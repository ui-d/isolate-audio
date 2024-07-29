exports.handler = async (event) => {
    const audioBase64 = event.queryStringParameters.audio;
    const apiEndpoint = 'https://api.elevenlabs.io/v1/audio-isolation';
    const apiKey = process.env.ELEVENLABS_API_KEY;
    const form = new FormData();
    form.append("audio", audioBase64);
  
    const options = {
      method: 'POST',
      headers: {
        'Content-Type': 'multipart/form-data',
        'xi-api-key': apiKey,
      },
      body: form,
    };
  
    try {
      const response = await fetch(apiEndpoint, options);
  
      if (!response.ok) {
        throw new Error(`Error calling ElevenLabs API: ${response.status}`);
      }
  
      const responseJson = await response.json();
      const audioBase64Response = await responseJson.audio;
  
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