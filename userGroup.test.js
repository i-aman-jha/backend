const mongoose = require("mongoose");
const User = require("./src/models/user"); // Path to your User model
const Group = require("./src/models/group"); // Path to your Group model

describe("User Creation and Group Membership", () => {
    beforeAll(async () => {
        // Connect to the test database
        await mongoose.connect("mongodb://localhost:27017/anonymonous_backend", {
            useNewUrlParser: true,
            useUnifiedTopology: true,
        });

        // Clear existing data
        await User.deleteMany({});
        await Group.deleteMany({});
    });

    afterAll(async () => {
        // Disconnect from the database
        await mongoose.disconnect();
    });

    test("Should add a new user to all groups upon creation", async () => {
        // Step 1: Create mock groups
        const groups = [
            { name: "Group 1" },
            { name: "Group 2" },
            { name: "Group 3" },
        ];
        const createdGroups = await Group.insertMany(groups);

        // Step 2: Create a new user
        const userData = {
            email: "testuser@example.com",
            password: "securepassword",
            name: "Test User",
        };

        const newUser = new User(userData);
        await newUser.save(); // Trigger the pre-save hook

        // Step 3: Verify the user's ID is in all groups
        const updatedGroups = await Group.find({}); // Fetch all groups
        updatedGroups.forEach(group => {
            const isUserInGroup = group.members.some(member => 
                member.equals(newUser._id)
            );
            expect(isUserInGroup).toBe(true); // Assertion
        });
    });
});
