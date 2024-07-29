const axios = require('axios');
const FormData = require('form-data');

exports.handler = async (event, context) => {
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      body: 'Method Not Allowed',
    };
  }

  try {
    // Parse the incoming form data
    const contentType = event.headers['content-type'] || event.headers['Content-Type'];

    if (!contentType.includes('multipart/form-data')) {
      return {
        statusCode: 400,
        body: 'Bad Request: Expected multipart/form-data',
      };
    }

    const boundary = contentType.split('boundary=')[1];
    const parts = event.body.split(new RegExp(`--${boundary}`));
    let audioFileBuffer = null;

    parts.forEach(part => {
      const disposition = part.match(/Content-Disposition: form-data; name="audioFile"; filename="(.+)"/);
      if (disposition) {
        const [header, ...fileContent] = part.split('\r\n\r\n');
        audioFileBuffer = Buffer.from(fileContent.join('\r\n\r\n').trim(), 'binary');
      }
    });

    if (!audioFileBuffer) {
      return {
        statusCode: 400,
        body: 'Bad Request: audioFile field is required',
      };
    }

    // Prepare the form data
    const form = new FormData();
    form.append('audio', audioFileBuffer, 'audio.mp3');

    // Call the ElevenLabs API
    const response = await axios.post('https://api.elevenlabs.io/v1/audio-isolation', form, {
      headers: {
        ...form.getHeaders(),
        'xi-api-key': process.env.ELEVENLABS_API_KEY,
      },
      responseType: 'arraybuffer',
    });

    // Convert response data to base64
    const base64Audio = Buffer.from(response.data).toString('base64');

    return {
      statusCode: 200,
      body: JSON.stringify({ audio: base64Audio }),
    };
  } catch (error) {
    console.error('Error isolating audio:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Failed to isolate audio' }),
    };
  }
};