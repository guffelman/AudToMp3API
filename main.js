import express from 'express';
import multer from 'multer';
import fs from 'fs';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';
import ffmpeg from 'fluent-ffmpeg';

const app = express();

const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

app.post('/convert', upload.single('file'), (req, res) => {
  const file = req.file;

  if (!file) {
    return res.status(400).send('No file uploaded');
  }

  const ext = path.extname(file.originalname);

  if (ext !== '.wav') {
    return res.status(400).send('Invalid file type');
  }

  const filename = `${uuidv4()}.wav`;
  const filePath = path.join(__dirname, 'uploads', filename);

  // Use fs.writeFile to write the file asynchronously
  fs.writeFile(filePath, file.buffer, (err) => {
    if (err) {
      console.error(err);
      return res.status(500).send('Internal Server Error');
    }

    convertWavToMp3(filePath)
      .then((mp3Filename) => {
        res.download(mp3Filename, (err) => {
          if (err) {
            console.error(err);
          }
          // Use fs.unlink to delete files asynchronously
          fs.unlink(filePath, (err) => {
            if (err) {
              console.error(err);
            }
          });
          fs.unlink(mp3Filename, (err) => {
            if (err) {
              console.error(err);
            }
          });
        });
      })
      .catch((err) => {
        console.error(err);
        res.status(500).send('Internal Server Error');
      });
  });
});

function convertWavToMp3(wavFilename) {
  return new Promise((resolve, reject) => {
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

app.listen(3051, () => {
  console.log('Server listening on port 3051');
});