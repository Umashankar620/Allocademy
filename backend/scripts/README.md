# Database setup

1. **Install and start MySQL** (if not already):
   - Install from https://dev.mysql.com/downloads/installer/ (Windows) or use another MySQL-compatible server.
   - Ensure the MySQL service is running.

2. **Configure credentials** in `backend/.env`:
   - `DB_HOST`, `DB_PORT`, `DB_USER`, `DB_PASSWORD`, `DB_NAME=course_allotment`

3. **Run the setup script** from the `backend` folder:
   ```bash
   cd backend
   npx tsx scripts/setup-db.ts
   ```
   This creates the `course_allotment` database and the **normalized schema**:
   - **DEPARTMENT** (Department_ID, Department_Name) — referenced by STUDENT and COURSE
   - **ADMIN** (Admin_ID, Name, Email, Password)
   - **STUDENT** (Roll_No PK, Name, Email, Password, Department_ID, Semester, CGPA, Status)
   - **COURSE** (Course_ID PK, Course_Name, Credits, Department_ID, Semester, Status, Capacity, Slot, Faculty)
   - **ADM_IN_ACCESS** (Admin–Course access)
   - **PREFERENCE** (student course rankings)
   - **ENROLLMENT** (allotment result: allotted/waitlisted, optional Grade)

4. **Seed departments** (required before student signup):
   ```bash
   npx tsx scripts/seed-departments.ts
   ```

5. **Create an admin user** (optional, for login):
   ```bash
   npx tsx scripts/seed-admin.ts
   ```
   Default: `admin@nith.ac.in` / `admin@123`

6. **Approve a student**: set `Status = 'active'` for that student, or run:
   ```bash
   npx tsx scripts/approve-student.ts <student-email@nith.ac.in>
   ```

7. **Clear all data** (keeps schema):
   ```bash
   npx tsx scripts/clear-data.ts
   ```