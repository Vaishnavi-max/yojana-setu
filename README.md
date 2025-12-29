# 🇮🇳 Yojana Setu - Government Scheme Eligibility Chatbot

> **AI-powered chatbot to help Indian citizens discover government welfare schemes they are eligible for**

![License](https://img.shields.io/badge/license-MIT-green)
![Schemes](https://img.shields.io/badge/schemes-3401-blue)
![Languages](https://img.shields.io/badge/languages-English%20%7C%20Hindi%20%7C%20Kannada-orange)

---

## 📌 Problem Statement

Governments launch many welfare schemes (healthcare, education, subsidies), but **awareness is low** because:
- Citizens don't know what they qualify for
- Eligibility criteria are complex
- Navigating government portals is daunting
- Benefits don't reach the intended population

## 💡 Our Solution

**Yojana Setu** ("Scheme Bridge") is an AI-driven chatbot that:
- Accepts **natural language input** in English, Hindi, or Kannada
- **Parses user profile** (age, occupation, income, caste, state, education)
- **Matches against 3,401 government schemes** using weighted scoring
- Returns **personalized scheme recommendations** with AI-generated explanations

---

## ✨ Features

| Feature | Description |
|---------|-------------|
| 🗣️ **Multilingual NLP** | Supports English, Hindi (kisan, mahila), Kannada (ರೈತ, ವಿದ್ಯಾರ್ಥಿ) |
| 🎯 **Smart Matching** | Weighted scoring: Critical (50) + Important (30) + Relevant (20) |
| 🤖 **AI Explanations** | Google Gemini 2.0 generates personalized eligibility explanations |
| 📊 **3,401 Schemes** | Complete Indian government schemes from Kaggle dataset |
| 🎓 **Education Parsing** | Detects 10th, 12th, degree, diploma, PhD |
| 🎨 **Premium UI** | Glassmorphism design with Indian tri-color accents |

---

## 🛠️ Tech Stack

| Layer | Technology |
|-------|------------|
| Frontend | HTML5, CSS3, Vanilla JavaScript |
| Styling | Custom CSS with Glassmorphism |
| AI/ML | Google Gemini 2.0 Flash API |
| NLP | Custom Regex-based Entity Extraction |
| Data | JSON (13MB, from Kaggle) |
| Deployment | Static hosting (no server required) |

---

## 🏗️ Architecture

```
User Query
    │
    ▼
┌─────────────────┐
│   UserParser    │  ◄── Extracts: age, gender, occupation, state, caste, education
│   (NLP Engine)  │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ EligibilityEngine│  ◄── Scores 3,401 schemes using weighted algorithm
│ (Scoring Engine) │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ GeminiIntegration│  ◄── Generates personalized explanations
│   (AI Layer)    │
└────────┬────────┘
         │
         ▼
   Scheme Cards
```

---

## 🚀 Quick Start

### Prerequisites
- Modern web browser (Chrome, Firefox, Edge, Safari)
- No installation required!

### Run Locally
```bash
# Clone the repository
git clone https://github.com/yourusername/yojana-setu.git

# Navigate to project
cd yojana-setu

# Open in browser (no server needed!)
open index.html
# OR double-click index.html
```

### Using Live Server (Optional)
```bash
# If you have VS Code Live Server extension
# Right-click index.html → "Open with Live Server"
```

---

## 📂 Project Structure

```
yojana-setu/
├── index.html              # Main HTML page
├── styles.css              # Glassmorphism styling
├── app.js                  # Main application controller
├── src/
│   ├── user_parser.js      # NLP entity extraction
│   ├── eligibility_engine.js # Weighted scoring algorithm
│   └── gemini_integration.js # Google Gemini AI
├── data/
│   ├── all_schemes.js      # 3,401 government schemes (13MB)
│   └── priority_schemes.js # Curated ~100 schemes
├── scripts/
│   └── csv_to_json.py      # Data conversion utility
└── README.md
```

---

## 💬 Example Queries

| Query | Parsed Profile |
|-------|----------------|
| "I am a 25 year old farmer from Karnataka" | age: 25, occupation: farmer, state: karnataka |
| "ನಾನು ರೈತ, 10th class ಮಗಳಿದ್ದಾಳೆ" | occupation: farmer, education: secondary, gender: female |
| "I am a SC student looking for scholarships" | caste: sc, occupation: student |
| "मैं एक किसान हूं, BPL" | occupation: farmer, isBPL: true |

---

## 📊 Scoring Algorithm

| Weight | Points | Criteria |
|--------|--------|----------|
| **Critical** | 50 | Occupation, Gender-specific schemes |
| **Important** | 30 | Age, Income/BPL, Caste, Education |
| **Relevant** | 20 | State, Land size, Senior/Disabled/Widow |

**Match % = (Total Score / 200) × 100**

---

## 🔧 Configuration

### Gemini API Key
Update your API key in `src/gemini_integration.js`:
```javascript
apiKey: 'YOUR_GEMINI_API_KEY',
```

Get your free API key: [Google AI Studio](https://aistudio.google.com/)

---

## 📱 Screenshots

| Welcome Screen | Search Results |
|----------------|----------------|
| *Add screenshot* | *Add screenshot* |

---

## 🗺️ Roadmap

- [ ] WhatsApp integration via Twilio
- [ ] Voice input support
- [ ] GPS-based state detection
- [ ] Document checklist generator
- [ ] Application status tracker

---

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

---

## 📜 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

## 🙏 Acknowledgments

- **Dataset**: [Indian Government Schemes - Kaggle](https://www.kaggle.com/datasets)
- **AI**: Google Gemini 2.0 Flash
- **Fonts**: Google Fonts (Outfit, Inter)

---

## 👨‍💻 Author

**Your Name**
- GitHub: [@yourusername](https://github.com/yourusername)

---

<p align="center">
  Made with ❤️ for Indian Citizens 🇮🇳
</p>
