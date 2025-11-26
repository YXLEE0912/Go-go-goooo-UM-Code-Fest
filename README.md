# GoSense - Enterprise AI Stock Analysis & Prediction Platform

GoSense is a cutting-edge enterprise dashboard designed for intelligent stock market analysis, forecasting, and strategic decision-making. Built for the **UM Code Fest**, it leverages advanced machine learning (SARIMAX) and Generative AI to provide actionable insights for NVIDIA (NVDA) stock.

## 🚀 Key Features

*   **📈 AI-Powered Forecasting**: 7-day price prediction using a fine-tuned SARIMAX model.
*   **🤖 Intelligent Chatbot**: Context-aware AI assistant (powered by Google Gemini) that understands market trends and provides strategic advice.
*   **📊 Advanced Technical Analysis**: Real-time calculation of key indicators:
    *   **RSI (Relative Strength Index)**
    *   **Annualized Volatility**
    *   **Support & Resistance Levels**
*   **💡 Enterprise Optimization Strategy**: Integrated function designed for enterprise executives (e.g., CEO) to determine actionable strategic steps and optimize corporate decision-making.
*   **📰 Market Intelligence**: Real-time news aggregation from Google & Yahoo Finance with sentiment impact analysis.
*   **🌍 Multi-Language Support**: Fully localized for **English**, **Chinese**, and **Malay**.
*   **🎨 Modern Enterprise UI**: Responsive design with Dark Mode, built using Next.js, Tailwind CSS, and Framer Motion.

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
│   │   ├── utils/          # Helper functions
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
