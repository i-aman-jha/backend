const express = require('express');
const { signup, login, getUserById, updateUser , deleteUser  } = require('../controllers/auth_controller');
const { addUserToGroup } = require('../controllers/group_controller');
const Message = require('../models/message');
const Group = require("../models/group");
const passport = require("passport");
const multer = require('multer');
const Comment = require('../models/comment');
const Post = require('../models/post');
const Assignment = require('../models/assignment'); // Import your Assignment model
const Submission = require('../models/submission')
const mongoose = require('mongoose');
const User = require('../models/user')

const router = express.Router();

// Configure multer for file uploads
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'uploads/'); // Directory for storing uploaded files
    },
    filename: (req, file, cb) => {
        cb(null, Date.now() + '-' + file.originalname); // Unique file name
    }
});
const upload = multer({ storage }); // Create a single multer instance

// Auth routes
router.post('/signup', signup);
router.post('/login', login);

// Group routes
router.post('/groups/:groupId/add-user', async (req, res) => {
    const { userId } = req.body;
    const { groupId } = req.params;
    
    const result = await addUserToGroup(groupId, userId);
    return res.status(result.success ? 200 : 400).json(result);
});

router.post("/join-group/:groupId", passport.authenticate("jwt", { session: false }), async (req, res) => {
    try {
        const { groupId } = req.params;
        const userId = req.user.id;
        
        await Group.findByIdAndUpdate(groupId, { $addToSet: { members: userId } });
        res.json({ message: "Joined group successfully" });
    } catch (error) {
        console.error("Error joining group:", error);
        res.status(500).json({ error: "Error joining group" });
    }
});

router.get('/groups/:userId', async (req, res) => {
    try {
        const groups = await Group.find({ members: req.params.userId })
            .select('name description') 
            .sort('name'); 

        res.json(groups);
    } catch (error) {
        console.error('Error fetching user groups:', error);
        res.status(500).json({ error: 'Error fetching user groups' });
    }
});

// Message routes
router.get('/messages/:groupId', async (req, res) => {
    try {
        const groupId = new mongoose.Types.ObjectId(req.params.groupId); 
        const messages = await Message.find({ group: groupId })
            .populate('user', 'name')  
            .sort({ timestamp: 'asc' }); 

        if (!messages.length) {
            return res.status(404).json({ error: 'No messages found for this group.' });
        }

        res.json(messages);
    } catch (error) {
        console.error('Error fetching messages:', error);
        res.status(500).json({ error: 'Error fetching messages' });
    }
});

// Blog routes
router.post('/posts', upload.single('image'), async (req, res) => {
    try {
        const post = new Post({
            title: req.body.title,
            description: req.body.description,
            image: req.file.path,
        });
        await post.save();
        res.status(201).json(post);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// User routes
router.get('/user', passport.authenticate('jwt', { session: false }), async (req, res) => {
    try {
        const user = await User.findById(req.user._id);
        if (!user) {
            return res.status(404).json({ error: "User  not found" });
        }
        res.json(user);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Error fetching user info" });
    }
});

// Fetch all blog posts
router.get('/posts', async (req, res) => {
    try {
        const posts = await Post.find().populate('comments');
        res.status( 200).json(posts);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Like a post
router.post('/posts/:id/like', async (req, res) => {
    try {
        const post = await Post.findById(req.params.id);
        post.likes += 1;
        await post.save();
        res.status(200).json(post);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Comment on a post
router.post('/comments', async (req, res) => {
    try {
        const { content, postId } = req.body;
        const post = await Post.findById(postId);
        
        const comment = new Comment({ content, postId });
        await comment.save();
        
        post.comments.push(comment);
        await post.save();
        
        res.status(201).json(comment);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Assignment routes
router.post('/assignments', upload.single('file'), async (req, res) => {
  try {
    const { title, description, dueDate, professorId } = req.body;
    
    // Create a new assignment with the provided data
    const assignment = new Assignment({
        title,
        description,
        file: req.file.path,
        dueDate,
        professorId
    });

    // Save the assignment to the database
    await assignment.save();

    // Return the newly created assignment
    res.status(201).json(assignment);
} catch (error) {
    res.status(500).json({ message: 'Error creating assignment', error });
}

});

// Get all assignments
router.get('/assignments', async (req, res) => {
    const assignments = await Assignment.find().populate('professorId', 'name');
    res.json(assignments);
});

// Submit an assignment (for students)
router.post('/assignments/submit', upload.single('file'), async (req, res) => {
  try {
      // Check if a file was uploaded
      if (!req.file) {
          console.log('No file uploaded');
          return res.status(400).json({ message: 'No file uploaded' });
      }

      const { assignmentId, studentId } = req.body;
      console.log('Assignment ID:', assignmentId);
      console.log('Student ID:', studentId);
      console.log('Uploaded file path:', req.file.path);

      // Check if the assignment exists
      const assignment = await Assignment.findById(assignmentId);
      if (!assignment) {
          console.log('Assignment not found');
          return res.status(404).json({ message: 'Assignment not found' });
      }

      // Check if the student exists
      const student = await User.findById(studentId);
      if (!student) {
          console.log('Student not found');
          return res.status(404).json({ message: 'Student not found' });
      }

      // Create a new submission
      const submission = new Submission({
          assignmentId,
          studentId,
          file: req.file.path
      });

      // Save the submission to the database
      await submission.save();
      console.log('Submission saved:', submission);

      // Respond with the saved submission
      res.status(201).json(submission);

  } catch (error) {
      console.error('Error submitting assignment:', error);
      res.status(500).json({ message: 'Error submitting assignment', error });
  }
});


// User management routes
router.get('/:id', getUserById);
router.put('/:id', updateUser );
router.delete('/:id', deleteUser );

module.exports = router;