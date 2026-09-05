// This file handles image uploads to Cloudinary.
// File names are saved on Render uploaded to Cloudinary.

const express = require('express');
const multer = require('multer');
const cloudinary = require('cloudinary').v2;
const { authenticate } = require('../middleware/auth');
const router = express.Router();

// set up cloudinary using env variables from Render
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// keep image in memory so we can stream it to cloudinary
const storage = multer.memoryStorage();
const upload = multer({ storage });

// only logged-in users can upload
router.post('/', authenticate, upload.single('image'), async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'No file uploaded' });
  }

  try {
    const { Readable } = require('stream');

    // pipe the buffer into cloudinary uploader
    const stream = cloudinary.uploader.upload_stream(
      { folder: 'components' },
      (error, result) => {
        if (error) {
          return res.status(500).json({ error: error.message });
        }
        res.json({ url: result.secure_url });
      }
    );

    Readable.from(req.file.buffer).pipe(stream);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;