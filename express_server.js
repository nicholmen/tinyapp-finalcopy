var express = require('express');
var app = express();
var PORT = process.env.PORT || 8080;

app.set('view engine','ejs');

const bodyParser = require("body-parser");
app.use(bodyParser.urlencoded({extended: true}));

function routeHandler(req, res){

}

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
    let templateVars = { urls: urlDatabase }
    res.render("urls_index", templateVars);
});

app.get("/urls/new", (req, res) => {
    res.render("urls_new");
});

// GET /notes/
// GET /notes/new
// POST/PUT /notes/
// GET /notes/noteId
// POST/PUT /notes/noteId
// DELETE /notes/noteId

// BREAD



//get this esplained
app.post("/urls", (req, res) => { 
    let longURL = req.body.longURL
    let shortURL = randomString();
    urlDatabase[shortURL] = longURL;
    //res.send('this will be a redirect to the long url')
    //TODO redirect
    res.redirect("urls/" + shortURL); 
});

app.get("/urls/:id", (req, res) => {
    const shortURL = req.params.id;
    const longURL = urlDatabase[shortURL];

    let templateVars = { shortURL, longURL };
    res.render("urls_show", templateVars);
  });

  // are these the same???^v

  app.get("/u/:shortURL", (req, res) => {
    let longURL = urlDatabase[req.params.shortURL]
    res.redirect(longURL);
  });

  app.listen(PORT, () => {
    console.log(`TinyApp server listening on port ${PORT}!`);
});


  // DOn't think I need this
// app.get("/urls.json", (req, res) => {
//     res.json(urlDatabase);
//   });

