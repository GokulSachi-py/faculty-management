# Faculty Management System

A comprehensive web-based faculty management system for Anna University CEG, designed to streamline question paper assignment, submission, scrutiny, and approval processes.

## 🌟 Features

### 🔐 Authentication & User Management
- **Multi-role Authentication**: Admin and Faculty login systems
- **Session Management**: Secure session handling with express-session
- **Password Reset**: OTP-based password reset via email
- **Profile Management**: Complete faculty profile with personal and professional details

### 📋 Faculty Assignment System
- **Subject Assignment**: Admin can assign subjects to faculty members
- **Role-based Assignments**: Support for Question Paper Setter and Scrutinizer roles
- **Deadline Management**: Configurable deadlines for assignments
- **Response Tracking**: Faculty can accept/reject assignments

### 📝 Question Paper Management
- **Question Paper Creation**: Faculty can create structured question papers
- **Multi-part Questions**: Support for Part A, B, and C questions
- **File Upload**: PDF and document upload capabilities
- **Download Functionality**: HTML-formatted question paper downloads

### 🔍 Scrutiny System
- **Scrutinizer Assignment**: Admin can assign scrutinizers to question papers
- **Scrutiny Requests**: Faculty can accept/reject scrutiny assignments
- **Scrutiny Submission**: Detailed scrutiny reports with remarks
- **Status Tracking**: Real-time status updates for scrutiny process

### 📊 Admin Dashboard
- **Assignment Overview**: Complete view of all faculty assignments
- **Question Paper Tracking**: Monitor submission and approval status
- **Scrutiny Management**: Assign and track scrutinizers
- **User Management**: Faculty profile and assignment management

### 📱 Faculty Dashboard
- **Assignment Notifications**: Real-time assignment alerts
- **Deadline Tracking**: Automated deadline reminders
- **Question Paper Creation**: Intuitive question paper builder
- **Scrutiny Interface**: Easy scrutiny request management

### 📧 Email Integration
- **OTP Delivery**: Secure password reset via email
- **Notification System**: Automated email notifications
- **SMTP Configuration**: Gmail SMTP integration

## 🛠️ Technology Stack

- **Backend**: Node.js with Express.js
- **Database**: MongoDB with Mongoose ODM
- **Frontend**: HTML5, CSS3, JavaScript (Vanilla)
- **Email**: Nodemailer with Gmail SMTP
- **Session Management**: Express-session
- **CORS**: Cross-origin resource sharing enabled

## 📦 Installation

### Prerequisites
- Node.js (v14 or higher)
- MongoDB (v4.4 or higher)
- Git

### Setup Instructions

1. **Clone the repository**
   ```bash
   git clone https://github.com/GokulSachi-py/faculty-management.git
   cd faculty-management
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Configure environment variables**
   
   Create a `.env` file in the root directory:
   ```env
   EMAIL_USER=your-email@gmail.com
   EMAIL_PASS=your-app-password
   ```
   
   **Note**: For Gmail, you'll need to:
   - Enable 2-factor authentication
   - Generate an App Password
   - Use the App Password in EMAIL_PASS

4. **Configure MongoDB**
   
   Ensure MongoDB is running on your system:
   ```bash
   # Start MongoDB (Windows)
   net start MongoDB
   
   # Start MongoDB (Linux/Mac)
   sudo systemctl start mongod
   ```

5. **Update config.js (if needed)**
   
   If you prefer to use config.js instead of environment variables:
   ```javascript
   module.exports = {
       email: {
           user: 'your-email@gmail.com',
           pass: 'your-app-password'
       }
   };
   ```

6. **Start the application**
   ```bash
   node server.js
   ```

7. **Access the application**
   
   Open your browser and navigate to:
   ```
   http://localhost:3000
   ```

## 👥 User Roles & Access

### Admin Access
- **Username**: `ADMIN`
- **Password**: `admin@CEG`
- **Capabilities**:
  - Assign subjects to faculty
  - Monitor question paper submissions
  - Assign scrutinizers
  - Approve/reject question papers
  - Manage faculty profiles

### Faculty Access
- **Registration**: Self-registration with faculty ID
- **Login**: Username and password authentication
- **Capabilities**:
  - Accept/reject assignments
  - Create question papers
  - Respond to scrutiny requests
  - Submit scrutiny reports
  - Manage profile information

## 📁 Project Structure

```
faculty-management/
├── config.js                 # Email configuration
├── server.js                 # Main server file
├── package.json              # Dependencies
├── README.md                 # This file
├── models/
│   ├── ApprovalRequest.js    # Approval request model
│   └── QuestionPaper.js      # Question paper model
└── public/
    ├── index.html            # Landing page
    ├── admin_dashboard.html  # Admin interface
    ├── faculty_dashboard.html # Faculty interface
    ├── set_question_paper.html # Question paper creation
    ├── scrutiny.html         # Scrutiny interface
    ├── profile.html          # Profile management
    ├── style.css             # Styling
    └── files/                # Uploaded files
