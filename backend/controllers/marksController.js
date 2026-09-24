const pool = require('../config/db');

// GET /api/marks — teacher & admin: view all students' marks
async function listMarks(req, res) {
  const { studentId, subject } = req.query;
  let query = `
    SELECT m.id, m.student_id, s.name AS student_name, m.subject, m.exam_type,
           m.marks_obtained, m.max_marks, m.updated_at, m.teacher_id, t.name AS teacher_name
    FROM marks m
    JOIN users s ON s.id = m.student_id
    LEFT JOIN users t ON t.id = m.teacher_id
    WHERE 1 = 1
  `;
  const params = [];
  if (studentId) {
    query += ' AND m.student_id = ?';
    params.push(studentId);
  }
  if (subject) {
    query += ' AND m.subject = ?';
    params.push(subject);
  }
  query += ' ORDER BY m.updated_at DESC';

  const [rows] = await pool.query(query, params);
  res.json(rows);
}

// POST /api/marks — teacher & admin: allot marks to a student
async function createMark(req, res) {
  try {
    const { studentId, subject, examType, marksObtained, maxMarks } = req.body;

    if (!studentId || !subject || marksObtained === undefined) {
      return res.status(400).json({ message: 'studentId, subject and marksObtained are required' });
    }

    const [[student]] = await pool.query('SELECT id FROM users WHERE id = ? AND role = ?', [
      studentId,
      'student',
    ]);
    if (!student) {
      return res.status(404).json({ message: 'Student not found' });
    }

    const max = maxMarks !== undefined ? Number(maxMarks) : 100;
    if (Number(marksObtained) > max) {
      return res.status(400).json({ message: 'Marks obtained cannot exceed max marks' });
    }

    const [result] = await pool.query(
      'INSERT INTO marks (student_id, teacher_id, subject, exam_type, marks_obtained, max_marks) VALUES (?, ?, ?, ?, ?, ?)',
      [studentId, req.user.id, subject, examType || 'General', marksObtained, max]
    );

    const [[created]] = await pool.query('SELECT * FROM marks WHERE id = ?', [result.insertId]);
    res.status(201).json(created);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Failed to allot marks' });
  }
}

// PUT /api/marks/:id — teacher & admin: edit marks
async function updateMark(req, res) {
  try {
    const markId = req.params.id;
    const [[existing]] = await pool.query('SELECT * FROM marks WHERE id = ?', [markId]);
    if (!existing) return res.status(404).json({ message: 'Mark record not found' });

    const { subject, examType, marksObtained, maxMarks } = req.body;
    const fields = [];
    const values = [];

    if (subject !== undefined) {
      fields.push('subject = ?');
      values.push(subject);
    }
    if (examType !== undefined) {
      fields.push('exam_type = ?');
      values.push(examType);
    }
    const effectiveMax = maxMarks !== undefined ? Number(maxMarks) : Number(existing.max_marks);
    if (maxMarks !== undefined) {
      fields.push('max_marks = ?');
      values.push(effectiveMax);
    }
    if (marksObtained !== undefined) {
      if (Number(marksObtained) > effectiveMax) {
        return res.status(400).json({ message: 'Marks obtained cannot exceed max marks' });
      }
      fields.push('marks_obtained = ?');
      values.push(marksObtained);
    }
    fields.push('teacher_id = ?');
    values.push(req.user.id);

    values.push(markId);
    await pool.query(`UPDATE marks SET ${fields.join(', ')} WHERE id = ?`, values);

    const [[updated]] = await pool.query('SELECT * FROM marks WHERE id = ?', [markId]);
    res.json(updated);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Failed to update marks' });
  }
}

// DELETE /api/marks/:id — teacher & admin
async function deleteMark(req, res) {
  const [result] = await pool.query('DELETE FROM marks WHERE id = ?', [req.params.id]);
  if (result.affectedRows === 0) {
    return res.status(404).json({ message: 'Mark record not found' });
  }
  res.json({ message: 'Mark record deleted' });
}

module.exports = { listMarks, createMark, updateMark, deleteMark };
