1. **PROJECT OVERVIEW**
**System Name**: College Course Portal
**Purpose**: Basic platform for students to view/enroll in courses and admins to manage them
**Users**: Students, Administrators
**Scope**: DBMS Lab Project - Basic Implementation



2. **SYSTEM ENTITIES**
2.1 **STUDENT**
**Roll_No** (Primary Key)
**Name**
**Email** (unique, college email only)
**Password**
**Department**
**Semester**
**Status** (Pending/Approved/Blocked)

2.2 **COURSE**
**Course_ID** (Primary Key)
**Course_Name**
**Credits**
**Department**
**Semester**
**Status** (Active/Inactive)

2.3 **ADMIN**
**Admin_ID** (Primary Key)
**Name**
**Email** (unique)
**Password**
**Department**



3. **FUNCTIONAL REQUIREMENTS**
3.1 STUDENT FUNCTIONS
Register using college email ID only
Login only after admin approval
View available courses filtered by:
  Department
  Semester
  Course status (Active only)
Enroll in available courses
View enrolled courses
Cannot enroll in the same course more than once

3.2 ADMIN FUNCTIONS
Login to system
Add new courses
Update existing course details
Activate or deactivate courses
Delete courses
View list of registered students
Approve or block student accounts



4. **NON-FUNCTIONAL REQUIREMENTS**
4.1 Security Requirements
Passwords must be stored in encrypted/hashed format
Only authenticated users can access the system
Students cannot access admin functionalities

4.2 Performance Requirements
System should handle multiple student logins simultaneously
Course listing should load within acceptable response time

4.3 Data Integrity Requirements
Duplicate student registration using the same email is not allowed
A student cannot enroll in the same course more than once
Only active courses are available for enrollment

4.4 Usability Requirements
Simple and user-friendly interface
Easy navigation between pages
Clear messages for approval status and enrollment actions

4.5 Reliability Requirements
System should prevent data loss during failures
Database constraints must ensure consistency of student and enrollment data



5. **USER INTERFACES**
5.1 STUDENT PAGES
Registration Page
  Roll number, name, email, password, department, semester
  Only college emails allowed
Login Page
  Email and password
Student Dashboard
  Accessible only after admin approval
  Welcome message
  List of available courses with "Enroll" button
  List of enrolled courses

5.2 ADMIN PAGES
Login Page
  Admin ID and password
Admin Dashboard
  Quick stats
  Links to manage courses and students
Manage Courses Page
  Add new course form
  List of existing courses with edit/delete options
Manage Students Page
  List of students with approve/block options
