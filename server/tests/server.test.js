const _ = require('lodash');
const expect = require('expect');
const request = require('supertest');
const {ObjectID} = require('mongodb');

const {app} = require('./../server');
const {Recipe} = require('./../models/recipe');
const {User} = require('./../models/user');
const {recipes, populateRecipes, users, populateUsers} = require('./seed/seed');

beforeEach(populateUsers);
beforeEach(populateRecipes);

////////////////////////////////////////////////////////////////////////////////
// /recipes tests

describe('POST /recipes', () => {
    it('should create a new recipe', (done) => {
        let recipe = {
            title: "Hard Steamed Egg",
            recipeName: "Hard Steamed Egg",
            author: "Peter",
            date: "12/16/2018",
            descriptions: ["I've struggled for years to make a decent hard boiled egg.  Inevitably the shell cracks and leaks whites into the pot, or the egg is under cooked.", "I've found that a steamed egg works much better.  12 minutes at near sea level, and I get an excellent egg everytime.  Now if I can figure out the secret to keeping the shell from sticking..."],
            ingredients: ["Egg(s)", "Ice water"],
            steps: ["In a steamer, bring about a quarter to a half inch of water to a boil", "Place egg(s) on the grate, or whatever, above the boiling water.", "Cover eggs and reduce heat until watter is at a low simmer", "After 12 minutes, remove eggs and drop into a bowl of ice water.", "Peel eggs and enjoy!"],
        };

        request(app)
            .post('/recipes')
            .set('x-auth', users[0].tokens[0].token)
            .send(recipe)
            .expect(200)
            .expect((res) => {
                let body = _.pick(res.body, ['title', 'recipeName', 'author', 'date', 'descriptions', 'ingredients', 'steps']);

                expect(recipe).toEqual(body);
            })
            .end((err,res) => {
                if (err) {
                    return done(err);
                }

                Recipe.find({recipeName: recipe.recipeName}).then( (recipes) => {
                    expect(recipes.length).toBe(1);
                    done();
                }).catch((e) => done(e));
            });
    });

    it('should not create recipe with invalid body data', (done) => {
        request(app)
            .post('/recipes')
            .set('x-auth', users[0].tokens[0].token)
            .send({})
            .expect(400)
            .end((err,res) => {
                if (err) {
                    return done(err);
                }

                Recipe.find().then( (recipes) => {
                    expect(recipes.length).toBe(2);
                    done();
                }).catch((e) => done(e));
            });
    });
});

describe('GET /recipes', () => {
    it('should get all recipes', (done) => {
        request(app)
            .get('/recipes')
            .set('x-auth', users[0].tokens[0].token)
            .expect(200)
            .expect((res) => {
                expect(res.body.recipes.length).toBe(1);
            })
            .end(done);
    });
});

describe('GET /recipes/:id', () => {
    it('should return recipe doc', (done) => {
        request(app)
            .get(`/recipes/${recipes[0]._id.toHexString()}`)
            .set('x-auth', users[0].tokens[0].token)
            .expect(200)
            .expect((res) => {
                expect(res.body.recipe.text).toBe(recipes[0].text);
            })
            .end(done);
    });

    it('should not return recipe doc created by other user', (done) => {
        request(app)
            .get(`/recipes/${recipes[1]._id.toHexString()}`)
            .set('x-auth', users[0].tokens[0].token)
            .expect(404)
            .end(done);
    });

    it('should return 404 if recipe not found', (done) => {
        let oid = new ObjectID().toHexString();

        request(app)
            .get(`/recipes/${oid}`) 
            .set('x-auth', users[0].tokens[0].token)
            .expect(404)
            .end(done);
    });

    it('should return 404 for non-object IDs', (done) => {
        request(app)
            .get('/recipes/zzzzzzzzzzzzzzzzzzzzzzzz') // this is an invalid ObjectID 
            .set('x-auth', users[0].tokens[0].token)
            .expect(404)
            .end(done);
    });
});

describe('DELETE /recipes/:id', () => {
    it('should remove a recipe', (done) => {
        let oid = recipes[1]._id.toHexString();

        request(app)
            .delete(`/recipes/${oid}`)
            .set('x-auth', users[1].tokens[0].token)
            .expect(200)
            .expect((res) => {
                expect(res.body.recipe._id).toBe(oid);
            })
            .end((err, res) => {
                if (err) {
                    return done(err);
                }

                Recipe.findById(oid).then((recipe) => {
                    expect(recipe).toBeFalsy();
                    done();
                }).catch((e) => done(e));
            });
    });

    it('should not remove a recipe if the user is not the creator', (done) => {
        let oid = recipes[0]._id.toHexString();

        request(app)
            .delete(`/recipes/${oid}`)
            .set('x-auth', users[1].tokens[0].token)
            .expect(404)
            .end((err, res) => {
                if (err) {
                    return done(err);
                }

                Recipe.findById(oid).then((recipe) => {
                    expect(recipe).toBeTruthy();
                    done();
                }).catch((e) => done(e));
            });
    });

    it('should return 404 if recipe not found', (done) => {
        let oid = new ObjectID().toHexString();

        request(app)
            .delete(`/recipes/${oid}`) 
            .set('x-auth', users[1].tokens[0].token)
            .expect(404)
            .end(done);
    });

    it('should return 404 for non-object IDs', (done) => {
        request(app)
            .delete('/recipes/zzzzzzzzzzzzzzzzzzzzzzzz') // this is an invalid ObjectID 
            .set('x-auth', users[1].tokens[0].token)
            .expect(404)
            .end(done);
    });
});

