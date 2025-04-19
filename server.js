const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const mongoose = require('mongoose');
const session = require('express-session');
const path = require('path');

const app = express();
const PORT = 3000;

app.use(cors());
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, 'public')));
app.use(session({
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

// Faculty assignment schema
const facultyAssignmentSchema = new mongoose.Schema({
  facultyId: String,
  facultyName: String,
  subjectCode: String,
  subjectName: String,
  numberOfQuestions: Number,
  regulation: String,
  role: String
});

// Model for Faculty Assignment
const FacultyAssignment = mongoose.model('FacultyAssignment', facultyAssignmentSchema);

// Route to save faculty assignment
app.post('/save-faculty-assignment', async (req, res) => {
  try {
    const { facultyID, facultyName, subjectCode, subjectName, numberOfQuestions, regulation, role } = req.body;

    // Validation: Ensure all fields are present
    if (!facultyID || !facultyName || !subjectCode || !subjectName || !numberOfQuestions || !regulation || !role) {
      return res.status(400).json({ message: 'All fields are required' });
    }

    // Create a new FacultyAssignment document
    const newFacultyAssignment = new FacultyAssignment({
      facultyId: facultyID,
      facultyName: facultyName,
      subjectCode: subjectCode,
      subjectName: subjectName,
      numberOfQuestions: numberOfQuestions,
      regulation: regulation,
      role: role
    });

    // Save the document to the database
    await newFacultyAssignment.save();

    // Send success response
    res.status(201).json({ message: 'Faculty Assignment saved successfully' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
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

    req.session.user = { username: user.username, role: user.role }; // Store user info in session
    return res.status(200).json({ message: `Welcome, ${username} (${role})! Login successful.`, role: user.role });
});

// View all extra details (Admin only - needs proper authentication later)
app.get('/view-extra-details', async (req, res) => {
    // In a real application, you would check if the user is an admin here
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

  if (username === 'ADMIN' && password === 'admin@CEG') {
      req.session.user = { username: 'ADMIN', role: 'admin' };
      res.status(200).json({ message: 'Admin login successful' }); // ✅ GOOD
  } else {
      res.status(401).json({ message: 'Invalid admin credentials' });
  }
});

// Admin dashboard route
app.get('/dashboard.html', (req, res) => {
  if (req.session.user && req.session.user.role === 'admin') {
      res.sendFile(path.join(__dirname, 'public/admin_dashboard.html'));
  } else {
      res.redirect('/'); // Redirect to the login page if not an admin
  }
});

// 404 fallback for unknown API routes
app.use((req, res, next) => {
  if (req.path.startsWith('/api')) {  // Assuming APIs are prefixed later
      res.status(404).json({ message: 'API route not found' });
  } else {
      res.sendFile(path.join(__dirname, 'public', 'index.html'));
  }
});

// Faculty dashboard route - Protect this route with session check
app.get('/faculty_dashboard.html', (req, res) => {
    if (req.session.user && req.session.user.role === 'Faculty') {
        res.sendFile(path.join(__dirname, 'public/faculty_dashboard.html')); // Assuming you have this file
    } else {
        res.redirect('/'); // Redirect to the login page if not faculty
    }
});

// Faculty details route - Fetch faculty details for faculty dashboard
app.get('/faculty-details', async (req, res) => {
    const { username } = req.session.user;

    try {
        const facultyDetails = await ExtraDetails.findOne({ username });
        if (!facultyDetails) {
            return res.status(404).json({ message: 'Faculty details not found' });
        }
        res.status(200).json(facultyDetails);
    } catch (err) {
        res.status(500).json({ message: 'Error fetching faculty details', error: err });
    }
});

// Logout route
app.get('/logout', (req, res) => {
    req.session.destroy((err) => {
        if (err) {
            console.error('Error destroying session:', err);
            return res.status(500).send('Error during logout');
        }
        res.redirect('/'); // Redirect to the home page after logout
    });
});

// Start server
app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});
