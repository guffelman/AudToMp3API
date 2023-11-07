import express from 'express';
import multer from 'multer';
import { v4 as uuidv4 } from 'uuid';
import ffmpeg from 'fluent-ffmpeg';
import { Readable } from 'stream';
import path from 'path';
const app = express();

const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

app.use((req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  next();
});

app.get('/', (req, res) => { 
  res.send('Wav to Mp3 Converter');
});

app.post('/convert', upload.single('file'), (req, res) => {
  const file = req.file;

  if (!file) {
    return res.status(400).send('No file uploaded');
  }

  const ext = path.extname(file.originalname);

  if (ext !== '.wav') {
    return res.status(400).send('Invalid file type');
  }

  const readStream = new Readable();
  readStream._read = () => {};
  readStream.push(file.buffer);
  readStream.push(null);

  const mp3Filename = `${uuidv4()}.mp3`;

  res.setHeader('Content-Disposition', `attachment; filename=${mp3Filename}`);

  ffmpeg(readStream)
    .audioCodec('libmp3lame')
    .toFormat('mp3')
    .pipe(res);
});

app.listen(443, () => {
  console.log('Server listening on port 443');
});