const bcrypt = require('bcryptjs');
const pool = require('../config/db');

async function fetchFullUser(userId) {
  const [[user]] = await pool.query(
    'SELECT id, name, email, role, phone, address, created_at FROM users WHERE id = ?',
    [userId]
  );
  if (!user) return null;

  if (user.role === 'student') {
    const [[profile]] = await pool.query(
      'SELECT roll_number, class_name, date_of_birth, guardian_name FROM student_profiles WHERE user_id = ?',
      [userId]
    );
    return { ...user, ...profile };
  }

  if (user.role === 'teacher') {
    const [[profile]] = await pool.query(
      'SELECT employee_id, subject_specialization, department FROM teacher_profiles WHERE user_id = ?',
      [userId]
    );
    return { ...user, ...profile };
  }

  return user;
}

// GET /api/users/me — any logged-in user
async function getMe(req, res) {
  const user = await fetchFullUser(req.user.id);
  if (!user) return res.status(404).json({ message: 'User not found' });
  res.json(user);
}

// PUT /api/users/me — any logged-in user edits their own profile.
// Role and email cannot be changed here (role changes are admin-only, email stays stable).
async function updateMe(req, res) {
  try {
    const userId = req.user.id;
    const { name, phone, address, password } = req.body;

    const fields = [];
    const values = [];
    if (name) {
      fields.push('name = ?');
      values.push(name);
    }
    if (phone !== undefined) {
      fields.push('phone = ?');
      values.push(phone);
    }
    if (address !== undefined) {
      fields.push('address = ?');
      values.push(address);
    }
    if (password) {
      if (password.length < 6) {
        return res.status(400).json({ message: 'Password must be at least 6 characters' });
      }
      fields.push('password = ?');
      values.push(await bcrypt.hash(password, 10));
    }

    if (fields.length > 0) {
      values.push(userId);
      await pool.query(`UPDATE users SET ${fields.join(', ')} WHERE id = ?`, values);
    }

    if (req.user.role === 'student') {
      const { className, dateOfBirth, guardianName } = req.body;
      const profileFields = [];
      const profileValues = [];
      if (className !== undefined) {
        profileFields.push('class_name = ?');
        profileValues.push(className);
      }
      if (dateOfBirth !== undefined) {
        profileFields.push('date_of_birth = ?');
        profileValues.push(dateOfBirth);
      }
      if (guardianName !== undefined) {
        profileFields.push('guardian_name = ?');
        profileValues.push(guardianName);
      }
      if (profileFields.length > 0) {
        profileValues.push(userId);
        await pool.query(
          `UPDATE student_profiles SET ${profileFields.join(', ')} WHERE user_id = ?`,
          profileValues
        );
      }
    }

    if (req.user.role === 'teacher') {
      const { subjectSpecialization, department } = req.body;
      const profileFields = [];
      const profileValues = [];
      if (subjectSpecialization !== undefined) {
        profileFields.push('subject_specialization = ?');
        profileValues.push(subjectSpecialization);
      }
      if (department !== undefined) {
        profileFields.push('department = ?');
        profileValues.push(department);
      }
      if (profileFields.length > 0) {
        profileValues.push(userId);
        await pool.query(
          `UPDATE teacher_profiles SET ${profileFields.join(', ')} WHERE user_id = ?`,
          profileValues
        );
      }
    }

    const updated = await fetchFullUser(userId);
    res.json(updated);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Failed to update profile' });
  }
}

// ---- Admin-only user management ----

// GET /api/admin/users
async function adminListUsers(req, res) {
  const { role } = req.query;
  let query = 'SELECT id, name, email, role, phone, created_at FROM users';
  const params = [];
  if (role) {
    query += ' WHERE role = ?';
    params.push(role);
  }
  query += ' ORDER BY created_at DESC';
  const [rows] = await pool.query(query, params);
  res.json(rows);
}

// GET /api/admin/users/:id
async function adminGetUser(req, res) {
  const user = await fetchFullUser(req.params.id);
  if (!user) return res.status(404).json({ message: 'User not found' });
  res.json(user);
}

