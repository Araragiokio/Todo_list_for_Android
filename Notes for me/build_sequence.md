# TodoApp — Build Sequence 🗡️

---

## Phase 1 — Foundation 🏗️

This is the skeleton everything else sits on. We don't touch UI until this is solid.

**Step 1 — Project Setup**
- Install Node.js
- Create project (npx create-expo-app@latest TodoApp)
- Run on phone via Expo Go ✅

**Step 2 — Install All Libraries**
- Install all Expo libraries in one go
- Install all npm libraries in one go
- Verify no errors ✅

**Step 3 — Navigation Structure**
- Install React Navigation
- Create 5 empty tab screens:
  - 🏠 Home
  - ➕ Add Task
  - 🔔 Reminders
  - ⚙️ Settings
  - 👤 Profile
- Bottom tab bar working
- Correct icons per tab ✅

**Step 4 — Theme System**
- Create theme context (light / dark / system)
- Define color palette for both themes
- Connect to all screens
- Toggle working
- Theme saved to local storage ✅

---

## Phase 2 — Intro & Splash 🎬

**Step 5 — Splash Screen**
- Configure Expo splash screen
- Build custom cinematic intro:
  - Magic circle Lottie
  - App name fade in letter by letter
  - Sakura petals fall across screen
  - "Crafted by Aditya" text appears
  - Everything fades into home screen
- Settings toggle: Cinematic / Quick / None ✅

---

## Phase 3 — Core Functionality ⚙️

The heart of the app. This is where it becomes a real todo app.

**Step 6 — Data Structure**
- Define how a task looks in code
- Set up local storage (AsyncStorage) for guest mode
- All tasks save and load correctly locally ✅

**Step 7 — Home Screen UI**
- Greeting with name + streak
- Daily progress bar
- Category filter tabs (scrollable)
- Task cards (static first, no animations yet)
- Floating + button ✅

**Step 8 — Add Task Screen**
- Task name input
- Category picker (all 35 pre-built categories + custom)
- Priority selector (High / Medium / Low)
- Due date picker
- Save task to local storage ✅

**Step 9 — Task Actions**
- Mark task complete (checkbox)
- Delete task (swipe left)
- Edit task
- All changes update local storage correctly ✅

---

## Phase 4 — Animations ✨

Now we make everything feel alive.

**Step 10 — Task Animations**
- Task card slides in on add
- Sparkle animation on complete
- Swipe left to delete with snap back
- Progress bar fills smoothly
- All running at 60fps on UI thread ✅

**Step 11 — Tab Background Lotties**
- 🌸 Home — sakura petals falling
- ❄️ Add Task — gentle snowfall
- 🌧️ Reminders — soft rain drops
- 🌿 Settings — floating autumn leaves
- ⚡ Profile — lightning strikes
- Opacity + speed controls
- Master on/off toggle in settings ✅

---

## Phase 5 — Reminders & Alarms 🔔

**Step 12 — Notification Permission**
- Ask permission on first launch
- Handle allow / deny gracefully
- Gentle nudge in settings if denied ✅

**Step 13 — Reminder System**
- One-time reminder (specific date & time)
- Daily recurring
- Weekly recurring (pick the day)
- Monthly recurring (pick the date) ✅

**Step 14 — Smart Alerts**
- 1 week before due alert
- 1 day before due alert
- 1 hour before due alert
- 15 minutes before due alert
- Overdue persistent notification (until resolved)
- All toggleable in settings ✅

**Step 15 — Morning Digest & Snooze**
- Daily rich notification at user set time
- Shows all tasks due today with priorities
- Tap notification → opens home screen
- Snooze system: 5 / 10 / 30 min / 1 hour / tomorrow
- Action buttons on notification: Done ✓ | Snooze 😴 | Open → ✅

---

## Phase 6 — Authentication & Profile 👤

**Step 16 — Firebase Setup & Google Sign In**
- Create Firebase project on firebase.google.com
- Enable Google Authentication
- Create Firestore database
- Connect Firebase to app (.env for API keys)
- Sign in with Google button
- Guest mode flow (local storage stays)
- On sign in → migrate local tasks to cloud
- Profile pic pulled from Google automatically ✅

**Step 17 — Profile Picture**
- Camera option
- Gallery option
- Circle crop (1:1 ratio)
- Saved to Firebase storage ✅

**Step 18 — Profile Screen UI**
- Header: profile pic, name, email, member since
- Streak stats bar (current streak, best streak, total tasks)
- Yearly heatmap (365 squares, color = tasks completed)
- Tap any square → popup showing tasks done that day ✅

