const LINE_PUSH_ENDPOINT = 'https://api.line.me/v2/bot/message/push';
const LINE_PROFILE_ENDPOINT = 'https://api.line.me/v2/bot/profile';

export async function sendLinePush({ accessToken, to, text }) {
  const response = await fetch(LINE_PUSH_ENDPOINT, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      to,
      messages: [
        {
          type: 'text',
          text
        }
      ]
    })
  });

  if (!response.ok) {
    const errorBody = await response.text();
    throw new Error(`LINE push failed (${response.status}): ${errorBody}`);
  }
}

export async function getLineProfile({ accessToken, userId }) {
  const response = await fetch(`${LINE_PROFILE_ENDPOINT}/${userId}`, {
    headers: {
      Authorization: `Bearer ${accessToken}`
    }
  });

  if (!response.ok) {
    const errorBody = await response.text();
    throw new Error(`LINE profile fetch failed (${response.status}): ${errorBody}`);
  }

  return response.json();
}
