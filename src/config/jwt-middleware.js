const { Strategy: JwtStrategy, ExtractJwt } = require('passport-jwt');
const User = require('../models/user');

const opts = {
    jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
    secretOrKey: 'chitransh_key' 
};

const passportAuth = (passport) => {
    passport.use(new JwtStrategy(opts, async (jwt_payload, done) => {
        try {
            const user = await User.findById(jwt_payload.id);
            if (!user) {
                return done(null, false);
            }
            return done(null, user);
        } catch (error) {
            console.error("Error in JWT strategy:", error);
            return done(error, false);
        }
    }));
};

module.exports = passportAuth;
