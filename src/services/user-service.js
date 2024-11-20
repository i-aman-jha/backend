const UserRepository = require('../repository/user-repository');

class UserService {
    constructor() {
        this.userRepository = new UserRepository();
    }

    async signup(data) {
        try {
            const user = await this.userRepository.create(data);
            const isNew = true; // Assuming it's always a new user if created successfully

            // Add a method to return userId and other essential fields
            return {
                userId: user._id,
                isNew,
                email: user.email,
                name: user.name,
                avatar: user.avatar
            };
        } catch (error) {
            throw new Error(error.message || 'Error in signup');
        }
    }

    async getUserById(id) {
        try {
            const user = await this.userRepository.get(id);
            if (!user) throw new Error('User not found');
            return user;
        } catch (error) {
            throw new Error(error.message || 'Error fetching user by ID');
        }
    }

    async getUserByEmail(email) {
        try {
            const user = await this.userRepository.findBy({ email });
            if (!user) throw new Error('User not found');
            return user;
        } catch (error) {
            throw new Error(error.message || 'Error fetching user by email');
        }
    }

    async updateUser(id, data) {
        try {
            const updatedUser = await this.userRepository.update(id, data);
            if (!updatedUser) throw new Error('User not found');
            return updatedUser;
        } catch (error) {
            throw new Error(error.message || 'Error updating user');
        }
    }

    async deleteUser(id) {
        try {
            const result = await this.userRepository.destroy(id);
            if (!result) throw new Error('User not found');
            return result;
        } catch (error) {
            throw new Error(error.message || 'Error deleting user');
        }
    }

    async signin(data) {
        try {
            const user = await this.getUserByEmail(data.email);
            if (!user) {
                throw new Error('No user found');
            }

            // Assuming `comparePassword` and `genJWT` are methods in your `User` model
            const isPasswordValid = await user.comparePassword(data.password);
            if (!isPasswordValid) {
                throw new Error('Incorrect password');
            }

            const token = user.genJWT();
            return {
                token,
                userId: user._id,
                email: user.email,
                name: user.name
            };
        } catch (error) {
            console.error('Signin error:', error.message);
            throw new Error(error.message || 'Error in signin');
        }
    }
}

module.exports = UserService;
