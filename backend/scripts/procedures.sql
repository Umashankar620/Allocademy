-- Stored procedures for course allotment

DELIMITER $$

DROP PROCEDURE IF EXISTS sp_admin_list_students$$
CREATE PROCEDURE sp_admin_list_students()
BEGIN
  SELECT Roll_No, Name, Email, CGPA, Status, Department_ID
  FROM STUDENT
  ORDER BY Roll_No;
END$$

DROP PROCEDURE IF EXISTS sp_student_exists_by_roll$$
CREATE PROCEDURE sp_student_exists_by_roll(IN p_roll_no VARCHAR(50))
BEGIN
  SELECT Roll_No FROM STUDENT WHERE Roll_No = p_roll_no;
END$$

DROP PROCEDURE IF EXISTS sp_admin_update_student_status$$
CREATE PROCEDURE sp_admin_update_student_status(IN p_roll_no VARCHAR(50), IN p_status VARCHAR(20))
BEGIN
  UPDATE STUDENT SET Status = p_status WHERE Roll_No = p_roll_no;
END$$

DROP PROCEDURE IF EXISTS sp_admin_delete_student$$
CREATE PROCEDURE sp_admin_delete_student(IN p_roll_no VARCHAR(50))
BEGIN
  DELETE FROM STUDENT WHERE Roll_No = p_roll_no;
END$$

DROP PROCEDURE IF EXISTS sp_admin_update_student_cgpa$$
CREATE PROCEDURE sp_admin_update_student_cgpa(IN p_roll_no VARCHAR(50), IN p_cgpa DOUBLE)
BEGIN
  UPDATE STUDENT SET CGPA = p_cgpa WHERE Roll_No = p_roll_no;
  SELECT ROW_COUNT() AS affected_rows;
END$$

DROP PROCEDURE IF EXISTS sp_admin_allotment_stats$$
CREATE PROCEDURE sp_admin_allotment_stats()
BEGIN
  SELECT
    (SELECT COUNT(*) FROM STUDENT WHERE Status = 'active') AS active_students,
    (SELECT COUNT(*) FROM STUDENT WHERE Status = 'inactive') AS inactive_students,
    (SELECT COUNT(*) FROM COURSE WHERE Status = 'active') AS active_courses,
    (SELECT SUM(Capacity) FROM COURSE WHERE Status = 'active') AS total_capacity,
    (SELECT COUNT(*) FROM ENROLLMENT WHERE Status = 'allotted') AS allotted_count,
    (SELECT COUNT(*) FROM ENROLLMENT WHERE Status = 'waitlisted') AS waitlisted_count;
END$$

DROP PROCEDURE IF EXISTS sp_admin_students_missing_cgpa$$
CREATE PROCEDURE sp_admin_students_missing_cgpa()
BEGIN
  SELECT Roll_No, Name
  FROM STUDENT
  WHERE Status = 'active' AND (CGPA IS NULL OR CGPA = 0);
END$$

DROP PROCEDURE IF EXISTS sp_admin_clear_allotments$$
CREATE PROCEDURE sp_admin_clear_allotments()
BEGIN
  DELETE FROM ENROLLMENT;
END$$

DROP PROCEDURE IF EXISTS sp_get_department_by_name$$
CREATE PROCEDURE sp_get_department_by_name(IN p_department_name VARCHAR(100))
BEGIN
  SELECT Department_ID, Department_Name
  FROM DEPARTMENT
  WHERE Department_Name = p_department_name;
END$$

DROP PROCEDURE IF EXISTS sp_get_department_by_id$$
CREATE PROCEDURE sp_get_department_by_id(IN p_department_id INT)
BEGIN
  SELECT Department_Name
  FROM DEPARTMENT
  WHERE Department_ID = p_department_id;
END$$

DROP PROCEDURE IF EXISTS sp_get_admin_by_email$$
CREATE PROCEDURE sp_get_admin_by_email(IN p_email VARCHAR(150))
BEGIN
  SELECT Admin_ID, Name, Email, Password
  FROM ADMIN
  WHERE Email = p_email;
END$$

