# 🏠 Running Academic Buddy Locally

## ✅ You're Already Set Up!

Good news - your `.env` file already has everything configured. You can start using the app right now!

---

## 🚀 Quick Start (3 Steps)

### **Step 1: Install Dependencies** (if not done)
```bash
npm install
```

### **Step 2: Setup Database**
```bash
npx prisma generate
npx prisma db push
```
This syncs your Prisma schema with your Neon database.

### **Step 3: Start the App**
```bash
npm run dev
```

**That's it!** Open your browser to:
```
http://localhost:3000
```

---

## 🎯 What You Can Do Locally

### **Everything Works:**
- ✅ Sign up / Login with Firebase
- ✅ Start focus sessions (Pomodoro & Stopwatch)
- ✅ Track your productivity
- ✅ Get AI daily insights (using GROQ)
- ✅ View analytics and stats
- ✅ Manage your profile
- ✅ All data saved to your Neon database
- ✅ Caching with Upstash Redis
- ✅ Error monitoring with Sentry

### **Your Data:**
- Stored in your Neon PostgreSQL database (cloud)
- Accessible from anywhere (even if you switch computers)
- Cached in Upstash Redis for speed
- Completely private (only you have access)

---

## 📱 How to Use It

### **First Time Setup:**

1. **Start the dev server:**
   ```bash
   npm run dev
   ```

2. **Open browser:** `http://localhost:3000`

3. **Sign up:**
   - Click "Get Started"
   - Enter your email and password
   - Choose a name
   - Done!

4. **Start your first focus session:**
   - Go to Focus page
   - Choose Pomodoro or Stopwatch
   - Click Start
   - Focus! 🎯

### **Daily Use:**

1. **Start the app:**
   ```bash
   npm run dev
   ```

2. **Login** at `http://localhost:3000`

3. **Use your features:**
   - Focus sessions
   - Check analytics
   - View your AI insight (updates daily)
   - Track your streaks

4. **When done, just close the terminal** (Ctrl+C)

---

## 💡 Pro Tips for Local Use

### **Keep It Running:**
- Leave the terminal open while you work
- The app stays at `localhost:3000`
- Your timer won't stop even if you switch browser tabs

### **Access from Other Devices on Same Network:**
Your app will also be available at:
```
http://YOUR_LOCAL_IP:3000
```
Find your IP with:
- Windows: `ipconfig` (look for IPv4)
- Mac/Linux: `ifconfig` (look for inet)

Example: `http://192.168.1.100:3000`

### **Data Persistence:**
- Your data is in the cloud (Neon database)
- Even if you close the app, your data is safe
- Next time you run it, everything is still there

### **Updates:**
When you make changes to the code:
- The app auto-reloads (hot reload)
- No need to restart the server

---

## 🔧 Useful Commands

### **Start Development Server:**
```bash
npm run dev
```

### **View Database:**
```bash
npx prisma studio
```
Opens a GUI at `http://localhost:5555` to see your data

### **Reset Database (if needed):**
```bash
npx prisma db push --force-reset
```
⚠️ This deletes all data!

### **Check for Errors:**
```bash
npm run lint
```

---

## 🎨 What You'll See

### **Landing Page** (`localhost:3000`)
- Beautiful dark theme
- "Master Your Academic Journey" hero section
- Sign up / Login buttons

### **Focus Page** (`localhost:3000/focus`)
- Big circular timer
- Pomodoro or Stopwatch modes
- Session stats and controls
- Tag selector

### **Analytics** (`localhost:3000/focus/analytics`)
- Charts and graphs
- Productivity trends
- Streak tracking
- Top focus areas

### **Profile** (`localhost:3000/profile`)
- Your stats
- AI daily insight (changes every day!)
- Edit profile
- Preferences

---

## 🐛 Troubleshooting

### **Port 3000 already in use?**
```bash
# Kill the process using port 3000
npx kill-port 3000

# Or use a different port
npm run dev -- -p 3001
```

### **Database connection error?**
- Check your `.env` file has `DATABASE_URL`
- Run `npx prisma db push` again

### **Firebase auth not working?**
- Make sure `localhost:3000` is in Firebase authorized domains
- Go to Firebase Console → Authentication → Settings → Authorized domains
- Add `localhost`

### **AI insights not generating?**
- Check your `GROQ_API_KEY` in `.env`
- Make sure you have internet connection

---

## 🎉 You're Ready!

**To start using your app right now:**

1. Open terminal in your project folder
2. Run: `npm run dev`
3. Open: `http://localhost:3000`
4. Sign up and start focusing!

**Your personal productivity app is ready to use! 🚀**

---

## 📊 Advantages of Local Use

✅ **Free** - No hosting costs
✅ **Fast** - No network latency
✅ **Private** - Runs on your machine
✅ **Full Control** - Modify anything you want
✅ **Data Persists** - Stored in cloud database
✅ **Works Offline** - Once loaded (except AI features)

## 🌐 When to Deploy?

Deploy to Vercel when you want to:
- Access from any device/location
- Share with others
- Have it always running (24/7)
- Get a professional URL

**For now, enjoy using it locally! 🎯**
