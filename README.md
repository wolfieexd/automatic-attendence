# Automated Student Attendance System

A premium, enterprise-grade system that uses state-of-the-art facial recognition (DeepFace) to automatically mark student attendance in real-time. 

This project has been completely overhauled with a robust architecture, edge-case protections, and a beautiful React dashboard.

## 🌟 Premium Features

- **Real-Time Facial Recognition**: Utilizes DeepFace (Facenet512) for highly accurate, state-of-the-art face detection and verification.
- **On-the-Spot Registration**: Add new students on the fly directly from the live camera feed using the Quick Register UI.
- **Batch Enrollment (ZIP)**: Upload a ZIP file of student photos (e.g., `1001_JohnDoe.jpg`) to bulk enroll entire classrooms in seconds.
- **Daily Attendance Lock**: Security feature that prevents tampering with attendance records past midnight of the recorded day.
- **Manual Overrides**: Teachers can easily override attendance statuses (Present, Absent, Late) via a beautifully styled UI.
- **Automated Warning System**: Automatically scans the database and dispatches warning emails (via Nodemailer) to students with < 75% attendance.
- **Advanced Analytics Dashboard**: Visualizes attendance trends using interactive, gradient-styled AreaCharts via Recharts.
- **Export to CSV**: Download comprehensive, perfectly formatted attendance reports with a single click.

## 🏗️ Project Architecture

```
/automated-attendance-system/
|
|--- 📂 client/              # React & Vite Frontend (TailwindCSS, Recharts, Framer Motion)
|--- 📂 server/              # Node.js & Express.js Backend (Sequelize, SQLite)
|--- 📂 cv-engine/           # Python CV Microservice (Flask, DeepFace, MTCNN)
```

## 💻 Technologies Used

### Frontend
- **React.js & Vite**: Lightning fast frontend tooling.
- **Tailwind CSS**: Custom, premium UI styling with glassmorphism and gradients.
- **Framer Motion**: Smooth micro-animations for an engaging UX.
- **Recharts**: For dynamic attendance analytics.

### Backend
- **Node.js & Express.js**: RESTful API architecture.
- **SQLite & Sequelize**: Lightweight, portable, and reliable relational database (migrated from MongoDB to eliminate connection drops).
- **Multer & AdmZip**: For handling photo uploads and batch ZIP enrollments.
- **Nodemailer**: For the automated email warning system.

### Computer Vision Engine
- **Python & Flask**: Dedicated microservice for intensive AI workloads.
- **DeepFace**: State-of-the-art facial recognition library.
- **Facenet512 & MTCNN**: High accuracy face detection models.

## 🚀 Setup Instructions

### 1. Database & Backend (Node.js)
1. Navigate to the server directory:
   ```bash
   cd server
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Start the server (SQLite database will automatically initialize):
   ```bash
   npm start
   ```

### 2. Computer Vision Engine (Python)
1. Navigate to the cv-engine directory:
   ```bash
   cd cv-engine
   ```
2. Install Python dependencies:
   ```bash
   pip install -r requirements.txt
   ```
3. Run the Flask server:
   ```bash
   python app.py
   ```

### 3. Frontend Dashboard (React)
1. Navigate to the client directory:
   ```bash
   cd client
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Start the development server:
   ```bash
   npm run dev
   ```

## 🤝 Contributing
1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request