DROP PROCEDURE IF EXISTS sp_get_admin_by_id$$
CREATE PROCEDURE sp_get_admin_by_id(IN p_admin_id INT)
BEGIN
  SELECT Admin_ID, Name, Email, Password
  FROM ADMIN
  WHERE Admin_ID = p_admin_id;
END$$

DROP PROCEDURE IF EXISTS sp_get_student_by_email_or_roll$$
CREATE PROCEDURE sp_get_student_by_email_or_roll(IN p_email VARCHAR(150), IN p_roll_no VARCHAR(50))
BEGIN
  SELECT s.Roll_No, s.Name, s.Email, s.Department_ID, s.Semester, s.CGPA, s.Password, s.Status
  FROM STUDENT s
  WHERE s.Email = p_email OR s.Roll_No = p_roll_no;
END$$

DROP PROCEDURE IF EXISTS sp_insert_student$$
CREATE PROCEDURE sp_insert_student(
  IN p_roll_no VARCHAR(50),
  IN p_name VARCHAR(150),
  IN p_email VARCHAR(150),
  IN p_password VARCHAR(255),
  IN p_department_id INT,
  IN p_semester INT,
  IN p_status VARCHAR(20)
)
BEGIN
  INSERT INTO STUDENT (Roll_No, Name, Email, Password, Department_ID, Semester, Status)
  VALUES (p_roll_no, p_name, p_email, p_password, p_department_id, p_semester, p_status);
END$$

DROP PROCEDURE IF EXISTS sp_get_course_allotted_count$$
CREATE PROCEDURE sp_get_course_allotted_count(IN p_course_id VARCHAR(50))
BEGIN
  SELECT COUNT(*) AS cnt
  FROM ENROLLMENT
  WHERE COURSE_Course_ID = p_course_id AND Status = 'allotted';
END$$

DROP PROCEDURE IF EXISTS sp_list_courses$$
CREATE PROCEDURE sp_list_courses(
  IN p_status VARCHAR(20),
  IN p_dept_name VARCHAR(100),
  IN p_semester INT,
  IN p_student_roll_no VARCHAR(50)
)
BEGIN
  DECLARE v_semester INT DEFAULT NULL;
  DECLARE v_department_id INT DEFAULT NULL;

  IF p_student_roll_no IS NOT NULL THEN
    SELECT Semester, Department_ID
      INTO v_semester, v_department_id
    FROM STUDENT
    WHERE Roll_No = p_student_roll_no;
  END IF;

  SELECT Course_ID, Course_Name, Credits, Department_ID, Semester, Status, Capacity, Slot, Faculty, Course_Type, Elective_Slot, Max_Choices
  FROM COURSE
  WHERE Status = p_status
    AND (v_semester IS NULL OR Semester = v_semester)
    AND (v_department_id IS NULL OR Department_ID = v_department_id)
    AND (p_dept_name IS NULL OR Department_ID = (SELECT Department_ID FROM DEPARTMENT WHERE Department_Name = p_dept_name))
    AND (p_semester IS NULL OR Semester = p_semester)
  ORDER BY Elective_Slot, Course_ID;
END$$

DROP PROCEDURE IF EXISTS sp_get_department_name_by_id$$
CREATE PROCEDURE sp_get_department_name_by_id(IN p_department_id INT)
BEGIN
  SELECT Department_Name
  FROM DEPARTMENT
  WHERE Department_ID = p_department_id;
END$$

DROP PROCEDURE IF EXISTS sp_get_course_by_id$$
CREATE PROCEDURE sp_get_course_by_id(IN p_course_id VARCHAR(50))
BEGIN
  SELECT Course_ID, Course_Name, Credits, Department_ID, Semester, Status, Capacity, Slot, Faculty, Course_Type, Elective_Slot, Max_Choices
  FROM COURSE
  WHERE Course_ID = p_course_id;
END$$

DROP PROCEDURE IF EXISTS sp_get_course_id_by_id$$
CREATE PROCEDURE sp_get_course_id_by_id(IN p_course_id VARCHAR(50))
BEGIN
  SELECT Course_ID FROM COURSE WHERE Course_ID = p_course_id;
