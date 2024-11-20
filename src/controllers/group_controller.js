const Group = require('../models/group');
const mongoose = require("mongoose");

async function addUserToGroup(groupId, userId) {
    try {
        const group = await Group.findById(groupId);

        if (!group) {
            return { success: false, message: 'Group not found' };
        }

        const userObjectId = new mongoose.Types.ObjectId(userId);

        if (!group.members.includes(userObjectId)) {
            group.members.push(userObjectId);
            await group.save();
        }

        return { success: true, message: 'User added to group successfully', data: group };
    } catch (error) {
        console.error("Error adding user to group:", error);
        return { success: false, message: 'Error adding user to group' };
    }
}

module.exports = { addUserToGroup };
