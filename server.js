const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const mongoose = require('mongoose');
const session = require('express-session');
const path = require('path');

const app = express();
const PORT = 3000;

// Middlewares
app.use(cors({
    origin: 'http://localhost:3000', // Change to your frontend URL
    credentials: true // Allow cookies to be sent
}));
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, 'public')));

app.use(session({
    secret: 'your-secret-key',
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
    role: { type: String, default: 'faculty' },
    facultyId: String
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
    role: String,
    isAssigned: Boolean,
});

const questionAssignerSchema = new mongoose.Schema({
    facultyId: String,
    subject: String,
    subjectCode: String,
    subjectName: String,
    regulation: String,
    facultyName: String,
    year: Number,
    assignedBy: String,
    createdAt: { type: Date, default: Date.now },
    response: { type: String, default: "" },
    role: {
        type: String,  // Role field to store either "scrutiny" or "question assigner"
        required: true
    }
});


// Models
const User = mongoose.model('User', userSchema);
const ExtraDetails = mongoose.model('ExtraDetails', extraDetailsSchema);
const FacultyAssignment = mongoose.model('FacultyAssignment', facultyAssignmentSchema);
const QuestionAssigner = mongoose.model('QuestionAssigner', questionAssignerSchema);

app.post('/save-faculty-assignment', async (req, res) => {
    const { facultyId, subjectCode, subjectName, numberOfQuestions, regulation, role } = req.body;

    const existingAssignment = await FacultyAssignment.findOne({ facultyId, subjectCode, role });
    if (existingAssignment) {
        return res.status(400).json({ message: 'Faculty assignment already exists' });
    }

    // Fetch the faculty name and subject from ExtraDetails
    const extraDetails = await ExtraDetails.findOne({ facultyId });
    const facultyName = extraDetails ? extraDetails.fullName : 'Unknown Faculty';

    try {
        // Create and save the new faculty assignment
        const newFacultyAssignment = new FacultyAssignment({
            facultyId,
            facultyName,
            subjectCode,
            subjectName,
            numberOfQuestions: Number(numberOfQuestions),
            regulation,
            role,
            isAssigned: false
        });

        await newFacultyAssignment.save();

        // Update ExtraDetails with assigned subject
        await ExtraDetails.updateOne(
            { facultyId },
            { $set: { assignedSubject: subjectName, isAssigned: true } }
        );

        // ✨ Automatically add to QuestionAssigner collection with role
        const alreadyInQA = await QuestionAssigner.findOne({ facultyId, subject: subjectName });
        if (!alreadyInQA) {
            const qa = new QuestionAssigner({
                facultyId,
                subject: subjectName,
                subjectCode,    // Save the subject code
                subjectName,    // Save the subject name
                regulation,     // Save the regulation
                facultyName,    // Save the faculty name
                year: new Date().getFullYear(),
                assignedBy: req.session.user?.username || "ADMIN",
                role: role       // Save the role
            });
            await qa.save();
        }

        res.status(201).json({ message: 'Faculty Assignment saved successfully' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error' });
    }
});



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
    // if (!req.session.user || !req.session.user.facultyId) {
    //     return res.status(401).json({ message: "User session not found." });
    // }

    console.log(req)

    const facultyId = req.session.user.facultyId;
    console.log(facultyId)

    const extraDetails = await FacultyAssignment.findOne({ facultyId });
    if (!extraDetails) {
        return res.status(404).json({ message: 'Faculty not found' });
    }

    res.status(200).json({
        isAssigned: extraDetails.isAssigned || false,
        assignedSubject: extraDetails.assignedSubject || '',
        subjectName: extraDetails.subjectName,
        role: extraDetails.role,
        numberOfQuestions: extraDetails.numberOfQuestions,
        regulation: extraDetails.regulation
    });
});

app.post('/update-faculty-assignment', async (req, res) => {
    const { response } = req.body;
    const facultyId = req.session.user.facultyId;

    const extraDetails = await ExtraDetails.findOne({ facultyId });
    if (!extraDetails) {
        return res.status(404).json({ message: 'Faculty not found' });
    }

    if (response === 'no') {
        await ExtraDetails.updateOne({ facultyId }, { $set: { isAssigned: false, assignedSubject: '' } });
        res.status(200).json({ message: 'You have declined the assignment.', response });
    } else if (response === 'yes') {
        res.status(200).json({ message: 'You have accepted the assignment.', response });
    } else {
        res.status(400).json({ message: 'Invalid response' });
    }
});

app.post('/remove-faculty-assignment', async (req, res) => {
    const { facultyId } = req.body;

    if (!facultyId) {
        return res.status(400).json({ message: 'Faculty ID missing' });
    }

    try {
        // Remove the assignments from FacultyAssignment collection
        const assignmentResult = await FacultyAssignment.deleteMany({ facultyId });
        console.log(`Deleted ${assignmentResult.deletedCount} assignments from FacultyAssignment`);

        if (assignmentResult.deletedCount === 0) {
            return res.status(404).json({ message: 'No assignments found for the faculty' });
        }

        // Remove the associated records from ExtraDetails
        const extraDetailsUpdateResult = await ExtraDetails.updateOne(
            { facultyId },
            { $set: { assignedSubject: '', isAssigned: false } }
        );
        console.log(`Updated ExtraDetails: ${extraDetailsUpdateResult.nModified} record(s)`);

        if (extraDetailsUpdateResult.nModified === 0) {
            return res.status(404).json({ message: 'Faculty details not found or already updated' });
        }

        // Optionally, remove from QuestionAssigner if needed
        const questionAssignerResult = await QuestionAssigner.deleteMany({ facultyId });
        console.log(`Deleted ${questionAssignerResult.deletedCount} records from QuestionAssigner`);

        res.status(200).json({ message: 'Faculty assignment removed successfully' });
    } catch (err) {
        console.error('Error deleting faculty assignment:', err);
        res.status(500).json({ message: 'Server error while deleting' });
    }
});

app.post("/signup", async (req, res) => {
    const { username, password, role = 'faculty', facultyId = "1000" } = req.body;

    if (!username || !password) {
        return res.status(400).json({ message: "Username and password are required." });
    }

    try {
        const existingUser = await User.findOne({ username });
        if (existingUser) {
            return res.status(400).json({ message: "User already exists." });
        }

        // facultyId = facultyId || Math.floor(Math.random() * 100000)


        const newUser = new User({ username, password, role: role.toLowerCase(), facultyId });
        await newUser.save();
        req.session.user = newUser;

        res.status(201).json({ message: "Signup successful!" });
    } catch (error) {
        console.error("Signup error:", error);
        res.status(500).json({ message: "Error signing up." });
    }
});


// ✨ Save Extra Faculty Details (Missing Route Added)
app.post('/signup-details', async (req, res) => {
    const {
        username, fullName, dob, facultyId, address, campus, campusName,
        email, phone, altPhone, bankAccount, ifsc, micr,
        branchName, branchAddress, qualification, expertise
    } = req.body;

    try {
        const existing = await ExtraDetails.findOne({ username });
        if (existing) {
            return res.status(400).json({ message: "Details already submitted." });
        }

        await User.updateOne({ username }, { $set: { facultyId } })

        const extraDetails = new ExtraDetails({
            username, fullName, dob, facultyId, address, campus, campusName,
            email, phone, altPhone, bankAccount, ifsc, micr,
            branchName, branchAddress, qualification, expertise
        });

        await extraDetails.save();
        res.status(201).json({ message: "Extra details saved successfully!" });
    } catch (err) {
        console.error("Signup-details error:", err);
        res.status(500).json({ message: "Failed to save details." });
    }
});

// Full Profile API
app.get('/full-profile', async (req, res) => {
    const { username } = req.query;

    const user = await User.findOne({ username });
    if (!user) {
        return res.status(400).json({ message: 'User not found' });
    }

    const extraDetails = await ExtraDetails.findOne({ username });
    if (!extraDetails) {
        return res.status(400).json({ message: 'Extra details not found' });
    }

    res.status(200).json({ user, extraDetails });
});

// Admin Login
app.post('/admin_login', (req, res) => {
    const { username, password } = req.body;

    if (username === 'ADMIN' && password === 'admin@CEG') {
        req.session.user = { username: 'ADMIN', role: 'admin' };
        res.status(200).json({ message: 'Admin login successful' });
    } else {
        res.status(401).json({ message: 'Invalid admin credentials' });
    }
});

// Faculty Login
app.post('/faculty_login', async (req, res) => {
    const { username, password } = req.body;

    if (!username || !password) {
        return res.status(400).json({ message: "Username and password are required." });
    }

    try {
        // Check for the user with matching username and password
        const user = await User.findOne({ username, password, role: 'faculty' });

        if (!user) {
            return res.status(404).json({ message: "User not found." });
        }

        req.session.user = {
            username: user.username,
            role: user.role,
            facultyId: user.facultyId
        };

        console.log(req.session.user)

        res.status(200).json({ message: "Login successful!" });
    } catch (error) {
        res.status(500).json({ message: "Server error." });
    }
});


// Admin Dashboard
app.get('/dashboard.html', (req, res) => {
    if (req.session.user && req.session.user.role === 'admin') {
        res.sendFile(path.join(__dirname, 'public/admin_dashboard.html'));
    } else {
        res.redirect('/');
    }
});

// Faculty Dashboard
app.get('/faculty_dashboard.html', (req, res) => {
    if (req.session.user && req.session.user.role === 'faculty') {
        res.sendFile(path.join(__dirname, 'public/faculty_dashboard.html'));
    } else {
        res.redirect('/');
    }
});

app.post('/add-question-assigner', async (req, res) => {
    const { facultyId, subject, subjectCode, subjectName, regulation, facultyName, year, assignedBy } = req.body;
    try {
        const newEntry = new QuestionAssigner({
            facultyId,
            subject,
            subjectCode,    // Save the subject code
            subjectName,    // Save the subject name
            regulation,     // Save the regulation
            facultyName,    // Save the faculty name
            year,
            assignedBy
        });
        await newEntry.save();
        res.status(201).json({ message: 'Faculty added to question assigner list' });
    } catch (err) {
        res.status(500).json({ message: 'Error adding entry', error: err });
    }
});

app.get('/get-question-assigner-status', async (req, res) => {
    const { facultyId } = req.session.user;
    try {
        const assign = await QuestionAssigner.findOne({ facultyId, response: '' });
        if (assign) {
            return res.status(200).json({ prompt: true, data: assign });
        }
        res.status(200).json({ prompt: false });
    } catch (err) {
        res.status(500).json({ message: 'Error checking status' });
    }
});
app.post('/respond-question-assigner', async (req, res) => {
    const { facultyId } = req.session.user;
    const { response } = req.body;
    try {
        const updated = await QuestionAssigner.findOneAndUpdate(
            { facultyId, response: '' },
            { $set: { response } }
        );
        if (updated) {
            res.status(200).json({ message: "Response recorded." });
        } else {
            res.status(404).json({ message: "No pending prompt found." });
        }
    } catch (err) {
        res.status(500).json({ message: "Error updating response." });
    }
});
app.get('/question-assigner-responses', async (req, res) => {
    try {
        const responses = await QuestionAssigner.find({});
        res.status(200).json(responses);
    } catch (err) {
        res.status(500).json({ message: "Error fetching responses." });
    }
});


// Start the server
app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});