END$$

DROP PROCEDURE IF EXISTS sp_create_course$$
CREATE PROCEDURE sp_create_course(
  IN p_course_id VARCHAR(50),
  IN p_course_name VARCHAR(150),
  IN p_credits INT,
  IN p_department_id INT,
  IN p_semester INT,
  IN p_capacity INT,
  IN p_slot VARCHAR(20),
  IN p_faculty VARCHAR(150),
  IN p_course_type VARCHAR(20),
  IN p_elective_slot VARCHAR(20),
  IN p_max_choices INT
)
BEGIN
  INSERT INTO COURSE (Course_ID, Course_Name, Credits, Department_ID, Semester, Status, Capacity, Slot, Faculty, Course_Type, Elective_Slot, Max_Choices)
  VALUES (p_course_id, p_course_name, p_credits, p_department_id, p_semester, 'active', p_capacity, p_slot, p_faculty, p_course_type, p_elective_slot, p_max_choices);
END$$

DROP PROCEDURE IF EXISTS sp_update_course$$
CREATE PROCEDURE sp_update_course(
  IN p_course_id VARCHAR(50),
  IN p_course_name VARCHAR(150), IN p_set_course_name TINYINT,
  IN p_credits INT, IN p_set_credits TINYINT,
  IN p_department_id INT, IN p_set_department_id TINYINT,
  IN p_semester INT, IN p_set_semester TINYINT,
  IN p_capacity INT, IN p_set_capacity TINYINT,
  IN p_slot VARCHAR(20), IN p_set_slot TINYINT,
  IN p_faculty VARCHAR(150), IN p_set_faculty TINYINT,
  IN p_status VARCHAR(20), IN p_set_status TINYINT,
  IN p_course_type VARCHAR(20), IN p_set_course_type TINYINT,
  IN p_elective_slot VARCHAR(20), IN p_set_elective_slot TINYINT,
  IN p_max_choices INT, IN p_set_max_choices TINYINT
)
BEGIN
  UPDATE COURSE
  SET
    Course_Name = CASE WHEN p_set_course_name = 1 THEN p_course_name ELSE Course_Name END,
    Credits = CASE WHEN p_set_credits = 1 THEN p_credits ELSE Credits END,
    Department_ID = CASE WHEN p_set_department_id = 1 THEN p_department_id ELSE Department_ID END,
    Semester = CASE WHEN p_set_semester = 1 THEN p_semester ELSE Semester END,
    Capacity = CASE WHEN p_set_capacity = 1 THEN p_capacity ELSE Capacity END,
    Slot = CASE WHEN p_set_slot = 1 THEN p_slot ELSE Slot END,
    Faculty = CASE WHEN p_set_faculty = 1 THEN p_faculty ELSE Faculty END,
    Status = CASE WHEN p_set_status = 1 THEN p_status ELSE Status END,
    Course_Type = CASE WHEN p_set_course_type = 1 THEN p_course_type ELSE Course_Type END,
    Elective_Slot = CASE WHEN p_set_elective_slot = 1 THEN p_elective_slot ELSE Elective_Slot END,
    Max_Choices = CASE WHEN p_set_max_choices = 1 THEN p_max_choices ELSE Max_Choices END
  WHERE Course_ID = p_course_id;

  SELECT ROW_COUNT() AS affected_rows;
END$$

DROP PROCEDURE IF EXISTS sp_get_course_students$$
CREATE PROCEDURE sp_get_course_students(IN p_course_id VARCHAR(50))
BEGIN
  SELECT
    s.Roll_No as roll_no,
    s.Name as name,
    s.Email as email,
    s.CGPA as cgpa,
    s.Status as status,
    e.Status as enrollment_status,
    e.Enrollment_Date as enrollment_date
  FROM ENROLLMENT e
  JOIN STUDENT s ON e.STUDENT_Roll_No = s.Roll_No
  WHERE e.COURSE_Course_ID = p_course_id
  ORDER BY
    CASE
      WHEN e.Status = 'allotted' THEN 1
      WHEN e.Status = 'waitlisted' THEN 2
      ELSE 3
    END,
    e.Enrollment_Date ASC;