```

## 🔧 API Endpoints

### Authentication
- `POST /signup` - User registration
- `POST /faculty_login` - Faculty login
- `POST /admin_login` - Admin login
- `POST /logout` - User logout
- `POST /forgot-password` - Password reset request
- `POST /reset-password` - Password reset

### Faculty Management
- `POST /signup-details` - Save faculty details
- `GET /full-profile` - Get complete profile
- `GET /get-user` - Get user by username

### Assignment Management
- `POST /save-faculty-assignment` - Create assignment
- `GET /api/faculty-assignments` - Get all assignments
- `GET /get-faculty-assignment-status` - Get faculty assignments
- `POST /update-faculty-assignment` - Update assignment response
- `POST /remove-faculty-assignment` - Remove assignment

### Question Paper Management
- `POST /api/questionpaper` - Create question paper
- `GET /api/questionpapers` - Get all question papers
- `GET /api/questionpaper/:id` - Get specific question paper
- `GET /api/questionpaper/:id/download` - Download question paper
- `POST /api/questionpaper/:id/approval` - Approve/reject paper

### Scrutiny Management
- `POST /api/assign-scrutinizer` - Assign scrutinizer
- `POST /api/submit-scrutiny` - Submit scrutiny report
- `GET /api/scrutiny-papers` - Get scrutiny assignments
- `GET /api/pending-scrutiny-requests` - Get pending requests
- `POST /api/respond-to-scrutiny-request` - Respond to scrutiny request

## 🚀 Usage Guide

### For Admins

1. **Login**: Use admin credentials to access the dashboard
2. **Assign Subjects**: Navigate to assignment section and assign subjects to faculty
3. **Monitor Submissions**: Track question paper submissions and approvals
4. **Assign Scrutinizers**: Assign scrutinizers to submitted question papers
5. **Approve Papers**: Review and approve/reject final question papers

### For Faculty

1. **Registration**: Register with faculty ID and personal details
2. **Login**: Access faculty dashboard with credentials
3. **Respond to Assignments**: Accept or reject subject assignments
4. **Create Question Papers**: Use the question paper builder interface
5. **Handle Scrutiny**: Respond to scrutiny requests and submit reports

## 🔒 Security Features

- **Session Management**: Secure session handling with expiration
- **Password Protection**: Encrypted password storage
- **CORS Protection**: Cross-origin request protection
- **Input Validation**: Server-side validation for all inputs
- **Email Verification**: OTP-based password reset system

## 📧 Email Configuration

The system uses Gmail SMTP for email notifications. To configure:

1. **Enable 2FA** on your Gmail account
2. **Generate App Password**:
   - Go to Google Account settings
   - Security → 2-Step Verification → App passwords
   - Generate password for "Mail"
3. **Update Environment Variables**:
   ```env
   EMAIL_USER=your-email@gmail.com
   EMAIL_PASS=your-16-digit-app-password
   ```

## 🐛 Troubleshooting

### Common Issues

1. **MongoDB Connection Error**
   - Ensure MongoDB is running
   - Check connection string in server.js

2. **Email Not Sending**
   - Verify Gmail credentials
   - Check App Password configuration
   - Ensure 2FA is enabled

3. **Session Issues**
   - Clear browser cookies
   - Check session configuration in server.js

4. **Port Already in Use**
   - Change PORT in server.js
   - Kill existing process on port 3000

### Debug Endpoints

- `GET /check-session` - Check current session
- `GET /api/debug-db` - Check database connection
- `GET /api/debug-state` - Check assignments and papers

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request
