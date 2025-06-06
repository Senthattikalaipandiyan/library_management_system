const express = require('express');
const multer = require('multer');
const path = require('path');
const Book = require('../models/Book');
const verifyUser = require('../middleware/verifyUser');
const { isValidId } = require('../utils/validation');

const router = express.Router();

// ================= Multer Config ===================
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, 'uploads/'),
  filename: (req, file, cb) => cb(null, Date.now() + path.extname(file.originalname)),
});
const upload = multer({ storage });

// ================ Add Book (Admin Only) ================
router.post('/add', verifyUser, upload.single('image'), async (req, res) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ message: 'Only admins can add books' });
  }

  const { name, writer, journals } = req.body;
  const imageUrl = req.file ? `/uploads/${req.file.filename}` : '';

  if (!name || !writer || !journals) {
    return res.status(400).json({ message: 'All fields are required' });
  }

  try {
    const book = new Book({ name, writer, journals, imageUrl });
    await book.save();
    res.status(201).json({ message: 'Book added', book });
  } catch (err) {
    res.status(500).json({ message: 'Error saving book', error: err.message });
  }
});

// ================ Get All Books =====================
router.get('/', async (req, res) => {
  try {
    const books = await Book.find();
    res.json(books);
  } catch (err) {
    res.status(500).json({ message: 'Error fetching books' });
  }
});

// ================ Delete Book (Admin Only) ============
router.delete('/delete/:id', verifyUser, async (req, res) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ message: 'Only admins can delete books' });
  }

  const id = req.params.id;
  if (!isValidId(id)) {
    return res.status(400).json({ message: 'Invalid book ID' });
  }

  try {
    const deleted = await Book.findByIdAndDelete(id);
    if (!deleted) return res.status(404).json({ message: 'Book not found' });
    res.json({ message: 'Book deleted successfully' });
  } catch (err) {
    res.status(500).json({ message: 'Error deleting book' });
  }
});

// ================ Update Book (Admin Only) =============
router.put('/update/:id', verifyUser, upload.single('image'), async (req, res) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ message: 'Only admins can update books' });
  }

  const id = req.params.id;
  if (!isValidId(id)) {
    return res.status(400).json({ message: 'Invalid book ID' });
  }

  const { name, writer, journals } = req.body;
  const update = {};
  if (name) update.name = name;
  if (writer) update.writer = writer;
  if (journals) update.journals = journals;
  if (req.file) update.imageUrl = `/uploads/${req.file.filename}`;

  if (Object.keys(update).length === 0) {
    return res.status(400).json({ message: 'No data to update' });
  }

  try {
    const updatedBook = await Book.findByIdAndUpdate(id, update, { new: true });
    if (!updatedBook) return res.status(404).json({ message: 'Book not found' });
    res.json({ message: 'Book updated successfully', book: updatedBook });
  } catch (err) {
    res.status(500).json({ message: 'Error updating book', error: err.message });
  }
});

// ================ Add Comment ========================
router.post('/:id/comments', verifyUser, async (req, res) => {
  const { id } = req.params;
  const { username, text, date } = req.body;

  if (!isValidId(id)) return res.status(400).json({ message: 'Invalid book ID' });
  if (!username || !text || !date) {
    return res.status(400).json({ message: 'All comment fields required' });
  }

  try {
    const book = await Book.findById(id);
    if (!book) return res.status(404).json({ message: 'Book not found' });

    book.comments = book.comments || [];
    book.comments.push({ username, text, date });
    await book.save();

    res.json({ message: 'Comment added successfully' });
  } catch (err) {
    res.status(500).json({ message: 'Error adding comment' });
  }
});

// ================ Get Comments =======================
router.get('/:id/comments', verifyUser, async (req, res) => {
  const { id } = req.params;

  if (!isValidId(id)) return res.status(400).json({ message: 'Invalid book ID' });

  try {
    const book = await Book.findById(id);
    if (!book) return res.status(404).json({ message: 'Book not found' });

    res.json(book.comments || []);
  } catch (err) {
    res.status(500).json({ message: 'Error fetching comments' });
  }
});

module.exports = router;
