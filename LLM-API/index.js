const express = require('express');
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
  // You can add your logic here
  res.json({ x, y, w, l });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`LLM-API listening on port ${PORT}`);
});