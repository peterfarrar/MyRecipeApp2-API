const mongoose = require('mongoose');
const validator = require('validator');

let RecipeSchema = new mongoose.Schema({
    title: {
        type: String,
        required: true,
        trim: true,
        minlength: 2,
        unique: true,
    },
    recipeName: {
        type: String,
        required: true,
        trim: true,
        minlength: 2,
    },
    author: {
        type: String,
        required: true,
        trim: true,
        minlength: 2,
    },
    date: {
        type: String,
        required: true,
        trim: true,
    },
    descriptions: [{
        type: String
    }],
    ingredients: [{
        type: String
    }],
    steps: [{
        type: String
    }],
    _creator: {
        type: mongoose.Schema.Types.ObjectId,
        required: true
    }
});

RecipeSchema.pre('save', function (next) {
    let recipe = this;

    let recipeObject = recipe.toObject();

    next();
});

let Recipe = mongoose.model('Recipe', RecipeSchema);

module.exports = { Recipe };
