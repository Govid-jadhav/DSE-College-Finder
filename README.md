# DSE College Finder 🎓
> **Direct Second Year (DSE) Engineering Admissions Predictor & Helper Portal 2025-26**
>
> 🌐 **Live Application**: [https://dse-college-finder.onrender.com](https://dse-college-finder.onrender.com)

DSE College Finder is a comprehensive web portal designed for engineering diploma holders and B.Sc. graduates in Maharashtra, India. The application simplifies the Direct Second Year (lateral entry) Centralized Admission Process (CAP) conducted by DTE Maharashtra. It helps students predict matching engineering colleges based on diploma scores, search and calculate caste-category fees, verify mandatory documents, and generate option entry choice code shortlists.

---

## 🚀 Key Features

*   **🎯 Precision Matcher Predictor**: Evaluates student diploma percentages against 3 years of historical CAP round cutoffs. Dynamically classifies matches into:
    *   **Dream List**: Highly competitive options (0–2% above student's score).
    *   **Match List**: Realistic target options (0–5% below student's score).
    *   **Safe List**: Highly secure options (more than 5% below student's score).
*   **💸 Fees Directory & Concession Calculator**: Interactive fee search register comparing Tuition Fees and Development Fees across caste categories (Open, OBC, EWS, SC, ST) with support for Tuition Fee Waiver Scheme (TFWS) simulations.
*   **📋 Mandatory Documents Checklist**: Custom wizard that outlines required certificates (Caste Validity, Non-Creamy Layer, Income Concessions) based on the candidate's admission category.
*   **💾 Shortlist Option Helper**: Allows logged-in students to bookmark choices, sort them by preference, print PDF helper sheets, or export selection choice codes as Excel-compatible CSV files.
*   **💬 Student Reviews & Ratings**: Community portal where aspirants share ratings and reviews about engineering institutes.
*   **🛡️ Secure Admin Dashboard**: Management control panel for administrators to monitor overview statistics, moderate/delete reviews, delete user accounts, and update college fee structures.
*   **📑 PDF Extraction Scripts**: Built-in Python tools to scrape, inspect, and parse official DTE cutoff PDFs.

---

## 🛠️ Technology Stack

*   **Backend**: Node.js, Express.js
*   **Database**: MongoDB, Mongoose ODM
*   **Authentication**: JSON Web Tokens (JWT) & bcryptjs (password hashing)
*   **Mailer Integration**: Nodemailer (supporting Brevo SMTP / Gmail SMTP fallback for password reset OTP codes)
*   **Frontend**: HTML5, Vanilla JavaScript, CSS3 (Modern, clean SaaS-style dark neutral UI with Inter typography, 8px spacing grid, and flat border alignments)
*   **Icons & Charts**: Lucide Icons, Chart.js (Dashboard statistics visualizer)
*   **Data Scrapers**: Python 3, PyPDF2 / pdfplumber (for cutoff extraction)

---

## 💻 Setup & Installation

### Prerequisites
*   Node.js (v16+)
*   MongoDB Server (running locally or on Atlas)
*   Python 3 (Optional, only required for running scraper scripts)

### Installation Steps

1.  **Clone the Repository**:
    ```bash
    git clone https://github.com/Govid-jadhav/DSE-College-Finder.git
    cd DSE-College-Finder
    ```

2.  **Install Node.js Dependencies**:
    ```bash
    npm install
    ```

3.  **Configure Database & Credentials**:
    Ensure MongoDB is running locally on port `27017` or update the `MONGODB_URI` in `.env`.

4.  **Start the Server**:
    ```bash
    node server.js
    ```
    *Open [http://localhost:8080](http://localhost:8080) in your web browser.*

---

## 🐍 Running Cutoff PDF Scraping Scripts

If you have new CET Cell DSE cutoff PDFs and want to update the JSON databases:

1.  **Install Python requirements**:
    ```bash
    pip install pdfplumber pandas
    ```

2.  **Parse DTE PDF Cutoffs**:
    Place the official PDF files in the `pdf/` folder and run the parsing utility:
    ```bash
    python scripts/parse_all_pdfs.py
    ```
    This script parses the choice codes, branches, seat categories, and merit list cutoffs, updating `public/dse_cutoff_data.json`.

---

## 🛡️ Admin Dashboard Secret Code
*   To register as an administrator account, sign up through the login modal and provide the default admin confirmation code:
    `dse_admin_secret_2026`
*   Once signed in, access the admin panel at: **[http://localhost:8080/admin](http://localhost:8080/admin)**

---

## 📜 License
This project is licensed under the ISC License.
