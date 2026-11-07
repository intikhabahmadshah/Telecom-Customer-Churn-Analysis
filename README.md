# Telecom Customer Churn Analytics & Machine Learning Platform

[![Node.js](https://img.shields.io/badge/Node.js-18%2B-339933?style=for-the-badge&logo=nodedotjs&logoColor=white)](https://nodejs.org/)
[![Express.js](https://img.shields.io/badge/Express.js-Backend-000000?style=for-the-badge&logo=express&logoColor=white)](https://expressjs.com/)
[![Python](https://img.shields.io/badge/Python-3.10%2B-3776AB?style=for-the-badge&logo=python&logoColor=white)](https://www.python.org/)
[![Scikit-Learn](https://img.shields.io/badge/Scikit--Learn-Machine%20Learning-F7931E?style=for-the-badge&logo=scikitlearn&logoColor=white)](https://scikit-learn.org/)
[![Model Recall](https://img.shields.io/badge/Churn%20Recall-82.09%25-059669?style=for-the-badge)](https://github.com/intikhabahmadshah)
[![Vercel Ready](https://img.shields.io/badge/Vercel-Deployment%20Ready-000000?style=for-the-badge&logo=vercel&logoColor=white)](https://vercel.com/)

---

## 📌 Project Overview

This repository contains an end-to-end Data Science and Machine Learning project designed to solve **customer churn** for telecommunication companies. 

The project analyzes **7,043 verified customer accounts** across **21 billing and service attributes**. It includes:
1. **An 11-step Jupyter Notebook** (`TelecomCustomerChurn_Analysis.ipynb`) with data cleaning, exploratory analysis (EDA), preprocessing pipelines, model comparisons, hyperparameter tuning via `GridSearchCV`, and business strategies.
2. **A Full-Stack Interactive Analytics Dashboard** powered by Node.js/Express with 3D telecom horizon visuals (Three.js), scroll animations (GSAP), interactive charts (Chart.js), and a real-time churn risk calculator.

---

## 👨‍💻 Author & Program Credentials

- **Data Analyst:** **Intikhab Ahmad Shah**
- **Trainee ID:** **TRN-2026-000059**
- **Bootcamp:** **PSEB AI Bootcamp @ Iqra University (H9), Islamabad**
- **Trainer & Mentor:** **Respected Ma'am Mahnoor Salman**
- **Program Coordinator:** **Respected Mr Furqan**
- **Organizers:** **Pakistan Software Export Board (PSEB) & atomcamp**

---

## 📊 Key Business Findings & Insights

| Dimension | Key Finding | Business Impact |
| :--- | :--- | :--- |
| **Total Universe** | 7,043 customers | Audited Kaggle dataset with clean records. |
| **Overall Churn Rate** | 26.54% (1,869 customers left) | High customer turnover requiring proactive retention. |
| **Monthly Revenue at Risk** | **$139,128 / month** | Represents over **$1.67 Million** in lost recurring annual revenue. |
| **Contract Type** | **Month-to-month: 42.71% churn** | Month-to-month users are **15 times more likely to churn** than 2-year contract users (2.83%). |
| **Customer Tenure** | **0–12 Months: 47.44% churn** | Half of all churners leave within their first 10 months. The first 90 days are critical. |
| **Payment Friction** | **Electronic Check: 45.29% churn** | Customers paying via manual check churn 3x faster than automated autopay users (<16%). |
| **AI Churn Catch Rate** | **Surges from 48.9% to 82.09%** | Using `class_weight='balanced'` enabled the AI model to catch **307 out of 374 actual churners**. |

---

## 🧠 Machine Learning Workflow (11 Steps)

The complete analysis is documented inside [`TelecomCustomerChurn_Analysis.ipynb`](TelecomCustomerChurn_Analysis.ipynb):

1. **Load Data:** Ingest Kaggle Telco Customer Churn dataset into pandas.
2. **First Look:** Verify shapes, data types, and check for duplicate rows (0 duplicates).
3. **Clean Data:** Fix `TotalCharges` (stored as text with 11 whitespace blanks) and drop `customerID`.
4. **Exploratory Data Analysis (EDA):** Plot churn rates against Contract type, Tenure, Monthly Bills, and Payment Methods.
5. **Prepare Split:** Perform 80/20 train-test split with `stratify=y` to preserve the 26.5% churn ratio.
6. **Feature Pipeline:** Standardize numeric variables and one-hot encode categorical features using `ColumnTransformer`.
7. **Model Comparison:** Train Logistic Regression, Decision Tree, and Random Forest baseline models.
8. **Optimize Recall:** Apply `class_weight="balanced"` to catch at-risk customers early.
9. **Hyperparameter Tuning:** Use `GridSearchCV` on the best model (Random Forest) across trees, depth, and split criteria.
10. **Evaluation:** Generate confusion matrix, ROC-AUC curve (0.841), and classification reports on unseen test data.
11. **Strategic Recommendations:** Formulate 4 actionable business pillars to protect recurring revenue.

---

## 📁 Repository Structure

```
├── Telco-Customer-Churn.csv           # Audited raw customer dataset (7,043 accounts)
├── TelecomCustomerChurn_Analysis.ipynb # Complete 11-step Machine Learning Jupyter Notebook
├── requirements.txt                   # Python dependencies for data science and ML
├── server.js                          # Express.js REST API & static web server
├── package.json                       # Node.js dependencies & scripts
├── vercel.json                        # Vercel deployment configuration
├── api/
│   └── index.js                       # Vercel serverless function entrypoint
├── public/                            # Full-stack frontend dashboard
│   ├── index.html                     # Responsive UI layout & structure
│   ├── styles.css                     # Executive Light Mode styling & Poppins typography
│   ├── app.js                         # Core JavaScript engine (Three.js, GSAP, Chart.js)
│   └── vendor/                        # High-speed bundled offline libraries
│       ├── chart.umd.min.js
│       ├── three.min.js
│       ├── gsap.min.js
│       ├── ScrollTrigger.min.js
│       └── fontawesome/               # Local FontAwesome vector icons
├── churn_dashboard_data.json          # Pre-computed analytics payload
├── churn_model_bundle.pkl             # Serialized trained model & preprocessor
├── prepare_dashboard_data.py          # Python ETL script to generate metrics
├── predict.py                         # Standalone Python inference script
├── Run_Dashboard.bat                  # 1-click Windows runner for local dashboard
├── .gitignore                         # Git exclusion rules
└── README.md                          # Comprehensive project documentation
```

---

## 🚀 How to Run Locally

### 1. Run the Interactive Web Dashboard

#### Option A: One-Click Windows Launcher
Double-click `Run_Dashboard.bat` in the root folder. It will start the server and open your browser automatically.

#### Option B: Terminal Command
```bash
# 1. Install Node dependencies
npm install

# 2. Start the Express server
npm start
```
Open **`http://localhost:3000`** in any web browser.

---

### 2. Run the Machine Learning Jupyter Notebook

```bash
# 1. Create and activate a Python virtual environment (optional)
python -m venv venv
venv\Scripts\activate     # On Windows
# source venv/bin/activate  # On macOS/Linux

# 2. Install requirements
pip install -r requirements.txt

# 3. Launch Jupyter Notebook
jupyter notebook TelecomCustomerChurn_Analysis.ipynb
```

---

## 🌐 How to Deploy on Vercel

This repository is pre-configured with `vercel.json` and `api/index.js` for instant deployment on **Vercel**:

### Step 1: Push Project to GitHub
```bash
git add .
git commit -m "Initial commit: Telecom Customer Churn Analytics Platform"
git push -u origin main
```

### Step 2: Import into Vercel
1. Go to **[vercel.com](https://vercel.com/)** and log in with your GitHub account.
2. Click **"Add New..."** → **"Project"**.
3. Select your GitHub repository (`Telecom-Customer-Churn-Analysis`).
4. In **Framework Preset**, select **"Other"**.
5. Leave the default settings (Build Command and Output Directory can be empty).
6. Click **"Deploy"**.

Your live dashboard URL will be generated within seconds (e.g., `https://telecom-customer-churn-analysis.vercel.app`).

---

## 🛡️ Strategic Retention Recommendations (4 Actionable Pillars)

1. **Pillar 1: Contract Migration Campaign:** Incentivize month-to-month subscribers with a 15% discount to switch to 1-Year or 2-Year contracts.
2. **Pillar 2: Early Tenure Onboarding (Critical 90 Days):** Automated onboarding check-ins and satisfaction surveys during the first 3 months to curb first-year attrition.
3. **Pillar 3: Autopay Friction Elimination:** Offer a recurring $5 monthly bill credit to switch from Electronic Check to automatic bank transfer or credit card.
4. **Pillar 4: Premium Value Bundling:** Bundle complimentary dedicated Tech Support and Online Security with Fiber Optic plans to reduce high-bill churn.

---

## 📜 License

This project was developed for academic, educational, and enterprise demonstration purposes under the **PSEB AI Upskilling Initiative**.
