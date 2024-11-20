const express = require('express');
const cors = require('cors');
const http = require('http');
const path = require('path'); // For handling paths
const { connect } = require('./config/database'); // Database connection function
const passport = require('passport');
const passportAuth = require('./config/jwt-middleware'); 
const apiRoutes = require('./routes/auth-routes');
const { Server } = require("socket.io");
const mongoose = require('mongoose');
const axios = require('axios');
// Import your models
const Message = require('./models/message');
const Group = require('./models/group');
const User = require('./models/user');

const app = express();

// CORS configuration
const corsOptions = {
    origin: 'http://localhost:3000', // Allow only your frontend's origin
    methods: ['GET', 'POST'], // Allow these methods
    credentials: true // Allow credentials (if needed)
};

app.use(cors(corsOptions));

const server = http.createServer(app);
const io = new Server(server, {
    cors: corsOptions // Apply CORS options to Socket.IO
});

app.use(express.static('public')); 
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(express.static(path.join(__dirname, 'public')));
app.use('/uploads', express.static('uploads'));
app.use(passport.initialize());

passportAuth(passport); 
app.use('/api', apiRoutes);

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'app.html')); // Serve the app HTML file
});

// Socket.IO connection handling
io.on('connection', (socket) => {
    console.log(`A user connected: ${socket.id}`); // Log socket ID

    socket.on('join group', async (groupId) => {
        try {
            // Validate the groupId
            const validGroupId = new mongoose.Types.ObjectId(groupId);
            const groupExists = await Group.findById(validGroupId);
            if (!groupExists) {
                console.error(`Group with ID ${groupId} does not exist.`);
                return;
            }
    
            console.log(`User ${socket.id} joined group: ${groupId}`);
            socket.join(groupId); // Add the user to the group's room
    
            // Fetch and emit previous messages for the group
            const messages = await Message.find({ group: validGroupId })
                .populate('user', 'name') // Optional: Populate user name
                .sort({ timestamp: 1 }); // Sort messages by timestamp
    
            socket.emit('previous messages', messages); // Send messages to the client
        } catch (err) {
            console.error('Error during join group:', err.message);
        }
    });
    

    socket.on('disconnect', () => {
        console.log(`A user disconnected: ${socket.id}`);
    });

    socket.on('chat message', async (data) => {
        console.log('Message received:', data);
    
        const { content, user, group, timestamp } = data;
    
        try {
            const response = await axios.post('http://localhost:5001/check-toxicity', { message: content });
            const { allowed, reason, score } = response.data;

            // If the message is not allowed, send a blocked message feedback
            if (!allowed) {
                socket.emit('messageBlocked', { reason, score });
                console.log('Message blocked due to toxicity');
                return; // Prevent further processing of the toxic message
            }
            const validUserId = new mongoose.Types.ObjectId(user._id);
            const validGroupId = new mongoose.Types.ObjectId(group._id);
    
            // Check if the group exists
            const groupExists = await Group.findById(validGroupId);
            if (!groupExists) {
                console.error(`Group with ID ${group._id} does not exist.`);
                return;
            }
    
            // Fetch the latest user details
            const userDetails = await User.findById(validUserId, 'name');
            if (!userDetails) {
                console.error(`User with ID ${user._id} not found.`);
                return;
            }
    
            // Save the message to MongoDB
            const newMessage = new Message({
                content,
                user: validUserId,
                group: validGroupId,
                timestamp: timestamp || new Date(),
            });
    
            const savedMessage = await newMessage.save();
            console.log('Message saved successfully:', savedMessage);
    
            // Broadcast the message to the group with the latest user data
            io.to(validGroupId.toString()).emit('chat message', {
                _id: savedMessage._id,
                content: savedMessage.content,
                user: {
                    _id: savedMessage.user,
                    name: userDetails.name, // Updated user name
                },
                group: savedMessage.group,
                timestamp: savedMessage.timestamp,
            });
        } catch (err) {
            console.error('Error saving message:', err.message);
        }
    });
    
    
});

const { PORT } = require('./config/server_config');

server.listen(PORT, async () => {
    console.log(`Server started on PORT: ${PORT}`);
    try {
        await connect();
        console.log('MongoDB connected');
    } catch (error) {
        console.error('Failed to connect to MongoDB:', error);
        process.exit(1);
    }
});