END$$

DROP PROCEDURE IF EXISTS sp_delete_course$$
CREATE PROCEDURE sp_delete_course(IN p_course_id VARCHAR(50))
BEGIN
  DELETE FROM COURSE WHERE Course_ID = p_course_id;
  SELECT ROW_COUNT() AS affected_rows;
END$$

DROP PROCEDURE IF EXISTS sp_get_preferences_by_student$$
CREATE PROCEDURE sp_get_preferences_by_student(IN p_roll_no VARCHAR(50))
BEGIN
  SELECT STUDENT_Roll_No, COURSE_Course_ID, `Rank`
  FROM PREFERENCE
  WHERE STUDENT_Roll_No = p_roll_no
  ORDER BY `Rank`;
END$$

DROP PROCEDURE IF EXISTS sp_get_course_basic_by_id$$
CREATE PROCEDURE sp_get_course_basic_by_id(IN p_course_id VARCHAR(50))
BEGIN
  SELECT Course_ID, Course_Name, Credits, Faculty, Slot, Course_Type, Elective_Slot, Max_Choices
  FROM COURSE
  WHERE Course_ID = p_course_id;
END$$

DROP PROCEDURE IF EXISTS sp_get_courses_by_ids_json$$
CREATE PROCEDURE sp_get_courses_by_ids_json(IN p_ids_list VARCHAR(2000))
BEGIN
  -- p_ids_list: comma-separated course IDs (e.g. 'CS101,CS102')
  SELECT Course_ID
  FROM COURSE
  WHERE FIND_IN_SET(Course_ID, p_ids_list) > 0;
END$$

DROP PROCEDURE IF EXISTS sp_delete_preferences_by_student$$
CREATE PROCEDURE sp_delete_preferences_by_student(IN p_roll_no VARCHAR(50))
BEGIN
  DELETE FROM PREFERENCE WHERE STUDENT_Roll_No = p_roll_no;
END$$

DROP PROCEDURE IF EXISTS sp_insert_preference$$
CREATE PROCEDURE sp_insert_preference(IN p_roll_no VARCHAR(50), IN p_course_id VARCHAR(50), IN p_rank INT)
BEGIN
  INSERT INTO PREFERENCE (STUDENT_Roll_No, COURSE_Course_ID, `Rank`)
  VALUES (p_roll_no, p_course_id, p_rank);
END$$

DROP PROCEDURE IF EXISTS sp_get_enrollments_by_student$$
CREATE PROCEDURE sp_get_enrollments_by_student(IN p_roll_no VARCHAR(50))
BEGIN
  SELECT
    e.COURSE_Course_ID,
    e.Status,
    e.Enrollment_Date,
    c.Course_Name,
    c.Credits,
    c.Department_ID,
    c.Semester,
    c.Faculty,
    c.Slot,
    c.Capacity,
    c.Course_Type,
    c.Elective_Slot,
    c.Max_Choices
  FROM ENROLLMENT e
  JOIN COURSE c ON e.COURSE_Course_ID = c.Course_ID
  WHERE e.STUDENT_Roll_No = p_roll_no
  ORDER BY e.Enrollment_Date DESC;
END$$

DROP PROCEDURE IF EXISTS sp_check_enrollment_exists$$
CREATE PROCEDURE sp_check_enrollment_exists(IN p_roll_no VARCHAR(50), IN p_course_id VARCHAR(50))
BEGIN
  SELECT COUNT(*) AS cnt
  FROM ENROLLMENT
  WHERE STUDENT_Roll_No = p_roll_no AND COURSE_Course_ID = p_course_id;
END$$

DROP PROCEDURE IF EXISTS sp_delete_enrollment$$
CREATE PROCEDURE sp_delete_enrollment(IN p_roll_no VARCHAR(50), IN p_course_id VARCHAR(50))
BEGIN
  DELETE FROM ENROLLMENT WHERE STUDENT_Roll_No = p_roll_no AND COURSE_Course_ID = p_course_id;
  SELECT ROW_COUNT() AS affected_rows;
END$$

