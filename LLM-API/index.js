const express = require('express');
const axios = require('axios');
const app = express();

app.use(express.json());

app.post('/transcribe', (req, res) => {
  const { x, y, w, l } = req.body;
  if (
    typeof x !== 'number' ||
    typeof y !== 'number' ||
    typeof w !== 'number' ||
    typeof l !== 'number'
  ) {
    return res.status(400).json({ error: 'x, y, w, and l must be numbers' });
  }

  examplePromise();

  // You can add your logic here
  res.json({ x, y, w, l });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`LLM-API listening on port ${PORT}`);
});

function examplePromise() {
  return new Promise((resolve, reject) => {
    // Your asynchronous logic here
    // Call resolve(result) on success, or reject(error) on failure

    let config = {
      method: 'get',
      maxBodyLength: Infinity,
      url: 'http://192.168.1.131:8090/api/tasks/1',
      headers: {
        'Authorization': 'Token d37e5cb1dbabc8ea06423803e120ad78e3bf2304',
        'Cookie': 'sessionid=eyJ1aWQiOiJiNjAwZDcxMi1hNWZlLTQyNTEtOWQxZC00OTk3NzJkYTlkYjYiLCJvcmdhbml6YXRpb25fcGsiOjF9:1uSWH3:Hm7W-IbmpKbwMZjR-53n7XBL2p9d4IQ6bHBXEXvI7iU'
      }
    };

    axios.request(config)
      .then((response) => {
        console.log(JSON.stringify(response.data));
      })
      .catch((error) => {
        console.log(error);
      });
  });
}