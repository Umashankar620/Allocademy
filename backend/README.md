# College Course Portal – Backend

Node.js/Express API for the College Course Portal (DBMS lab project). Handles auth, courses, preferences, enrollments, allotment, and admin.

## Requirements

- **Node.js** 18+
- **MySQL** 8 (or MariaDB)

## Quick start

### 1. Install dependencies

```bash
cd backend
npm install
```

### 2. Configure environment

```bash
cp .env.example .env
# Edit .env and set DB_PASSWORD and optionally JWT secrets
```

### 3. Create database and schema

Ensure MySQL is running, then:

```bash
npx tsx scripts/setup-db.ts
```

This creates the `course_allotment` database, tables, and stored procedures.

### 4. Seed data (required for signup)

```bash
npx tsx scripts/seed-departments.ts
npx tsx scripts/seed-admin.ts
```

Default admin: `admin@nith.ac.in` / `admin@123` (change in production).

### 5. Run the server

```bash
npm run dev
```

API base URL: **http://localhost:5000**

## API overview

| Path | Description |
|------|-------------|
| `POST /auth/signup` | Student registration (college email only) |
| `POST /auth/login` | Login (student: email/roll + password; admin: email or Admin ID + password) |
| `GET /auth/me` | Current user (requires Bearer token) |
| `GET /courses` | List courses (optional filters: department, semester) |
| `POST /courses` | Add course (admin) |
| `PATCH /courses/:id` | Update course (admin) |
| `DELETE /courses/:id` | Delete course (admin) |
| `GET /preferences` | Student's course preferences |
| `PUT /preferences` | Update preferences (admin can set deadline via env) |
| `GET /enrollments` | Student's enrollments |
| `POST /enrollments/:courseId` | Enroll in course |
| `DELETE /enrollments/:courseId` | Drop course |
| `GET /allotment/result` | Allotment result (allotted/waitlisted, published flag) |
| `GET /admin/students` | List students (admin) |
| `PATCH /admin/:rollNo/approve` | Approve student |
| `PATCH /admin/:rollNo/reject` | Reject student |
| `GET /admin/dashboard/stats` | Dashboard stats |
| `POST /admin/allotment/run` | Run allotment algorithm |
| `GET /admin/allotment/status` | Whether results are published |
| `POST /admin/allotment/publish` | Publish results |
| `POST /admin/allotment/unpublish` | Unpublish results |

## Frontend integration

Set in frontend `.env`:

```
VITE_API_URL=http://localhost:5000
```

Run frontend: `cd frontend && npm run dev` (default http://localhost:5173).

## Database schema (summary)

- **DEPARTMENT** – departments
- **STUDENT** – Roll_No, Name, Email, Password, Department_ID, Semester, CGPA, Status (active/inactive)
- **ADMIN** – Admin_ID, Name, Email, Password
- **COURSE** – Course_ID, Name, Credits, Department_ID, Semester, Status, Capacity, Slot, Faculty, Course_Type, Elective_Slot, Max_Choices
- **PREFERENCE** – student course rankings (for allotment)
- **ENROLLMENT** – student–course with Status (allotted/waitlisted)

See `scripts/init-db.sql` and `scripts/procedures.sql` for full schema and procedures.
