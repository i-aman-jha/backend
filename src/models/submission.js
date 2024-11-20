// models/submission.js
const mongoose = require('mongoose');

const SubmissionSchema = new mongoose.Schema({
    assignmentId: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'Assignment', 
        required: true 
    },
    studentId: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'User', 
        required: true 
    },
    file: { 
        type: String, 
        required: true 
    },
    submissionDate: { 
        type: Date, 
        default: Date.now 
    }
});

module.exports = mongoose.model('Submission', SubmissionSchema);
