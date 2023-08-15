const express = require('express');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');
const nodemailer = require('nodemailer');
const crypto = require('crypto'); 

const app = express();
app.use(express.json());

const transporter = nodemailer.createTransport({
  host: 'smtp.ethereal.email',
  port: 587,
  auth: {
    user: 'josue.mueller@ethereal.email ',
    pass: 'MPw4G1EDrfUbq8vpRf',
  },
});


// Connect to MongoDB
mongoose.connect('mongodb+srv://haseebmushtaq2002:beInHYjqwmFJCY1f@cluster0.jslfzox.mongodb.net/?retryWrites=true&w=majority', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
  .then(() => console.log('Connected to MongoDB'))
  .catch((err) => console.error('Failed to connect to MongoDB', err));


// Create a mongoose schema for the user
const userSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  resetToken: String,
  resetTokenExpiry: Date,
});

const authentication = mongoose.model('authentication', userSchema);

// Signup route
app.post('/signup', async (req, res) => {
  try {
    const { email, password } = req.body;

    // Check if the user already exists
    const existingUser = await authentication.findOne({ email });
    if (existingUser) {
      return res.status(409).json({ error: 'authentication already exists' });
    }

    // Hash the password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create a new user
    const newUser = new authentication({
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

// authentication login route
app.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    // Check if the user exists
    const user = await authentication.findOne({ email });
    if (!user) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    // Compare the provided password with the stored password
    const passwordMatch = await bcrypt.compare(password, user.password);
    if (!passwordMatch) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }
    
    // Generate and sign a JWT
    const token = jwt.sign({ userId: user._id, role: user.role }, '03079957468', { expiresIn: '10h' });

    res.json({ message: 'Login successful', token });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to login' });
  }
});

// Protected route example
app.get('/protected', verifyToken, (req, res) => {
  // Only authenticated users with the 'admin' or 'student' role can access this route
 

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
    const user = await authentication.findOne({ email });
    if (!user) {
      return res.status(404).json({ error: 'authentication not found' });
    }

    // Generate a reset token
    const resetToken = crypto.randomBytes(32).toString('hex');
    const resetTokenExpiry = Date.now() + 3600000; // Token expires in 1 hour

    // Update user with reset token and expiry
    user.resetToken = resetToken;
    user.resetTokenExpiry = resetTokenExpiry;
    await user.save();

    // Send the reset token to the user via email
    const mailOptions = {
      from: 'josue.mueller@ethereal.email',
      to: user.email,
      subject: 'Password Reset Request',
      text: `Your password reset token: ${resetToken}`,
    };

    transporter.sendMail(mailOptions, (error, info) => {
      if (error) {
        console.error(error);
        return res.status(500).json({ error: 'Failed to send reset token email' });
      }
      console.log('Reset token email sent: ' + info.response);
    });

    res.json({ message: 'Reset token generated and sent to your email' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to generate reset token' });
  }
});



app.post('/reset-password', async (req, res) => {
  try {
    const { email, resetToken, newPassword } = req.body;

    // Check if the user exists
    const user = await authentication.findOne({ email });
    if (!user) {
      return res.status(404).json({ error: 'authentication not found' });
    }

    // Check if the reset token is valid and not expired
    if (user.resetToken !== resetToken || user.resetTokenExpiry < Date.now()) {
      return res.status(401).json({ error: 'Invalid or expired reset token' });
    }

    // Hash the new password
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // Update user password and reset token fields
    user.password = hashedPassword;
    user.resetToken = undefined;
    user.resetTokenExpiry = undefined;
    await user.save();

    res.json({ message: 'Password reset successful' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to reset password' });
  }
});




const port = 3001;
app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});