describe('PATCH /recipes/:id', () => {
    it('should update the recipe', (done) => {
        let oid = recipes[0]._id.toHexString();
        let title = 'My New Title';
        let recipeName = 'My New Recipe Name';

        request(app)
            .patch(`/recipes/${oid}`)
            .set('x-auth', users[0].tokens[0].token)
            .send({ title, recipeName })
            .expect(200)
            .expect((res) => {
                expect(res.body.title).toBe(title);
            })
            .expect((res) => {
                expect(res.body.recipeName).toBe(recipeName);
            })
            .end(done);
    });

    it('should not update the recipe if the user is not the creator', (done) => {
        let oid = recipes[0]._id.toHexString();
        let text = 'Updating text in /recipes/:id test 1';
        let completed = true;

        request(app)
            .patch(`/recipes/${oid}`)
            .set('x-auth', users[1].tokens[0].token)
            .send({text, completed})
            .expect(404)
            .end(done);
    });
});

describe('GET /users/me', () => {
    it('should return user if authenticated', (done) => {
        request(app)
            .get('/users/me')
            .set('x-auth', users[0].tokens[0].token)
            .expect(200)
            .expect((res) => {
                expect(res.body._id).toBe(users[0]._id.toHexString());
                expect(res.body.email).toBe(users[0].email);
            })
            .end(done);
    });

    it('should return return a 401 if not authenticated', (done) => {
        request(app)
            .get('/users/me')
            .expect(401)
            .expect((res) => {
                expect(res.body).toEqual({});
            })
            .end(done);
    });
});

describe('POST /users', () => {
    it('should get create a user', (done) => {
        let name = 'Test User';
        let email = 'testuser@example.com';
        let password = 'password1!';

        request(app)
            .post('/users')
            .send({name, email, password})
            .expect(200)
            .expect((res) => {
                expect(res.headers['x-auth']).toBeTruthy();
                expect(res.body._id).toBeTruthy();
                expect(res.body.name).toBe(name);
                expect(res.body.email).toBe(email);
            })
            .end((err) => {
                if (err) {
                    return done(err);
                }
                
                User.findOne({email}).then((user) => {
                    expect(user).toBeTruthy();
                    expect(user.password).not.toBe(password);
                    done();
                }).catch((e) => done(e));
            });
    });

    it('should return validation errors if request is invalid', (done) => {
        request(app)
            .post('/users')
            .send({})
            .expect(400)
            .end(done);
    });

    it('should not create the user if email already in use', (done) => {
        let name = 'Newtest User';
        let email = users[1].email;
        let password = 'pasSWord1!';

        request(app)
            .post('/users')
            .send({name, email, password})
            .expect(400)
            .end(done);
    });
});

describe('POST /users/login', () => {
    it('should login user and return auth token', (done) => {
        let email = users[1].email;
        let password = users[1].password;

        request(app)
            .post('/users/login')
            .send({email, password})
            .expect(200)
            .expect((res) => {
                expect(res.header['x-auth']).toBeTruthy()
            })
            .end((err,res) => {
                if (err) {
                    done(err);
                }

                User.findById(users[1]._id).then((user) => {
                    expect(user.toObject().tokens[1]).toMatchObject({
                        access: 'auth',
                        token: res.headers['x-auth']
                    })
                    done();
                }).catch((e) => done(e));
            });
    });
    
    it('should reject invalid login', (done) => {
        let email = users[1].email;
        let password = 'bad password';

        request(app)
            .post('/users/login')
            .send({email, password})
            .expect(400)
            .expect((res) => {
                expect(res.header['x-auth']).toBeFalsy()
            })
            .end((err,res) => {
                if (err) {
                    done(err);
                }

                User.findById(users[1]._id).then((user) => {
                    expect(user.tokens.length).toBe(1)
                    done();
                }).catch((e) => done(e));
            });
    });
});

describe('DELETE /users/me/token', () => {
    it('should remove auth token on logout', (done) => {
        request(app)
            .delete('/users/me/token')
            .set('x-auth', users[0].tokens[0].token)
            .expect(200)
            .end((err,res) => {
                if (err) {
                    done(err);
                }

                User.findById(users[0]._id).then((user) => {
                    expect(user.tokens.length).toBe(0)
                    done();
                }).catch((e) => done(e));
            });
    });
});
