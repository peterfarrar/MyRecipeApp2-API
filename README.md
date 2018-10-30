# MyRecipeApp2-API
This is the repo for development on the API for the second version of MyRecipeApp.  It borrows heavily from course work from Udemy and is only a staring point.

One file not included in this repo is `server/config/config.json`  
Here is an example of the contents:  
`{`  
`    "test": {`  
`        "PORT": 3000,`  
`        "MONGODB_URI": "mongodb://localhost:27017/RecipeAppTest",`  
`        "JWT_SECRET": "8VH8likpwT6DwhW2eJwxpJ6oPOaVX2O"`  
`    },`  
`    "development": {`  
`        "PORT": 3000,`  
`        "MONGODB_URI": "mongodb://localhost:27017/RecipeApp",`  
`        "JWT_SECRET": "lhZbKr5aWk4G7dVrnq2.Se9zmRaNE4O"`  
`    }`  
`}`

I think it's pretty self evident, but the secret is used for seeding the JWT used for authenticating users.  
