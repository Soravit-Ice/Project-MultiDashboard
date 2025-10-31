import { getAdminPreferences, setAdminPreference } from '../services/preferenceService.js';

export async function fetchPreferences(req, res) {
  try {
    const prefs = await getAdminPreferences(req.user.id);
    res.json({ preferences: prefs });
  } catch (error) {
    console.error('fetchPreferences error:', error);
    res.status(500).json({ error: 'Failed to load preferences.' });
  }
}

export async function updatePreference(req, res) {
  const { key, value } = req.body;

  if (!key) {
    return res.status(400).json({ error: 'Preference key is required.' });
  }

  try {
    const record = await setAdminPreference(req.user.id, key, value ?? null);
    res.json({ preference: record });
  } catch (error) {
    console.error('updatePreference error:', error);
    res.status(500).json({ error: 'Failed to update preference.' });
  }
}
