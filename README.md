# DSE College Finder - Direct Second Year Engineering Admissions Predictor & Fees Explorer

A premium, modern web application designed to help Direct Second Year (DSE) engineering aspirants in Maharashtra search cutoff trends, predict matching college options across CAP rounds, and explore detailed category-wise fee structures.

---

## 🚀 Features

1. **Precision Predictor**: Groups engineering colleges into **Dream** (0-2% above score), **Realistic Matches** (0-5% below score), and **Safe Admissions** (> 5% below score) categories based on your aggregate diploma/B.Sc. percentage.
2. **Multi-Year Cutoff Trends**: Shows historical cutoffs across multiple years (AY 2025-26, 2024-25, 2023-24) and CAP rounds directly on college cards.
3. **Personalized Shortlist Helper**: Bookmark matching colleges to assemble a custom preference list. Print or download your shortlist as a CSV to prepare for official option entry.
4. **College Fees Directory**: A complete database of **357 registered engineering colleges** in Maharashtra. Search by college name, code, or type.
5. **Category-Wise Fees Table**: Displays side-by-side Tuition Fees, Development Fees, and Net Payable Fees for **Open, OBC, EWS, SC, ST, VJNT, SBC, and TFWS** categories.
6. **Required Documents Checker**: Summarizes the list of documents (Caste Validity, Non-Creamy Layer, Domicile, Income certificates) needed to claim concessions.
7. **Reviews & Feedbacks**: Authenticated users can write, edit, and read reviews to share experiences using the predictor.

---

## 🛠️ Tech Stack

- **Backend**: Node.js, Express, MongoDB (Mongoose), JWT, bcryptjs, Nodemailer
- **Frontend**: Vanilla HTML5, CSS3 (Glassmorphism design system), JavaScript, Lucide Icons
- **Fonts**: Outfit & Inter (Google Fonts)

---

## 📁 Project Directory Structure

```text
├── server.js               # Express API backend, authentication routes & database schemas
├── app.js                  # Frontend client logic for the predictor & shortlist
├── index.html              # Landing Page / Predictor dashboard UI
├── index.css               # Main styling system, animations, dark mode and glassmorphism
├── fees.html               # College directory listing page
├── fees.js                 # Frontend logic for the college fees directory list
├── college-details.html    # Dedicated comparative fees details page
├── college-details.js      # Frontend logic to compute dynamic category fee concessions
├── dse_cutoff_data.json    # Cutoff database for all CAP rounds and categories
├── college_fees_data.json  # Fee structure database for all 357 registered colleges
├── .gitignore              # Excludes environment files (.env) and node modules
├── package.json            # Project configuration and dependency specifications
└── README.md               # Documentation
```

---

## 🔧 Setup & Installation

### 1. Prerequisites
Ensure you have the following installed on your system:
- **Node.js** (v16.x or higher)
- **MongoDB** (Local instance running on `mongodb://127.0.0.1:27017` or a remote MongoDB Atlas URL)

### 2. Clone the Repository
```bash
git clone https://github.com/Govid-jadhav/DSE-College-Finder.git
cd DSE-College-Finder
```

### 3. Install Dependencies
```bash
npm install
```

### 4. Configure Environment Variables
Create a file named `.env` in the root directory and add the following keys:
```env
PORT=8080
MONGODB_URI=mongodb://127.0.0.1:27017/dse_predictor
JWT_SECRET=your_super_secret_jwt_key_2026

# Optional: Email SMTP Setup for OTP Verification
EMAIL_USER=your_gmail_address@gmail.com
EMAIL_PASS=your_gmail_app_password

# Or Brevo SMTP setup
# BREVO_SMTP_USER=your_brevo_user
# BREVO_SMTP_KEY=your_brevo_api_key
```

### 5. Run the Application
Start the Node.js server:
```bash
node server.js
```

Open your web browser and navigate to:
- Predictor Home: **[http://localhost:8080](http://localhost:8080)**
- Fees Directory: **[http://localhost:8080/fees](http://localhost:8080/fees)**

---

## 📝 Concession Rule Calculations

Fees are calculated dynamically based on Maharashtra State CET Cell and Fee Regulating Authority (FRA) guidelines:

- **General Open (GOPEN)**: Pays 100% Tuition Fee + 100% Development Fee.
- **OBC / EWS**: Pays 50% Tuition Fee + 100% Development Fee (under EBC / Freeship schemes).
- **SC / ST**: Pays 0% Tuition Fee + 0% Development Fee (under Government Post-Matric schemes).
- **VJ/NT / SBC / TFWS**: Pays 0% Tuition Fee + 100% Development Fee.

*Note: Concessions are strictly applicable only to admissions secured through official CAP rounds.*
