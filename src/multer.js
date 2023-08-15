const express = require('express');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const multer = require('multer'); 

const app = express();
app.use(bodyParser.json());



// MongoDB connection string
const dbURI =
  'mongodb+srv://haseebmushtaq2002:beInHYjqwmFJCY1f@cluster0.jslfzox.mongodb.net/?retryWrites=true&w=majority';

mongoose.connect(dbURI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

mongoose.connection.on('connected', () => {
  console.log('Connected to MongoDB');
});

mongoose.connection.on('error', (err) => {
  console.error('MongoDB connection error:', err);
});

// Mongoose schema and model
const bookSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
  },
  author: {
    type: String,
    required: true,
  },
  information: {
    type: String,
    required: true,
  },
  photo: {
    data: Buffer,        // Storing the binary data of the photo
    contentType: String  // Storing the content type of the photo
  }
});

const ImageChecking = mongoose.model('ImageChecking', bookSchema);

// Set up multer storage
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });
app.post('/api/upload', upload.single('photo'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const newImage = new ImageChecking({
      title: req.body.title,
      author: req.body.author,
      information: req.body.information,
      photo: {
        data: req.file.buffer, // Use req.file.buffer to get the binary data
        contentType: req.file.mimetype
      }
    });

    const savedImage = await newImage.save();
    res.status(201).json(savedImage);
  } catch (err) {
    console.error('Error uploading photo:', err);
    res.status(500).json({ error: 'Failed to upload photo' });
  }
});

const PORT = 3000;
app.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
});
