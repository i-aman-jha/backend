const User = require('../models/user');
const CrudRepository = require('./crud_repository');

class UserRepository extends CrudRepository {
    constructor() {
        super(User);
    }

    async findBy(data) {
        try {
            const response = await User.findOne(data);
            return response;
        } catch (error) {
            console.log("Something went wrong in UserRepository during findBy.");
            throw error;
        }
    }
}

module.exports = UserRepository;
