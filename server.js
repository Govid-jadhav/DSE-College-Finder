const express = require('express');
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const dotenv = require('dotenv');
const path = require('path');
const nodemailer = require('nodemailer');

// Load environment variables
dotenv.config();

// Dynamic Transporter Setup based on env priority
let transporter = null;
let emailGatewayName = 'Console Log Fallback';

if (process.env.BREVO_SMTP_KEY && process.env.BREVO_SMTP_USER) {
    transporter = nodemailer.createTransport({
        host: 'smtp-relay.brevo.com',
        port: 587,
        secure: false,
        auth: {
            user: process.env.BREVO_SMTP_USER,
            pass: process.env.BREVO_SMTP_KEY
        }
    });
    emailGatewayName = 'Brevo SMTP';
} else if (process.env.EMAIL_USER && process.env.EMAIL_PASS) {
    transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
            user: process.env.EMAIL_USER,
            pass: process.env.EMAIL_PASS
        }
    });
    emailGatewayName = 'Gmail SMTP';
}

console.log(`Email verification service successfully initialized with: ${emailGatewayName}`);

const app = express();
app.use(express.json());

// Serve static assets from the current directory
app.use(express.static(__dirname));

// MongoDB connection
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/dse_predictor';
const PORT = process.env.PORT || 8080;
const JWT_SECRET = process.env.JWT_SECRET || 'dse_super_secret_jwt_key_2026';

console.log('Connecting to MongoDB...');
mongoose.connect(MONGODB_URI)
    .then(() => console.log('Successfully connected to MongoDB!'))
    .catch(err => {
        console.error('Error connecting to MongoDB:', err);
        console.log('Running in fallback mode (authentication APIs will report database unavailable).');
    });

// MongoDB Schema Definitions
const UserSchema = new mongoose.Schema({
    email: { type: String, required: true, unique: true, index: true },
    password: { type: String, required: true },
    username: { type: String, required: true },
    shortlist: { type: [String], default: [] },
    resetCode: { type: String, default: null },
    resetCodeExpires: { type: Date, default: null }
});

const User = mongoose.model('User', UserSchema);

const ReviewSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    username: { type: String, required: true },
    rating: { type: Number, required: true, min: 1, max: 5 },
    comment: { type: String, required: true },
    createdAt: { type: Date, default: Date.now }
});

const Review = mongoose.model('Review', ReviewSchema);

// Middleware for JWT authorization
const authenticateToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    
    if (!token) {
        return res.status(401).json({ message: 'No authorization token provided' });
    }
    
    jwt.verify(token, JWT_SECRET, (err, user) => {
        if (err) {
            return res.status(403).json({ message: 'Token is invalid or expired' });
        }
        req.user = user;
        next();
    });
};

// ----------------------------------------------------
// Authentication API Endpoints
// ----------------------------------------------------

// POST /api/auth/signup - Register new student
app.post('/api/auth/signup', async (req, res) => {
    try {
        const { username, email, password } = req.body;
        
        if (!username || !email || !password) {
            return res.status(400).json({ message: 'Please provide all required fields' });
        }
        
        if (mongoose.connection.readyState !== 1) {
            return res.status(503).json({ message: 'Database connection is currently unavailable. Please try again later.' });
        }
        
        // Check if user already exists
        const existingUser = await User.findOne({ email: email.toLowerCase() });
        if (existingUser) {
            return res.status(400).json({ message: 'Account with this email already exists' });
        }
        
        // Hash password
        const hashedPassword = await bcrypt.hash(password, 10);
        
        // Create user
        const newUser = new User({
            username,
            email: email.toLowerCase(),
            password: hashedPassword,
            shortlist: []
        });
        
        await newUser.save();
        
        // Sign JWT
        const token = jwt.sign({ id: newUser._id, email: newUser.email }, JWT_SECRET, { expiresIn: '7d' });
        
        res.status(201).json({
            message: 'User registered successfully',
            token,
            user: {
                id: newUser._id,
                username: newUser.username,
                email: newUser.email,
                shortlist: newUser.shortlist
            }
        });
    } catch (err) {
        console.error('Signup error:', err);
        res.status(500).json({ message: 'Internal server error occurred during registration' });
    }
});

