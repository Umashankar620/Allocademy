-- Add elective slot functionality to COURSE table
USE course_allotment;

-- Add new columns to COURSE table
ALTER TABLE COURSE 
ADD COLUMN Course_Type ENUM('core', 'elective') NOT NULL DEFAULT 'core' AFTER Faculty,
ADD COLUMN Elective_Slot VARCHAR(50) DEFAULT NULL AFTER Course_Type,
ADD COLUMN Max_Choices INT DEFAULT NULL AFTER Elective_Slot;

-- Add index for elective slot queries
CREATE INDEX idx_course_elective ON COURSE(Elective_Slot);

-- Add index for semester and department filtering
CREATE INDEX idx_course_sem_dept ON COURSE(Semester, Department_ID);

-- Notes:
-- Course_Type: 'core' for mandatory courses, 'elective' for optional courses
-- Elective_Slot: e.g., 'Elective-1', 'Elective-2', NULL for core courses
-- Max_Choices: How many courses student can select from this elective slot (NULL for core)
