const fs = require('fs');
const path = require('path');

const outputFile = path.join(__dirname, 'seed-test-data.sql');
const stream = fs.createWriteStream(outputFile);

function w(query) {
    stream.write(query + '\n');
}

function esc(str) {
    if (str === null || str === undefined) return 'NULL';
    if (typeof str === 'number') return str;
    // escape single quotes
    return "'" + String(str).replace(/'/g, "''") + "'";
}

function chunkedInsert(table, columns, rows, chunkSize = 100) {
    if (rows.length === 0) return;
    for (let i = 0; i < rows.length; i += chunkSize) {
        const chunk = rows.slice(i, i + chunkSize);
        const values = chunk.map(row => `(${row.map(esc).join(', ')})`).join(',\n');
        w(`REPLACE INTO ${table} (${columns.join(', ')}) VALUES \n${values};`);
    }
}

function randomInt(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

function randomItem(arr) {
    return arr[randomInt(0, arr.length - 1)];
}

function randomDate(start, end) {
    return new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime())).toISOString().split('T')[0];
}

console.log('Generating seed data script...');
w('-- ==========================================');
w('-- AUTO GENERATED TEST DATA SEED SCRIPT');
w('-- ==========================================');
w('SET FOREIGN_KEY_CHECKS = 0;'); // Disable FK checks temporarily for robust seeding

// Data Generation Parameters
const NUM_DEPTS = 15;
const NUM_MAJORS = 40;
const NUM_CLASSES = 80;
const NUM_INSTRUCTORS = 150;
const NUM_COURSES = 120;
const NUM_STUDENTS = 1200; // ensures > 100 pages
const NUM_GRADES = 2500; // ensures > 100 pages
const NUM_NOTIFICATIONS = 80;

const defaultPasswordHash = '$2a$10$TE7Zp9LxeSt/l5RHiUhtP.x5Itd9cA3.CGhEoZ0.WGqZXSo0A71Pu'; // 'password' in bcrypt

// 1. Departments
const departments = [];
const deptNames = ['Công nghệ thông tin', 'An toàn thông tin', 'Điện tử viễn thông', 'Cơ bản', 'Kinh tế', 'Đa phương tiện', 'Marketing', 'Tài chính', 'Kế toán', 'Quản trị kinh doanh', 'Luật', 'Ngôn ngữ Anh', 'Công nghệ sinh học', 'Toán học', 'Vật lý'];
for (let i = 0; i < NUM_DEPTS; i++) {
    departments.push([i + 1, `D${(i+1).toString().padStart(2, '0')}`, `Khoa ${deptNames[i] || 'Test ' + i}`, 'Mô tả khoa']);
}
chunkedInsert('departments', ['id', 'code', 'name', 'description'], departments);

// 2. Majors
const majors = [];
for (let i = 0; i < NUM_MAJORS; i++) {
    const deptId = (i % NUM_DEPTS) + 1;
    majors.push([i + 1, `M${(i+1).toString().padStart(3, '0')}`, `Ngành ${i+1}`, deptId, 145, 4]);
}
chunkedInsert('majors', ['id', 'code', 'name', 'department_id', 'total_credits', 'duration_years'], majors);

// 3. Classes
const classes = [];
for (let i = 0; i < NUM_CLASSES; i++) {
    const majorId = (i % NUM_MAJORS) + 1;
    const deptId = majors[majorId - 1][3];
    // Create classes with duplicate names for Search test
    const className = (i === 10 || i === 11) ? 'D21CQCN01-B' : `D${20 + (i%4)}CQ-${i}`; 
    classes.push([i + 1, `C${(i+1).toString().padStart(3, '0')}`, className, deptId, majorId, `20${20 + (i%4)}-20${24 + (i%4)}`, null, 0, 0, i % 5 === 0 ? 'Đã tốt nghiệp' : 'Đang học']);
}
// Edge case: Class with no students (Last 5 classes)
chunkedInsert('classes', ['id', 'class_code', 'name', 'department_id', 'major_id', 'academic_year', 'advisor_id', 'total_students', 'avg_gpa', 'status'], classes);

// 4. Users (for instructors + students)
const users = [];
let userIdCounter = 1;

// Admin user
users.push([userIdCounter++, 'admin', defaultPasswordHash, 'admin', 1]);

// 5. Instructors
const instructors = [];
for (let i = 0; i < NUM_INSTRUCTORS; i++) {
    const uId = userIdCounter++;
    const instructorCode = `GV${(i+1).toString().padStart(4, '0')}`;
    users.push([uId, instructorCode, defaultPasswordHash, 'instructor', 1]);
    
    const deptId = (i % NUM_DEPTS) + 1;
    const status = i < 10 ? 'Đã nghỉ' : (i < 20 ? 'Nghỉ phép' : 'Đang dạy'); // assigned & unassigned
    instructors.push([i + 1, instructorCode, `Giảng Viên ${i+1}`, `gv${i+1}@ptit.edu.vn`, `098${randomInt(1000000, 9999999)}`, null, deptId, 'Giảng viên', 'Thạc sĩ', status, 4.5, randomInt(100, 500), uId]);
}
chunkedInsert('instructors', ['id', 'instructor_code', 'full_name', 'email', 'phone', 'avatar', 'department_id', 'academic_rank', 'degree', 'status', 'rating', 'total_teaching_hours', 'user_id'], instructors);

