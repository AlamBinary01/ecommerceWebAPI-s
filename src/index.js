const mongoose = require('mongoose');
const express = require('express');
const app = express();
app.use(express.json());

// MongoDB connection URI
const uri = 'mongodb+srv://haseebmushtaq2002:beInHYjqwmFJCY1f@cluster0.jslfzox.mongodb.net/'; // Replace with your MongoDB connection URI

// Connect to MongoDB
mongoose
  .connect(uri, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => {
    console.log('Connected to MongoDB');

    // Define the dynamic schema
    const dynamicSchema = new mongoose.Schema({});

    // Create a model based on the dynamic schema
    const DynamicModel = mongoose.model('DynamicModel', dynamicSchema);

    // Create a new document
    // Create multiple documents
    app.post('/documents', (req, res) => {
      const dynamicDataArray = req.body;

      DynamicModel.insertMany(dynamicDataArray)
        .then((result) => {
          console.log('Documents saved:', result);
          res.status(201).json(result);
        })
        .catch((error) => {
          console.error('Error saving documents:', error);
          res.status(500).json({ error: 'Error saving documents' });
        });
    });


    // Retrieve all documents
    app.get('/documents', (req, res) => {
      DynamicModel.find()
        .then((documents) => {
          res.status(200).json(documents);
        })
        .catch((error) => {
          console.error('Error retrieving documents:', error);
          res.status(500).json({ error: 'Error retrieving documents' });
        });
    });

    // Retrieve a document by ID
    app.get('/documents/:id', (req, res) => {
      const documentId = req.params.id;

      DynamicModel.findById(documentId)
        .then((document) => {
          if (!document) {
            return res.status(404).json({ error: 'Document not found' });
          }
          res.status(200).json(document);
        })
        .catch((error) => {
          console.error('Error retrieving document:', error);
          res.status(500).json({ error: 'Error retrieving document' });
        });
    });

    // Update a document by ID
    app.put('/documents/:id', (req, res) => {
      const documentId = req.params.id;
      const updatedData = req.body;

      DynamicModel.findByIdAndUpdate(documentId, updatedData, { new: true })
        .then((updatedDocument) => {
          if (!updatedDocument) {
            return res.status(404).json({ error: 'Document not found' });
          }
          console.log('Document updated:', updatedDocument);
          res.status(200).json(updatedDocument);
        })
        .catch((error) => {
          console.error('Error updating document:', error);
          res.status(500).json({ error: 'Error updating document' });
        });
    });

    // Delete a document by ID
    app.delete('/documents/:id', (req, res) => {
      const documentId = req.params.id;

      DynamicModel.findByIdAndRemove(documentId)
        .then((deletedDocument) => {
          if (!deletedDocument) {
            return res.status(404).json({ error: 'Document not found' });
          }
          console.log('Document deleted:', deletedDocument);
          res.status(204).end();
        })
        .catch((error) => {
          console.error('Error deleting document:', error);
          res.status(500).json({ error: 'Error deleting document' });
        });
    });

    // Create a model based on the schema
const User = mongoose.model('User', userSchema);

// Create an Express app
const app = express();
app.use(express.json());

// Signup route
app.post('/signup', async (req, res) => {
  try {
    const { email, password } = req.body;

    // Check if the user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(409).json({ error: 'User already exists' });
    }

    // Hash the password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create a new user
    const newUser = new User({
      email,
      password: hashedPassword,
    });

    // Save the user to the database
    await newUser.save();

    res.status(201).json({ message: 'Signup successful' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to signup' });
  }
});

// Login route
app.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    // Check if the user exists
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    // Compare the provided password with the stored password
    const passwordMatch = await bcrypt.compare(password, user.password);
    if (!passwordMatch) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    res.json({ message: 'Login successful' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to login' });
  }
});
    // Start the server
    app.listen(3000, () => {
      console.log('Server is running on port 3000');
    });
  })
  .catch((error) => {
    console.error('Error connecting to MongoDB:', error);
  });
