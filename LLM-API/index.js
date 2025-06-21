const express = require('express');
const axios = require('axios');
const path = require('path');
const fs = require('fs');
const app = express();
const sharp = require('sharp');

app.use(express.json());

app.post('/transcribe', (req, res) => {
  const { x, y, width, height, taskNumber } = req.body;
  if (
    typeof x !== 'number' ||
    typeof y !== 'number' ||
    typeof width !== 'number' ||
    typeof height !== 'number' ||
    typeof taskNumber !== 'number'
  ) {
    return res.status(400).json({ error: 'x, y, w, and h must be numbers' });
  }

  examplePromise(x, y, width, height, taskNumber).then((result) => {
    // Handle the result from the promise here
    res.json(JSON.parse(result.response)); // Send the result back to the client 
  })
  .catch((err) => {
    res.status(500).json({ error: err.message || 'Internal server error' });
  });

  // You can add your logic here
  // res.json({ x, y, w, h });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`LLM-API listening on port ${PORT}`);
});

function examplePromise(x, y, w, h, taskNumber) {
  return new Promise((resolve, reject) => {
    // Your asynchronous logic here
    // Call resolve(result) on success, or reject(error) on failure

    let config = {
      method: 'get',
      maxBodyLength: Infinity,
      url: `http://192.168.1.131:8090/api/tasks/${taskNumber}`,
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
          .then(async () => {

            let base64ImageString;
            console.log('Image downloaded successfully');

            croppedImagePath = path.join(__dirname, 'downloads', 'cropped_image.png');
            await snapshotImageArea(downloadedFilePath, croppedImagePath, x, y, w, h)

            // convert image to base64
            await imageToBase64(croppedImagePath)
              .then(base64Image => {
                // console.log("Base64 Image String: ", base64Image);
                // make call to ollama to get translation
                base64ImageString = base64Image;
              })
              .catch(err => {
                console.error("Error converting image to base64:", err);
                reject(err);
              });

            // Send the base64 image as string to ollama


            sendImageToVisionModel("http://192.168.1.123:11434/api/generate", base64ImageString)
              .then((response) => {
                console.log("Response from vision model:", response);
                // Process the response as needed
                resolve(response);
              })
              .catch((error) => {
                console.error("Error from vision model:", error);
                reject(error);
              });

            // resolve(response.dat);
          })
          .catch((error) => {
            console.error('Error downloading image:', error);
            reject(error);
          });
      })
      .catch((error) => {
        console.log(error);
        reject(error);
      });
  });
}

async function downloadImage(url, outputPath) {
  // Check if file already exists
  if (fs.existsSync(outputPath)) {
    console.log(`File already exists at ${outputPath}, skipping download.`);
    return Promise.resolve();
  }

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

/**
 * Reads an image file and returns its base64-encoded string.
 * @param {string} imagePath - Path to the image file.
 * @returns {Promise<string>} - Base64 string of the image.
 */
function imageToBase64(imagePath) {
  return new Promise((resolve, reject) => {
    fs.readFile(imagePath, (err, data) => {
      if (err) return reject(err);
      const base64 = data.toString('base64');
      resolve(base64);
    });
  });
}

/**
 * Sends a POST request to an external vision model API with a base64 image string.
 * @param {string} apiUrl - The URL of the external vision model API.
 * @param {string} base64Image - The base64-encoded image string.
 * @param {object} [extraPayload={}] - Any extra fields to include in the payload.
 * @returns {Promise<object>} - Resolves with the API response data.
 */
function sendImageToVisionModel(apiUrl, base64Image) {
  return axios.post(apiUrl, {
    "model": "llama3.2-vision:latest",
    "prompt": "Transcribe. Only provide the transcription. No comments. Output is a JSON object that has 'transcription' as its only key. The value is the transcription.",
    "format": "json",
    "stream": false,
    "images": [base64Image]
  })
    .then(response => response.data)
    .catch(error => {
      // Optionally, you can log or process the error here
      throw error;
    });
}