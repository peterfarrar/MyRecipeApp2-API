let mongoose = require('mongoose');
mongoose.Promise = global.Promise;

let mongoUrl = process.env.MONGODB_URI;
mongoose.connect(mongoUrl, {useNewUrlParser: true});

module.exports = { mongoose };