**Step 19 — Category Analysis & Insights**
- Donut chart (category breakdown)
- Bar chart (toggle between the two)
- Week / Month / Year toggle
- Smart insights below chart:
  - Best performing category
  - Most consistent category
  - Idle category warnings
  - Encouragement messages ✅

---

## Phase 7 — Badges 🏅

**Step 20 — Badge Logic**
- Track all badge conditions silently in background
- Streak badges (3 / 7 / 14 / 30 / 100 / 365 days)
- Task count badges (1 / 10 / 50 / 100 / 500 / 1000)
- Category badges (50 tasks per category)
- Special badges (Early Bird, Night Owl, Speed Run etc.)
- Anime badge variants (replaces standard when anime theme on)
- Trigger unlock the moment condition is met ✅

**Step 21 — Badge UI**
- Earned grid: full color + rarity glow
- Locked grid: grey silhouette + ??? + progress bar
- Rarity filter tabs: All / Common / Rare / Epic / Legendary
- Tap earned badge → detail popup (name, date earned, rarity)
- Tap locked badge → hint popup (requirement + progress bar) ✅

**Step 22 — Badge Unlock Animation**
- Full screen Lottie sparkle burst
- Badge reveals with glow animation
- Rarity color fills in dramatically
- "New Badge Unlocked!" text
- Share button (generates shareable image)
- Anime variants when anime theme is on ✅

---

## Phase 8 — Sound Design 🔊

**Step 23 — Sound Effects**
- Download all sounds (freesound.org / mixkit.co / zapsplat.com):
  - App open → soft magic chime
  - Task added → sword unsheath
  - Task complete → anime sparkle ting
  - Task deleted → paper whoosh
  - All tasks done → victory jingle
  - Deadline close → low warning tone
  - Reminder fires → soft bell
- Integrate expo-av
- Volume slider in settings
- Master on/off toggle ✅

---

## Phase 9 — Settings & Polish ⚙️

**Step 24 — Settings Screen**
- Appearance: theme, accent color, font size
- Sound: on/off toggle, volume slider
- Notifications & Alarms: all toggles from Phase 5
- Anime & Animations: tab backgrounds, speed, opacity
- Profile: name edit ✅

**Step 25 — SVG Illustrations**
- Empty state illustration → download from unDraw.co
- All done screen illustration → generate with Adobe Firefly (anime style)
- Guest mode chibi character → generate with Adobe Firefly
- Integrate into correct screens ✅

**Step 26 — About Section**
- App logo
- Version number
- "Designed & Developed by Aditya Gupta"
- Built with React Native + Expo
- © 2026 Aditya Gupta ✅

---

## Phase 10 — Final Polish 🌟

**Step 27 — Performance**
- Test on older / slower phones
- Optimize heavy animations
- Reduce unnecessary re-renders (React.memo, useMemo, useCallback)
- Verify FlatList optimization for large task lists
- Confirm Lottie pauses when tab is not active ✅

**Step 28 — Bug Testing**
- Test every flow end to end
- Test guest mode vs signed in mode
- Test all notifications firing correctly
- Test light / dark mode on every single screen
- Test with 0 tasks, 1 task, 100 tasks
- Test on different screen sizes
- Test with no internet connection ✅

**Step 29 — GitHub Final**
- Clean up all code
- Update README.md:
  - App name + description
  - Screenshots of every screen
  - Full feature list
  - How to run locally
  - "Designed & Developed by Aditya Gupta"
- Confirm repo is public
- Push final code ✅

**Step 30 — Play Store (Optional)**
- Create Google Play Developer account ($25 one-time)
- Generate release build (npx expo build:android)
- Write store listing (description, screenshots, category)
- Upload screenshots and app icon
- Submit for review ✅

---

# The Full Picture

```
Phase 1  — Foundation          Steps 1-4
Phase 2  — Intro & Splash      Step 5
Phase 3  — Core Features       Steps 6-9
Phase 4  — Animations          Steps 10-11
Phase 5  — Reminders & Alarms  Steps 12-15
Phase 6  — Auth & Profile      Steps 16-19
Phase 7  — Badges              Steps 20-22
Phase 8  — Sound Design        Step 23
Phase 9  — Settings & Polish   Steps 24-26
Phase 10 — Final Polish        Steps 27-30
```

**30 Steps. 10 Phases. 1 Incredible App. 🚀🗡️**

---

*Designed & Developed by Aditya Gupta — © 2026*