DROP PROCEDURE IF EXISTS sp_load_preferences_with_cgpa$$
CREATE PROCEDURE sp_load_preferences_with_cgpa()
BEGIN
  SELECT
    p.STUDENT_Roll_No as roll_no,
    s.CGPA as cgpa,
    p.COURSE_Course_ID as course_id,
    p.`Rank` as `rank`,
    c.Course_Type as course_type,
    c.Elective_Slot as elective_slot
  FROM PREFERENCE p
  JOIN STUDENT s ON p.STUDENT_Roll_No = s.Roll_No
  JOIN COURSE c ON p.COURSE_Course_ID = c.Course_ID
  WHERE s.Status = 'active'
  ORDER BY s.CGPA DESC, p.`Rank` ASC;
END$$

DROP PROCEDURE IF EXISTS sp_get_course_capacities$$
CREATE PROCEDURE sp_get_course_capacities()
BEGIN
  SELECT Course_ID as course_id, Capacity as capacity
  FROM COURSE
  WHERE Status = 'active';
END$$

DROP PROCEDURE IF EXISTS sp_clear_enrollments$$
CREATE PROCEDURE sp_clear_enrollments()
BEGIN
  DELETE FROM ENROLLMENT;
END$$

DROP PROCEDURE IF EXISTS sp_insert_enrollment$$
CREATE PROCEDURE sp_insert_enrollment(IN p_roll_no VARCHAR(50), IN p_course_id VARCHAR(50), IN p_status VARCHAR(20))
BEGIN
  INSERT INTO ENROLLMENT (STUDENT_Roll_No, COURSE_Course_ID, Status)
  VALUES (p_roll_no, p_course_id, p_status);
END$$

DROP PROCEDURE IF EXISTS sp_approve_student_by_email$$
CREATE PROCEDURE sp_approve_student_by_email(IN p_email VARCHAR(150))
BEGIN
  UPDATE STUDENT SET Status = 'active' WHERE Email = p_email;
  SELECT ROW_COUNT() AS affected_rows;
END$$

DROP PROCEDURE IF EXISTS sp_seed_department$$
CREATE PROCEDURE sp_seed_department(IN p_department_name VARCHAR(100))
BEGIN
  INSERT IGNORE INTO DEPARTMENT (Department_Name) VALUES (p_department_name);
END$$

DROP PROCEDURE IF EXISTS sp_seed_course$$
CREATE PROCEDURE sp_seed_course(
  IN p_course_id VARCHAR(50),
  IN p_course_name VARCHAR(150),
  IN p_credits INT,
  IN p_department_name VARCHAR(100),
  IN p_semester INT,
  IN p_capacity INT,
  IN p_slot VARCHAR(20),
  IN p_faculty VARCHAR(150)
)
BEGIN
  DECLARE v_department_id INT DEFAULT NULL;

  SELECT Department_ID
    INTO v_department_id
  FROM DEPARTMENT
  WHERE Department_Name = p_department_name;

  INSERT INTO COURSE (Course_ID, Course_Name, Credits, Department_ID, Semester, Status, Capacity, Slot, Faculty)
  VALUES (p_course_id, p_course_name, p_credits, v_department_id, p_semester, 'active', p_capacity, p_slot, p_faculty)
  ON DUPLICATE KEY UPDATE Course_Name = p_course_name, Capacity = p_capacity;
END$$

DROP PROCEDURE IF EXISTS sp_seed_admin$$
CREATE PROCEDURE sp_seed_admin(IN p_name VARCHAR(150), IN p_email VARCHAR(150), IN p_password VARCHAR(255))
BEGIN
  INSERT INTO ADMIN (Name, Email, Password)
  VALUES (p_name, p_email, p_password)
  ON DUPLICATE KEY UPDATE Name = p_name, Password = p_password;
END$$

