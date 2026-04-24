8# Copilot Instructions for Todo_list_for_Android

## Build, run, lint, and test commands

This is an Expo + React Native TypeScript app.

- Install dependencies: `npm install`
- Start dev server: `npm run start`
- Run on Android (Expo): `npm run android`
- Run on iOS (Expo): `npm run ios`
- Run on web: `npm run web`
- Lint: `npm run lint`

No test runner is currently configured in `package.json` (no `test` script), so there is no supported command yet for full-suite or single-test execution.

## High-level architecture

- **Routing and app shell** use Expo Router:
  - `app/_layout.tsx` is the root shell. It wraps the app in `ThemeProvider`, handles the custom splash flow, registers notification action categories, and schedules the daily digest after splash completion.
  - `app/(tabs)/_layout.tsx` defines the bottom-tab navigation for Home, Add Task, Reminders, Settings, and Profile. `edittask` exists as a route but is hidden from the tab bar (`href: null`).
- **State and theming**:
  - `context/ThemeContext.tsx` is the single global context. It computes `isDark`, exposes `colors`, and persists theme selection to AsyncStorage under the `theme` key.
  - `constants/Colors.ts` and `useTheme()` are the source of truth for UI colors.
- **Task domain + persistence**:
  - `Types/Task.ts` defines the core `Task` and `TaskInput` contract.
  - `storage/TaskStorage.ts` is the persistence layer (AsyncStorage keys: `tasks`, `custom_categories`, and `custom_category_warning_shown`) and includes key domain behaviors (recurring task visibility via `getActiveTasks`, manual order persistence via `sortOrder`, task/category search helpers).
- **Notifications**:
  - `services/NotificationService.ts` handles permissions and reminder scheduling/cancellation.
  - Task creation in storage calls reminder scheduling helpers; app boot also schedules a daily digest notification category/action flow from the root layout.

## Key codebase conventions

- **Use theme context colors, not ad-hoc palette values** for screen styling. Pattern: `const { colors } = useTheme();` then consume `colors.background`, `colors.card`, `colors.text`, etc.
- **Treat `TaskInput` as the write shape and `Task` as the persisted shape**:
  - `TaskStorage.addTask` appends generated fields (`id`, `completed`, `createdAt`, `sortOrder`).
  - `dueDate` and `reminder` are stored as ISO strings (`string | null`).
  - Recurrence is represented by `recurring` + `recurringDay` (weekday names for weekly, day-of-month string for monthly).
- **When working with categories, always merge defaults + custom categories** (`DEFAULT_CATEGORIES` + `getCustomCategories()`), and resolve display metadata through `getCategoryInfo`.
- **Manual ordering is persisted** by writing `sortOrder` through `updateSortOrder`; do not implement transient UI-only ordering for the home active list.
- **File-based routing is canonical**: create screens under `app/` (or `app/(tabs)/`) and navigate using Expo Router paths (e.g. `router.push('/(tabs)/addtask')`).
- **Path aliasing is enabled** via `@/*` in `tsconfig.json`; prefer alias imports for app code (`@/context/...`, `@/storage/...`, etc.) and preserve existing filename casing when importing.

## graphify

Before answering architecture or codebase questions, read `graphify-out/GRAPH_REPORT.md` if it exists.
If `graphify-out/wiki/index.md` exists, navigate it for deep questions.
Type `/graphify` in Copilot Chat to build or update the knowledge graph.
