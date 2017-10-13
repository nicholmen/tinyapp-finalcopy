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



function registerNewUser(email, password, res){
    const randomUserId = randomString();
    if(email === '' || password === ''){
        res.status(400).send('you fucked up. enter an email *and* password.')
    } else if (getUserByEmail(email)) {
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
}
// "b2xVn2": "http://www.lighthouselabs.ca",
// "9sm5xK": "http://www.google.com"
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
    const id = req.cookies['user_id']; 
    const templateVars = {
         user: usersDatabase[req.cookies["user_id"]],
         //urls: urlDatabase
         urls: urlsForUser(id)
    }
    if(!id) {
        return res.redirect("/login");
    } else {
        res.render("urls_index", templateVars);
    }
});

app.get("/urls/new", (req, res) => {
    const userId = req.cookies["user_id"];
    const templateVars = {
        user: usersDatabase[req.cookies["user_id"]],
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
    const userId = req.cookies['user_id']
    urlDatabase[shortURL] = { userId: userId, longURL: longURL };
    res.redirect("urls/" + shortURL);
});

app.post('/urls/:id/edit', (req, res) =>{
    const shortURL = req.params.id;
    const longURL = req.body.longURL
    const userId = req.cookies["user_id"]
    console.log(urlDatabase);
    if(userId === urlDatabase[shortURL].userId){
        urlDatabase[shortURL] = { userId: userId, longURL: longURL };
        res.redirect("/urls");
    } else {
        res.status(401).send('stop trying to edit other people\'s shit, you shit')
    }
    console.log(urlDatabase);
});

// removing existing urls, by id
app.post("/urls/:id/delete", (req, res) => {
    const shortURL = req.params.id;
    const userId = req.cookies["user_id"]
    if(userId === urlDatabase[shortURL].userId){
        delete urlDatabase[shortURL];
        res.redirect("/urls");
    } else {
        res.status(401).send('stop trying to delete other people\'s shit, you shit')
    }
});

app.get("/urls/:id", (req, res) => {
    const shortURL = req.params.id;
    const longURL = urlDatabase[shortURL].longURL;
    const templateVars = { 
        shortURL, 
        longURL, 
        user: usersDatabase[req.cookies['user_id']] };

    if(urlDatabase[shortURL].userId === req.cookies['user_id']){ 
        res.render("urls_show", templateVars);
    } else {
        res.send('login dumbass');
    }
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

app.post('/register', (req, res) => {
    const email = req.body.email.trim();
    const password = req.body.password.trim();
    //const {email, password} = req.body;
    registerNewUser(email, password, res);
});

  app.listen(PORT, () => {
    console.log(`TinyApp server listening on port ${PORT}!`);
});