# KPR Voting System

A modern, web-based voting system tailored for student council elections. Crafted with React.js and powered by Supabase, it blends elegance, security, and responsiveness.

---

## Features

### Dual Authentication System
- **Admin Login**: Secure access, credentials safely kept in environment variables.
- **Student Login**: Simple and swift via hardcoded JSON credentials (ideal for prototypes or controlled environments).

### Student Voting Flow
- Browse all positions (e.g., President, Vice President).
- Select your choice for each role, complete with candidate photos and bios.
- Flow seamlessly from one vote to the next.
- Finalize via a summary page — auto-logout kicks in after 30 seconds of silence, keeping your vote safe and your session lean.

### Admin Dashboard
- Add, edit, or remove voting roles on the fly.
- Manage candidates, with smooth photo uploads.
- View real-time voting results adorned with dynamic visual charts.
- Reset all votes in one decisive moment — perfect for fresh elections or practice runs.

### Modern UI & UX
- Fluid design that adapts across devices.
- Animated CSS backgrounds to keep things visually alive.
- Smooth transitions, thoughtful loading states, and a refined color palette that’s both timeless and contemporary.

---

## Tech Stack

| Layer       | Technology                    |
|-------------|-------------------------------|
| Frontend    | React.js with Vite             |
| Database    | Supabase (PostgreSQL)          |
| Storage     | Supabase Storage               |
| Routing     | React Router v6                |
| State       | React Context API              |
| Styling     | Hand-crafted CSS with animations |

---

## Prerequisites
- **Node.js** v14 or newer        
- **npm** or **yarn**  
- A **Supabase account** (for database and storage setup)

---

## Setup Instructions

### 1. Clone the Repository
git clone https://github.com/Thirumoorthy369/KPR-Voting-System.git
cd kpr-voting-system

### 2. Install Dependencies
npm install

### 3. Configure Environment
Create a .env file in the project root with the following:

VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
ADMIN_USERNAME=your_admin_username
ADMIN_PASSWORD=your_admin_password

### 4. Start the Development Server
bash
npm run dev
