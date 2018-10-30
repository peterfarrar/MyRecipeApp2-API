const {ObjectID} = require('mongodb');
const jwt = require('jsonwebtoken');

const {Recipe} = require('./../../models/recipe');
const {User} = require('./../../models/user');

const userIds = [ new ObjectID(), new ObjectID() ];
 
const users = [{
    _id: userIds[0],
    name: 'Peter Farrar',
    email: 'peter.h.farrar@gmail.com',
    password: 'PeterFarrar1',
    tokens: [{
        access: 'auth',
        token: jwt.sign({_id: userIds[0], access: 'auth'}, 'process.env.JWT_SECRET').toString()
    }]
}, {
    _id: userIds[1],
    name: 'Rick Montalban',
    email: 'mr_rourke@fantsyisland.com',
    password: 'mrR@urk3',
    tokens: [{
        access: 'auth',
        token: jwt.sign({_id: userIds[1], access: 'auth'}, 'process.env.JWT_SECRET').toString()
    }]
}];

const recipes = [{
    _id: new ObjectID(),
    title: "Toast",
    recipeName: "Toast",
    author: "Peter Farrar",
    date: "07/10/2017",
    descriptions: [" Everyone should know how to use toast.  I recommend using a toaster, but a toaster oven, an oven, a stove top, an outdoor grill, a fireplace, a firepit... any god head source can do it."],
    ingredients: ["1 slice bread"],
    steps: ["Heat bread until it reaches desired doneness."],
    _creator: userIds[0]
},
{
    _id: new ObjectID(),
    title: "Cold Beer",
    recipeName: "Cold Beer",
    author: "Tim",
    date: "07/11/2017",
    descriptions: ["A tasty glass of cold beer!"],
    ingredients: ["glass", "beer"],
    steps: ["chill glass", "chill beer", "pour beer in glass", "drink!"],
    _creator: userIds[1]
}];

const populateUsers = (done) => {
    User.deleteMany({}).then(() => {
        let userPromises = [new User(users[0]).save(), new User(users[1]).save()];

        return Promise.all(userPromises);
    }).then(() => done());
};

const populateRecipes = (done) => {
    Recipe.deleteMany({}).then(() => {
        return Recipe.insertMany(recipes);
    }).then(() => done());
};

module.exports = {recipes, populateRecipes, users, populateUsers};
