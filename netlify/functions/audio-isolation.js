const axios = require('axios');
const Busboy = require('busboy');
const FormData = require('form-data');
const fs = require('fs');
const { Writable } = require('stream');

exports.handler = async (event, context) => {
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      body: JSON.stringify({ error: 'Method Not Allowed' }),
      headers: { 'Content-Type': 'application/json' },
    };
  }

  const busboy = Busboy({
    headers: {
      'content-type': event.headers['content-type'],
    },
  });

  let audioFile;

  return new Promise((resolve, reject) => {
    const buffers = [];

    busboy.on('file', (fieldname, file, filename, encoding, mimetype) => {
      const saveTo = `/tmp/${filename}`;
      audioFile = {
        path: saveTo,
        name: filename,
        type: mimetype,
      };
      const writeStream = fs.createWriteStream(saveTo);
      file.pipe(writeStream);
      file.on('data', (data) => buffers.push(data));
      file.on('end', () => {
        writeStream.end();
      });
    });

    busboy.on('finish', async () => {
      try {
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

    const buffer = Buffer.from(event.body, 'base64');
    const req = new Writable();
    req._write = (chunk, encoding, next) => {
      busboy.write(chunk, encoding, next);
    };
    req.on('finish', () => {
      busboy.end();
    });

    req.headers = event.headers;

    req.write(buffer);
    req.end();
  });
};