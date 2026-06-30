-- database/schema.sql

-- =============================================
-- DATABASE: PTIT Student Management System
-- =============================================

CREATE DATABASE IF NOT EXISTS ptit_student_management
CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

USE ptit_student_management;

-- =============================================
-- 1. DEPARTMENTS (Khoa)
-- =============================================
CREATE TABLE departments (
    id INT PRIMARY KEY AUTO_INCREMENT,
    code VARCHAR(20) NOT NULL UNIQUE,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- =============================================
-- 2. MAJORS (Ngành học)
-- =============================================
CREATE TABLE majors (
    id INT PRIMARY KEY AUTO_INCREMENT,
    code VARCHAR(20) NOT NULL UNIQUE,
    name VARCHAR(100) NOT NULL,
    department_id INT NOT NULL,
    total_credits INT DEFAULT 145,
    duration_years INT DEFAULT 4,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (department_id) REFERENCES departments(id)
);

-- =============================================
-- 3. USERS (Tài khoản đăng nhập)
-- =============================================
CREATE TABLE users (
    id INT PRIMARY KEY AUTO_INCREMENT,
    username VARCHAR(50) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    role ENUM('admin', 'student', 'instructor') NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    last_login DATETIME,
    refresh_token TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- =============================================
-- 4. STUDENTS (Sinh viên)
-- =============================================
CREATE TABLE students (
    id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT UNIQUE,
    student_code VARCHAR(20) NOT NULL UNIQUE,
    
    -- Thông tin cá nhân
    full_name VARCHAR(100) NOT NULL,
    date_of_birth DATE,
    gender ENUM('Nam', 'Nữ', 'Khác'),
    ethnicity VARCHAR(50) DEFAULT 'Kinh',
    religion VARCHAR(50) DEFAULT 'Không',
    id_number VARCHAR(20),
    id_issue_date DATE,
    id_issue_place VARCHAR(255),
    avatar VARCHAR(255),
    
    -- Thông tin liên hệ
    email VARCHAR(100),
    personal_email VARCHAR(100),
    phone VARCHAR(20),
    permanent_address TEXT,
    current_address TEXT,
    
    -- Thông tin học tập
    department_id INT,
    major_id INT,
    class_id INT,
    cohort_id INT,
    academic_year VARCHAR(20),
    enrollment_date DATE,
    training_system ENUM('Chính quy', 'Vừa học vừa làm') DEFAULT 'Chính quy',
    status ENUM('Đang học', 'Chờ duyệt', 'Bảo lưu', 'Tạm nghỉ', 'Đã tốt nghiệp', 'Bị đuổi') DEFAULT 'Chờ duyệt',
    gpa DECIMAL(3,2) DEFAULT 0.00,
    total_credits INT DEFAULT 0,
    
    -- Thông tin gia đình
    father_name VARCHAR(100),
    father_phone VARCHAR(20),
    father_occupation VARCHAR(100),
    mother_name VARCHAR(100),
    mother_phone VARCHAR(20),
    mother_occupation VARCHAR(100),
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL,
    FOREIGN KEY (department_id) REFERENCES departments(id),
    FOREIGN KEY (major_id) REFERENCES majors(id)
);

-- =============================================
-- COHORTS (Khóa học)
-- =============================================
CREATE TABLE IF NOT EXISTS cohorts (
    id INT PRIMARY KEY AUTO_INCREMENT,
    code VARCHAR(20) NOT NULL UNIQUE COMMENT 'VD: K2021',
    name VARCHAR(100) NOT NULL COMMENT 'VD: Khóa 2021-2025',
    start_year INT NOT NULL,
    end_year INT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- =============================================
-- 5. INSTRUCTORS (Giảng viên)
-- =============================================
CREATE TABLE instructors (
    id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT UNIQUE,
    instructor_code VARCHAR(20) NOT NULL UNIQUE,
    full_name VARCHAR(100) NOT NULL,
    email VARCHAR(100),
    phone VARCHAR(20),
    avatar VARCHAR(255),
    department_id INT,
    academic_rank VARCHAR(50),
    degree ENUM('Cử nhân', 'Thạc sĩ', 'Tiến sĩ', 'GS/PGS') DEFAULT 'Thạc sĩ',
    status ENUM('Đang dạy', 'Nghỉ phép', 'Đã nghỉ') DEFAULT 'Đang dạy',
    rating DECIMAL(2,1) DEFAULT 0.0,
    total_teaching_hours INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    FOREIGN KEY (department_id) REFERENCES departments(id),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
);

-- =============================================
-- 6. COURSES (Môn học)
-- =============================================
CREATE TABLE courses (
    id INT PRIMARY KEY AUTO_INCREMENT,
    course_code VARCHAR(20) NOT NULL UNIQUE,
    name VARCHAR(150) NOT NULL,
    credits INT NOT NULL DEFAULT 3,
    department_id INT,
    major_id INT,
    class_id INT,
    instructor_id INT,
    description TEXT,
    type ENUM('Bắt buộc', 'Tự chọn', 'Thể chất/QP') DEFAULT 'Bắt buộc',
    max_students INT DEFAULT 150,
    current_students INT DEFAULT 0,
    status ENUM('Đang mở', 'Đã đóng') DEFAULT 'Đang mở',
    semester VARCHAR(50),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    FOREIGN KEY (department_id) REFERENCES departments(id),
    FOREIGN KEY (instructor_id) REFERENCES instructors(id)
);

-- =============================================
-- 7. CLASSES (Lớp học)
-- =============================================
CREATE TABLE classes (
    id INT PRIMARY KEY AUTO_INCREMENT,
    class_code VARCHAR(20) NOT NULL UNIQUE,
    name VARCHAR(100) NOT NULL,
    department_id INT,
    major_id INT,
    academic_year VARCHAR(20),
    advisor_id INT,
    total_students INT DEFAULT 0,
    avg_gpa DECIMAL(3,2) DEFAULT 0.00,
    status ENUM('Đang học', 'Đã tốt nghiệp') DEFAULT 'Đang học',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    FOREIGN KEY (department_id) REFERENCES departments(id),
    FOREIGN KEY (major_id) REFERENCES majors(id),
    FOREIGN KEY (advisor_id) REFERENCES instructors(id)
);

-- Add foreign key for students.class_id
ALTER TABLE students ADD FOREIGN KEY (class_id) REFERENCES classes(id);

-- =============================================
-- 8. SCHEDULES (Thời khóa biểu)
-- =============================================
CREATE TABLE schedules (
    id INT PRIMARY KEY AUTO_INCREMENT,
    course_id INT NOT NULL,
    instructor_id INT NOT NULL,
    class_id INT,
    room VARCHAR(20) NOT NULL,
    day_of_week ENUM('Thứ 2', 'Thứ 3', 'Thứ 4', 'Thứ 5', 'Thứ 6', 'Thứ 7', 'CN') NOT NULL,
    period_start INT NOT NULL,
    period_end INT NOT NULL,
    start_time TIME,
    end_time TIME,
    type ENUM('Lý thuyết', 'Thực hành') DEFAULT 'Lý thuyết',
    week_start DATE,
    week_end DATE,
    semester VARCHAR(50),
    group_number INT DEFAULT 1,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    FOREIGN KEY (course_id) REFERENCES courses(id),
    FOREIGN KEY (instructor_id) REFERENCES instructors(id),
    FOREIGN KEY (class_id) REFERENCES classes(id)
);

-- =============================================
-- 9. GRADES (Điểm số)
-- =============================================
CREATE TABLE grades (
    id INT PRIMARY KEY AUTO_INCREMENT,
    student_id INT NOT NULL,
    course_id INT NOT NULL,
    semester VARCHAR(50) NOT NULL,
    attendance_score DECIMAL(4,2),
    midterm_score DECIMAL(4,2),
    final_score DECIMAL(4,2),
    average_score DECIMAL(4,2),
    letter_grade VARCHAR(5),
    gpa_score DECIMAL(3,1),
    status ENUM('Đã duyệt', 'Chờ duyệt', 'Từ chối') DEFAULT 'Chờ duyệt',
    approved_by INT,
    approved_at DATETIME,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    FOREIGN KEY (student_id) REFERENCES students(id),
    FOREIGN KEY (course_id) REFERENCES courses(id),
    FOREIGN KEY (approved_by) REFERENCES users(id),
    UNIQUE KEY unique_grade (student_id, course_id, semester)
);

-- =============================================
-- 10. REGISTRATIONS (Đăng ký môn học)
-- =============================================
CREATE TABLE registrations (
    id INT PRIMARY KEY AUTO_INCREMENT,
    student_id INT NOT NULL,
    course_id INT NOT NULL,
    schedule_id INT,
    semester VARCHAR(50) NOT NULL,
    registered_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    status ENUM('Đã đăng ký', 'Đã hủy', 'Đã xác nhận') DEFAULT 'Đã đăng ký',
    
    FOREIGN KEY (student_id) REFERENCES students(id),
    FOREIGN KEY (course_id) REFERENCES courses(id),
    FOREIGN KEY (schedule_id) REFERENCES schedules(id),
    UNIQUE KEY unique_registration (student_id, course_id, semester)
);

-- =============================================
-- 11. TUITIONS (Học phí)
-- =============================================
CREATE TABLE tuitions (
    id INT PRIMARY KEY AUTO_INCREMENT,
    student_id INT NOT NULL,
    semester VARCHAR(50) NOT NULL,
    total_credits INT,
    credit_fee DECIMAL(10,0) DEFAULT 450000,
    total_amount DECIMAL(12,0) NOT NULL,
    discount DECIMAL(12,0) DEFAULT 0,
    paid_amount DECIMAL(12,0) DEFAULT 0,
    remaining DECIMAL(12,0) DEFAULT 0,
    status ENUM('Chưa thanh toán', 'Đã thanh toán', 'Thanh toán một phần') DEFAULT 'Chưa thanh toán',
    payment_method VARCHAR(50),
    payment_date DATETIME,
    deadline DATE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    FOREIGN KEY (student_id) REFERENCES students(id),
    UNIQUE KEY unique_tuition (student_id, semester)
);

-- =============================================
-- 12. NOTIFICATIONS (Thông báo)
-- =============================================
CREATE TABLE notifications (
    id INT PRIMARY KEY AUTO_INCREMENT,
    title VARCHAR(255) NOT NULL,
    content TEXT NOT NULL,
    type ENUM('Thông báo chung', 'Đăng ký học', 'Học phí', 'Điểm số', 'Sự kiện') DEFAULT 'Thông báo chung',
    priority ENUM('Quan trọng', 'Lưu ý', 'Thường') DEFAULT 'Thường',
    target_role ENUM('all', 'admin', 'student') DEFAULT 'all',
    created_by INT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (created_by) REFERENCES users(id)
);

-- =============================================
-- 13. NOTIFICATION_READS (Đánh dấu đã đọc)
-- =============================================
CREATE TABLE notification_reads (
    id INT PRIMARY KEY AUTO_INCREMENT,
    notification_id INT NOT NULL,
    user_id INT NOT NULL,
    read_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    is_deleted TINYINT(1) NOT NULL DEFAULT 0 COMMENT '0=visible, 1=hidden by user',
    
    FOREIGN KEY (notification_id) REFERENCES notifications(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id),
    UNIQUE KEY unique_read (notification_id, user_id),
    INDEX idx_nr_deleted (notification_id, user_id, is_deleted)
);

-- =============================================
-- 14. EVENTS (Sự kiện)
-- =============================================
CREATE TABLE events (
    id INT PRIMARY KEY AUTO_INCREMENT,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    event_date DATE NOT NULL,
    type ENUM('Sự kiện', 'Deadline', 'Thi') DEFAULT 'Sự kiện',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- =============================================
-- 15. REQUESTS (Yêu cầu từ sinh viên)
-- =============================================
CREATE TABLE requests (
    id INT PRIMARY KEY AUTO_INCREMENT,
    student_id INT NOT NULL,
    type VARCHAR(100) NOT NULL,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    status ENUM('Chờ xử lý', 'Đã duyệt', 'Từ chối') DEFAULT 'Chờ xử lý',
    processed_by INT,
    processed_at DATETIME,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (student_id) REFERENCES students(id),
    FOREIGN KEY (processed_by) REFERENCES users(id)
);

-- =============================================
-- 16. SETTINGS (Cài đặt hệ thống)
-- =============================================
CREATE TABLE settings (
    id INT PRIMARY KEY AUTO_INCREMENT,
    setting_key VARCHAR(100) NOT NULL UNIQUE,
    setting_value TEXT,
    description VARCHAR(255),
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- =============================================
-- 17. SEMESTERS (Học kỳ)
-- =============================================
CREATE TABLE semesters (
    id INT PRIMARY KEY AUTO_INCREMENT,
    code VARCHAR(20) NOT NULL UNIQUE,
    name VARCHAR(100) NOT NULL,
    start_date DATE,
    end_date DATE,
    registration_start DATE,
    registration_end DATE,
    is_current BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- =============================================
-- INDEXES
-- =============================================
CREATE INDEX idx_students_code ON students(student_code);
CREATE INDEX idx_students_status ON students(status);
CREATE INDEX idx_students_department ON students(department_id);
CREATE INDEX idx_instructors_code ON instructors(instructor_code);
CREATE INDEX idx_instructors_department ON instructors(department_id);
CREATE INDEX idx_courses_code ON courses(course_code);
CREATE INDEX idx_grades_student ON grades(student_id);
CREATE INDEX idx_grades_semester ON grades(semester);
CREATE INDEX idx_schedules_semester ON schedules(semester);
CREATE INDEX idx_notifications_type ON notifications(type);
CREATE INDEX idx_tuitions_student ON tuitions(student_id);