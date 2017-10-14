var express = require('express');
var app = express();
var PORT = process.env.PORT || 8080;

app.set('view engine','ejs');

// var cookieparser = require('cookie-parser');
// app.use(cookieparser());
var cookieSession = require('cookie-session');
app.use(cookieSession({
    name: 'session',
    keys: ['combinationlock']
}));

const bodyParser = require("body-parser");
app.use(bodyParser.urlencoded({extended: true}));

// why do we not have to say app.use(bcrypt())???
const bcrypt = require('bcrypt');


function randomString() {
    var randomString = "";
    var possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  
    for (var i = 0; i < 6; i++)
      randomString += possible.charAt(Math.floor(Math.random() * possible.length));
  
    return randomString;
  }

function getUserByEmail(email){
    for(let userId in usersDatabase) {
        if (email === usersDatabase[userId].email){
            return userId;
        }
    }
}

function getUserById(userId){
    return usersDatabase[userId];
}



function registerNewUser(email, password){
    const randomUserId = randomString();
    usersDatabase[randomUserId] = {
        id : randomUserId,
        email,
        hashedPassword : bcrypt.hashSync(password, 10)  
    }
    return randomUserId;
}

const urlDatabase = {
        "b2xVn2": {
            userId: "userRandomId",
            longURL: "http://www.lighthouselabs.ca"
        },

        "9sm5xK": {
            userId: "user2RandomId",
            longURL: "http://www.google.com"
        }
}

const usersDatabase = { 
    "userRandomId": {
      id: "userRandomId", 
      email: "user@example.com", 
      password: "purple-monkey-dinosaur"
    },
   "user2RandomId": {
      id: "user2RandomId", 
      email: "user2@example.com", 
      password: "dishwasher-funk"
    }
  }

app.get("/", (req, res) => {
    res.redirect("/urls");
});

function urlsForUser(id){
    const specificURLs = {}
    for(let shortURL in urlDatabase){
        const urlObj = urlDatabase[shortURL];
        if(urlObj.userId === id) {
            specificURLs[shortURL] = urlObj; 
        }
    }
    return specificURLs;
}

app.get("/urls", (req, res) => {
    const id = req.session['user_id']; 
    const templateVars = {
         user: usersDatabase[req.session["user_id"]],
         urls: urlsForUser(id)
    }
    if(id) {
        res.render("urls_index", templateVars);
    } else {
        return res.status(403).send('403 Forbidden, not logged in');
    }
});

app.get("/urls/new", (req, res) => {
    const userId = req.session["user_id"];
    const templateVars = {
        user: usersDatabase[req.session["user_id"]],
    };
    if (getUserById(userId)){
        res.render("urls_new", templateVars);
    } else {
        res.redirect('/login');
    }
});

// ceating new urls
app.post("/urls", (req, res) => { 
    const longURL = req.body.longURL
    const shortURL = randomString();
    const userId = req.session['user_id']
    urlDatabase[shortURL] = { userId: userId, longURL: longURL };
    res.redirect("urls/" + shortURL);
});

app.post('/urls/:id/edit', (req, res) =>{
    const shortURL = req.params.id;
    const longURL = req.body.longURL
    const userId = req.session["user_id"]
    console.log(urlDatabase);
    if(userId === urlDatabase[shortURL].userId){
        urlDatabase[shortURL] = { userId: userId, longURL: longURL };
        res.redirect("/urls");
    } else {
        res.status(401).send('stop trying to edit other people\'s shit, you shit')
    }
    console.log(urlDatabase);
});


app.post("/urls/:id/delete", (req, res) => {
    const shortURL = req.params.id;
    const userId = req.session["user_id"]
    if(userId === urlDatabase[shortURL].userId){
        delete urlDatabase[shortURL];
        res.redirect("/urls");
    } else {
        res.status(401).send('stop trying to delete other people\'s shit, you shit')
    }
});

app.get("/urls/:id", (req, res) => {
    const shortURL = req.params.id;
    if(urlDatabase[shortURL] === undefined){
        return res.status(404).send('This TinyURL does not exist');
    }
    const longURL = urlDatabase[shortURL].longURL;
    const templateVars = { 
        shortURL, 
        longURL, 
        user: usersDatabase[req.session['user_id']] };
    if(urlDatabase[shortURL].userId === req.session['user_id']){ 
        res.render("urls_show", templateVars);
    } else {
        res.status(403).send('This is not your TinyURL, please login/register');
    }
  });

app.get("/u/:shortURL", (req, res) => {
    if(urlDatabase[req.params.shortURL] === undefined){
        return res.status(404).send('Tiny URL does not exist...Until Someone makes it! That could be YOU!');
    }
    let longURL = urlDatabase[req.params.shortURL].longURL
    return res.redirect(longURL);
});

app.get("/register", (req, res) => {
    const templateVars = {
        user: usersDatabase[req.session["user_id"]],
    }; 
    res.render("register", templateVars);
});

app.get("/login", (req, res) => {
    const userId = req.session["user_id"]
    const templateVars = {
        user: usersDatabase[req.session.email],
    }; 
    if(userId){
        res.redirect("/urls")
    }
    res.render("login", templateVars);
});
function checkPassword(userId, password){
    if(getUserById(userId) && usersDatabase[userId].hashedPassword){ 
        return bcrypt.compareSync(password, usersDatabase[userId].hashedPassword) 
    };
}
app.post('/login', (req, res) => {
    const email = req.body.email;
    const userId = getUserByEmail(email);
    const password = req.body.password;
    const authenticated = checkPassword(userId, password);
    
    if(userId && authenticated) {
        req.session.user_id = userId;
        res.redirect('urls');
    } else {
        res.status(403).send('Forbidden');
    }
});

app.post('/logout', (req, res) => {
    req.session = null;
    res.redirect('/login');
});

app.post('/register', (req, res) => {
    const email = req.body.email.trim();
    const password = req.body.password.trim();
    //const {email, password} = req.body;
    // if(password.length < 4 || password.length > 129){
    //     res.status(400).send('Please choose a password between 4 and 128 characters');
    // } else {


    if(email === '' || password === ''){
        res.status(400).send('you fucked up. enter an email *and* password.')
    } else if(getUserByEmail(email)) {
        return res.status(400).send('Email is already registered')
    } else {
        const randomUserId = registerNewUser(email, password);
        req.session.user_id = randomUserId;
        res.redirect('/urls');
    }
    //}
});

  app.listen(PORT, () => {
    console.log(`TinyApp server listening on port ${PORT}!`);
});