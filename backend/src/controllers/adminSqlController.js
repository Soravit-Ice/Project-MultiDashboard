import prisma from '../config/database.js';
import { recordActivity, ActivityType } from '../services/activityService.js';

const ALLOWED_COMMANDS = ['SELECT', 'INSERT', 'UPDATE', 'DELETE', 'WITH'];
const BLOCKED_KEYWORDS = ['DROP', 'TRUNCATE', 'ALTER', 'GRANT', 'REVOKE', 'CREATE', 'VACUUM'];

function sanitiseQuery(query) {
  if (!query) {
    return '';
  }
  return query.trim();
}

function validateQuery(query) {
  const sanitized = sanitiseQuery(query);
  if (!sanitized) {
    throw new Error('Query is required.');
  }

  const upper = sanitized.toUpperCase();
  const firstWord = upper.split(/\s+/)[0];

  if (!ALLOWED_COMMANDS.includes(firstWord)) {
    throw new Error(`Unsupported statement "${firstWord}". Allowed: ${ALLOWED_COMMANDS.join(', ')}`);
  }

  if (BLOCKED_KEYWORDS.some((keyword) => upper.includes(keyword))) {
    throw new Error(`Query contains restricted keyword.`);
  }

  const semicolonCount = (sanitized.match(/;/g) || []).length;
  if (semicolonCount > 1 || (semicolonCount === 1 && !sanitized.endsWith(';'))) {
    throw new Error('Multiple statements are not allowed.');
  }

  return sanitized.replace(/;$/, '');
}

export async function executeSqlQuery(req, res) {
  const { query } = req.body;

  try {
    const sanitizedQuery = validateQuery(query);
    const firstWord = sanitizedQuery.split(/\s+/)[0].toUpperCase();

    const startedAt = Date.now();
    let result;
    let rowCount = 0;

    if (firstWord === 'SELECT' || firstWord === 'WITH') {
      result = await prisma.$queryRawUnsafe(sanitizedQuery);
      rowCount = Array.isArray(result) ? result.length : 0;
    } else {
      const affected = await prisma.$executeRawUnsafe(sanitizedQuery);
      result = { affectedRows: affected };
      rowCount = typeof affected === 'number' ? affected : 0;
    }

    const executionTimeMs = Date.now() - startedAt;

    const history = await prisma.queryHistory.create({
      data: {
        adminId: req.user.id,
        query: sanitizedQuery,
        resultRowCount: rowCount,
        executionTimeMs,
        success: true
      }
    });

    await recordActivity({
      type: ActivityType.QUERY_RUN,
      actorId: req.user.id,
      entityId: history.id,
      entityType: 'QUERY_HISTORY',
      metadata: {
        executionTimeMs,
        rowCount
      }
    });

    return res.json({
      result,
      rowCount,
      executionTimeMs,
      historyId: history.id
    });
  } catch (error) {
    console.error('executeSqlQuery error:', error);

    if (req.user?.id) {
      await prisma.queryHistory.create({
        data: {
          adminId: req.user.id,
          query: sanitiseQuery(query),
          resultRowCount: 0,
          executionTimeMs: 0,
          success: false,
          errorMessage: error.message?.slice(0, 500) ?? 'Unknown error'
        }
      });
    }

    return res.status(400).json({ error: error.message || 'Failed to execute query.' });
  }
}

export async function getQueryHistory(req, res) {
  try {
    const {
      limit = 50,
      cursor = null,
      success
    } = req.query;

    const take = Math.min(Number(limit) || 50, 200);

    const filters = {
      adminId: req.user.id
    };

    if (success !== undefined) {
      filters.success = success === 'true';
    }

    const histories = await prisma.queryHistory.findMany({
      where: filters,
      orderBy: { executedAt: 'desc' },
      take: take + 1,
      cursor: cursor ? { id: cursor } : undefined
    });

    const nextCursor = histories.length > take ? histories[take].id : null;
    const items = histories.slice(0, take);

    res.json({
      items,
      nextCursor
    });
  } catch (error) {
    console.error('getQueryHistory error:', error);
    res.status(500).json({ error: 'Failed to fetch query history.' });
  }
}

export async function updateQueryHistoryVisibility(req, res) {
  const { historyId } = req.params;
  const { isVisible } = req.body;

  if (typeof isVisible !== 'boolean') {
    return res.status(400).json({ error: 'isVisible must be a boolean.' });
  }

  try {
    const history = await prisma.queryHistory.findUnique({
      where: { id: historyId }
    });

    if (!history || history.adminId !== req.user.id) {
      return res.status(404).json({ error: 'History entry not found.' });
    }

    const updated = await prisma.queryHistory.update({
      where: { id: historyId },
      data: { isVisible }
    });

    res.json({ history: updated });
  } catch (error) {
    console.error('updateQueryHistoryVisibility error:', error);
    res.status(404).json({ error: 'History entry not found.' });
  }
}
