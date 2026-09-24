const express = require('express');
const router = express.Router();
const { authenticate, authorize } = require('../middleware/auth');
const { listMarks, createMark, updateMark, deleteMark } = require('../controllers/marksController');

router.use(authenticate, authorize('teacher', 'admin'));

router.get('/', listMarks);
router.post('/', createMark);
router.put('/:id', updateMark);
router.delete('/:id', deleteMark);

module.exports = router;
