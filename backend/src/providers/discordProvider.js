export async function sendDiscordMessage({ webhookUrl, content }) {
  if (!webhookUrl) {
    throw new Error('Discord webhook URL is required.');
  }

  const response = await fetch(webhookUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      content: content?.slice(0, 2000) || ''
    })
  });

  if (!response.ok) {
    const errorBody = await response.text();
    throw new Error(`Discord webhook failed (${response.status}): ${errorBody}`);
  }
}
