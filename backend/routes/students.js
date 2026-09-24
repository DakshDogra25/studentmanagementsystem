const express = require('express');
const router = express.Router();
const { authenticate, authorize } = require('../middleware/auth');
const { listStudents, getStudent, getMyMarks } = require('../controllers/studentController');

router.use(authenticate);

router.get('/me/marks', authorize('student'), getMyMarks);
router.get('/', authorize('teacher', 'admin'), listStudents);
router.get('/:id', authorize('student', 'teacher', 'admin'), getStudent);

module.exports = router;
