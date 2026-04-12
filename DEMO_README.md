# Demo Preparation - READ THIS FIRST

## What Was Wrong

Your demo seed script created analytics data but was missing actual content records:
- ✅ Analytics showed up (charts, graphs)
- ❌ Quizzes section was empty
- ❌ Documents section was empty
- ❌ Flashcards section was empty

## What I Fixed

I updated `scripts/demo-seed.mjs` to now create:
- **3 Documents** (source materials with [DEMO] tag)
- **3 Quizzes** (with questions and attempt history)
- **26 Flashcards** (actual card records, not just sessions)
- **40 Focus Sessions** (across 14 days)
- **Analytics Records** (daily rollups)

## What You Need to Do NOW

### 1. Re-run the Seed Script
```bash
cd academic-buddy
node scripts/demo-seed.mjs your@email.com --reset
```

Replace `your@email.com` with the email you use to log into the app.

### 2. Run the Agents
```bash
node scripts/demo-run-agents.mjs your@email.com
```

### 3. Verify It Worked

Log into your app and check:
- `/study/documents` - Should show 3 documents
- `/study/quizzes` - Should show 3 quizzes  
- `/study/flashcards` - Should show 3 documents with cards
- `/study/analytics` - Should show charts with data
- `/focus/analytics` - Should show 14 days of focus data

## If Data Still Doesn't Show

### Check Authentication
Make sure you're logged in with the EXACT email you used in the seed script.

### Check Browser Console
Open DevTools (F12) and look for errors. Common issues:
- 401 Unauthorized - Wrong user logged in
- 403 Forbidden - Auth token issue
- 404 Not Found - API route issue

### Verify Database
The seed script prints confirmation messages. You should see:
```
✅ Found user: Your Name (user-id-here)
✅ Seeded 3 demo tags
✅ Seeded 40 focus sessions
✅ Seeded 14 daily analytics records
✅ Seeded quiz: "Neural Networks — Fundamentals [DEMO]" (6 questions, 5 attempts)
✅ Seeded quiz: "Deep Learning — CNNs & RNNs [DEMO]" (5 questions, 5 attempts)
✅ Seeded quiz: "Network Security — Firewalls & Protocols [DEMO]" (5 questions, 5 attempts)
✅ Seeded 10 flashcard sessions
✅ Seeded 10 flashcards for Neural_Networks_Notes [DEMO].pdf
✅ Seeded 8 flashcards for Deep_Learning_Lecture_Notes [DEMO].pdf
✅ Seeded 8 flashcards for Firewall_Security_Notes [DEMO].pdf
```

## Demo Day Checklist

- [ ] Run seed script with `--reset`
- [ ] Run agents script
- [ ] Log in and verify all sections
- [ ] Practice the demo flow
- [ ] Have backup screenshots ready

## Need More Help?

See these detailed guides:
- `docs/DEMO_QUICK_START.md` - Step-by-step demo guide
- `docs/DEMO_PREPARATION_CHECKLIST.md` - Complete preparation checklist
- `docs/DEMO_WORKFLOW.md` - Original demo workflow

## Quick Test Command

Run this to verify everything is seeded:
```bash
node -e "
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
prisma.user.findUnique({
  where: { email: 'your@email.com' },
  include: {
    _count: {
      select: {
        sourceMaterials: true,
        quizzes: true,
        flashcards: true,
        pomodoroLogs: true
      }
    }
  }
}).then(user => {
  if (!user) {
    console.log('❌ User not found');
  } else {
    console.log('✅ User found:', user.email);
    console.log('📄 Documents:', user._count.sourceMaterials);
    console.log('❓ Quizzes:', user._count.quizzes);
    console.log('🎴 Flashcards:', user._count.flashcards);
    console.log('⏱️  Focus Sessions:', user._count.pomodoroLogs);
  }
}).finally(() => prisma.\$disconnect());
"
```

Replace `your@email.com` with your actual email.

Expected output:
```
✅ User found: your@email.com
📄 Documents: 3
❓ Quizzes: 3
🎴 Flashcards: 26
⏱️  Focus Sessions: 40+
```

---

**TL;DR:** Run the seed script again with `--reset`, then verify all sections show data. The script is now fixed to create actual content, not just analytics.
