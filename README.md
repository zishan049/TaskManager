<div align="center">
  <img src="https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB" alt="React" />
  <img src="https://img.shields.io/badge/Vite-B73BFE?style=for-the-badge&logo=vite&logoColor=FFD62E" alt="Vite" />
  <img src="https://img.shields.io/badge/Supabase-3ECF8E?style=for-the-badge&logo=supabase&logoColor=white" alt="Supabase" />
</div>

<h1 align="center">✨ TaskManager</h1>

<p align="center">
  <strong>A high-performance, mobile-first Task Management platform designed for both individual productivity and team collaboration.</strong>
</p>

---

## 🌟 Overview

TaskManager is built with a "Minimal Techy" philosophy. It features a dark-mode focused, monochrome aesthetic with high-contrast accents, bringing a premium, native app-like experience to the browser. With real-time updates and seamless team synchronization, you can manage tasks, view progress, and collaborate without ever hitting refresh.

## 🚀 Key Features

- **⚡ Blazing Fast Architecture:** Built with Vite and React 18, ensuring an incredibly fast Interaction to Next Paint (INP) of under 100ms and zero layout shifts.
- **🔒 Frictionless Auth & Profiles:** Secure email/password authentication powered by Supabase with persistent local storage caching.
- **🤝 Real-Time Team Collaboration:** Shared team spaces with instant updates across all clients using Supabase Real-time.
- **📊 Interactive Dashboard:** A beautiful visual dashboard showcasing to-do lists, completed tasks, and overall productivity metrics.
- **✨ Premium UI/UX:** Features a physics-based motion engine (`cubic-bezier(0.22, 1, 0.36, 1)`) running at 60fps, subtle scan-line overlays, and a fully fluid mobile-first layout.
- **🔍 Advanced Task Management:** Includes a dynamic Quick Add FAB, a detailed Task Sidebar, and comprehensive task history tracking.

## 💻 Tech Stack

- **Frontend Framework:** React 19 + Vite
- **Styling:** Vanilla Modern CSS (CSS Variables, Grid/Flexbox, Container Queries)
- **Backend & Database:** Supabase (PostgreSQL, Auth, Real-time)
- **State Management:** React Context + Custom Hooks (`useAuth`, `useTasks`)
- **Icons:** Lucide React & Phosphor Icons

## 🛠️ Installation & Setup

1. **Clone the repository:**
   ```bash
   git clone https://github.com/your-username/TaskManager.git
   cd TaskManager
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Configure Environment Variables:**
   Create a `.env.local` file in the root directory and add your Supabase credentials:
   ```env
   VITE_SUPABASE_URL=your_supabase_project_url
   VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
   ```

4. **Start the development server:**
   ```bash
   npm run dev
   ```

5. **Build for production:**
   ```bash
   npm run build
   ```

## 🎨 Design Philosophy & Standards

This project strictly adheres to a "Senior-Level Engineering Standard":
- **Clean Codebase:** Driven by SOLID and DRY principles, utilizing highly modular hooks and components.
- **Mobile-First & Touch-Friendly:** Touch targets are a minimum of 44px by 44px, heavily optimized for one-handed use on mobile devices.
- **Robust Error Handling:** Integrated React Error Boundaries prevent app crashes and provide graceful fallback UI states.

## 🗄️ Database Architecture

The Supabase PostgreSQL backend handles the following core tables:
- `users`: User profiles and core settings.
- `tasks`: Core task data (`title`, `status`, `priority`, `team_id`, etc).
- `teams` & `team_members`: Role-based access for team collaboration.
- `history`: Comprehensive activity logs for tasks.
