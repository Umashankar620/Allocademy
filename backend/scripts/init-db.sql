-- College Course Allotment Portal - Normalized Schema (reference + app)
-- Connections: DEPARTMENT -> STUDENT, DEPARTMENT -> COURSE; ADMIN <-> COURSE (ADM_IN_ACCESS); STUDENT <-> COURSE (PREFERENCE, ENROLLMENT)

CREATE DATABASE IF NOT EXISTS course_allotment;
USE course_allotment;

-- Drop old schema tables if they exist (one-time migration to normalized schema)
SET FOREIGN_KEY_CHECKS = 0;
DROP TABLE IF EXISTS allotments;
DROP TABLE IF EXISTS preferences;
DROP TABLE IF EXISTS courses;
DROP TABLE IF EXISTS students;
DROP TABLE IF EXISTS admins;
SET FOREIGN_KEY_CHECKS = 1;

-- 1. DEPARTMENT (referenced by STUDENT and COURSE)
CREATE TABLE IF NOT EXISTS DEPARTMENT (
  Department_ID INT PRIMARY KEY AUTO_INCREMENT,
  Department_Name VARCHAR(100) UNIQUE NOT NULL
);

-- 2. ADMIN
CREATE TABLE IF NOT EXISTS ADMIN (
  Admin_ID INT PRIMARY KEY AUTO_INCREMENT,
  Name VARCHAR(100) NOT NULL,
  Email VARCHAR(100) UNIQUE NOT NULL,
  Password VARCHAR(255) NOT NULL,
  INDEX idx_admin_email (Email)
);

-- 3. STUDENT (Department_ID -> DEPARTMENT; Roll_No used in PREFERENCE and ENROLLMENT)
CREATE TABLE IF NOT EXISTS STUDENT (
  Roll_No VARCHAR(100) PRIMARY KEY,
  Name VARCHAR(100) NOT NULL,
  Email VARCHAR(100) UNIQUE NOT NULL,
  Password VARCHAR(255) NOT NULL,
  Department_ID INT,
  Semester INT NOT NULL,
  CGPA DECIMAL(4, 2) DEFAULT NULL,
  Status ENUM('active', 'inactive', 'graduated', 'suspended') NOT NULL DEFAULT 'inactive',
  INDEX idx_student_email (Email),
  INDEX idx_student_department (Department_ID),
  FOREIGN KEY (Department_ID) REFERENCES DEPARTMENT(Department_ID) ON DELETE SET NULL
);

-- 4. COURSE (Department_ID -> DEPARTMENT; Course_ID used in ADM_IN_ACCESS, PREFERENCE, ENROLLMENT)
CREATE TABLE IF NOT EXISTS COURSE (
  Course_ID VARCHAR(20) PRIMARY KEY,
  Course_Name VARCHAR(100) NOT NULL,
  Credits INT NOT NULL,
  Department_ID INT,
  Semester INT,
  Status ENUM('active', 'inactive', 'archived') NOT NULL DEFAULT 'active',
  Capacity INT NOT NULL DEFAULT 0,
  Slot VARCHAR(50) NOT NULL DEFAULT 'TBA',
  Faculty VARCHAR(255) NOT NULL DEFAULT 'TBA',
  Course_Type ENUM('core', 'elective') NOT NULL DEFAULT 'core',
  Elective_Slot VARCHAR(50) DEFAULT NULL,
  Max_Choices INT DEFAULT NULL,
  INDEX idx_course_department (Department_ID),
  INDEX idx_course_semester (Semester),
  INDEX idx_course_elective (Elective_Slot),
  INDEX idx_course_sem_dept (Semester, Department_ID),
  FOREIGN KEY (Department_ID) REFERENCES DEPARTMENT(Department_ID) ON DELETE SET NULL
);

-- 5. ADM_IN_ACCESS (Admin-Course access: which admin manages which course)
CREATE TABLE IF NOT EXISTS ADM_IN_ACCESS (
  ADMIN_Admin_ID INT,
  COURSE_Course_ID VARCHAR(20),
  PRIMARY KEY (ADMIN_Admin_ID, COURSE_Course_ID),
  FOREIGN KEY (ADMIN_Admin_ID) REFERENCES ADMIN(Admin_ID) ON DELETE CASCADE,
  FOREIGN KEY (COURSE_Course_ID) REFERENCES COURSE(Course_ID) ON DELETE CASCADE
);

-- 6. PREFERENCE (student ranked course choices before allotment)
CREATE TABLE IF NOT EXISTS PREFERENCE (
  STUDENT_Roll_No VARCHAR(100),
  COURSE_Course_ID VARCHAR(20),
  `Rank` INT NOT NULL,
  PRIMARY KEY (STUDENT_Roll_No, COURSE_Course_ID),
  FOREIGN KEY (STUDENT_Roll_No) REFERENCES STUDENT(Roll_No) ON DELETE CASCADE,
  FOREIGN KEY (COURSE_Course_ID) REFERENCES COURSE(Course_ID) ON DELETE CASCADE
);

-- 7. ENROLLMENT (allotment result: allotted / waitlisted; optional Grade)
CREATE TABLE IF NOT EXISTS ENROLLMENT (
  STUDENT_Roll_No VARCHAR(100),
  COURSE_Course_ID VARCHAR(20),
  Enrollment_Date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  Grade VARCHAR(2) DEFAULT NULL,
  Status ENUM('allotted', 'waitlisted') NOT NULL DEFAULT 'allotted',
  PRIMARY KEY (STUDENT_Roll_No, COURSE_Course_ID),
  FOREIGN KEY (STUDENT_Roll_No) REFERENCES STUDENT(Roll_No) ON DELETE CASCADE,
  FOREIGN KEY (COURSE_Course_ID) REFERENCES COURSE(Course_ID) ON DELETE CASCADE
);

-- 8. COURSE_REQUEST (student course requests and approvals)
CREATE TABLE IF NOT EXISTS COURSE_REQUEST (
  Request_ID INT PRIMARY KEY AUTO_INCREMENT,
  STUDENT_Roll_No VARCHAR(100) NOT NULL,
  COURSE_Course_ID VARCHAR(20) NOT NULL,
  Status ENUM('pending', 'approved', 'rejected') NOT NULL DEFAULT 'pending',
  Request_Date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  Approval_Date TIMESTAMP NULL,
  Approved_By INT NULL,
  Reason VARCHAR(500) DEFAULT NULL,
  INDEX idx_request_student (STUDENT_Roll_No),
  INDEX idx_request_course (COURSE_Course_ID),
  INDEX idx_request_status (Status),
  INDEX idx_request_date (Request_Date),
  UNIQUE KEY unique_pending_request (STUDENT_Roll_No, COURSE_Course_ID, Status),
  FOREIGN KEY (STUDENT_Roll_No) REFERENCES STUDENT(Roll_No) ON DELETE CASCADE,
  FOREIGN KEY (COURSE_Course_ID) REFERENCES COURSE(Course_ID) ON DELETE CASCADE,
  FOREIGN KEY (Approved_By) REFERENCES ADMIN(Admin_ID) ON DELETE SET NULL
);
