# Git Push Fix

## Problem
```
! [rejected]        main -> main (fetch first)
error: failed to push some refs
```

This means the remote repository has commits that you don't have locally.

## Solution

### Option 1: Rebase (Recommended)
```bash
# Pull and rebase your changes on top of remote changes
git pull --rebase origin main

# If there are conflicts, resolve them, then:
git add .
git rebase --continue

# Push your changes
git push origin main
```

### Option 2: Merge
```bash
# Pull and merge remote changes
git pull origin main

# If there are conflicts, resolve them, then:
git add .
git commit -m "Merge remote changes"

# Push your changes
git push origin main
```

### Option 3: Force Push (⚠️ Use with Caution)
**Only use if you're sure you want to overwrite remote changes!**

```bash
# Force push (overwrites remote)
git push --force origin main
```

## Recommended Steps

1. **Check what's different**:
```bash
git fetch origin
git log HEAD..origin/main
```

2. **Pull with rebase**:
```bash
git pull --rebase origin main
```

3. **Push**:
```bash
git push origin main
```

## If You Get Conflicts

1. **See conflicted files**:
```bash
git status
```

2. **Open and resolve conflicts** in your editor

3. **Mark as resolved**:
```bash
git add <file>
```

4. **Continue rebase**:
```bash
git rebase --continue
```

5. **Push**:
```bash
git push origin main
```

## Prevention

To avoid this in the future:
```bash
# Always pull before starting work
git pull origin main

# Or set up automatic rebase
git config pull.rebase true
```
