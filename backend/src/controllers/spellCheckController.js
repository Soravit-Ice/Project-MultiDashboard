import { checkSpelling, autoCorrect } from '../services/spellCheckService.js';

/**
 * Check spelling in text
 */
export async function checkSpellingController(req, res) {
  try {
    const { text } = req.body;

    if (!text) {
      return res.status(400).json({
        success: false,
        error: 'Text is required'
      });
    }

    const result = checkSpelling(text);

    if (!result.success) {
      return res.status(400).json(result);
    }

    return res.json(result);
  } catch (error) {
    console.error('Spell check error:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to check spelling'
    });
  }
}

/**
 * Auto-correct text
 */
export async function autoCorrectController(req, res) {
  try {
    const { text, corrections } = req.body;

    if (!text) {
      return res.status(400).json({
        success: false,
        error: 'Text is required'
      });
    }

    const result = autoCorrect(text, corrections);

    if (!result.success) {
      return res.status(400).json(result);
    }

    return res.json(result);
  } catch (error) {
    console.error('Auto-correct error:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to auto-correct text'
    });
  }
}
