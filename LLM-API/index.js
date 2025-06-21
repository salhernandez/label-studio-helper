const express = require('express');
const axios = require('axios');
const path = require('path');
const fs = require('fs');
const app = express();
const sharp = require('sharp');

app.use(express.json());

app.post('/transcribe', (req, res) => {
  const { x, y, w, h } = req.body;
  if (
    typeof x !== 'number' ||
    typeof y !== 'number' ||
    typeof w !== 'number' ||
    typeof h !== 'number'
  ) {
    return res.status(400).json({ error: 'x, y, w, and h must be numbers' });
  }

  examplePromise(x, y, w, h);

  // You can add your logic here
  res.json({ x, y, w, h });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`LLM-API listening on port ${PORT}`);
});

function examplePromise(x, y, w, h) {
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
        // console.log(JSON.stringify(response.data));
        console.log(response.data.data.image)

        downloadedFilePath = path.join(__dirname, 'downloads', response.data.file_upload);

        downloadImage(`http://192.168.1.131:8090${response.data.data.image}`, downloadedFilePath)
          .then(() => {
            console.log('Image downloaded successfully');

            croppedImagePath = path.join(__dirname, 'downloads', 'cropped_image.png');
            snapshotImageArea(downloadedFilePath, croppedImagePath, x, y, w, h)
            
            
            // cropWithFloat(downloadedFilePath, { x, y, width: w, height: h }, path.join(__dirname, 'downloads', 'cropped_image.png'))
            resolve(response.data);
          })
          .catch((error) => {
            console.error('Error downloading image:', error);
            reject(error);
          });
      })
      .catch((error) => {
        console.log(error);
      });
  });
}

async function downloadImage(url, outputPath) {
  const response = await axios({
    method: 'get',
    url: url,
    responseType: 'stream',
    headers: {
        'Authorization': 'Token d37e5cb1dbabc8ea06423803e120ad78e3bf2304',
      }
  });

  return new Promise((resolve, reject) => {
    const writer = fs.createWriteStream(outputPath);
    response.data.pipe(writer);
    writer.on('finish', resolve);
    writer.on('error', reject);
  });
}


/**
 * Crops an area from an image file and saves it to a new file using sharp.
 * @param {string} inputPath - Path to the source image.
 * @param {string} outputPath - Path to save the cropped image.
 * @param {number} x - The x coordinate of the top-left corner (percentage 0-100).
 * @param {number} y - The y coordinate of the top-left corner (percentage 0-100).
 * @param {number} w - The width of the crop area (percentage 0-100).
 * @param {number} h - The height of the crop area (percentage 0-100).
 * @returns {Promise<void>}
 */
async function snapshotImageArea(inputPath, outputPath, x, y, w, h) {
  // Get image metadata to determine dimensions
  const img = sharp(inputPath);
  const metadata = await img.metadata();
  const imgWidth = metadata.width;
  const imgHeight = metadata.height;

  // Convert percentage-based coordinates to pixel values
  const px = Math.floor((x / 100) * imgWidth);
  const py = Math.floor((y / 100) * imgHeight);
  const pw = Math.ceil((w / 100) * imgWidth);
  const ph = Math.ceil((h / 100) * imgHeight);

  // Crop the image using sharp
  await img.extract({ left: px, top: py, width: pw, height: ph }).toFile(outputPath);

  console.log("Snapshot saved to", outputPath);
}