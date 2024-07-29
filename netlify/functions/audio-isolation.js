import fetch from 'node-fetch';

export async function handler(event, context) {
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      body: JSON.stringify({ message: 'Method Not Allowed' }),
    };
  }

  try {
    const { audioBase64 } = JSON.parse(event.body);
    if (!audioBase64) {
      return {
        statusCode: 400,
        body: JSON.stringify({ message: 'Bad Request: Missing audioBase64 field' }),
      };
    }

    const apiKey = process.env.ELEVENLABS_API_KEY;
    if (!apiKey) {
      return {
        statusCode: 500,
        body: JSON.stringify({ message: 'Internal Server Error: Missing API key' }),
      };
    }

    const response = await fetch('https://api.elevenlabs.io/v1/audio-isolation', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'xi-api-key': `${apiKey}`
      },
      body: JSON.stringify({
        audio: audioBase64,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      return {
        statusCode: response.status,
        body: JSON.stringify({ message: `Error from Eleven Labs API: ${errorText}` }),
      };
    }

    const arrayBuffer = await response.arrayBuffer();
    const base64Response = arrayBufferToBase64(arrayBuffer);

    return {
      statusCode: 200,
      body: JSON.stringify({ audioBase64: base64Response }),
    };
  } catch (error) {
    console.error('Error processing request:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ message: 'Internal Server Error' }),
    };
  }
}

function arrayBufferToBase64(buffer) {
  let binary = '';
  const bytes = new Uint8Array(buffer);
  const len = bytes.byteLength;
  for (let i = 0; i < len; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}