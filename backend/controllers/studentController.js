const pool = require('../config/db');
const { fetchFullUser } = require('./userController');

// GET /api/students — teacher & admin only
async function listStudents(req, res) {
  const [rows] = await pool.query(
    `SELECT u.id, u.name, u.email, u.phone, sp.roll_number, sp.class_name
     FROM users u
     LEFT JOIN student_profiles sp ON sp.user_id = u.id
     WHERE u.role = 'student'
     ORDER BY u.name ASC`
  );
  res.json(rows);
}

// GET /api/students/:id — teacher, admin, or the student themself
async function getStudent(req, res) {
  const studentId = req.params.id;

  if (req.user.role === 'student' && Number(studentId) !== req.user.id) {
    return res.status(403).json({ message: 'You can only view your own record' });
  }

  const student = await fetchFullUser(studentId);
  if (!student || student.role !== 'student') {
    return res.status(404).json({ message: 'Student not found' });
  }

  const [marks] = await pool.query(
    `SELECT m.id, m.subject, m.exam_type, m.marks_obtained, m.max_marks, m.updated_at,
            t.name AS teacher_name
     FROM marks m
     LEFT JOIN users t ON t.id = m.teacher_id
     WHERE m.student_id = ?
     ORDER BY m.updated_at DESC`,
    [studentId]
  );

  res.json({ ...student, marks });
}

// GET /api/students/me/marks — logged-in student views their own marks
async function getMyMarks(req, res) {
  const [marks] = await pool.query(
    `SELECT m.id, m.subject, m.exam_type, m.marks_obtained, m.max_marks, m.updated_at,
            t.name AS teacher_name
     FROM marks m
     LEFT JOIN users t ON t.id = m.teacher_id
     WHERE m.student_id = ?
     ORDER BY m.updated_at DESC`,
    [req.user.id]
  );
  res.json(marks);
}

module.exports = { listStudents, getStudent, getMyMarks };