// POST /api/auth/login - Authenticate student
app.post('/api/auth/login', async (req, res) => {
    try {
        const { email, password } = req.body;
        
        if (!email || !password) {
            return res.status(400).json({ message: 'Please provide email and password' });
        }
        
        if (mongoose.connection.readyState !== 1) {
            return res.status(503).json({ message: 'Database connection is currently unavailable. Please try again later.' });
        }
        
        // Check if user exists
        const user = await User.findOne({ email: email.toLowerCase() });
        if (!user) {
            return res.status(400).json({ message: 'Invalid email or password' });
        }
        
        // Check password correctness
        const isPasswordCorrect = await bcrypt.compare(password, user.password);
        if (!isPasswordCorrect) {
            return res.status(400).json({ message: 'Invalid email or password' });
        }
        
        // Sign JWT
        const token = jwt.sign({ id: user._id, email: user.email }, JWT_SECRET, { expiresIn: '7d' });
        
        res.json({
            message: 'Login successful',
            token,
            user: {
                id: user._id,
                username: user.username,
                email: user.email,
                shortlist: user.shortlist
            }
        });
    } catch (err) {
        console.error('Login error:', err);
        res.status(500).json({ message: 'Internal server error occurred during login' });
    }
});

// POST /api/auth/forgot-password - Generate OTP code and send email
app.post('/api/auth/forgot-password', async (req, res) => {
    try {
        const { email } = req.body;
        
        if (!email) {
            return res.status(400).json({ message: 'Please provide email address' });
        }
        
        if (mongoose.connection.readyState !== 1) {
            return res.status(503).json({ message: 'Database connection is currently unavailable. Please try again later.' });
        }
        
        const user = await User.findOne({ email: email.toLowerCase() });
        if (!user) {
            return res.status(404).json({ message: 'Account with this email does not exist' });
        }
        
        // Generate a 6-digit verification code
        const otp = Math.floor(100000 + Math.random() * 900000).toString();
        
        // Expiry in 10 minutes
        const expiry = new Date(Date.now() + 10 * 60 * 1000);
        
        user.resetCode = otp;
        user.resetCodeExpires = expiry;
        await user.save();
        
        // Log verification code in the server log clearly
        console.log(`\n====================================================`);
        console.log(`PASSWORD RESET REQUEST`);
        console.log(`User Email: ${user.email}`);
        console.log(`6-Digit Verification Code (OTP): ${otp}`);
        console.log(`Code Expires At: ${expiry.toISOString()}`);
        console.log(`====================================================\n`);
        
        // If any email credentials are set, send verification email
        if (transporter) {
            const senderEmail = process.env.BREVO_SMTP_USER || process.env.EMAIL_USER;
            const mailOptions = {
                from: `"DSE College Finder" <${senderEmail}>`,
                to: user.email,
                subject: 'DSE College Finder - Password Reset Verification Code',
                html: `
                    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 8px;">
                        <h2 style="color: #6366f1; text-align: center;">DSE College Finder</h2>
                        <p>Hello,</p>
                        <p>We received a request to reset your password for your Direct Second Year Engineering Admissions Predictor account.</p>
                        <p>Please use the following 6-digit verification code to complete your password reset. This code is valid for 10 minutes.</p>
                        <div style="text-align: center; margin: 30px 0;">
                            <span style="font-size: 32px; font-weight: bold; letter-spacing: 5px; color: #1e1b4b; background-color: #f3f4f6; padding: 10px 20px; border-radius: 6px; border: 1px dashed #6366f1;">${otp}</span>
                        </div>
                        <p>If you did not make this request, you can safely ignore this email. Your password will remain unchanged.</p>
                        <hr style="border: 0; border-top: 1px solid #eaeaea; margin: 20px 0;" />
                        <p style="font-size: 12px; color: #6b7280; text-align: center;">Direct Second Year Engineering Admissions Predictor App</p>
                    </div>
                `
            };

            transporter.sendMail(mailOptions, (err, info) => {
                if (err) {
                    console.error('Error sending email:', err);
                } else {
                    console.log('Verification email successfully sent:', info.response);
                }
            });

            return res.json({ message: 'Verification code generated and sent to your email.' });
        } else {
            return res.json({ message: 'Verification code generated. Please retrieve the code from the server console.' });
        }
    } catch (err) {
        console.error('Forgot password error:', err);
        res.status(500).json({ message: 'Internal server error generating reset token' });
    }
});

