# GoSense - Enterprise AI Stock Analysis & Prediction Platform

GoSense is a cutting-edge enterprise dashboard designed for intelligent stock market analysis, forecasting, and strategic decision-making. Built for the **UM Code Fest**, it leverages advanced machine learning (SARIMAX) and Generative AI to provide actionable insights for publicly listed companies (demonstrated with NVIDIA).

## 🎥 Demo
**Watch the demo here ➡️** [GoSense demo video](https://youtu.be/AQo0N60C73w)
**Alternative demo link ➡️** [Google Drive](https://drive.google.com/drive/u/0/folders/1FNlay7UKNywKSEXQJ-d3Tk4HMrhhd3jv)

## 🎯 Problem Statement
Investment teams and corporate finance departments face complex, unstructured financial data.
*   Making accurate predictions and strategic decisions is time-consuming and error-prone.
*   Existing dashboards often lack real-time forecasting, actionable recommendations, automated reporting, and explainable insights.

## 👥 Target Users
Any publicly listed company’s internal teams:
*   **Professional Investors & Portfolio Managers**
*   **Corporate Finance & Strategy Departments**
*   **Institutional Research Teams**

*Note: NVIDIA is used only as a demo, the system is adaptable to multiple companies and industries.*

## ✅ The Solution (What We Solve)
*   **Simplifies** complex financial analysis and market forecasting.
*   **Provides** actionable insights, risk alerts, KPI predictions, and automated reporting.
*   **Enables** data-driven decisions with explainable reasoning.
*   **Reduces** manual effort for investment teams and ensures consistent reporting.

## 🚀 Key Features

### 1. SaaS Dashboard (3 Core Modules)
*   **Main Page**: Historical view, graph of stock performance, input selection, and prediction triggers.
*   **Prediction Page**: Forecast graphs, % changes, AI insights, risk alerts, optimization suggestions, and chatbot explanations.
*   **News Page**: Aggregated news feed, sentiment analysis, and highlights for the selected company/sector.

### 2. AI Strategy & Forecasting
*   **Time-series Forecasting**: Utilizes SARIMAX (Prophet, LSTM, GRU capable) for accurate price trend prediction.
*   **Anomaly Detection**: Isolation Forest and rolling z-scores identify unusual price/volume changes.
*   **Optimization Models**: Provides portfolio adjustments and strategic decision recommendations.

### 3. Intelligent Chatbot
*   **LLM-Powered**: Built on Gemini API (adaptable to GPT-4).
*   **Context-Aware**: Restricted to company/sector news for explainable, relevant answers.
*   **R&D Advisor**: Acts as a virtual analyst for investment queries.

### 4. Automated Report Generation 
*   **Customizable Reports**: Auto-generates PDF/PPT briefing books (Daily/Weekly/Monthly).
*   **Content**: Includes performance attribution, risk metrics, key alerts, and AI-driven insights.
*   **Value**: Reduces manual reporting effort and ensures consistency for executives & clients.

### 5. Smart Alert System
*   **Risk Alerts**: Automatically detects drops >5% or 7% (Critical).
*   **Notification History**: Persists alerts in a database and displays them in a notification panel.
*   **Email Integration**: Sends critical alerts directly to user emails via SMTP.

### 6. Unique Selling Proposition (USP)
*   **Explainable AI**: Transparent reasoning for every prediction.
*   **Dynamic & Scalable**: Works for any publicly listed company with minimal configuration.
*   **Integrated News Sentiment**: Real-time news + sentiment analysis incorporated into forecasts.
*   **End-to-End Solution**: Combines forecasting, alerts, recommendations, and reports in one platform.

## 📊 Market Analysis
*   **TAM (Total Addressable Market)**: RM 140B–190B/year (Global AI finance analytics).
*   **SAM (Serviceable Available Market)**: RM 23B–38B/year (APAC + Enterprise).
*   **SOM (Serviceable Obtainable Market)**: RM 230M–560M/year (Realistic 2–3 year capture).
*   **Trends**: Rapid adoption of AI, big data, and predictive analytics in finance.

## 💼 Business Impact
*   **Accelerates** decision-making with AI insights and recommendations.
*   **Enhances** risk visibility with alerts & anomaly detection.
*   **Optimizes** portfolio/strategic performance through actionable suggestions.
*   **Reduces** manual reporting via automated PDF/PPT generation.
*   **Supports** auditability and transparency with explainable AI.
*   **Scalable** SaaS model ensures predictable recurring revenue.

## 🆚 Competitive Advantage

| Feature | GoSense | Typical Dashboards | Competitor A | Competitor B |
| :--- | :---: | :---: | :---: | :---: |
| **AI Forecasting** | ✅ Time-series + ML + Sentiment | ❌ Basic charts | ✅ Only price forecast | ❌ Limited ML |
| **Risk Alerts** | ✅ Drop >5%, Anomaly Detection | ❌ | ❌ | ✅ Only thresholds |
| **Explainable AI** | ✅ Full reasoning + News context | ❌ | ❌ | ❌ |
| **Chatbot** | ✅ Company-specific answers | ❌ | ❌ | ❌ |
| **News Integration** | ✅ Aggregated + Sentiment | ❌ | ✅ | ❌ |
| **Customizable** | ✅ Minor config needed | ❌ | ❌ | ❌ |
| **Automated Reports** | ✅ PDF/PPT Briefing | ❌ | ❌ | ❌ |

## 🛠️ Tech Stack

### Frontend
*   **Framework**: Next.js 16 (React 19)
*   **Language**: TypeScript
*   **Styling**: Tailwind CSS, Framer Motion
*   **Components**: Radix UI, Lucide React
*   **Charts**: Recharts

### Backend
*   **Framework**: FastAPI
*   **Language**: Python 3.10+
*   **ML/Data Science**: Scikit-learn, Statsmodels (SARIMAX), Pandas, NumPy, Joblib
*   **AI Integration**: Google Gemini API (`google-generativeai`)
*   **Data Sources**: Yahoo Finance (`yfinance`), RSS Feeds (`feedparser`)
*   **Database**: MongoDB

### Machine Learning
*   **Dataset / Data source acquisition**: yfinance, [NVDA dataset from Kaggle](https://www.google.com/url?q=https%3A%2F%2Fwww.kaggle.com%2Fdatasets%2Fmeharshanali%2Fnvidia-stocks-data-2025)
*   **Visualization**: matplotlib, seaborn
*   **News API Integration**: newsapi-python, gnews, beautifulsoup4, requests
*   **Natural Language Processing & Sentiment Analysis**: textblob, transformers (ProsusAI/finbert model for financial sentiment), torch
*   **Time Series Modeling**: prophet (Facebook Prophet), statsmodels (for SARIMAX)
*   **Machine Learning (General)**: scikit-learn (for MinMaxScaler, mean_absolute_error, mean_squared_error)

#### 📈 Model Training Results

| Model           | MAE (Mean Absolute Error) | RMSE (Root Mean Squared Error) |
|-----------------|---------------------------|--------------------------------|
| **SARIMAX (tuned)** | **0.0826**                | **0.1036**                     |
| Prophet         | 0.2136                    | 0.2288                         |

**Key Finding:** The SARIMAX model demonstrated superior performance, achieving a **61.3% improvement** in Mean Absolute Error compared to the Prophet model. Based on these evaluation metrics, the **SARIMAX (tuned)** model was selected as the best performing model. It has been saved as `best_model.pkl` for integration into the GoSense backend system to power the Stock Forecasting Dashboard. This model is expected to provide more accurate and reliable stock price predictions.

## 📦 Installation & Setup

### Prerequisites
*   Node.js (v18+)
*   Python (v3.10+)
*   MongoDB (Local or Atlas)

### 1. Clone the Repository
```bash
git clone https://github.com/zheHT/Go-go-goooo-UM-Code-Fest.git
cd Go-go-goooo-UM-Code-Fest
```

### 2. Backend Setup
Navigate to the backend directory and install dependencies:
```bash
cd backend
# Create a virtual environment (optional but recommended)
python -m venv venv
# Activate venv:
# Windows: .\venv\Scripts\activate
# Mac/Linux: source venv/bin/activate

pip install -r requirements.txt
```

**Configuration**:
Create a `.env` file in the `backend` directory with the following keys:
```env
MONGODB_URL=mongodb://localhost:27017
DB_NAME=gosense
SECRET_KEY=your_secret_key
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=30
GOOGLE_API_KEY=your_gemini_api_key
SMTP_SERVER=smtp.gmail.com
SMTP_PORT=587
SMTP_USERNAME=your_email@gmail.com
SMTP_PASSWORD=your_app_password
FROM_EMAIL=your_email@gmail.com
```

**Run the Backend**:
```bash
python run.py
# The API will start at http://localhost:8000
```

### 3. Frontend Setup
Navigate to the frontend directory and install dependencies:
```bash
cd ../frontend
npm install
# or
pnpm install
```

**Run the Frontend**:
```bash
npm run dev
# The application will start at http://localhost:3000
```

## 📂 Project Structure

```
GoSense/
├── backend/                # FastAPI Backend
│   ├── app/
│   │   ├── models/         # Database models
│   │   ├── routes/         # API endpoints (auth, chat, predict, news)
│   │   ├── utils/          # Helper functions (email, report_generator)
│   │   └── main.py         # App entry point
│   ├── models/             # ML Models (best_model.pkl, scalers)
│   └── run.py              # Server runner
├── frontend/               # Next.js Frontend
│   ├── app/                # App router pages
│   ├── components/         # React components (gosense/, ui/)
│   ├── lib/                # Utilities (api, types, translations)
│   └── public/             # Static assets
├── ml/                     # Machine Learning resources
│   └── dataset/            # Training data (NVDA.csv)
└── chatbot/                # Chatbot specific resources
```

## 🤝 Contributors
*   **Team Go-go-goooo** - UM Code Fest

## 📄 License
This project is licensed under the MIT License.
