const mongoose = require('mongoose')

module.exports = {
    connect : async()=>{
        await mongoose.connect('mongodb://localhost/anonymonous_backend');
    }
}