// POST /api/auth/reset-password - Verify OTP and update password
app.post('/api/auth/reset-password', async (req, res) => {
    try {
        const { email, otp, newPassword } = req.body;
        
        if (!email || !otp || !newPassword) {
            return res.status(400).json({ message: 'Please provide email, verification code, and new password' });
        }
        
        if (mongoose.connection.readyState !== 1) {
            return res.status(503).json({ message: 'Database connection currently offline.' });
        }
        
        const user = await User.findOne({ email: email.toLowerCase() });
        if (!user) {
            return res.status(404).json({ message: 'Account not found' });
        }
        
        // Check code presence, match, and expiration
        if (!user.resetCode || user.resetCode !== otp.trim()) {
            return res.status(400).json({ message: 'Invalid verification code' });
        }
        
        if (new Date() > user.resetCodeExpires) {
            return res.status(400).json({ message: 'Verification code has expired' });
        }
        
        if (newPassword.length < 6) {
            return res.status(400).json({ message: 'Password must be at least 6 characters' });
        }
        
        // Hash and update
        user.password = await bcrypt.hash(newPassword, 10);
        user.resetCode = null;
        user.resetCodeExpires = null;
        await user.save();
        
        console.log(`Password reset successfully completed for user: ${user.email}`);
        
        res.json({ message: 'Password reset successfully. You can now login.' });
    } catch (err) {
        console.error('Reset password error:', err);
        res.status(500).json({ message: 'Internal server error resetting password' });
    }
});

// ----------------------------------------------------
// User Profile & Shortlist API Endpoints
// ----------------------------------------------------

// GET /api/user/profile - Get profile data
app.get('/api/user/profile', authenticateToken, async (req, res) => {
    try {
        if (mongoose.connection.readyState !== 1) {
            return res.status(503).json({ message: 'Database connection currently offline.' });
        }
        
        const user = await User.findById(req.user.id).select('-password');
        if (!user) {
            return res.status(404).json({ message: 'User profile not found' });
        }
        
        res.json(user);
    } catch (err) {
        console.error('Profile fetch error:', err);
        res.status(500).json({ message: 'Internal server error' });
    }
});

// POST /api/user/shortlist - Sync/Save cloud shortlist codes
app.post('/api/user/shortlist', authenticateToken, async (req, res) => {
    try {
        const { shortlist } = req.body;
        
        if (!Array.isArray(shortlist)) {
            return res.status(400).json({ message: 'Invalid shortlist content format' });
        }
        
        if (mongoose.connection.readyState !== 1) {
            return res.status(503).json({ message: 'Database offline, could not persist shortlist.' });
        }
        
        const user = await User.findByIdAndUpdate(
            req.user.id,
            { shortlist: shortlist },
            { new: true }
        ).select('-password');
        
        if (!user) {
            return res.status(404).json({ message: 'User account not found' });
        }
        
        res.json({
            message: 'Shortlist synchronized successfully',
            shortlist: user.shortlist
        });
    } catch (err) {
        console.error('Shortlist save error:', err);
        res.status(500).json({ message: 'Internal server error synchronizing shortlist' });
    }
});

// GET /api/reviews - Fetch all student reviews
app.get('/api/reviews', async (req, res) => {
    try {
        if (mongoose.connection.readyState !== 1) {
            return res.status(503).json({ message: 'Database offline, reviews unavailable.' });
        }
        const reviews = await Review.find().sort({ createdAt: -1 });
        res.json(reviews);
    } catch (err) {
        console.error('Error fetching reviews:', err);
        res.status(500).json({ message: 'Internal server error fetching reviews' });
    }
});

