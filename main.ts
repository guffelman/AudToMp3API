const express = require('express');
const multer = require('multer');
const fileType = require('file-type');
const fs = require('fs');
const path = require('path');
const { v4: uuidv4 } = require('uuid');
const ffmpeg = require('fluent-ffmpeg');

const app = express();

const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

app.post('/convert', upload.single('file'), (req, res) => {
  const file = req.file;

  if (!file) {
    return res.status(400).send('No file uploaded');
  }

  const fileTypeResult = fileType(file.buffer);

  if (!fileTypeResult || !fileTypeResult.mime.startsWith('audio/')) {
    return res.status(400).send('Invalid file type');
  }

  const filename = `${uuidv4()}.${fileTypeResult.ext}`;
  const filePath = path.join(__dirname, 'uploads', filename);

  fs.writeFileSync(filePath, file.buffer);

  convertWavToMp3(filePath)
    .then((mp3Filename) => {
      res.download(mp3Filename, (err) => {
        if (err) {
          console.error(err);
        }
        fs.unlinkSync(filePath);
        fs.unlinkSync(mp3Filename);
      });
    })
    .catch((err) => {
      console.error(err);
      res.status(500).send('Internal Server Error');
    });
});

function isWavFile(wavFilename) {
  const ext = path.extname(wavFilename);
  return ext === '.wav';
}

function convertWavToMp3(wavFilename) {
  return new Promise((resolve, reject) => {
    if (!isWavFile(wavFilename)) {
      reject(new Error('Not a wav file'));
    }

    const outputFile = wavFilename.replace('.wav', '.mp3');

    ffmpeg()
      .input(wavFilename)
      .audioCodec('libmp3lame')
      .toFormat('mp3')
      .on('end', () => {
        resolve(outputFile);
      })
      .on('error', (err) => {
        reject(err);
      })
      .save(outputFile);
  });
}

app.listen(3000, () => {
  console.log('Server listening on port 3000');
});
