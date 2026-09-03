// This file handles image uploads for components. it saves files to the uploads folder and returns the URL. The actual image will be uploaded on the cloud. Save only file name.


const express = require('express');
const multer = require('multer');
const path = require('path');
const { authenticate } = require('../middleware/auth');
const router = express.Router();


// set up storage - we save with a timestamp so files don't overwrite each other
const storage = multer.diskStorage({
  destination: './uploads/',
  filename: (req, file, cb) => {
    cb(null, Date.now() + path.extname(file.originalname));
  }
});
const upload = multer({ storage });


router.post('/', authenticate, upload.single('image'), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'No file uploaded' });
  }
  res.json({ url: `/uploads/${req.file.filename}` });
});


module.exports = router;