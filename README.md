# 🎓 Automated Student Attendance System

![License](https://img.shields.io/badge/license-MIT-blue.svg)
![React](https://img.shields.io/badge/React-18.x-61dafb.svg?logo=react)
![Node](https://img.shields.io/badge/Node.js-20.x-339933.svg?logo=nodedotjs)
![Python](https://img.shields.io/badge/Python-3.10-3776AB.svg?logo=python)
![SQLite](https://img.shields.io/badge/SQLite-3-003B57.svg?logo=sqlite)

A premium, enterprise-grade system that leverages state-of-the-art facial recognition (DeepFace) to automatically mark student attendance in real-time. Built with a robust full-stack architecture, edge-case protections, and a beautiful React dashboard.

---

## 🌟 Premium Features

- **Real-Time Facial Recognition**: Utilizes DeepFace (Facenet512) for highly accurate, state-of-the-art face detection and verification directly from a live video feed.
- **On-the-Spot Registration**: Add new students on the fly from the live camera feed using the interactive Quick Register UI.
- **Batch Enrollment (ZIP)**: Bulk enroll entire classrooms in seconds! Upload a ZIP file of student photos (e.g., `1001_JohnDoe.jpg`) and let the system extract, save, and encode them automatically.
- **Daily Attendance Lock**: Advanced security feature that prevents tampering with attendance records past midnight of the recorded day.
- **Manual Overrides**: Teachers can easily override attendance statuses (Present, Absent, Late) via a beautifully styled UI dropdown within the Course Details modal.
- **Automated Warning System**: The system scans the database and dispatches warning emails (via Nodemailer) to students with < 75% attendance.
- **Advanced Analytics Dashboard**: Visualizes attendance trends using interactive, gradient-styled AreaCharts via Recharts.
- **Export to CSV**: Download comprehensive, perfectly formatted attendance reports with a single click.

---

## 📂 Detailed Project Structure

```text
/automated-attendance-system
│
├── 📂 client/                          # React Frontend Application (Vite)
│   ├── 📂 public/                      # Static assets
│   └── 📂 src/
│       ├── 📂 assets/                  # Images and global CSS
│       ├── 📂 components/              # Reusable UI Components
│       │   ├── 📂 attendance/          # LiveAttendance and QuickRegisterModal
│       │   ├── 📂 common/              # Buttons, Cards, Modals, Spinners
│       │   ├── 📂 dashboard/           # AnalyticsChart, StatCard, LiveFeed
│       │   ├── 📂 layout/              # Sidebar, Topbar, MainLayout
│       │   └── 📂 students/            # AddStudentForm, StudentTable
│       ├── 📂 pages/                   # Main Application Views
│       │   ├── DashboardPage.jsx
│       │   ├── StudentsPage.jsx
│       │   ├── CoursesPage.jsx
│       │   └── ReportsPage.jsx
│       ├── 📂 routes/                  # React Router configurations
│       ├── 📂 services/                # API client (Axios) configurations
│       └── 📂 utils/                   # Helper functions (e.g., cameraCleanup)
│
├── 📂 server/                          # Node.js & Express.js Backend
│   ├── 📂 config/                      # Database (Sequelize) and Multer configs
│   ├── 📂 controllers/                 # Request handlers (Attendance, Students, Courses)
│   ├── 📂 models/                      # SQLite Database Schemas (User, Student, Attendance, Course)
│   ├── 📂 routes/                      # REST API endpoints definition
│   ├── 📂 services/                    # External service wrappers (cvEngineService)
│   ├── 📂 uploads/                     # Temporary storage for uploaded photos/ZIPs
│   ├── index.js                        # Express server entry point
│   └── database.sqlite                 # Local SQLite database file
│
└── 📂 cv-engine/                       # Python Computer Vision Microservice
    ├── app.py                          # Flask server entry point
    ├── requirements.txt                # Python dependencies
    ├── student_embeddings.pkl          # Serialized face encodings
    └── 📂 temp_uploads/                # Temporary image processing directory
```

---

## 💻 Tech Stack

### Frontend
- **React.js & Vite**: Lightning fast frontend tooling and rendering.
- **Tailwind CSS**: Custom, premium UI styling with glassmorphism and smooth gradients.
- **Framer Motion**: Micro-animations for an engaging and dynamic User Experience.
- **Recharts**: For rendering dynamic, responsive attendance analytics.

### Backend
- **Node.js & Express.js**: High-performance RESTful API architecture.
- **SQLite & Sequelize**: Lightweight, portable, and reliable relational database (migrated from MongoDB to ensure data integrity and eliminate connection drops).
- **Multer & AdmZip**: For handling secure photo uploads and batch ZIP enrollments.
- **Nodemailer**: For the automated email warning system.

### Computer Vision Engine
- **Python & Flask**: Dedicated microservice for intensive AI workloads.
- **DeepFace**: State-of-the-art facial recognition library.
- **Facenet512 & MTCNN**: High accuracy face detection models optimized for difficult lighting.

---

## 🚀 Setup & Installation

### 1. Database & Backend (Node.js)
1. Navigate to the server directory:
   ```bash
   cd server
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Start the server (The SQLite database will automatically initialize itself):
   ```bash
   npm start
   ```

### 2. Computer Vision Engine (Python)
1. Navigate to the cv-engine directory:
   ```bash
   cd cv-engine
   ```
2. Create a virtual environment (optional but recommended):
   ```bash
   python -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   ```
3. Install Python dependencies:
   ```bash
   pip install -r requirements.txt
   ```
4. Run the Flask microservice (runs on port 5001 by default):
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
3. Start the Vite development server:
   ```bash
   npm run dev
   ```

---

## 🤝 Contributing

We welcome contributions! To contribute:

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

---

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.