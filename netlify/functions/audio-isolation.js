// netlify/functions/audio-isolation.mjs
import fetch from 'node-fetch';

export async function handler(event, context) {
  // Check if the method is POST
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

    // Send the audio file to the Eleven Labs audio isolation API
    const response = await fetch('https://api.elevenlabs.io/v1/audio-isolation', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'xi-api-key': `${apiKey}`
      },
      body: JSON.stringify({
        audio: audioBase64,
        // Add any additional required parameters for the API here
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      return {
        statusCode: response.status,
        body: JSON.stringify({ message: `Error from Eleven Labs API: ${errorText}` }),
      };
    }

    const responseData = await response.blob();

    // Convert the response blob to base64
    const base64Response = await blobToBase64(responseData);

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

function blobToBase64(blob) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      resolve(reader.result.split(',')[1]);
    };
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}