DROP PROCEDURE IF EXISTS sp_clear_all_data$$
CREATE PROCEDURE sp_clear_all_data()
BEGIN
  SET FOREIGN_KEY_CHECKS = 0;
  TRUNCATE TABLE COURSE_REQUEST;
  TRUNCATE TABLE ENROLLMENT;
  TRUNCATE TABLE PREFERENCE;
  TRUNCATE TABLE ADM_IN_ACCESS;
  TRUNCATE TABLE COURSE;
  TRUNCATE TABLE STUDENT;
  TRUNCATE TABLE ADMIN;
  TRUNCATE TABLE DEPARTMENT;
  SET FOREIGN_KEY_CHECKS = 1;
END$$

-- Course Request Procedures
DROP PROCEDURE IF EXISTS sp_submit_course_request$$
CREATE PROCEDURE sp_submit_course_request(IN p_roll_no VARCHAR(50), IN p_course_id VARCHAR(50))
BEGIN
  DECLARE v_exists INT DEFAULT 0;
  
  -- Check if request already pending
  SELECT COUNT(*) INTO v_exists FROM COURSE_REQUEST 
  WHERE STUDENT_Roll_No = p_roll_no AND COURSE_Course_ID = p_course_id AND Status = 'pending';
  
  IF v_exists > 0 THEN
    SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Request already exists for this course';
  END IF;
  
  -- Check if already enrolled
  SELECT COUNT(*) INTO v_exists FROM ENROLLMENT 
  WHERE STUDENT_Roll_No = p_roll_no AND COURSE_Course_ID = p_course_id;
  
  IF v_exists > 0 THEN
    SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Student already enrolled in this course';
  END IF;
  
  INSERT INTO COURSE_REQUEST (STUDENT_Roll_No, COURSE_Course_ID, Status)
  VALUES (p_roll_no, p_course_id, 'pending');
END$$

DROP PROCEDURE IF EXISTS sp_get_pending_requests$$
CREATE PROCEDURE sp_get_pending_requests()
BEGIN
  SELECT 
    cr.Request_ID,
    cr.STUDENT_Roll_No,
    s.Name as student_name,
    s.Email as student_email,
    cr.COURSE_Course_ID,
    c.Course_Name,
    c.Credits,
    c.Faculty,
    c.Slot,
    cr.Request_Date,
    cr.Status
  FROM COURSE_REQUEST cr
  JOIN STUDENT s ON cr.STUDENT_Roll_No = s.Roll_No
  JOIN COURSE c ON cr.COURSE_Course_ID = c.Course_ID
  WHERE cr.Status = 'pending'
  ORDER BY cr.Request_Date DESC;
END$$

DROP PROCEDURE IF EXISTS sp_approve_course_request$$
CREATE PROCEDURE sp_approve_course_request(IN p_request_id INT, IN p_admin_id INT)
BEGIN
  DECLARE v_roll_no VARCHAR(50);
  DECLARE v_course_id VARCHAR(50);
  DECLARE v_exists INT DEFAULT 0;
  
  -- Get request details
  SELECT STUDENT_Roll_No, COURSE_Course_ID INTO v_roll_no, v_course_id
  FROM COURSE_REQUEST WHERE Request_ID = p_request_id;
  
  IF v_roll_no IS NULL THEN
    SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Request not found';
  END IF;
  
  -- Check if already enrolled
  SELECT COUNT(*) INTO v_exists FROM ENROLLMENT 
  WHERE STUDENT_Roll_No = v_roll_no AND COURSE_Course_ID = v_course_id;
  
  IF v_exists > 0 THEN
    SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Student already enrolled in this course';
  END IF;
  
  -- Enroll student as allotted
  INSERT INTO ENROLLMENT (STUDENT_Roll_No, COURSE_Course_ID, Status)
  VALUES (v_roll_no, v_course_id, 'allotted');
  
  -- Update request status
  UPDATE COURSE_REQUEST 
  SET Status = 'approved', Approval_Date = NOW(), Approved_By = p_admin_id
  WHERE Request_ID = p_request_id;
END$$

