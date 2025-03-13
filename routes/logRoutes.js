const express = require('express');
const router = express.Router();
const multer = require('multer');
const { S3Client } = require('@aws-sdk/client-s3');


// configure multer
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 10 * 1024 * 1024 } });   // 10MB upload limit



//    UPLOAD TRACKING LOG MEDIA    \\

router.post('/upload', upload.single('file'), async (req, res) => {
  try {
    //  no file in post req
    if (!req.file) return res.status(400).json({ message: 'No file uploaded', error: 400 });


    //  define upload params
    const params = {
      Bucket: 'starbase-portal-media',
      Key: `${Date.now()}-${req.file.originalname.replace(/[^a-zA-Z0-9.-]/g, "_")}`,
      Body: req.file.buffer,
      ContentType: req.file.mimetype,
      ACL: 'public-read'
    };


    try {
      const data = await s3.upload(params).promise();

      // send img url back in res
      res.status(200).json({ message: 'Uploaded image.', location: data.Location });
    } catch (error) {
      return res.status(500).json({ message: 'Error uploading to S3.', error: error });
    }
  } catch (error) {
    res.status(500).json({ message: 'Server error requesting upload.', error: error });
  }
});



module.exports = router;