var express = require('express');
var app = express();
var PORT = process.env.PORT || 8080;

app.set('view engine','ejs');

var cookieparser = require('cookie-parser');
app.use(cookieparser());

const bodyParser = require("body-parser");
app.use(bodyParser.urlencoded({extended: true}));


function randomString() {
    var randomString = "";
    var possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  
    for (var i = 0; i < 6; i++)
      randomString += possible.charAt(Math.floor(Math.random() * possible.length));
  
    return randomString;
  }


const urlDatabase = {
    "b2xVn2": "http://www.lighthouselabs.ca",
    "9sm5xK": "http://www.google.com"
}

const usersDatabase = { 
    "userRandomID": {
      id: "userRandomID", 
      email: "user@example.com", 
      password: "purple-monkey-dinosaur"
    },
   "user2RandomID": {
      id: "user2RandomID", 
      email: "user2@example.com", 
      password: "dishwasher-funk"
    }
  }

app.get("/", (req, res) => {
    res.redirect("/urls");
});

app.get("/urls", (req, res) => {
     let templateVars = {
         user: usersDatabase[req.cookies["user_id"]],
         urls: urlDatabase
       };
    res.render("urls_index", templateVars);
});

app.get("/urls/new", (req, res) => {
    let templateVars = {
        user: usersDatabase[req.cookies["user_id"]],
      };
    res.render("urls_new", templateVars);
});

// ceating new urls
app.post("/urls", (req, res) => { 
    let longURL = req.body.longURL
    let shortURL = randomString();
    urlDatabase[shortURL] = longURL;
    res.redirect("urls/" + shortURL);
});

app.post('/urls/:id/edit', (req, res) =>{
    let shortURL = req.params.id;
    let longURL = req.body.longURL
    urlDatabase[shortURL] = longURL;
    res.redirect("/urls/" + shortURL);
});

// removing existing urls, by id
app.post("/urls/:id/delete", (req, res) => {
    let shortURL = req.params.id;
    delete urlDatabase[shortURL];
    res.redirect("/urls");
});

app.get("/urls/:id", (req, res) => {
    const shortURL = req.params.id;
    const longURL = urlDatabase[shortURL];

    let templateVars = { 
        shortURL, 
        longURL, 
        user: usersDatabase[req.cookies["user_id"]] };
    res.render("urls_show", templateVars);
  });

  app.get("/u/:shortURL", (req, res) => {
    let longURL = urlDatabase[req.params.shortURL]
    res.redirect(longURL);
  });

app.get("/register", (req, res) => {
    res.render("register");
});

app.get("/login", (req, res) => {
    res.render("login");
});


function getUserByEmail(email){
    for(let userId in usersDatabase) {
        if (email === usersDatabase[userId].email){
            return userId;
        }
    }
}

app.post('/login', (req, res) => {
    const email = req.body.email;
    const userId = getUserByEmail(email);
    if(userId) {
        res.cookie('user_id', userId);
        res.redirect('urls');
    } else {
        res.status(403).send('Only jocks and nerds try to login without registering');
    }
});

app.post('/logout', (req, res) => {
    res.clearCookie('user_id');
    res.redirect('urls');
});

function userExist(email){
    for(let userId in usersDatabase) {
        if (email === usersDatabase[userId].email){
            return true
        }
    }
}

// function registerNewUser(email, password){
//     const randomUserId = randomString();
//     if(email === '' || password === ''){
//         res.status(400).send('you fucked up. enter an email *and* password.')
//     } else if (userExist(email)) {
//         res.status(400).send('you fucked up. email is already registered')
//     } else {
//         usersDatabase[randomUserId] = {
//             id : randomUserId,
//             email,
//             password  
//         }
// }

app.post('/register', (req, res) => {
    const email = req.body.email.trim();
    const password = req.body.password.trim();
    //const {email, password} = req.body;
    const randomUserId = randomString();
    if(email === '' || password === ''){
        res.status(400).send('you fucked up. enter an email *and* password.')
    } else if (userExist(email)) {
        res.status(400).send('you fucked up. email is already registered')
    } else {
        usersDatabase[randomUserId] = {
            id : randomUserId,
            email,
            password  
        }
        res.cookie('user_id', randomUserId);
        res.redirect('urls');
    }
});

  app.listen(PORT, () => {
    console.log(`TinyApp server listening on port ${PORT}!`);
});