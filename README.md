# Team Task Manager – Full Stack Project Management App

A modern team task manager with project management, task assignments, role-based access (Admin/Member), and a beautiful glassmorphism UI. Built with React, Node.js, Express, Prisma, and SQLite/PostgreSQL.

![Screenshot of Dashboard](./screenshot-placeholder.png)

## 🚀 Features

- **Authentication** – JWT-based signup/login, password hashing (bcrypt), protected routes
- **Role-Based Access** – Admin can manage all projects, members, and tasks; Members see only their assigned items
- **Project Management** – Create, edit, delete projects; assign users to projects
- **Task Management** – Create, edit, delete tasks; set status (Todo, In Progress, Completed), due date, and assign users
- **Dashboard** – Real-time stats: total tasks, completed, pending, overdue, and recent tasks
- **Modern UI** – Glassmorphism design, responsive sidebar, stat cards, dark theme, smooth animations
- **Filtering** – Filter tasks by project, status, and assignee

## 🛠️ Tech Stack

### Frontend
- React 18 (Vite)
- Tailwind CSS
- React Router DOM
- Axios
- Lucide React (icons)
- date-fns

### Backend
- Node.js + Express
- Prisma ORM
- SQLite (default) / PostgreSQL / MySQL
- JWT authentication
- bcrypt
- express-validator

## 📦 Installation

### Prerequisites
- Node.js (v18 or higher)
- npm or yarn

### Clone the repository
```bash
git clone https://github.com/Prince-edu22/team-task-manager.git
cd team-task-manager