// POST /api/admin/users — admin creates a student, teacher, or another admin
async function adminCreateUser(req, res) {
  try {
    const { name, email, password, role, phone, address } = req.body;
    if (!name || !email || !password || !role) {
      return res.status(400).json({ message: 'Name, email, password and role are required' });
    }
    if (!['student', 'teacher', 'admin'].includes(role)) {
      return res.status(400).json({ message: 'Invalid role' });
    }

    const [existing] = await pool.query('SELECT id FROM users WHERE email = ?', [email]);
    if (existing.length > 0) {
      return res.status(409).json({ message: 'An account with this email already exists' });
    }

    const hashed = await bcrypt.hash(password, 10);
    const conn = await pool.getConnection();
    try {
      await conn.beginTransaction();
      const [result] = await conn.query(
        'INSERT INTO users (name, email, password, role, phone, address) VALUES (?, ?, ?, ?, ?, ?)',
        [name, email, hashed, role, phone || null, address || null]
      );

      if (role === 'student') {
        const { rollNumber, className, dateOfBirth, guardianName } = req.body;
        await conn.query(
          'INSERT INTO student_profiles (user_id, roll_number, class_name, date_of_birth, guardian_name) VALUES (?, ?, ?, ?, ?)',
          [result.insertId, rollNumber || null, className || null, dateOfBirth || null, guardianName || null]
        );
      } else if (role === 'teacher') {
        const { employeeId, subjectSpecialization, department } = req.body;
        await conn.query(
          'INSERT INTO teacher_profiles (user_id, employee_id, subject_specialization, department) VALUES (?, ?, ?, ?)',
          [result.insertId, employeeId || null, subjectSpecialization || null, department || null]
        );
      }

      await conn.commit();
      const created = await fetchFullUser(result.insertId);
      res.status(201).json(created);
    } catch (err) {
      await conn.rollback();
      throw err;
    } finally {
      conn.release();
    }
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Failed to create user' });
  }
}

// PUT /api/admin/users/:id — admin can edit anything, including role
async function adminUpdateUser(req, res) {
  try {
    const userId = req.params.id;
    const [[existing]] = await pool.query('SELECT * FROM users WHERE id = ?', [userId]);
    if (!existing) return res.status(404).json({ message: 'User not found' });

    const { name, email, password, role, phone, address } = req.body;
    const fields = [];
    const values = [];
    if (name) {
      fields.push('name = ?');
      values.push(name);
    }
    if (email) {
      fields.push('email = ?');
      values.push(email);
    }
    if (role && ['student', 'teacher', 'admin'].includes(role)) {
      fields.push('role = ?');
      values.push(role);
    }
    if (phone !== undefined) {
      fields.push('phone = ?');
      values.push(phone);
    }
    if (address !== undefined) {
      fields.push('address = ?');
      values.push(address);
    }
    if (password) {
      fields.push('password = ?');
      values.push(await bcrypt.hash(password, 10));
    }

    if (fields.length > 0) {
      values.push(userId);
      await pool.query(`UPDATE users SET ${fields.join(', ')} WHERE id = ?`, values);
    }

    const effectiveRole = role || existing.role;
    if (effectiveRole === 'student') {
      const { rollNumber, className, dateOfBirth, guardianName } = req.body;
      const hasProfileFields =
        rollNumber !== undefined || className !== undefined || dateOfBirth !== undefined || guardianName !== undefined;
      if (hasProfileFields) {
        await pool.query(
          `INSERT INTO student_profiles (user_id, roll_number, class_name, date_of_birth, guardian_name)
           VALUES (?, ?, ?, ?, ?)
           ON DUPLICATE KEY UPDATE
             roll_number = COALESCE(VALUES(roll_number), roll_number),
             class_name = COALESCE(VALUES(class_name), class_name),
             date_of_birth = COALESCE(VALUES(date_of_birth), date_of_birth),
             guardian_name = COALESCE(VALUES(guardian_name), guardian_name)`,
          [userId, rollNumber || null, className || null, dateOfBirth || null, guardianName || null]
        );
      }
    } else if (effectiveRole === 'teacher') {
      const { employeeId, subjectSpecialization, department } = req.body;
      const hasProfileFields = employeeId !== undefined || subjectSpecialization !== undefined || department !== undefined;
      if (hasProfileFields) {
        await pool.query(
          `INSERT INTO teacher_profiles (user_id, employee_id, subject_specialization, department)
           VALUES (?, ?, ?, ?)
           ON DUPLICATE KEY UPDATE
             employee_id = COALESCE(VALUES(employee_id), employee_id),
             subject_specialization = COALESCE(VALUES(subject_specialization), subject_specialization),
             department = COALESCE(VALUES(department), department)`,
          [userId, employeeId || null, subjectSpecialization || null, department || null]
        );
      }
    }

    const updated = await fetchFullUser(userId);
    res.json(updated);
  } catch (err) {
    console.error(err);
    if (err.code === 'ER_DUP_ENTRY') {
      return res.status(409).json({ message: 'Email or roll number already in use' });
    }
    res.status(500).json({ message: 'Failed to update user' });
  }
}

// DELETE /api/admin/users/:id
async function adminDeleteUser(req, res) {
  const userId = req.params.id;
  if (Number(userId) === req.user.id) {
    return res.status(400).json({ message: 'You cannot delete your own account' });
  }
  const [result] = await pool.query('DELETE FROM users WHERE id = ?', [userId]);
  if (result.affectedRows === 0) {
    return res.status(404).json({ message: 'User not found' });
  }
  res.json({ message: 'User deleted' });
}

module.exports = {
  fetchFullUser,
  getMe,
  updateMe,
  adminListUsers,
  adminGetUser,
  adminCreateUser,
  adminUpdateUser,
  adminDeleteUser,
};
