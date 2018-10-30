require('./config/config');

// load required packages
const _ = require('lodash');
const express = require('express');
const bodyParser = require('body-parser');
const {ObjectID} = require('mongodb');
//const bcrypt = require('bcryptjs');

// load custom packages
let {mongoose} = require('./db/mongoose');
let {Recipe} = require('./models/recipe');
let {User} = require('./models/user');
let {authenticate} = require('./middleware/authenticate');

let app = express();
const portNumber = process.env.PORT;

app.use(bodyParser.json());

// recipes routes
app.post('/recipes', authenticate, (req, res) => {
    let recipe = new Recipe({
        title: req.body.title,
        recipeName: req.body.recipeName,
        author: req.body.author,
        date: req.body.date,
        descriptions: req.body.descriptions,
        ingredients: req.body.ingredients,
        steps: req.body.steps,
        _creator: req.user._id
    });

    recipe.save().then((doc) => {
        res.send(doc);
    }, (e) => {
        res.status(400).send(e);
    });
});

app.get('/recipes', authenticate, (req, res) => {
    Recipe.find({
        _creator: req.user._id
    }).then( (recipes) => {
        res.send({recipes});
    }, (e) => {
        res.status(400).send(e);
    });

});

app.get('/recipes/:id', authenticate, (req, res) => {
    let id = req.params.id;

    if (!ObjectID.isValid(id)) {
        return res.status(404).send({});
    }

    Recipe.findOne({
        _id: id,
        _creator: req.user._id
    }).then((recipe) => {
        if (!recipe) {
            return res.status(404).send({});
        }

        res.status(200).send({recipe});
    }).catch((e) => res.status(400).send());
});

app.delete('/recipes/:id', authenticate, (req, res) => {
    let id = req.params.id;

    if (!ObjectID.isValid(id)) {
        return res.status(404).send({});
    }

    Recipe.findOneAndRemove({
        _id: id,
        _creator: req.user._id
    }).then((recipe) => {
        if (!recipe) {
            return res.status(404).send({});
        }

        res.status(200).send({recipe});
    }).catch((e) => res.status(400).send());
});

app.patch('/recipes/:id', authenticate, (req, res) => {
    let id = req.params.id;
    let body = _.pick(req.body, ['text', 'completed']);

    if (!ObjectID.isValid(id)) {
        return res.status(404).send({});
    }

    if (_.isBoolean(body.completed) && body.completed) {
        body.completedAt = new Date().getTime();
    } else {
        body.completed = false;
        body.completedAt = null;
    }

    Recipe.findOneAndUpdate({_id: id, _creator: req.user._id}, {$set: body}, {new: true}).then((recipe) => {
        if (!recipe) {
            return res.status(404).send();
        }

        res.send({recipe});
    }).catch(() => {
        res.status(400).send();
    });
});

// users routes
app.post('/users', (req, res) => {
    let user = new User(_.pick(req.body, ['name', 'email', 'password']));

    user.save().then(() => {
        return user.generateAuthToken();
    }).then((token) => {
        res.header('x-auth', token).send(user);
    }).catch((e) => { res.status(400).send(e); });
});

app.post('/users/login', (req, res) => {
    let {name, email, password} = _.pick(req.body, ['name', 'email', 'password']);

    User.findByCredentials(email, password).then((user) => {
        return user.generateAuthToken().then((token) => {
            res.header('x-auth', token).send(user);
        });
    }).catch((e) => {
        res.status(400).send();
    });
});

app.get('/users/me', authenticate, (req, res) => {
    res.send(req.user);
});

app.delete('/users/me/token', authenticate, (req, res) => {
    req.user.removeToken(req.token).then(() => {
        res.status(200).send();
    }, () => {
        res.status(400).send();
    });
});

// run it
app.listen(portNumber, () => {
    console.log(`Server started on port ${portNumber}`);
});

// export for test suite
module.exports = {app};
