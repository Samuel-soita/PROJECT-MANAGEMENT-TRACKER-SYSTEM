# Project Management System

A complete, responsive Project Management System built with vanilla JavaScript, HTML, and CSS. This system enables efficient project and task management, user administration, and communication within teams. Data is stored using a JSON Server backend.

---

## Project Structure

/PROJECT MANAGEMENT SYSTEM
│
├── /image # Images used in the project UI
│ ├── 1.jpg
│ ├── 2.jpg
│ ├── 12.jpg
│ └── k.avif
│
├── /scripts # JavaScript files for session and app logic
│ ├── session.js
│ ├── admin-dashboard.js
│ ├── assign-task.js
│ └── (other JS files)
│
├── admin-dashboard.html # Admin dashboard main interface
├── assign-task.html # Task assignment interface
├── communicate.html # Messaging interface
├── db.json # JSON Server database file storing all data
├── login.html # Login page
├── logout.html # Logout page
├── logs.html # Logs viewing page
├── style.css # Main stylesheet
├── submissions.html # Submission review page
├── user-dashboard.html # User dashboard interface
└── README.md # Project overview and setup instructions (this file)



---

## Features

- Manage projects: create, edit, delete with client details, timelines, status, and remarks.
- Manage tasks: assign, prioritize, link to projects, and add remarks.
- User management with roles and secure access.
- Real-time search and filtering across projects, tasks, and users.
- Modal dialogs for forms and editing.
- Session management and authentication via `session.js`.
- Messaging and submission review features.
- Activity logs for audit and tracking.

---

## Technologies Used

- Vanilla JavaScript (ES6+)
- HTML5 & CSS3
- JSON Server for backend API (`db.json`)
- Responsive UI design

---

## Setup & Usage

1. **Clone the repository:**

git clone <your-repo-url>
cd PROJECT MANAGEMENT SYSTEM
npm install -g json-server
json-server --watch db.json --port 3001
Open admin-dashboard.html or login.html in your browser to start managing projects and tasks.

##Contributing
Feel free to fork, enhance, and submit pull requests. Please ensure consistent coding style and meaningful commit messages.

License

MIT License

Developed by Samuel Soita
Contact: [https://www.linkedin.com/in/samuel-soita/]





