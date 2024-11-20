const UserService = require("../services/user-service");
const userService = new UserService();
const Group = require('../models/group')
const signup = async (req, res) => {
    try {
        const response = await userService.signup({
            email: req.body.email,
            password: req.body.password,
            name: req.body.name,
            avatar: req.body.avatar // Avatar included in signup
        });

        if (response.isNew) { // Assuming `isNew` is part of the response
            const allGroups = await Group.find({});
            const userId = response.userId; // Assuming `userId` is in the response

            const groupUpdatePromises = allGroups.map(group => 
                Group.findByIdAndUpdate(
                    group._id,
                    { $addToSet: { members: userId } }, // Prevent duplicates
                    { new: true }
                )
            );

            await Promise.all(groupUpdatePromises);
        }

        return res.status(201).json({
            success: true,
            message: 'Successfully created a new user',
            data: {
                userId: response.userId, // Assuming response contains userId
                token: response.token // Also include token here if available
            },
            err: {}
        });
    } catch (err) {
        console.error(err);
        return res.status(500).json({
            message: 'Something went wrong',
            data: {},
            success: false,
            err: err.message
        });
    }
};


const login = async (req, res) => {
    try {
        const {userId,token} = await userService.signin(req.body);
        return res.status(200).json({
            success: true,
            message: 'Successfully logged in',
            data: {userId,token},
            err: {}
        });
    } catch (error) {
        return res.status(500).json({
            message: 'Something went wrong',
            data: {},
            success: false,
            err: error
        });
    }
};

const getUserById = async (req, res) => {
    try {
        const user = await userService.getUserById(req.params.id);
        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found',
                data: {}
            });
        }
        return res.status(200).json({
            success: true,
            message: 'User retrieved successfully',
            data: user,
            err: {}
        });
    } catch (error) {
        return res.status(500).json({
            message: 'Something went wrong',
            data: {},
            success: false,
            err: error
        });
    }
};

// Function to update only the avatar
const updateAvatar = async (req, res) => {
  const { id } = req.params;
  const { avatar } = req.body;

  if (!avatar) {
    return res.status(400).json({ message: "Avatar is required" });
  }

  try {
    const updatedUser = await User.findByIdAndUpdate(
      id, 
      { avatar }, 
      { new: true }
    );

    if (!updatedUser) {
      return res.status(404).json({ message: "User not found" });
    }

    res.status(200).json(updatedUser);
  } catch (error) {
    console.error("Error updating avatar:", error);
    res.status(500).json({ message: "Failed to update avatar" });
  }
};


const updateUser = async (req, res) => {
    try {
        // Check if avatar is present in the request body
        const updateData = {
            avatar: req.body.avatar,  // Avatar is updated along with other user info
            name: req.body.name,
            email: req.body.email,
            password: req.body.password // Ensure you hash the password before saving
        };

        // Log the request to ensure the avatar data is being sent correctly
        console.log('Received update request for user:', req.params.id);
        console.log('Avatar:', req.body.avatar);

        // Ensure the user exists before updating
        const existingUser = await userService.getUserById(req.params.id);
        if (!existingUser) {
            return res.status(404).json({
                success: false,
                message: 'User not found',
                data: {}
            });
        }

        // Perform the update operation
        const updatedUser = await userService.updateUser(req.params.id, updateData);

        // Respond with the updated user data
        return res.status(200).json({
            success: true,
            message: 'User updated successfully',
            data: updatedUser,
            err: {}
        });
    } catch (error) {
        console.error('Error updating user:', error);
        return res.status(500).json({
            message: 'Something went wrong',
            data: {},
            success: false,
            err: error.message || error
        });
    }
};

const deleteUser = async (req, res) => {
    try {
        const result = await userService.deleteUser(req.params.id);
        if (!result) {
            return res.status(404).json({
                success: false,
                message: 'User not found',
                data: {}
            });
        }
        return res.status(200).json({
            success: true,
            message: 'User deleted successfully',
            data: {},
            err: {}
        });
    } catch (error) {
        return res.status(500).json({
            message: 'Something went wrong',
            data: {},
            success: false,
            err: error
        });
    }
};

module.exports = {
    signup,
    login,
    getUserById,
    updateUser,
    updateAvatar,  // New updateAvatar function
    deleteUser
};
