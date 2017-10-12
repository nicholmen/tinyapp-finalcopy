var express = require('express');
var app = express();
var PORT = process.env.PORT || 8080;

app.set('view engine','ejs');

var cookieparser = require('cookie-parser');
app.use(cookieparser());

const bodyParser = require("body-parser");
app.use(bodyParser.urlencoded({extended: true}));

function populateLocals(req, res, next) {
    const username = req.cookies.username;
    res.locals.username = username;
    res.locals.urls = urlDatabase;
    next();
}

app.use(populateLocals);


function randomString() {
    var randomString = "";
    var possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  
    for (var i = 0; i < 6; i++)
      randomString += possible.charAt(Math.floor(Math.random() * possible.length));
  
    return randomString;
  }


var urlDatabase = {
    "b2xVn2": "http://www.lighthouselabs.ca",
    "9sm5xK": "http://www.google.com"
}

app.get("/", (req, res) => {
    res.end("Hello");
});

app.get("/urls", (req, res) => {
    res.render("urls_index");
});

app.get("/urls/new", (req, res) => {
    res.render("urls_new");
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

    let templateVars = { shortURL, longURL };
    res.render("urls_show", templateVars);
  });

  app.get("/u/:shortURL", (req, res) => {
    let longURL = urlDatabase[req.params.shortURL]
    res.redirect(longURL);
  });

app.post("/login", (req, res) => {
    let user = req.body.username;
    res.cookie("username", user);
    res.redirect("urls");
});

app.post("/logout", (req, res) => {
    res.clearCookie('username');
    res.redirect("urls")
});

  app.listen(PORT, () => {
    console.log(`TinyApp server listening on port ${PORT}!`);
});