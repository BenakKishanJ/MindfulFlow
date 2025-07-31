# 🧘‍♂️ MindfulFlow

**MindfulFlow** is a digital wellbeing mobile app built with **React Native** and **Expo**, designed to help users maintain healthy device usage habits and reduce digital fatigue. The app uses AI-powered features such as emotion detection, posture analysis, eye strain tracking, and doomscrolling prevention to provide intelligent, personalized prompts and break reminders.

## ✨ Features

- 📱 Emotion recognition via camera (MediaPipe, TensorFlow Lite)
- 🧍‍♂️ Posture and eye strain detection using phone sensors
- ⚪ Monochrome screen mode for late-night use
- 🧠 Doomscrolling and overuse detection
- ⏱️ Context-aware break timers and breathing prompts
- 🎨 Beautiful and minimal Figma-based UI

---

## 🚀 Tech Stack

- **Frontend**: React Native, Expo, TypeScript
- **Backend**: Node.js, Express, Firebase (or Supabase)
- **ML Models**: MediaPipe, TensorFlow Lite, custom fine-tuned models
- **Design**: Figma, Tailwind-like utility-first styling

---

## 📲 Getting Started (for Developers)

### 🔧 Prerequisites

- [Node.js](https://nodejs.org/)
- [Expo CLI](https://docs.expo.dev/get-started/installation/)
- [Git](https://git-scm.com/)
- Expo Go App on your **Android** or **iOS** device

### 📦 Installation

1. **Clone the repository:**

   ```bash
   git clone https://github.com/your-org/mindfulflow.git
   cd mindfulflow
   ```

2. **Install dependencies:**

   ```bash
   npm install
   ```

3. **Start the development server:**

   ```bash
   npx expo start
   ```

4. **Scan the QR code** with the **Expo Go App** (available on Google Play or App Store) to run it on your device.

---

## 🛠️ Useful Commands

| Command            | Description                             |
| ------------------ | --------------------------------------- |
| `npx expo start`   | Starts the dev server with QR code      |
| `npx expo install` | Installs Expo-compatible dependencies   |
| `npm run android`  | Runs app on Android emulator (if setup) |
| `npm run ios`      | Runs app on iOS simulator (macOS only)  |
| `expo publish`     | Publishes the app to Expo's servers     |

---

## 👨‍💻 Contributing

Team Members:

- **Benak** – App Development, Backend, ML Integration
- **Dhanush** – AI/ML Research, Model Tuning
- **Akshatha** – UI/UX Design, Figma Assets
- **Basaveshwari** – UI/UX Design, Branding, Visuals

To contribute, create a new branch and submit a pull request. Please follow the coding style and folder structure.

---

## 📁 Project Structure (Simplified)

```
mindfulflow/
│
├── assets/               # Images, fonts, icons
├── components/           # Shared React Native components
├── screens/              # App screens
├── ml/                   # TFLite/ML model logic
├── backend/              # Backend endpoints (optional)
├── App.tsx               # Root app file
└── README.md
```

---

## 📌 Notes

- This is a WIP (Work in Progress) project.
- AI model performance may vary based on device and tuning.
- Final release will include accessibility options and multilingual support.

---

## 📄 License

MIT License – See [`LICENSE`](LICENSE) file for details.
