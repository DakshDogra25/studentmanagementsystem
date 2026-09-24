-- Student Management System - MySQL schema
-- Run this once against your MySQL server before starting the backend.

CREATE DATABASE IF NOT EXISTS student_management_system;
USE student_management_system;

-- All accounts (student / teacher / admin) live in one table with a role column.
CREATE TABLE IF NOT EXISTS users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  email VARCHAR(150) NOT NULL UNIQUE,
  password VARCHAR(255) NOT NULL,
  role ENUM('student', 'teacher', 'admin') NOT NULL DEFAULT 'student',
  phone VARCHAR(20),
  address VARCHAR(255),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Extra fields that only apply to students.
CREATE TABLE IF NOT EXISTS student_profiles (
  user_id INT PRIMARY KEY,
  roll_number VARCHAR(50) UNIQUE,
  class_name VARCHAR(50),
  date_of_birth DATE,
  guardian_name VARCHAR(100),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Extra fields that only apply to teachers.
CREATE TABLE IF NOT EXISTS teacher_profiles (
  user_id INT PRIMARY KEY,
  employee_id VARCHAR(50) UNIQUE,
  subject_specialization VARCHAR(100),
  department VARCHAR(100),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Marks allotted to a student by a teacher for a subject/exam.
CREATE TABLE IF NOT EXISTS marks (
  id INT AUTO_INCREMENT PRIMARY KEY,
  student_id INT NOT NULL,
  teacher_id INT,
  subject VARCHAR(100) NOT NULL,
  exam_type VARCHAR(50) NOT NULL DEFAULT 'General',
  marks_obtained DECIMAL(5,2) NOT NULL,
  max_marks DECIMAL(5,2) NOT NULL DEFAULT 100,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (student_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (teacher_id) REFERENCES users(id) ON DELETE SET NULL
);

-- To create the first admin account, run `npm run seed:admin` in backend/
-- after setting up your .env (see backend/utils/seedAdmin.js).
