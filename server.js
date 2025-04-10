const express = require('express');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const cors = require('cors');
const path = require('path');

const app = express();
app.use(cors());
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, 'public')));

mongoose.connect('mongodb://localhost:27017/collegeLogin', {
  useNewUrlParser: true,
  useUnifiedTopology: true
});

// Define schema for login
const LoginSchema = new mongoose.Schema({
  username: String,
  password: String
});
const User = mongoose.model('User', LoginSchema);

// Define schema for profile
const ProfileSchema = new mongoose.Schema({
  username: String,
  name: String,
  staffId: String,
  department: String,
  phone: String,
  email: String,
  accNo: String,
  ifsc: String,
  bankName: String,
  micr: String
});
const Profile = mongoose.model('userData', ProfileSchema);

// Signup
app.post('/signup', async (req, res) => {
  const { username, password } = req.body;
  const userExists = await User.findOne({ username });
  if (userExists) return res.status(400).json({ message: 'User already exists' });

  await new User({ username, password }).save();
  res.status(201).json({ message: 'User registered successfully' });
});

// Login
app.post('/login', async (req, res) => {
  const { username, password, sum, expectedSum } = req.body;
  const user = await User.findOne({ username, password });

  if (!user) return res.status(401).json({ message: 'Invalid credentials' });
  if (parseInt(sum) !== expectedSum) return res.status(401).json({ message: 'Incorrect sum' });

  res.json({ message: 'Login successful', username });
});

// Get Profile
app.get('/profile/:username', async (req, res) => {
  const profile = await Profile.findOne({ username: req.params.username });
  if (!profile) return res.status(404).json({ message: 'Profile not found' });
  res.json(profile);
});

// Save or Update Profile
app.post('/profile/:username', async (req, res) => {
  const { username } = req.params;
  const data = req.body;
  const profile = await Profile.findOneAndUpdate({ username }, data, { upsert: true, new: true });
  res.json({ message: 'Profile saved successfully', profile });
});

app.listen(3000, () => console.log('Server running at http://localhost:3000'));
