const axios = require('axios');
const FormData = require('form-data');

exports.handler = async (event, context) => {
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      body: 'Method Not Allowed',
    };
  }

  const { audioFileUrl } = JSON.parse(event.body);

  try {
    // Download the audio file from the given URL
    const response = await axios({
      method: 'GET',
      url: audioFileUrl,
      responseType: 'arraybuffer'
    });

    const audioBuffer = Buffer.from(response.data, 'binary');

    // Prepare form data for ElevenLabs API
    const form = new FormData();
    form.append('file', audioBuffer, { filename: 'audio.wav' });

    // Send the audio file to ElevenLabs API
    const elevenLabsResponse = await axios({
      method: 'POST',
      url: 'https://api.elevenlabs.io/audio-isolation',
      headers: {
        ...form.getHeaders(),
        'Authorization': `Bearer ${process.env.ELEVENLABS_API_KEY}`
      },
      data: form
    });

    // Convert the response to base64
    const base64Audio = Buffer.from(elevenLabsResponse.data).toString('base64');

    // Return the base64 audio
    return {
      statusCode: 200,
      body: JSON.stringify({ base64Audio }),
    };
  } catch (error) {
    console.error('Error:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Internal Server Error' }),
    };
  }
};