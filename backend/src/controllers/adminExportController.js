import ExcelJS from 'exceljs';
import PDFDocument from 'pdfkit';
import prisma from '../config/database.js';

function formatDate(value) {
  if (!value) {
    return '';
  }
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) {
    return '';
  }
  return date.toISOString();
}

async function sendExcel(res, sheetName, columns, rows, filename) {
  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet(sheetName);
  worksheet.columns = columns;
  worksheet.addRows(rows);

  const buffer = await workbook.xlsx.writeBuffer();

  res.setHeader(
    'Content-Type',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
  );
  res.setHeader('Content-Disposition', `attachment; filename="${filename}.xlsx"`);

  res.send(buffer);
}

function sendPdf(res, title, headers, rows, filename) {
  const doc = new PDFDocument({ margin: 30, size: 'A4' });

  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', `attachment; filename="${filename}.pdf"`);

  doc.pipe(res);
  doc.fontSize(18).text(title, { align: 'center' });
  doc.moveDown();

  const headerLine = headers.join(' | ');
  doc.fontSize(12).text(headerLine);
  doc.moveDown(0.5);

  rows.forEach((row) => {
    doc.fontSize(10).text(row.join(' | '));
  });

  doc.end();
}

export async function exportQueryHistory(req, res) {
  try {
    const { format = 'excel' } = req.query;

    const histories = await prisma.queryHistory.findMany({
      where: {
        adminId: req.user.id,
        isVisible: true
      },
      orderBy: { executedAt: 'desc' },
      take: 500
    });

    const rows = histories.map((history) => ({
      executedAt: formatDate(history.executedAt),
      query: history.query,
      success: history.success ? 'YES' : 'NO',
      rowCount: history.resultRowCount ?? 0,
      executionTimeMs: history.executionTimeMs ?? 0,
      errorMessage: history.errorMessage ?? ''
    }));

    if (format === 'pdf') {
      sendPdf(
        res,
        'Query History',
        ['Executed At', 'Success', 'Rows', 'Time (ms)', 'Query', 'Error'],
        rows.map((row) => [
          row.executedAt,
          row.success,
          row.rowCount.toString(),
          row.executionTimeMs.toString(),
          row.query,
          row.errorMessage
        ]),
        `query-history-${Date.now()}`
      );
      return;
    }

    await sendExcel(
      res,
      'QueryHistory',
      [
        { header: 'Executed At', key: 'executedAt', width: 24 },
        { header: 'Success', key: 'success', width: 10 },
        { header: 'Rows', key: 'rowCount', width: 10 },
        { header: 'Time (ms)', key: 'executionTimeMs', width: 12 },
        { header: 'Query', key: 'query', width: 80 },
        { header: 'Error', key: 'errorMessage', width: 40 }
      ],
      rows,
      `query-history-${Date.now()}`
    );
  } catch (error) {
    console.error('exportQueryHistory error:', error);
    res.status(500).json({ error: 'Failed to export query history.' });
  }
}

export async function exportMessageLogs(req, res) {
  try {
    const { format = 'excel' } = req.query;

    const logs = await prisma.messageLog.findMany({
      orderBy: { createdAt: 'desc' },
      take: 500,
      include: {
        recipientUser: {
          select: { username: true, email: true }
        },
        recipientGroup: {
          select: { name: true }
        },
        sender: {
          select: { username: true, email: true }
        }
      }
    });

    const rows = logs.map((log) => ({
      createdAt: formatDate(log.createdAt),
      direction: log.direction,
      channel: log.channel,
      source: log.source,
      status: log.status,
      sender: log.sender?.username || log.sender?.email || log.senderId || '',
      recipient: log.recipientUser?.username || log.recipientUser?.email || log.recipientUserId || '',
      group: log.recipientGroup?.name || '',
      content: log.content,
      error: log.error || ''
    }));

    if (format === 'pdf') {
      sendPdf(
        res,
        'Message Logs',
        ['Created At', 'Dir', 'Channel', 'Status', 'Sender', 'Recipient', 'Group', 'Content'],
        rows.map((row) => [
          row.createdAt,
          row.direction,
          row.channel,
          row.status,
          row.sender,
          row.recipient,
          row.group,
          row.content
        ]),
        `message-logs-${Date.now()}`
      );
      return;
    }

    await sendExcel(
      res,
      'MessageLogs',
      [
        { header: 'Created At', key: 'createdAt', width: 24 },
        { header: 'Direction', key: 'direction', width: 12 },
        { header: 'Channel', key: 'channel', width: 12 },
        { header: 'Source', key: 'source', width: 12 },
        { header: 'Status', key: 'status', width: 12 },
        { header: 'Sender', key: 'sender', width: 20 },
        { header: 'Recipient', key: 'recipient', width: 20 },
        { header: 'Group', key: 'group', width: 20 },
        { header: 'Content', key: 'content', width: 80 },
        { header: 'Error', key: 'error', width: 40 }
      ],
      rows,
      `message-logs-${Date.now()}`
    );
  } catch (error) {
    console.error('exportMessageLogs error:', error);
    res.status(500).json({ error: 'Failed to export message logs.' });
  }
}
