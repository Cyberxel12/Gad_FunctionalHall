# 🏛️ Dimataling GAD Function Hall Reservation System

A modern, responsive web-based hall reservation and schedule management system built for the Municipality of Dimataling. Powered by **Firebase Cloud Firestore** for real-time cross-device database synchronization, **Tailwind CSS** for rich responsive UI, and **Vanilla JavaScript**.

---

## ✨ Features

- ⚡ **Real-time Cloud Sync**: Powered by **Firebase Cloud Firestore**, allowing instant cross-device updates between Reservers and Administrators.
- 📱 **Fully Responsive UI**: Mobile-first design optimized for smartphones, tablets, laptops, and desktop displays.
- 🛡️ **Role-Based Access Control**:
  - **Admin Dashboard**: Real-time management of pending reservations, approval/rejection workflows, user account management, metrics, and CSV exports.
  - **User Portal**: Easy reservation request creation, track booking status, view schedule calendar, update profile, and export approved meeting history.
- 📊 **CSV Export Support**:
  - Department-based CSV exports in Admin Dashboard.
  - Chronologically sorted (ascending order) CSV export for Approved Meeting History in User Dashboard.
- 🔐 **Account Security & Recovery**: Password strength indicator, registration validation, and 2-step OTP account password recovery flow.
- 💾 **Offline Resilience**: Automatic `localStorage` caching fallback if internet connection is disrupted.

---

## 🛠️ Technology Stack

- **Frontend**: HTML5, Vanilla JavaScript (ES6+), Tailwind CSS (CDN)
- **UI Components & Icons**: Google Material Symbols Outlined & Inter Typography
- **Database & Cloud Backend**: Firebase Web SDK v10 (Cloud Firestore & Authentication)

---

## 📁 Repository Structure

```
├── index.html               # Main entry & auto-redirect portal (GitHub Pages entry point)
├── login.html               # User & Admin authentication form with OTP recovery
├── register.html            # User registration form with terms agreement
├── user_dashboard.html      # Reserver portal & reservation management
├── admin_dashboard.html     # Administrative management portal & statistics
├── js/
│   └── db.js                # Central database engine & Firebase Firestore SDK module
├── dimataling-logo.png      # Municipal seal asset
├── municipality.png         # Background watermark asset
├── README.md                # Project documentation
└── .gitignore               # Ignored local temporary files
```

---

## 🚀 Quick Start / Local Setup

1. **Clone or Download the Repository**:
   ```bash
   git clone https://github.com/YOUR_USERNAME/dimataling-gad-hall-reservation-system.git
   ```
2. **Open in Browser**:
   Double click `index.html` or run using any local server (e.g. Live Server in VS Code).

---

## 🔑 Default Credentials

- **Admin Account**:
  - **Username / Email**: `admin` or `admin@dimataling.gov.ph`
  - **Password**: `admin123`
  - **Role**: `Admin`

---

## 🌐 Publishing to GitHub Pages

1. Create a new repository on [GitHub](https://github.com/new) named `dimataling-gad-hall-reservation-system`.
2. Push this folder to your GitHub repository:
   ```bash
   git init
   git add .
   git commit -m "Initial commit - Dimataling GAD Reservation System"
   git branch -M main
   git remote add origin https://github.com/YOUR_USERNAME/dimataling-gad-hall-reservation-system.git
   git push -u origin main
   ```
3. Go to your repository **Settings** ➔ **Pages**.
4. Under **Branch**, select `main` and `/ (root)`, then click **Save**.
5. Your live site will be deployed at `https://YOUR_USERNAME.github.io/dimataling-gad-hall-reservation-system/`!

---

## 👨‍💻 Credits & Attribution

Developed for **Dimataling GAD Function Hall Reservation System** by **ZDSPGC DIMATALING STUDENTS**.
