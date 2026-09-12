# 🚀 Deployment & Publishing Guide for Engineers’ Day 2026

This guide explains how to access the website across devices and publish it with a live public link.

---

## 📱 Option 1: Instant Local Wi-Fi Access (No Internet Deployment Needed)

Your server is bound to `0.0.0.0:5000`, which means anyone on the same Wi-Fi network (college lab, hotspot, auditorium) can open the website directly on their phone, tablet, or laptop!

1. Make sure your server is running:
   ```powershell
   npm start
   # or
   node server/index.js
   ```
2. On any phone or laptop connected to the same Wi-Fi, open:
   ```
   http://10.21.170.207:5000
   ```
   *(Replace with your computer's IP address from `ipconfig` if your Wi-Fi changes).*

---

## 🌐 Option 2: Instant Free Public Link (Accessible Worldwide)

To generate a public HTTPS link right now from your computer without uploading code anywhere:

1. Keep your server running:
   ```powershell
   npm start
   ```
2. In a second terminal window, run:
   ```powershell
   npm run tunnel
   ```
   This gives you an instant public link like:
   ```
   your url is: https://engineers-day-2026.loca.lt
   ```
   Anyone in the world can open this link to use the website, register, and play the games live.

---

## ☁️ Option 3: Free Permanent 24/7 Cloud Hosting (Render.com)

To host the full-stack website online permanently 24/7 for free:

### Step 1: Push project to GitHub
1. In your terminal:
   ```powershell
   git init
   git add .
   git commit -m "Engineers Day 2026 full-stack website"
   ```
2. Create a new repository on [GitHub.com](https://github.com) named `engineers-day-2026`.
3. Link and push:
   ```powershell
   git remote add origin https://github.com/<YOUR_USERNAME>/engineers-day-2026.git
   git branch -M main
   git push -u origin main
   ```

### Step 2: Deploy on Render (Free Web Service)
1. Go to [Render.com](https://render.com) and create a free account.
2. Click **New +** -> **Web Service**.
3. Select your GitHub repository (`engineers-day-2026`).
4. Configure settings:
   - **Environment:** Node
   - **Build Command:** `npm run build`
   - **Start Command:** `npm start`
   - **Plan:** Free
5. Click **Create Web Service**.
6. In about 2 minutes, Render will provide a permanent live URL:
   ```
   https://engineers-day-2026.onrender.com
   ```

---

## 🔑 Admin Access on Published Link

- **Admin Login:** Click **"Admin Login"** in the top navigation.
- **Username:** `admin`
- **Password:** `admin@engineer2026`
