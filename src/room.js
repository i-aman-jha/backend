const mongoose = require("mongoose");
const Message = require("./models/message");
const Group = require("./models/group");
const User = require("./models/user");

module.exports = (io) => {
    io.on("connection", (socket) => {
        const userId = socket.handshake.query.userId;
        const groupId = socket.handshake.query.groupId;

        console.log(`User ${userId} connected`);
        console.log(`Received userId: ${userId}, groupId: ${groupId}`);

        // Validate the userId and groupId
        Promise.all([User.findById(userId), Group.findById(groupId)])
            .then(([user, group]) => {
                if (!user) {
                    console.error(`User ${userId} not found`);
                    return;
                }

                if (!group) {
                    console.error(`Group ${groupId} not found`);
                    return;
                }

                // Check database connection
                if (!mongoose.connection.readyState) {
                    console.error("Database not connected");
                    return;
                }

                // User joins the group room
                socket.join(groupId);
                console.log(`User ${userId} joined group ${groupId}`);

                // Listen for a new message in the group
                socket.on("chat message", async (data) => {
                    console.log("Received data:", data);

                    const { content, user, group, timestamp } = data;

                    try {
                        // Validate ObjectId conversion
                        const validUserId = mongoose.Types.ObjectId(user._id);
                        const validGroupId = mongoose.Types.ObjectId(group._id);

                        // Create and save the message
                        const newMessage = new Message({
                            content,
                            user: validUserId,
                            group: validGroupId,
                            timestamp: timestamp || new Date(),
                        });

                        const savedMessage = await newMessage.save();
                        console.log("Message saved successfully:", savedMessage);

                        // Emit the message to the group
                        io.to(groupId).emit("chat message", savedMessage);
                    } catch (err) {
                        console.error("Error processing chat message:", err.message);
                    }
                });

                // Handle user disconnection
                socket.on("disconnect", () => {
                    console.log(`User ${userId} disconnected`);
                });
            })
            .catch((error) => {
                console.error("Error validating user or group:", error);
            });
    });
};
