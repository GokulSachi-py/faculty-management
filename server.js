const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const mongoose = require('mongoose');
const session = require('express-session');
const path = require('path');

const app = express();
const PORT = 3000;

// Middlewares
app.use(cors());
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, 'public')));
app.use(session({
    secret: 'mysecretkey',
    resave: false,
    saveUninitialized: true
}));

// MongoDB Connection
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

// Mongoose Schemas
const userSchema = new mongoose.Schema({
    username: { type: String, unique: true },
    password: String,
    role: String,
    facultyId: { type: String, unique: true, sparse: true } // ✅ Added this line
});


const extraDetailsSchema = new mongoose.Schema({
    username: { type: String, unique: true },
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
    expertise: String,
    assignedSubject: { type: String, default: "" },
    isAssigned: { type: Boolean, default: false }
});

const facultyAssignmentSchema = new mongoose.Schema({
    facultyId: String,
    facultyName: String,
    subjectCode: String,
    subjectName: String,
    numberOfQuestions: Number,
    regulation: String,
    role: String
});

const questionAssignerSchema = new mongoose.Schema({
    subject: String,
    year: Number,
    assignedBy: String,
    createdAt: { type: Date, default: Date.now }
});

// Models
const User = mongoose.model('User', userSchema);
const ExtraDetails = mongoose.model('ExtraDetails', extraDetailsSchema);
const FacultyAssignment = mongoose.model('FacultyAssignment', facultyAssignmentSchema);
const QuestionAssigner = mongoose.model('QuestionAssigner', questionAssignerSchema);

// Routes

