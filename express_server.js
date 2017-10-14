var express = require('express');
var app = express();
var PORT = process.env.PORT || 8080;

app.set('view engine','ejs');
var cookieSession = require('cookie-session');
app.use(cookieSession( {
    name: 'session',
    keys: ['combinationlock']
}));

const bodyParser = require("body-parser");
app.use(bodyParser.urlencoded({extended: true}));

const bcrypt = require('bcrypt');

function randomString() {
    var randomString = "";
    var possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
    for (var i = 0; i < 6; i++) {
        randomString += possible.charAt(Math.floor(Math.random() * possible.length));
    }
    return randomString;
}

function getUserByEmail(email) {
    for(let userId in usersDatabase) {
        if (email === usersDatabase[userId].email){
            return userId;
        }
    }
}

function getUserById(userId) {
    return usersDatabase[userId];
}



function registerNewUser(email, password) {
    const randomUserId = randomString();
    usersDatabase[randomUserId] = {
        id : randomUserId,
        email,
        hashedPassword : bcrypt.hashSync(password, 10)  
    }
    return randomUserId;
}

function checkPassword(userId, password){
    if(getUserById(userId) && usersDatabase[userId].hashedPassword){ 
        return bcrypt.compareSync(password, usersDatabase[userId].hashedPassword) 
    };
}

function urlsForUser(id) {
    const specificURLs = {};
    for(let shortURL in urlDatabase){
        const urlObj = urlDatabase[shortURL];
        if(urlObj.userId === id) {
            specificURLs[shortURL] = urlObj; 
        }
    }
    return specificURLs;
}

const urlDatabase = {};

const usersDatabase = {};

app.get("/", (req, res) => {
    return res.redirect("/urls");
});

app.get("/urls", (req, res) => {
    const id = req.session['user_id']; 
    const templateVars = {
         user: usersDatabase[req.session["user_id"]],
         urls: urlsForUser(id)
    };
    if(id) {
        return res.render("urls_index", templateVars);
    } else {
        return res.status(403).send('403 Forbidden, not logged in');
    }
});

app.get("/urls/new", (req, res) => {
    const userId = req.session["user_id"];
    const templateVars = {
        user: usersDatabase[req.session["user_id"]]
    };
    if (getUserById(userId)){
        return res.render("urls_new", templateVars);
    } else {
        return res.redirect('/login');
    }
});

app.post("/urls", (req, res) => { 
    const longURL = req.body.longURL;
    const shortURL = randomString();
    const userId = req.session['user_id'];
    urlDatabase[shortURL] = { userId: userId, longURL: longURL };
    return res.redirect("urls/" + shortURL);
});

app.post('/urls/:id/edit', (req, res) => {
    const shortURL = req.params.id;
    const longURL = req.body.longURL;
    const userId = req.session["user_id"];
    if(userId === urlDatabase[shortURL].userId) {
        urlDatabase[shortURL] = { userId: userId, longURL: longURL };
        return res.redirect("/urls");
    } else {
        return res.status(403).send('You can\'t edit TinyURLs that don\'t belong to you');
    }
});


app.post("/urls/:id/delete", (req, res) => {
    const shortURL = req.params.id;
    const userId = req.session["user_id"];
    if(userId === urlDatabase[shortURL].userId){
        delete urlDatabase[shortURL];
        return res.redirect("/urls");
    } else {
        return res.status(403).send('You can\'t delete TinyURLs that don\'t belong to you');
    }
});

app.get("/urls/:id", (req, res) => {
    const shortURL = req.params.id;
    if(urlDatabase[shortURL] === undefined) {
        return res.status(404).send('This TinyURL does not exist');
    }
    const longURL = urlDatabase[shortURL].longURL;
    const templateVars = { 
        shortURL, 
        longURL, 
        user: usersDatabase[req.session['user_id']]
    };
    if(urlDatabase[shortURL].userId === req.session['user_id']){ 
        return res.render("urls_show", templateVars);
    } else {
        return res.status(403).send('This is not your TinyURL, please login/register');
    }
});

app.get("/u/:shortURL", (req, res) => {
    if(urlDatabase[req.params.shortURL] === undefined){
        return res.status(404).send('Tiny URL does not exist...Until Someone makes it! That could be YOU!');
    }
    let longURL = urlDatabase[req.params.shortURL].longURL;
    return res.redirect(longURL);
});

app.get("/register", (req, res) => {
    const templateVars = {
        user: usersDatabase[req.session["user_id"]],
    }; 
    return res.render("register", templateVars);
});

app.get("/login", (req, res) => {
    const userId = req.session["user_id"];
    const templateVars = {
        user: usersDatabase[req.session.email],
    }; 
    if(userId){
        return res.redirect("/urls");
    }
        return res.render("login", templateVars);
});

app.post('/login', (req, res) => {
    const email = req.body.email;
    const userId = getUserByEmail(email);
    const password = req.body.password;
    const authenticated = checkPassword(userId, password);
    
    if(userId && authenticated) {
        req.session.user_id = userId;
        return res.redirect('urls');
    } else {
        return res.status(403).send('Forbidden');
    }
});

app.post('/logout', (req, res) => {
    req.session = null;
    return res.redirect('/login');
});

app.post('/register', (req, res) => {
    const email = req.body.email.trim();
    const password = req.body.password.trim();
    if(email === '' || password === '') {
        res.status(400).send('Please enter an email *and* password.');
    } else if(getUserByEmail(email)) {
        return res.status(400).send('Email is already registered')
    } else {
        const randomUserId = registerNewUser(email, password);
        req.session.user_id = randomUserId;
        return res.redirect('/urls');
    }
});

  app.listen(PORT, () => {
    console.log(`TinyApp server listening on port ${PORT}!`);
});