// POST /api/reviews - Add a new student review (Requires Auth)
app.post('/api/reviews', authenticateToken, async (req, res) => {
    try {
        const { rating, comment } = req.body;
        
        if (!rating || !comment) {
            return res.status(400).json({ message: 'Please provide both rating and comment' });
        }
        
        const ratingNum = parseInt(rating, 10);
        if (isNaN(ratingNum) || ratingNum < 1 || ratingNum > 5) {
            return res.status(400).json({ message: 'Rating must be between 1 and 5' });
        }
        
        if (mongoose.connection.readyState !== 1) {
            return res.status(503).json({ message: 'Database offline, could not save review.' });
        }
        
        // Find user username
        const user = await User.findById(req.user.id);
        if (!user) {
            return res.status(404).json({ message: 'User account not found' });
        }
        
        const newReview = new Review({
            userId: user._id,
            username: user.username,
            rating: ratingNum,
            comment: comment.trim()
        });
        
        await newReview.save();
        
        res.status(201).json({
            message: 'Review submitted successfully',
            review: newReview
        });
    } catch (err) {
        console.error('Error saving review:', err);
        res.status(500).json({ message: 'Internal server error saving review' });
    }
});

// PUT /api/reviews/:id - Update student review (Requires Auth)
app.put('/api/reviews/:id', authenticateToken, async (req, res) => {
    try {
        const { rating, comment } = req.body;
        const reviewId = req.params.id;

        if (!rating || !comment) {
            return res.status(400).json({ message: 'Please provide both rating and comment' });
        }

        const ratingNum = parseInt(rating, 10);
        if (isNaN(ratingNum) || ratingNum < 1 || ratingNum > 5) {
            return res.status(400).json({ message: 'Rating must be between 1 and 5' });
        }

        if (mongoose.connection.readyState !== 1) {
            return res.status(503).json({ message: 'Database offline, could not update review.' });
        }

        const review = await Review.findById(reviewId);
        if (!review) {
            return res.status(404).json({ message: 'Review not found' });
        }

        // Check ownership
        if (review.userId.toString() !== req.user.id) {
            return res.status(403).json({ message: 'You are not authorized to edit this review' });
        }

        review.rating = ratingNum;
        review.comment = comment.trim();
        await review.save();

        res.json({
            message: 'Review updated successfully',
            review
        });
    } catch (err) {
        console.error('Error updating review:', err);
        res.status(500).json({ message: 'Internal server error updating review' });
    }
});

// DELETE /api/reviews/:id - Delete student review (Requires Auth)
app.delete('/api/reviews/:id', authenticateToken, async (req, res) => {
    try {
        const reviewId = req.params.id;

        if (mongoose.connection.readyState !== 1) {
            return res.status(503).json({ message: 'Database offline, could not delete review.' });
        }

        const review = await Review.findById(reviewId);
        if (!review) {
            return res.status(404).json({ message: 'Review not found' });
        }

        // Check ownership
        if (review.userId.toString() !== req.user.id) {
            return res.status(403).json({ message: 'You are not authorized to delete this review' });
        }

        await Review.findByIdAndDelete(reviewId);

        res.json({ message: 'Review deleted successfully' });
    } catch (err) {
        console.error('Error deleting review:', err);
        res.status(500).json({ message: 'Internal server error deleting review' });
    }
});

// Route to serve fees.html
app.get('/fees', (req, res) => {
    res.sendFile(path.join(__dirname, 'fees.html'));
});

// Route to serve college-details.html
app.get('/college-fees-details', (req, res) => {
    res.sendFile(path.join(__dirname, 'college-details.html'));
});

// Fallback to serve index.html for undefined frontend routes
app.get('/{*splat}', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

// Listen on designated port
app.listen(PORT, () => {
    console.log(`====================================================`);
    console.log(`DSE Predictor server successfully running on Port ${PORT}`);
    console.log(`Open http://localhost:${PORT} in your web browser`);
    console.log(`====================================================`);
});
