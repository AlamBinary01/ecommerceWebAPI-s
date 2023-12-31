// app.js

const express = require('express');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');

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
  iformation: {
    type: String,
    required: true,
  },
});

const Book = mongoose.model('Book', bookSchema);

// Middleware
app.use(bodyParser.json());

// Add a new book to the database
app.post('/api/books', async (req, res) => {
  const { title, author, iformation } = req.body;
  if (!title || !author || !iformation) {
    return res.status(400).json({ error: 'All fields are required' });
  }
  try {
    const newBook = new Book({ title, author, iformation });
    const savedBook = await newBook.save();
    res.status(201).json(savedBook);
  } catch (err) {
    console.error('Error saving book:', err);
    res.status(500).json({ error: 'Failed to add the book' });
  }
});
//find records 
app.get('/api/records', async (req, res) => {
  try {
    const items = await Book.find();
    res.json(items);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to retrieve items' });
  }
});

app.get('/api/books', async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 4;
  try {
    const totalBooks = await Book.countDocuments();  // totalBooks= 10
    const totalPages = Math.ceil(totalBooks / limit); //totalPage= 10/2=5
    if (page > totalPages) {
      return res.status(400).json({ error: 'Page out of range' });
    }
    const books = await Book.find()
      .skip((page - 1) * limit)
      .limit(limit);

    res.status(200).json({
      page,
      totalPages,
      books,
    });
  } catch (err) {
    console.error('Error fetching books:', err);
    res.status(500).json({ error: 'Failed to fetch books' });
  }
});
app.get('/api/search', async (req, res) => {
  const { query } = req.query;

  if (!query) {
    return res.status(400).json({ error: 'Search query is required' });
  }
  try {
    const books = await Book.find({
      title: { $regex: query, $options: 'i' } // Case-insensitive search by title
    });

    res.status(200).json(books);
  } catch (err) {
    console.error('Error searching books:', err);
    res.status(500).json({ error: 'Failed to search books' });
  }
});
app.get('/api/filter/authors', async (req, res) => {
  const { author } = req.query;

  if (!author) {
    return res.status(400).json({ error: 'Author name is required for filtering' });
  }

  try {
    const books = await Book.find({
      author: { $regex: author, $options: 'i' } // Case-insensitive search by author name
    });

    res.status(200).json(books);
  } catch (err) {
    console.error('Error filtering books by author:', err);
    res.status(500).json({ error: 'Failed to filter books by author' });
  }
});


const PORT = 3000;
app.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
});
