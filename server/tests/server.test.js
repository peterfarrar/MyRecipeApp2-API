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
        let text = 'Test recipe text';

        request(app)
            .post('/recipes')
            .set('x-auth', users[0].tokens[0].token)
            .send({text})
            .expect(200)
            .expect((res) => {
                expect(res.body.text).toBe(text);
            })
            .end((err,res) => {
                if (err) {
                    return done(err);
                }

                Recipe.find({text}).then( (recipes) => {
                    expect(recipes.length).toBe(1);
                    expect(recipes[0].text).toBe(text);
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
        let text = 'Updating text in /recipes/:id test 1';
        let completed = true;

        request(app)
            .patch(`/recipes/${oid}`)
            .set('x-auth', users[0].tokens[0].token)
            .send({text, completed})
            .expect(200)
            .expect((res) => {
                expect(res.body.recipe.text).toBe(text);
            })
            .expect((res) => {
                expect(res.body.recipe.completed).toBe(true);
            })
            .expect((res) => {
                expect(typeof res.body.recipe.completedAt).toBe('number');
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

    it('should clear completedAt when recipe is not completed', (done) => {
        let oid = recipes[1]._id.toHexString();
        let text = 'Updating text in /recipes/:id test 2';
        let completed = false;

        request(app)
            .patch(`/recipes/${oid}`)
            .set('x-auth', users[1].tokens[0].token)
            .send({text, completed})
            .expect(200)
            .expect((res) => {
                expect(res.body.recipe.text).toBe(text);
            })
            .expect((res) => {
                expect(res.body.recipe.completed).toBe(false);
            })
            .expect((res) => {
                expect(res.body.recipe.completedAr).toBeFalsy();
            })
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