DROP PROCEDURE IF EXISTS sp_reject_course_request$$
CREATE PROCEDURE sp_reject_course_request(IN p_request_id INT, IN p_admin_id INT, IN p_reason VARCHAR(500))
BEGIN
  DECLARE v_roll_no VARCHAR(50);
  
  -- Get request details
  SELECT STUDENT_Roll_No INTO v_roll_no
  FROM COURSE_REQUEST WHERE Request_ID = p_request_id;
  
  IF v_roll_no IS NULL THEN
    SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Request not found';
  END IF;
  
  -- Update request status
  UPDATE COURSE_REQUEST 
  SET Status = 'rejected', Approval_Date = NOW(), Approved_By = p_admin_id, Reason = p_reason
  WHERE Request_ID = p_request_id;
END$$

DROP PROCEDURE IF EXISTS sp_allot_compulsory_course$$
CREATE PROCEDURE sp_allot_compulsory_course(IN p_course_id VARCHAR(50), IN p_admin_id INT)
BEGIN
  DECLARE done INT DEFAULT FALSE;
  DECLARE v_roll_no VARCHAR(50);
  DECLARE v_exists INT DEFAULT 0;
  
  DECLARE cur CURSOR FOR 
    SELECT Roll_No FROM STUDENT WHERE Status = 'active'
    AND Department_ID = (SELECT Department_ID FROM COURSE WHERE Course_ID = p_course_id);
  
  DECLARE CONTINUE HANDLER FOR NOT FOUND SET done = TRUE;
  
  OPEN cur;
  
  loop_label: LOOP
    FETCH cur INTO v_roll_no;
    IF done THEN
      LEAVE loop_label;
    END IF;
    
    -- Check if student already enrolled
    SELECT COUNT(*) INTO v_exists FROM ENROLLMENT 
    WHERE STUDENT_Roll_No = v_roll_no AND COURSE_Course_ID = p_course_id;
    
    IF v_exists = 0 THEN
      -- Enroll student as allotted
      INSERT INTO ENROLLMENT (STUDENT_Roll_No, COURSE_Course_ID, Status)
      VALUES (v_roll_no, p_course_id, 'allotted');
    END IF;
  END LOOP;
  
  CLOSE cur;
END$$

DROP PROCEDURE IF EXISTS sp_get_student_allotted_courses$$
CREATE PROCEDURE sp_get_student_allotted_courses(IN p_roll_no VARCHAR(50))
BEGIN
  SELECT
    e.COURSE_Course_ID,
    e.Status,
    e.Enrollment_Date,
    c.Course_Name,
    c.Credits,
    c.Faculty,
    c.Slot,
    c.Capacity,
    c.Course_Type,
    c.Course_ID
  FROM ENROLLMENT e
  JOIN COURSE c ON e.COURSE_Course_ID = c.Course_ID
  WHERE e.STUDENT_Roll_No = p_roll_no AND e.Status = 'allotted'
  ORDER BY c.Course_Type DESC, c.Course_Name ASC;
END$$

DROP PROCEDURE IF EXISTS sp_get_available_courses_for_request$$
CREATE PROCEDURE sp_get_available_courses_for_request(IN p_roll_no VARCHAR(50))
BEGIN
  DECLARE v_semester INT;
  DECLARE v_department_id INT;
  
  -- Get student's semester and department
  SELECT Semester, Department_ID INTO v_semester, v_department_id
  FROM STUDENT WHERE Roll_No = p_roll_no;
  
  -- Get courses available for request (those not already enrolled/requested)
  SELECT
    c.Course_ID,
    c.Course_Name,
    c.Credits,
    c.Faculty,
    c.Slot,
    c.Capacity,
    c.Course_Type,
    (SELECT COUNT(*) FROM ENROLLMENT WHERE COURSE_Course_ID = c.Course_ID AND Status = 'allotted') as allotted_count
  FROM COURSE c
  WHERE c.Status = 'active'
    AND c.Semester = v_semester
    AND c.Department_ID = v_department_id
    AND c.Course_ID NOT IN (
      SELECT COURSE_Course_ID FROM ENROLLMENT WHERE STUDENT_Roll_No = p_roll_no
      UNION
      SELECT COURSE_Course_ID FROM COURSE_REQUEST WHERE STUDENT_Roll_No = p_roll_no AND Status = 'pending'
    )
  ORDER BY c.Course_Type DESC, c.Course_Name ASC;
END$$

DELIMITER ;

