# TodoApp — Build Sequence 🗡️

### Updated after Product Design Revision — March 2026

\---

## Phase 1 — Foundation 🏗️

**Step 1 — Project Setup** ✅

* Node.js installed
* Project created (npx create-expo-app@latest TodoApp)
* Running on phone via Expo Go

**Step 2 — Install All Libraries** ✅

* All Expo libraries installed
* All npm libraries installed
* react-native-draggable-flatlist added for manual sort

**Step 3 — Navigation Structure** ✅

* 5 tab screens created (Home, Add Task, Reminders, Settings, Profile)
* Bottom tab bar working with correct icons

**Step 4 — Theme System** ✅

* Light / dark / system theme context
* Warm peach palette (light) + deep navy palette (dark)
* Purple accent #6C63FF consistent across both
* Theme saved to local storage

\---

## Phase 2 — Intro \& Splash 🎬

**Step 5 — Splash Screen** ✅

* Cream background
* Checklist Lottie fades in + scales
* "TodoApp" text fades in
* Confetti burst
* "Crafted by Araragi" appears
* Fades into home screen

\---

## Phase 3 — Core Functionality ⚙️

**Step 6 — Data Structure** ✅

* Updated Task type:

  * id, title, category, tags\[], energyLevel
  * priority, dueDate, reminder, notes
  * subtasks\[], completed, createdAt
  * recurring, recurringDay, sortOrder
* 10 broad categories + custom category support
* AsyncStorage engine (getTasks, addTask, toggleTask, deleteTask, editTask)

**Step 7 — Home Screen UI** ← Partial redo needed

* Search bar at top (searches title, tags, category, notes)
* Greeting with name + streak
* Daily progress bar
* Category filter chips (horizontal scrollable)

  * 10 broad categories + custom ones
  * Sort button at right corner (drop down)
* Sort options:

  * Due Date (grouped: Today / Tomorrow / Future)
  * Priority (grouped: High / Medium / Low)
  * Energy Level (grouped: Deep Work / Focus / Quick / Low)
  * Created Time (newest first)
  * Manual (drag and drop reorder)
* Active task list
* Completed tasks collapsed at bottom
* Sakura petals Lottie (always on, subtle, home only)
* Floating + button ✅

**Step 8 — Add Task Screen** ← Full redo needed