// 6. Courses
const courses = [];
for (let i = 0; i < NUM_COURSES; i++) {
    const deptId = (i % NUM_DEPTS) + 1;
    const instrId = (i % NUM_INSTRUCTORS) + 1;
    let courseName = `Môn học ${i+1}`;
    // Edge case: Unusually long course name
    if (i === 5) courseName = 'Môn học cực kỳ dài và có nhiều thông tin không cần thiết để kiểm tra giao diện có bị vỡ hay không khi hiển thị trên màn hình nhỏ hoặc phân trang';
    
    const status = i < 20 ? 'Đã đóng' : 'Đang mở'; // unused vs used
    courses.push([i + 1, `SUBJ${(i+1).toString().padStart(3, '0')}`, courseName, randomInt(2, 4), deptId, instrId, 'Mô tả môn học', 'Bắt buộc', 150, 0, status, 'Học kỳ 1']);
}
chunkedInsert('courses', ['id', 'course_code', 'name', 'credits', 'department_id', 'instructor_id', 'description', 'type', 'max_students', 'current_students', 'status', 'semester'], courses);

// 7. Students (with Users)
const students = [];
const studentStatuses = ['Đang học', 'Chờ duyệt', 'Bảo lưu', 'Tạm nghỉ', 'Đã tốt nghiệp', 'Bị đuổi'];
const firstNames = ['Nguyễn', 'Trần', 'Lê', 'Phạm', 'Hoàng', 'Huỳnh', 'Phan', 'Vũ', 'Võ', 'Đặng', 'Bùi', 'Đỗ', 'Hồ', 'Ngô', 'Dương', 'Lý'];
const middleNames = ['Văn', 'Thị', 'Hoàng', 'Minh', 'Thanh', 'Đức', 'Hữu', 'Ngọc', 'Quốc', 'Tuấn', 'Hải', 'Xuân'];
const lastNames = ['Anh', 'Tuấn', 'Minh', 'Hải', 'Hùng', 'Linh', 'Lan', 'Hoa', 'Phương', 'Nam', 'Trang', 'Hương', 'Cường', 'Khang', 'Bình'];

for (let i = 0; i < NUM_STUDENTS; i++) {
    const isNoRelatedData = i >= NUM_STUDENTS - 20; // Last 20 students have NO grades/tuitions
    
    // Duplicate names for search testing
    let fName = (i === 10 || i === 11) ? 'Nguyễn' : randomItem(firstNames);
    let mName = (i === 10 || i === 11) ? 'Văn' : randomItem(middleNames);
    let lName = (i === 10 || i === 11) ? 'Nam' : randomItem(lastNames);
    const fullName = `${fName} ${mName} ${lName}`;
    
    const uId = userIdCounter++;
    const studentCode = `B21DCCN${(i+1).toString().padStart(3, '0')}`;
    users.push([uId, studentCode, defaultPasswordHash, 'student', 1]);
    
    const classIdx = isNoRelatedData ? 75 : (i % 70); // Put in class
    const classData = classes[classIdx];
    const classId = classData[0];
    const deptId = classData[3];
    const majorId = classData[4];
    
    let status = randomItem(studentStatuses);
    if (i < 50) status = 'Chờ duyệt'; // new
    if (i >= 50 && i < 100) status = 'Bảo lưu';
    if (i >= 100 && i < 150) status = 'Đã tốt nghiệp';
    if (i >= 150 && i < 200) status = 'Bị đuổi';
    if (i >= 200 && i < 800) status = 'Đang học';
    
    students.push([
        i + 1, uId, studentCode, fullName, randomDate(new Date(1999, 0, 1), new Date(2003, 11, 31)),
        randomItem(['Nam', 'Nữ']), 'Kinh', 'Không', `0${randomInt(10000000000, 99999999999)}`,
        '2020-01-01', 'Hà Nội', null, `${studentCode.toLowerCase()}@stu.ptit.edu.vn`, `test${i}@gmail.com`,
        `09${randomInt(10000000, 99999999)}`, 'Hà Nội', 'Hà Nội', deptId, majorId, classId, '2021-09-01',
        'Chính quy', status, 0.00, 0, randomItem([2, 3, 4, 5, 6, 7])
    ]);
}
chunkedInsert('users', ['id', 'username', 'password', 'role', 'is_active'], users);
chunkedInsert('students', ['id', 'user_id', 'student_code', 'full_name', 'date_of_birth', 'gender', 'ethnicity', 'religion', 'id_number', 'id_issue_date', 'id_issue_place', 'avatar', 'email', 'personal_email', 'phone', 'permanent_address', 'current_address', 'department_id', 'major_id', 'class_id', 'enrollment_date', 'training_system', 'status', 'gpa', 'total_credits', 'cohort_id'], students);

