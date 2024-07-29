const axios = require('axios');
const FormData = require('form-data');

exports.handler = async (event, context) => {
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      body: JSON.stringify({ error: 'Method Not Allowed' }),
      headers: { 'Content-Type': 'application/json' },
    };
  }

  try {
    // Parse the incoming request body
    const { audioFile } = JSON.parse(event.body);

    // Prepare the form data
    const form = new FormData();
    form.append('audio', Buffer.from(audioFile, 'base64'), 'audio.wav');

    // Call the ElevenLabs API
    const response = await axios.post('https://api.elevenlabs.io/v1/audio-isolation', form, {
      headers: {
        ...form.getHeaders(),
        'xi-api-key': process.env.ELEVENLABS_API_KEY, // Fetch the API key from environment variables
      },
      responseType: 'arraybuffer',
    });

    // Convert response data to base64
    const base64Audio = Buffer.from(response.data).toString('base64');

    return {
      statusCode: 200,
      body: JSON.stringify({ audio: base64Audio }),
      headers: { 'Content-Type': 'application/json' },
    };
  } catch (error) {
    console.error('Error isolating audio:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Failed to isolate audio', details: error.message }),
      headers: { 'Content-Type': 'application/json' },
    };
  }
};