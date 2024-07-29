exports.handler = async (event) => {
    const audioBase64 = event.queryStringParameters.audio;
    const apiEndpoint = 'https://elevenlabs.io/docs/api-reference/audio-isolation';
    const headers = {
      'Content-Type': 'application/octet-stream',
      'xi-api-key': process.env.ELEVENLABS_API_KEY,
    };
  
    try {
      const response = await fetch(apiEndpoint, {
        method: 'POST',
        headers,
        body: audioBase64,
      });
  
      if (!response.ok) {
        throw new Error(`Error calling ElevenLabs API: ${response.status}`);
      }
  
      const blob = await response.blob();
      const audioBase64Response = await blob.arrayBuffer().then((buffer) => {
        return btoa(String.fromCharCode(...new Uint8Array(buffer)));
      });
  
      return {
        statusCode: 200,
        body: JSON.stringify({ audioBase64: audioBase64Response }),
      };
    } catch (error) {
      console.error(error);
      return {
        statusCode: 500,
        body: JSON.stringify({ error: 'Error processing audio file' }),
      };
    }
  };