// 8. Grades & Registrations
const grades = [];
const registrations = [];
const registeredSet = new Set();

let gradeId = 1;
let regId = 1;

for (let i = 0; i < NUM_GRADES; i++) {
    // Leave some students without grades
    const studentId = randomInt(1, NUM_STUDENTS - 50);
    const courseId = randomInt(1, NUM_COURSES - 10);
    const semester = `HK${(i%2)+1}-2023`;
    
    const regKey = `${studentId}_${courseId}_${semester}`;
    if (registeredSet.has(regKey)) continue; // prevent duplicate grades
    registeredSet.add(regKey);
    
    // Edge cases for scores
    let final_score = (Math.random() * 10).toFixed(1);
    if (i % 50 === 0) final_score = 0; // 0
    if (i % 50 === 1) final_score = 10; // 10
    if (i % 50 === 2) final_score = 3.9; // failed
    if (i % 50 === 3) final_score = 4.0; // border pass
    if (i % 50 === 4) final_score = null; // null
    
    const avg_score = final_score === null ? null : parseFloat(final_score);
    let gpa = null;
    let letter_grade = null;
    
    if (avg_score !== null) {
        if (avg_score < 3.95) { gpa = 0.0; letter_grade = 'F'; }
        else if (avg_score < 4.95) { gpa = 1.0; letter_grade = 'D'; }
        else if (avg_score < 5.45) { gpa = 1.5; letter_grade = 'D+'; }
        else if (avg_score < 6.45) { gpa = 2.0; letter_grade = 'C'; }
        else if (avg_score < 6.95) { gpa = 2.5; letter_grade = 'C+'; }
        else if (avg_score < 7.95) { gpa = 3.0; letter_grade = 'B'; }
        else if (avg_score < 8.45) { gpa = 3.5; letter_grade = 'B+'; }
        else if (avg_score < 8.95) { gpa = 3.7; letter_grade = 'A'; }
        else { gpa = 4.0; letter_grade = 'A+'; }
    }
    
    registrations.push([regId++, studentId, courseId, semester, 'Đã xác nhận']);
    
    grades.push([
        gradeId++, studentId, courseId, semester,
        final_score === null ? null : 10, final_score, final_score, avg_score, letter_grade, gpa, 'Đã duyệt', 1
    ]);
}
chunkedInsert('registrations', ['id', 'student_id', 'course_id', 'semester', 'status'], registrations);
chunkedInsert('grades', ['id', 'student_id', 'course_id', 'semester', 'attendance_score', 'midterm_score', 'final_score', 'average_score', 'letter_grade', 'gpa_score', 'status', 'approved_by'], grades);

// 9. Tuitions
const tuitions = [];
for (let i = 0; i < NUM_STUDENTS - 20; i++) {
    const studentId = i + 1;
    let status = 'Chưa thanh toán';
    let paidAmount = 0;
    const totalAmount = 15000000;
    
    if (i % 4 === 0) {
        status = 'Đã thanh toán';
        paidAmount = totalAmount;
    } else if (i % 4 === 1) {
        status = 'Thanh toán một phần';
        paidAmount = 5000000;
    }
    
    // Test multiple debt
    tuitions.push([i*2 + 1, studentId, 'HK1-2023', 15, 450000, totalAmount, 0, paidAmount, totalAmount - paidAmount, status, 'Bank', null, '2023-12-31']);
    if (i % 10 === 0) {
        tuitions.push([i*2 + 2, studentId, 'HK2-2023', 15, 450000, totalAmount, 0, 0, totalAmount, 'Chưa thanh toán', null, null, '2024-05-31']);
    }
}
chunkedInsert('tuitions', ['id', 'student_id', 'semester', 'total_credits', 'credit_fee', 'total_amount', 'discount', 'paid_amount', 'remaining', 'status', 'payment_method', 'payment_date', 'deadline'], tuitions);

// 10. Notifications
const notifications = [];
for (let i = 0; i < NUM_NOTIFICATIONS; i++) {
    notifications.push([
        i + 1, `Thông báo số ${i+1}`, `Nội dung thông báo vô cùng quan trọng ${i+1}. Chú ý đóng học phí!`,
        randomItem(['Thông báo chung', 'Đăng ký học', 'Học phí', 'Điểm số', 'Sự kiện']),
        randomItem(['Quan trọng', 'Lưu ý', 'Thường']),
        'all', 1
    ]);
}
chunkedInsert('notifications', ['id', 'title', 'content', 'type', 'priority', 'target_role', 'created_by'], notifications);

w('UPDATE courses c SET current_students = (SELECT COUNT(*) FROM registrations r WHERE r.course_id = c.id);');

w('SET FOREIGN_KEY_CHECKS = 1;');
stream.end(() => {
    console.log('Successfully generated seed-test-data.sql');
});
