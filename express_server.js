// int
const express = require("express");
const cookieParser = require('cookie-parser')
const bodyParser = require("body-parser");

const app = express();
app.set("view engine", "ejs");
const port = process.env.PORT || 8080;
app.use(bodyParser.urlencoded({extended: true}));
app.use(cookieParser())

//Pseudo-Database
let urlDatabase = {
  "b2xVn2": "http://www.lighthouselabs.ca",
  "9sm5xK": "http://www.google.com"
};

const users = {
  "userRandomID": {
    id: "Nikolas",
    email: "nikolas.clark@gmail.com",
    password: "password"
  },
 "user2RandomID": {
    id: "user2RandomID",
    email: "user2@example.com",
    password: "dishwasher-funk"
  }
}


function generateRandomString() {
  var string = "";
  var possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";

  for (let i = 0; i < 7; i++)
    string += possible.charAt(Math.floor(Math.random() * possible.length));

  return string;
}


// Defining pages
// app.get("/", function(req, res){
//   res.end("I AM THE ROOT WEBPAGE, HELLOOO");
// });


app.get("/urls", function(req, res){
  let templateVar = {
    urls: urlDatabase,
    username: req.cookies["username"]
  };
  res.render("../urls_index", templateVar);
});

app.get("/urls/new", (req, res) => {
  let templateVar = {urls: urlDatabase, username: req.cookies["username"]};
  res.render("../urls_new",templateVar);
});

app.get("/urls/:id", function(req, res) {
  let templateVar = {urls: urlDatabase, username: req.cookies["username"]};
  templateVar.shortURL = req.params.id,
  res.render("../urls_show", templateVar);
});

// User Registration
app.get("/registration", function(req, res){
  let templateVar = {
    urls: urlDatabase,
    username: req.cookies["username"],
    users: users,
  };
  res.render("../userRegistration", templateVar);
});

app.post("/registration", (req, res) => {
  console.log(req.body["name"],req.body["email"], req.body["password"] )
  let id = generateRandomString()
  users[id] = {
    name: req.body["name"],
    email: req.body["email"],
    password: req.body["password"]
  };
  res.cookie('username', req.body["name"], { maxAge: 900000})
  console.log(users)
  res.redirect("/urls")
});


// Main pages
app.post("/urls", (req, res) => {
  console.log(req.body["longURL"]) // debug statement to see POST parameters
  urlDatabase[generateRandomString()] = req.body["longURL"];
  res.redirect("/urls")
  console.log("302")
});

app.post("/urls/:id/delete", (req, res) => {
  delete urlDatabase[req.params.id]
  console.log("deleted...")
  res.redirect("/urls")
})

app.post("/urls/:id", (req, res) => {
  urlDatabase[req.params.id] = req.body.newLongURL
  console.log("long url updated...")
  res.redirect("/urls")
})

app.get("/u/:shortURL", (req, res) => {
  res.redirect(urlDatabase[req.params.shortURL]);
});


// Login + posts cookie
app.post("/login", (req, res) => {
  console.log(req.body["username"])
  res.cookie('username', req.body["username"], { maxAge: 900000})
  res.redirect("/urls")
});

//logout
app.post("/logout", (req, res) => {
  res.clearCookie('username')
  res.redirect("/urls")
  console.log("logged out!")
});


// get app to listen on port 8080
app.listen(port, function(){
  console.log(`Good News Everyone!, I'm listening... on port ${port}`)
})