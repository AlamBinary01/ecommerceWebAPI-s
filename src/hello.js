// Install required dependencies:
// npm install express mongoose

const express = require('express');
const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const nodemailer = require('nodemailer');

// Connect to MongoDB
mongoose.connect('mongodb+srv://haseebmushtaq2002:beInHYjqwmFJCY1f@cluster0.jslfzox.mongodb.net/?retryWrites=true&w=majority', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
  .then(() => console.log('Connected to MongoDB'))
  .catch((err) => console.error('Failed to connect to MongoDB', err));

// Create a schema for your documents
const itemSchema = new mongoose.Schema({
  name: String,
  quantity: Number,
});

// Create a model based on the schema
const Item = mongoose.model('Item', itemSchema);

// Create an Express app
const app = express();
app.use(express.json());

// Create an API route to store data
app.post('/items', async (req, res) => {
  try {
    const { name, quantity } = req.body;


    // Create a new document
    const newItem = new Item({
      name,
      quantity,
    });

    // Save the document to the database
    await newItem.save();

    res.status(201).json(newItem);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to store data' });
  }
});

// Get all items
app.get('/items', async (req, res) => {
  try {
    const items = await Item.find();
    res.json(items);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to retrieve items' });
  }
});

// Get a specific item by ID
app.get('/items/:id', async (req, res) => {
  try {
    const item = await Item.findById(req.params.id);
    if (!item) {
      return res.status(404).json({ error: 'Item not found' });
    }
    res.json(item);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to retrieve item' });
  }
});

// Update an item by ID
app.put('/items/:id', async (req, res) => {
  try {
    const { name, quantity } = req.body;

    const item = await Item.findByIdAndUpdate(req.params.id, { name, quantity }, { new: true });
    if (!item) {
      return res.status(404).json({ error: 'Item not found' });
    }
    res.json(item);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to update item' });
  }
});

// Delete an item by ID
app.delete('/items/:id', async (req, res) => {
  try {
    const item = await Item.findByIdAndRemove(req.params.id);
    if (!item) {
      return res.status(404).json({ error: 'Item not found' });
    }
    res.json({ message: 'Item deleted successfully' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to delete item' });
  }
});

// ==================================================================================
// Create a schema for user documents
const userSchema = new mongoose.Schema({
  email: { type: String, unique: true },
  password: String,
  role: { type: String, enum: ['user', 'admin'], default: 'user' },
});

// Create a model based on the schema
const User = mongoose.model('User', userSchema);

// User registration route
// Signup route
app.post('/signup', async (req, res) => {
  try {
    const { email, password, role } = req.body;

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
      role: role || 'user', // Default role is 'user' if not provided
    });

    // Save the user to the database
    const hello = await newUser.save();

    res.status(201).json(hello);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to signup' });
  }
});

// User login route
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

    // Generate and sign a JWT
    const token = jwt.sign({ userId: user._id, role: user.role }, '03079957468', { expiresIn: '10s' });

    res.json({ message: 'Login successful', token });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to login' });
  }
});


// Protected route example
app.get('/protected', verifyToken, (req, res) => {
  // Only authenticated users with the 'admin' role can access this route
  if (req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Access denied' });
  }

  res.json({ message: 'Protected route accessed successfully' });
});

// Middleware to verify the JWT
function verifyToken(req, res, next) {
  const token = req.headers.authorization?.split(' ')[1]; // Extract the token from the Authorization header

  if (!token) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  jwt.verify(token, '03079957468', (err, decodedToken) => {
    if (err) {
      return res.status(401).json({ error: 'Invalid token' });
    }

    // Attach the decoded user information to the request object
    req.user = decodedToken;
    next();
  });
}


app.post('/forgot-password', async (req, res) => {
  try {
    const { email } = req.body;

    // Check if the user exists
    const user = await User.findOne({ email });
    console.log(user)
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Generate a JWT with a short expiration time for password reset
    const resetToken = jwt.sign({ userId: user._id }, '03079957468', { expiresIn: '1h' });

    // Send the reset link to the user's email
    const transporter = nodemailer.createTransport({
      // Configure your email service
      host: 'smtp.gmail.email',
      port: 587,
      secure: false,
      requireTLS: true,
      auth: {
        user: "hase271002@gmail.com",
        pass: "vjxbcbugijpxfilo",
      },
      debug: true,
    });

    const resetLink = `http://localhost:3000/reset-password?token=${resetToken}`;
    const mailOptions = {
      from: 'hase271002@gmail.com',
      to: user.email,
      subject: 'Password Reset',
      text: `Click the link below to reset your password:\n${resetLink}`,
    };

    await transporter.sendMail(mailOptions);

    res.json({ message: 'Password reset link sent to your email' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to send reset link' });
  }
});

// Reset password route
app.post('/reset-password', async (req, res) => {
  try {
    const { token, newPassword } = req.body;

    // Verify the reset token
    jwt.verify(token, '03079957468', async (err, decodedToken) => {
      if (err) {
        return res.status(401).json({ error: 'Invalid or expired token' });
      }

      const { userId } = decodedToken;

      // Find the user by the decoded user ID
      const user = await User.findById(userId);
      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }

      // Hash the new password
      const hashedPassword = await bcrypt.hash(newPassword, 10);

      // Update the user's password
      user.password = hashedPassword;
      await user.save();

      res.json({ message: 'Password reset successful' });
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to reset password' });
  }
});




// Start the server
app.listen(3000, () => {
  console.log('Server is running on port 3000');
});