// 🛠 Faculty Assignment Saving
app.post('/save-faculty-assignment', async (req, res) => {
    const { facultyId, facultyName, subjectCode, subjectName, numberOfQuestions, regulation, role } = req.body;

    const existingAssignment = await FacultyAssignment.findOne({
        facultyId,
        subjectCode,
        role
    });

    if (existingAssignment) {
        return res.status(400).json({ message: 'Faculty assignment already exists' });
    }

    const newFacultyAssignment = new FacultyAssignment({
        facultyId,
        facultyName,
        subjectCode,
        subjectName,
        numberOfQuestions: Number(numberOfQuestions),
        regulation,
        role
    });

    try {
        await newFacultyAssignment.save();

        // Update ExtraDetails to reflect the assignment
        await ExtraDetails.updateOne(
            { facultyId },
            { $set: { assignedSubject: subjectName, isAssigned: true } }
        );

        res.status(201).json({ message: 'Faculty Assignment saved successfully' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error' });
    }
});

// 🧑‍🏫 Fetch Faculty Assignments
app.get('/api/faculty-assignments', async (req, res) => {
    try {
        const assignments = await FacultyAssignment.find({});
        res.json(assignments);
    } catch (err) {
        console.error("Error fetching faculty assignments:", err);
        res.status(500).json({ message: "Error fetching assignments" });
    }
});

app.get('/get-faculty-assignment-status', async (req, res) => {
    if (!req.session.user || !req.session.user.facultyId) {
        return res.status(401).json({ message: "User session not found." });
    }

    const facultyId = req.session.user.facultyId;

    const extraDetails = await ExtraDetails.findOne({ facultyId });
    if (!extraDetails) {
        return res.status(404).json({ message: 'Faculty not found' });
    }

    res.status(200).json({
        isAssigned: extraDetails.isAssigned || false,
        assignedSubject: extraDetails.assignedSubject || ''
    });
});

// 🖋️ Update Faculty Assignment Response
app.post('/update-faculty-assignment', async (req, res) => {
    const { response } = req.body;  // 'yes' or 'no'
    const facultyId = req.session.user.facultyId;

    const extraDetails = await ExtraDetails.findOne({ facultyId });
    if (!extraDetails) {
        return res.status(404).json({ message: 'Faculty not found' });
    }

    if (response === 'no') {
        // Update the status to reflect the faculty declined the assignment
        await ExtraDetails.updateOne({ facultyId }, { $set: { isAssigned: false, assignedSubject: '' } });
        res.status(200).json({ message: 'You have declined the assignment.', response });
    } else if (response === 'yes') {
        // Faculty accepted the assignment
        res.status(200).json({ message: 'You have accepted the assignment.', response });
    } else {
        res.status(400).json({ message: 'Invalid response' });
    }
});

// 🧹 Remove Faculty Assignment
app.post('/remove-faculty-assignment', async (req, res) => {
    const { facultyId } = req.body;

    if (!facultyId) {
        return res.status(400).json({ message: 'Faculty ID missing' });
    }

    try {
        const deletedAssignment = await FacultyAssignment.findOneAndDelete({ facultyId });

        if (!deletedAssignment) {
            return res.status(404).json({ message: 'Faculty assignment not found' });
        }

        res.status(200).json({ message: 'Faculty assignment removed successfully' });
    } catch (err) {
        console.error('Error deleting assignment:', err);
        res.status(500).json({ message: 'Server error while deleting' });
    }
});

app.post('/signup', async (req, res) => {
    const {
        username, password, role, facultyId, fullName, dob,
        address, campus, campusName, email, phone, altPhone,
        bankAccount, ifsc, micr, branchName, branchAddress,
        qualification, expertise
    } = req.body;

    if (!username || !password || !role || !facultyId || !fullName || !email || !phone) {
        return res.status(400).json({ message: "All required fields must be filled." });
    }

    try {
        const existingUser = await User.findOne({ username });
        if (existingUser) {
            return res.status(400).json({ message: "Username already taken!" });
        }

        const user = new User({ username, password, role, facultyId });
        const extraDetails = new ExtraDetails({
            username, fullName, dob, facultyId, address, campus,
            campusName, email, phone, altPhone, bankAccount, ifsc,
            micr, branchName, branchAddress, qualification, expertise
        });

        await user.save();
        await extraDetails.save();

        res.status(201).json({ message: "Signup successful!" });
    } catch (error) {
        console.error("Signup error:", error);
        res.status(500).json({ message: "Server error, try again later." });
    }
});

// ✨ Full Profile API
app.get('/full-profile', async (req, res) => {
    const { username } = req.query; // Expecting username in query

    const user = await User.findOne({ username });
    if (!user) {
        return res.status(400).json({ message: 'User not found' });
    }

    const extraDetails = await ExtraDetails.findOne({ username });
    if (!extraDetails) {
        return res.status(400).json({ message: 'Extra details not found' });
    }

    res.status(200).json({
        user,
        extraDetails
    });
});

// ✨ Admin Login
app.post('/admin_login', (req, res) => {
    const { username, password } = req.body;

    if (username === 'ADMIN' && password === 'admin@CEG') {
        req.session.user = { username: 'ADMIN', role: 'admin' };
        res.status(200).json({ message: 'Admin login successful' });
    } else {
        res.status(401).json({ message: 'Invalid admin credentials' });
    }
});

app.post('/faculty_login', async (req, res) => {
    const { username, password } = req.body;

    if (!username || !password) {
        return res.status(400).json({ message: "Username and password are required." });
    }

    try {
        const user = await User.findOne({ username, role: 'Faculty' });

        if (!user) {
            return res.status(404).json({ message: "User not found." });
        }

        if (user.password !== password) {
            return res.status(400).json({ message: "Incorrect password." });
        }

        // ✅ Set session user object
        req.session.user = {
            username: user.username,
            role: user.role,
            facultyId: user.facultyId
        };

        res.status(200).json({ message: "Login successful!" });
    } catch (error) {
        res.status(500).json({ message: "Server error." });
    }
});

// 🖥️ Admin Dashboard
app.get('/dashboard.html', (req, res) => {
    if (req.session.user && req.session.user.role === 'admin') {
        res.sendFile(path.join(__dirname, 'public/admin_dashboard.html'));
    } else {
        res.redirect('/');
    }
});

// 🎓 Faculty Dashboard
app.get('/faculty_dashboard.html', (req, res) => {
    if (req.session.user && req.session.user.role === 'faculty') {
        res.sendFile(path.join(__dirname, 'public/faculty_dashboard.html'));
    } else {
        res.redirect('/');
    }
});

// Start Server
app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});