* Task title input
* Category picker (10 broad + custom categories)
* Tags input (#coding #deepwork style)
* Energy level selector (Deep Work / Quick Task / Low Energy / Focus)
* Priority selector (High / Medium / Low)
* Due date picker
* Auto reminders (1 day before + 1 hour before + at due time)
* Notes field
* Subtasks / checklist builder
* Recurring toggle:

  * Daily / Weekly / Monthly / Yearly
  * Pick day for weekly
  * Pick date for monthly
* Save task to local storage ✅

**Step 9 — Task Actions**

* Mark task complete → sparkle Lottie animation fires
* Delete task (swipe left with snap back)
* Edit task (full edit screen, all fields editable)
* Subtask completion (tap individual subtask)
* Parent task auto-completes when all subtasks done
* Recurring task overdue handling:

  * Missed → shows overdue next day with warning
  * Disappears day after
  * Reappears on next occurrence
* All changes update local storage correctly ✅

\---

## Phase 4 — Animations ✨

**Step 10 — Purposeful Animations**

* Task card slides in on add
* Sparkle Lottie burst on task complete
* Swipe left to delete with snap back
* Progress bar fills smoothly
* Confetti Lottie when ALL tasks completed for the day
* All running at 60fps on UI thread ✅

**Step 11 — Sakura Home Background**

* Sakura petals Lottie on Home screen only
* Always on, slow, subtle (opacity 15%)
* On/off toggle in settings
* Speed control in settings
* No background Lotties on other tabs ✅

\---

## Phase 5 — Reminders \& Alarms 🔔

**Step 12 — Notification Permission**

* Ask permission on first launch
* Handle allow / deny gracefully
* Gentle nudge in settings if denied ✅

**Step 13 — Auto Reminder System**

* User sets due date → reminders fire automatically:

  * 1 day before due
  * 1 hour before due
  * At exact due time
* Manual one-time reminder option still available
* Recurring task reminders auto-generated per occurrence ✅

**Step 14 — Smart Alerts**

* Overdue persistent notification (until resolved)
* Recurring task missed → overdue notification next day
* All toggleable in settings ✅

**Step 15 — Morning Digest \& Snooze**

* Daily rich notification at user set time
* Shows all tasks due today with priorities and energy levels
* Tap → opens home screen
* Snooze: 5 / 10 / 30 min / 1 hour / tomorrow
* Action buttons: Done ✓ | Snooze 😴 | Open → ✅

\---

## Phase 6 — Authentication \& Profile 👤

**Step 16 — Firebase Setup \& Google Sign In**

* Create Firebase project
* Enable Google Authentication
* Create Firestore database
* Connect Firebase (.env for API keys)
* Sign in with Google button
* Guest mode flow (local storage stays)
* On sign in → migrate local tasks to cloud
* Custom categories stay local only
* One-time warning on first custom category created ✅

**Step 17 — Profile Picture**

* Camera option
* Gallery option
* Circle crop (1:1 ratio)
* Saved to Firebase storage ✅

**Step 18 — Profile Screen UI**

* Header: profile pic, name, email, member since
* Streak stats bar
* Yearly heatmap (365 squares)
* Tap any square → daily task popup ✅

**Step 19 — Category Analysis \& Insights**

* Donut chart + bar chart toggle
* Week / Month / Year toggle
* Smart insights + encouragement messages ✅

\---

## Phase 7 — Badges 🏅

**Step 20 — Badge Logic**

Streak Badges:

* Genin (Naruto) → 7 day streak — Common
* Chunin (Naruto) → 30 day streak — Rare
* Jonin (Naruto) → 100 day streak — Epic
* Hashira (Demon Slayer) → 365 day streak — Mythic

Task Count Badges:

* First Step → 1st task — Common
* Titan Shifter (AOT) → 50 tasks — Uncommon
* Hollow Mask (Bleach) → 200 tasks — Rare
* Nine Tails (Naruto) → 500 tasks — Legendary

Special Badges:

* Curse User (JJK) → 7 day streak — Uncommon
* Domain Expand (JJK) → Perfect week — Epic
* Sage Mode (Naruto) → Perfect month — Legendary
* Alchemist (FMA) → All 10 categories used — Rare
* Early Bird → Task before 7AM — Common
* Night Owl → Task after 11PM — Common
* Survey Corps (AOT) → 30 tasks in one week — Rare
* Speed Run → 10 tasks in one day — Uncommon
* Lunar Knight → 365 day streak — Mythic

Total: 18 badges
Anime references: Naruto, JJK, Demon Slayer, AOT, Bleach, FMA ✅

**Step 21 — Badge UI**

* Earned grid: full color + rarity glow
* Locked grid: grey silhouette + ??? + progress bar
* Rarity filter: All / Common / Rare / Epic / Legendary
* Tap earned → detail popup
* Tap locked → hint + progress bar ✅

**Step 22 — Badge Unlock Animation**

* Full screen Lottie sparkle burst
* Badge reveals with glow
* Share button
* Anime reference shown in unlock screen ✅

\---

## Phase 8 — Sound Design 🔊

**Step 23 — Sound Effects**

* App open → soft magic chime
* Task added → sword unsheath
* Task complete → anime sparkle ting
* Task deleted → paper whoosh
* All tasks done → victory jingle
* Badge unlock → dramatic reveal sound
* Deadline close → warning tone
* Reminder fires → soft bell
* Volume slider + master toggle ✅

\---

## Phase 9 — Settings \& Polish ⚙️

**Step 24 — Settings Screen**

* Appearance: theme, accent color, font size
* Sound: on/off, volume slider
* Notifications: auto-reminder toggles, digest time
* Animations: sakura on/off, speed, opacity
* Custom Categories: manage + warning shown once
* About section ✅

**Step 25 — SVG Illustrations**

* Empty state → unDraw.co
* All done → Adobe Firefly anime style
* Guest mode → Adobe Firefly chibi
* Integrated into correct screens ✅

**Step 26 — About Section**

* App logo + version
* "Designed \& Developed by Aditya Gupta"
* Built with React Native + Expo
* © 2026 Aditya Gupta ✅

\---

## Phase 10 — Final Polish 🌟

**Step 27 — Performance**

* Test on older phones
* Optimize animations
* React.memo, useMemo, useCallback
* FlatList optimization ✅

**Step 28 — Bug Testing**

* Every flow end to end
* Guest mode vs signed in
* Notifications firing correctly
* Light / dark on every screen
* 0 / 1 / 100 tasks
* Different screen sizes
* No internet connection
* Recurring task logic across days
* Custom category warning shows once only ✅

**Step 29 — GitHub Final**

* Clean up code
* Full README with screenshots
* "Designed \& Developed by Aditya Gupta"
* Repo public
* Push final code ✅

**Step 30 — Play Store (Optional)**

* Google Play Developer account ($25)
* Generate release build
* Store listing + screenshots
* Submit for review ✅

\---

# The Full Picture

```
Phase 1  — Foundation          Steps 1-4   ✅ Done
Phase 2  — Intro \\\& Splash      Step 5      ✅ Done
Phase 3  — Core Features       Steps 6-9   🔄 In Progress
Phase 4  — Animations          Steps 10-11
Phase 5  — Reminders \\\& Alarms  Steps 12-15
Phase 6  — Auth \\\& Profile      Steps 16-19
Phase 7  — Badges              Steps 20-22
Phase 8  — Sound Design        Step 23
Phase 9  — Settings \\\& Polish   Steps 24-26
Phase 10 — Final Polish        Steps 27-30
```

**30 Steps. 10 Phases. 1 Incredible App. 🚀🗡️**

\---

*Designed \& Developed by Aditya Gupta — © 2026*

