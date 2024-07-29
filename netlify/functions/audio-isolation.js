const axios = require('axios');
const Formidable = require('formidable');
const FormData = require('form-data');
const fs = require('fs');

exports.handler = async (event, context) => {
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      body: JSON.stringify({ error: 'Method Not Allowed' }),
      headers: { 'Content-Type': 'application/json' },
    };
  }

  // Parse the multipart form data
  const form = new Formidable.IncomingForm();

  return new Promise((resolve, reject) => {
    const buffer = Buffer.from(event.body, 'base64');
    const req = new require('stream').Readable();
    req.push(buffer);
    req.push(null);

    form.parse(req, async (err, fields, files) => {
      if (err) {
        console.error('Error parsing form data:', err);
        return resolve({
          statusCode: 500,
          body: JSON.stringify({ error: 'Failed to parse form data' }),
          headers: { 'Content-Type': 'application/json' },
        });
      }

      try {
        // Access the audio file
        const audioFile = files.audio;

        // Prepare the form data for ElevenLabs API
        const formData = new FormData();
        formData.append('audio', fs.createReadStream(audioFile.path), {
          filename: audioFile.name,
          contentType: audioFile.type,
        });

        // Call the ElevenLabs API
        const response = await axios.post('https://api.elevenlabs.io/v1/audio-isolation', formData, {
          headers: {
            ...formData.getHeaders(),
            'xi-api-key': process.env.ELEVENLABS_API_KEY,
          },
          responseType: 'arraybuffer',
        });

        // Convert response data to base64
        const base64Audio = Buffer.from(response.data).toString('base64');

        return resolve({
          statusCode: 200,
          body: JSON.stringify({ audio: base64Audio }),
          headers: { 'Content-Type': 'application/json' },
        });
      } catch (error) {
        console.error('Error isolating audio:', error.message);
        return resolve({
          statusCode: 500,
          body: JSON.stringify({ error: 'Failed to isolate audio', details: error.message }),
          headers: { 'Content-Type': 'application/json' },
        });
      }
    });
  });
};