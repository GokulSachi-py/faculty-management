const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const mongoose = require('mongoose');
const session = require('express-session'); // ADD THIS LINE
const path = require('path');

const app = express();
const PORT = 3000;

app.use(cors());
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, 'public')));
app.use(session({               // ADD THIS BLOCK
  secret: 'mysecretkey',
  resave: false,
  saveUninitialized: true
}));

// MongoDB connection
mongoose.connect('mongodb://localhost:27017/signupDB', {
  useNewUrlParser: true,
  useUnifiedTopology: true
});

mongoose.connection.on('connected', () => {
  console.log('Connected to MongoDB');
});
mongoose.connection.on('error', (err) => {
  console.log('MongoDB connection error:', err);
});

// Basic login user schema with role
const userSchema = new mongoose.Schema({
  username: String,
  password: String,
  role: String
});

// Extended faculty details schema
const extraDetailsSchema = new mongoose.Schema({
  username: String,
  fullName: String,
  dob: String,
  facultyId: String,
  address: String,
  campus: String,
  campusName: String,
  email: String,
  phone: String,
  altPhone: String,
  bankAccount: String,
  ifsc: String,
  micr: String,
  branchName: String,
  branchAddress: String,
  qualification: String,
  expertise: String
});

// Models
const User = mongoose.model('User', userSchema);
const ExtraDetails = mongoose.model('ExtraDetails', extraDetailsSchema);

// Signup route
app.post('/signup', async (req, res) => {
  const { username, password, role } = req.body;

  const existingUser = await User.findOne({ username });
  if (existingUser) {
    return res.status(400).json({ message: 'User already exists' });
  }

  const user = new User({ username, password, role });

  try {
    await user.save();
    res.status(200).json({ message: 'Signup successful' });
  } catch (err) {
    res.status(500).json({ message: 'Error saving user', error: err });
  }
});

// Extra details submission route
app.post('/signup-details', async (req, res) => {
  const {
    username, fullName, dob, facultyId, address,
    campus, campusName, email, phone, altPhone,
    bankAccount, ifsc, micr, branchName, branchAddress,
    qualification, expertise
  } = req.body;

  const user = await User.findOne({ username });

  if (!user) {
    return res.status(400).json({ message: 'User not found' });
  }

  const newDetails = new ExtraDetails({
    username, fullName, dob, facultyId, address,
    campus, campusName, email, phone, altPhone,
    bankAccount, ifsc, micr, branchName, branchAddress,
    qualification, expertise
  });

  try {
    await newDetails.save();
    res.status(200).json({ message: 'Extra details saved successfully' });
  } catch (err) {
    res.status(500).json({ message: 'Error saving extra details', error: err });
  }
});

// Login route with CAPTCHA validation
app.post('/login', async (req, res) => {
  const { username, password, role, sum, expectedSum } = req.body;

  const user = await User.findOne({ username, password, role });

  if (!user) {
    return res.status(401).json({ message: 'Invalid username, password, or role' });
  }

  if (parseInt(sum) !== parseInt(expectedSum)) {
    return res.status(401).json({ message: 'CAPTCHA incorrect' });
  }

  res.status(200).json({ message: `Welcome, ${username} (${role})! Login successful.` });
});

// View all extra details
app.get('/view-extra-details', async (req, res) => {
  try {
    const extraDetails = await ExtraDetails.find();
    res.status(200).json(extraDetails);
  } catch (err) {
    res.status(500).json({ message: 'Error fetching extra details', error: err });
  }
});

// Serve frontend
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public/index.html'));
});

// Admin login route
app.post('/admin_login', (req, res) => {
  const { username, password } = req.body;

  if (username === 'admin' && password === 'admin123') {
    req.session.user = 'admin';
    res.redirect('/admin_dashboard');
  } else {
    res.send('Invalid credentials');
  }
});

// Admin dashboard route
app.get('/admin_dashboard', (req, res) => {
  if (req.session.user === 'admin') {
    res.sendFile(path.join(__dirname, 'public/admin_dashboard.html')); // Moved inside /public
  } else {
    res.redirect('/');
  }
});

// Start server
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});