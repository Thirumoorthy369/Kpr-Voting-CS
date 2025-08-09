# KPR Voting System

A modern web-based voting system for student council elections built with React.js and Supabase.

## Features

- 🔐 **Dual Authentication System**
  - Admin login with credentials stored in environment variables
  - Student login with hardcoded credentials in JSON

- 🗳️ **Student Voting Flow**
  - View all available positions (President, Vice President, etc.)
  - Select candidates for each position with photos and information
  - Automatic progression through voting roles
  - Summary page with auto-logout after 30 seconds

- 👨‍💼 **Admin Dashboard**
  - Manage voting roles (add, edit, delete)
  - Manage candidates with photo upload
  - Real-time voting results with visual charts
  - Reset all votes functionality

- 🎨 **Modern UI/UX**
  - Responsive design for all devices
  - Animated backgrounds using CSS
  - Smooth transitions and loading states
  - Professional color scheme

## Tech Stack

- **Frontend**: React.js with Vite
- **Database**: Supabase (PostgreSQL)
- **Storage**: Supabase Storage
- **Routing**: React Router v6
- **State Management**: React Context API
- **Styling**: Custom CSS with animations

## Prerequisites

- Node.js (v14 or higher)
- npm or yarn
- Supabase account

## Setup Instructions

### 1. Clone the Repository
```bash
git clone <repository-url>
cd kpi-voting-system
