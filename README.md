# Student Management System

A full-stack app with three roles — **student**, **teacher**, **admin** — built with React (Vite), Node.js/Express, and MySQL.

- Students self-register, view their own marks, and edit their own profile.
- Teachers see the full student list, allot/edit marks for any student, and edit their own profile.
- Admins can create/edit/delete any user (student, teacher, or admin), manage all marks, and edit their own profile.

## Project structure

```
backend/     Express REST API (JWT auth, MySQL via mysql2)
frontend/    React app (Vite, React Router, Axios)
database/    schema.sql — run this against MySQL first
```

## 1. Set up the database

Make sure MySQL is running, then:

```bash
mysql -u root -p < database/schema.sql
```

This creates the `student_management_system` database and its tables (no seed data).

## 2. Backend

```bash
cd backend
npm install
cp .env.example .env     # then edit DB_PASSWORD / JWT_SECRET etc.
npm run seed:admin       # creates the first admin login (prints the credentials)
npm run dev              # starts on http://localhost:5000
```

`npm run seed:admin` accepts optional args: `npm run seed:admin -- "Name" you@school.com "StrongPass1"`.

## 3. Frontend

```bash
cd frontend
npm install
cp .env.example .env     # VITE_API_URL, defaults to http://localhost:5000/api
npm run dev               # starts on http://localhost:5173
```

## Roles at a glance

| Action                          | Student | Teacher | Admin |
|----------------------------------|:-------:|:-------:|:-----:|
| Self-register                    | ✅      | —       | —     |
| View own profile / marks         | ✅      | ✅      | ✅    |
| Edit own profile                 | ✅      | ✅      | ✅    |
| View all students & their marks  |         | ✅      | ✅    |
| Allot / edit marks               |         | ✅      | ✅    |
| Create / edit / delete any user  |         |         | ✅    |

Teacher and admin accounts are not self-registrable — create them from the Admin dashboard (**Manage Users → Create User**) using the seeded admin login.
