# 🚀 EventPulse: Full-Stack Event Management & Automated Certification

**EventPulse** is a robust MERN stack application designed to automate the lifecycle of events—from registration to digital certificate distribution. It eliminates manual certificate generation by using dynamic image processing.

---

## 📸 Project Gallery

### Admin Insights & Reports
<img width="1920" height="1080" alt="Screenshot 2026-02-07 152948" src="https://github.com/user-attachments/assets/a4e9473f-7d1a-4f56-8eb2-8af2e8f5e764" />
*Overview of system-wide analytics and user engagement.*

### Organizer & Student Portals
<img src="https://github.com/user-attachments/assets/2c655551-8ee8-463d-8101-89fd13dcd6d3" width="100%" alt="User Interface" />
<img width="1919" height="1079" alt="Screenshot 2026-02-07 153409" src="https://github.com/user-attachments/assets/65220e6b-225d-4c94-b262-49f8e61bd047" />

### Dynamic Certification System
<img src="https://github.com/user-attachments/assets/52f79eb8-c1c3-40d2-a895-97909cebf6c9" width="100%" alt="Certificate Configuration" />
<img src="https://github.com/user-attachments/assets/f3be396a-3513-4c13-91f2-b76b3a938ca7" width="100%" alt="Generated Certificate" />

---

## 🌟 Key Features

### 🎓 Student Portal
- **Browse & Register:** View upcoming events and register instantly.
- **My Events:** Track your registration history.
- **Auto-Claim Certificates:** Once an event ends, students can claim their unique certificates.

### 🏢 Organizer Portal
- **Event Lifecycle:** Create, manage, and end events.
- **Certificate Designer:** Configure custom coordinates for names and unique IDs on templates.
- **Data Export:** Generate professional Excel reports of all participants.

### 🛠 Admin Dashboard
- **Global Stats:** Overview of total students, organizers, and events.
- **User Management:** Full CRUD capabilities to manage platform users.
- **System-Wide Reports:** Export comprehensive CSV data for all platform activities.

---

## 💻 Tech Stack

- **Frontend:** React.js, Tailwind CSS, Framer Motion, Axios.
- **Backend:** Node.js, Express.js.
- **Database:** MongoDB (Mongoose).
- **Processing:** - `Canvas API` (Dynamic Certificate Generation)
  - `ExcelJS` (Professional Spreadsheet Reports)
  - `Multer` (File & Image Management)
  - `JWT` (Secure Role-Based Authentication)

---

## ⚙️ Installation & Setup

### 1. Clone the Project

git clone [https://github.com/Alpha6024/EventPulse.git](https://github.com/Alpha6024/Event-Pulse.git)
cd EventPulse

### 2. Backend Setup

cd backend
npm install
Create a .env file with MONGO_URI, JWT_SECRET, and PORT
node server.js

### 3. Frontend Setup

cd ../frontend
npm install
npm run dev

Developed with ❤️ by Alpha6024
