# Django-React Full Stack Application - Template

A modern full-stack web application built with Django REST Framework (DRF) for the backend and React for the frontend. This template provides a solid foundation for building scalable web applications with user authentication and a clean, responsive UI.

## 🌟 Features

- **User Authentication**

  - JWT-based authentication
  - Secure login/logout functionality
  - Protected routes

- **Frontend**

  - Built with React 18 and Vite
  - Responsive design with CSS variables for theming
  - Client-side routing with React Router

- **Backend**
  - Django REST Framework for API endpoints
  - SQLite database (can be easily switched to PostgreSQL)
  - JWT authentication
  - CORS headers configured

## 🛠 Project Structure

```
Django-React-Template/
├── backend/                  # Django project
│   ├── api/                  # Main app with API endpoints
│   ├── backend/              # Project settings and configurations
│   ├── manage.py
│   └── requirements.txt
│
├── frontend/                 # React frontend
│   ├── public/               # Static files
│   └── src/
│       ├── components/       # Reusable UI components
│       ├── pages/            # Page components
│       ├── styles/           # Global styles and variables
│       ├── App.jsx           # Main App component
│       └── main.jsx          # Entry point
│
├── .env.example             # Example environment variables
└── README.md                # This file
```

## 🚀 Quick Start

### Prerequisites

- Python 3.8+
- Node.js 16+
- npm or yarn

### Backend Setup

1. **Create and activate virtual environment**

   ```bash
   # Windows
   python -m venv venv
   .\venv\Scripts\activate

   # macOS/Linux
   python3 -m venv venv
   source venv/bin/activate
   ```

2. **Install Python dependencies**

   ```bash
   cd backend
   pip install -r requirements.txt
   ```

3. **Set up environment variables**

   Copy `.env.example` to `.env` in the project root and update the values:

   ```bash
   cp .env.example .env
   ```

4. **Run migrations**

   ```bash
   python manage.py makemigrations
   python manage.py migrate
   ```

5. **Create superuser (optional)**
   ```bash
   python manage.py createsuperuser
   ```

### Frontend Setup

1. **Install Node.js dependencies**

   ```bash
   cd frontend
   npm install
   # or
   yarn install
   ```

## 🏃 Running the Application

1. **Start Django backend**

   ```bash
   cd backend
   python manage.py runserver
   ```

   - API: http://localhost:8000
   - Admin: http://localhost:8000/admin

2. **Start React frontend** (in a new terminal)
   ```bash
   cd frontend
   npm run dev
   ```
   - Frontend: http://localhost:5173

## 🛠 Available Commands

### Backend

- `python manage.py runserver` - Start development server
- `python manage.py makemigrations` - Create new migrations
- `python manage.py migrate` - Apply database migrations
- `python manage.py createsuperuser` - Create admin user

### Frontend

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run lint` - Lint code
- `npm run preview` - Preview production build

## 🔧 Technologies Used

- **Frontend**

  - React 18
  - React Router 6
  - Vite
  - CSS Modules
  - Axios for API requests

- **Backend**
  - Django 4.2
  - Django REST Framework
  - djangorestframework-simplejwt
  - django-cors-headers

## 🙏 Acknowledgments

- Django and React communities for amazing documentation
- Vite for the fast development experience
