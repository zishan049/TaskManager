# DESIGN.md - TaskManager

## 1. Core Purpose
A high-performance, mobile-first Task Management platform designed for both individual productivity and team collaboration. It features task history tracking and shared team spaces to ensure accountability and progress visibility.

## 2. Tech Stack
- **Frontend**: React (Vite)
- **Styling**: Vanilla CSS (Modern CSS features: CSS Variables, Flexbox/Grid, Container Queries)
- **Backend/Database**: Supabase (Auth - Email/Password, PostgreSQL, Real-time)
- **State Management**: React Context / Hooks (keeping it lean)
- **Icons**: Lucide React / Phosphor Icons

## 3. UI/UX Philosophy: "Minimal Techy"
- **Aesthetic**: Dark-mode focused, monochrome with high-contrast accent colors (e.g., Electric Blue or Neon Green).
- **Typography**: Monospace or ultra-clean Sans-serif (e.g., JetBrains Mono, Inter).
- **Motion**: Physics-based transitions `cubic-bezier(0.22, 1, 0.36, 1)`, subtle "scan-line" or "grid" overlays to reinforce the techy feel.
- **Interactions**: Haptic-like feedback on mobile, micro-interactions for task completion.

## 4. Key User Flows
- **Quick Add Task**: Global shortcut or persistent FAB (Floating Action Button) to capture tasks in < 2 seconds.
- **Categorize/Tag**: Dynamic tagging system with smart filters.
- **View Progress**: Visual dashboard showing completion rates, historical trends, and team activity.

## 5. Mobile & Performance Standards
- **Mobile-First**: Optimized for one-handed use (bottom-weighted navigation).
- **Performance**: Zero layout shifts, INP < 100ms, aggressive use of Supabase real-time for team updates.
- **Touch Targets**: Minimum 44px x 44px.

## 6. Architecture & Data Model (Supabase)
- **Auth**: Email & Password authentication (No OAuth).
- `users`: Profile and settings.
- `tasks`: id, title, description, status, priority, due_date, user_id, team_id, tags[].
- `teams`: id, name, owner_id.
- `team_members`: team_id, user_id, role.
- `history`: task_id, action, timestamp, user_id.
