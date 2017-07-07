
///////////////////////////////////// Intiate Server ////////////////////////////////////////////

const express = require("express");
const cookieSession = require('cookie-session')
const cookieParser = require('cookie-parser')
const bodyParser = require("body-parser");
const bcrypt = require('bcrypt');


const app = express();
app.set("view engine", "ejs");
const port = process.env.PORT || 8080;
app.use(bodyParser.urlencoded({extended: true}));
// app.use(cookieSession())
app.use(cookieParser())
app.use(cookieSession({ secret: 'Banannnas!', cookie: { maxAge: 60 * 60 * 1000 }}));
const cookieOptions = ["rocks"]

// Get app to listen on port 8080
app.listen(port, function(){
  console.log(`Good News Everyone!, I'm listening... on port ${port}`)
})



///////////////////////////////////// Databases ////////////////////////////////////////////


//Short URL -Database
// now urls are objects, 2 breaks: redirect, ursl page, and urls
// work on only user can edit, or delete []
// then create url has the user attached.

const urlDatabase = {
  "b2xVn2": "http://www.lighthouselabs.ca",
  "9sm5xK": "http://www.google.com",
};

/// User Database Object
const users = {
}


///////////////////////////////////// Accessory Functions /////////////////////////////////


function generateRandomString() {
  var string = "";
  var possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  for (let i = 0; i < 7; i++)
    string += possible.charAt(Math.floor(Math.random() * possible.length));
  return string;
}

function getUsername(req) {
  if(!req.session.user_id){
    return ""
  }
  return users[req.session.user_id]
}


function isIdDuplicate(email){
  for(let id in users) {
    if(email === users[id]["email"]){
      return true
    }
  }
  return false
}

function emailForId(email){
  for(let id in users) {
    if(email === users[id]["email"]) {
      return id
    }
  }
  return false
}

function generateUserURLS(req) {
 if(users[req.session.user_id]) {
    const user_id = req.session.user_id
    console.log(req.session.user_id)
    const urlArray = users[user_id]["shortURLs"]
    let urls = {}
    for(var i in urlArray) {
      const shortURL = urlArray[i]
      console.log(urlDatabase[shortURL])
      urls[shortURL] = urlDatabase[shortURL]
    }
    return urls
  }
  return {}
}

function deleteOrphinCookies(req, res) {
  if(!getUsername(req)) {
      res.clearCookie('user_id')
  }
}

function removeFromUserURLS(user_id, shortURL){
  console.log(user_id)
  let urlArray = users[user_id]["shortURLs"]
  var index = urlArray.indexOf(shortURL)
  delete users[user_id]["shortURLs"][index]
}

// Defining pages/views
// app.get("/", function(req, res){
//   res.end("I AM THE ROOT WEBPAGE, HELLOOO");
// });

///////////////////////////////////// Create or Delete tinyurls ////////////////////////////////////////////


// View for creating urls
app.get("/urls/new", (req, res) => {
  if(!req.session.user_id){
    res.redirect("/login")
  }

  let templateVar = {
    urls: urlDatabase,
    user: getUsername(req)
  };
  res.render("../urls_new",templateVar);
});

// post new url to database
app.post("/urls", (req, res) => {
  console.log(req.session.user_id)
  const shortURL = generateRandomString()
  const user = req.session.user_id
  urlDatabase[shortURL] = req.body["longURL"];
  users[user]["shortURLs"].push(shortURL)
  res.status(301)
  res.redirect("/urls")
});

// update  URL
app.post("/urls/:id", (req, res) => {
  urlDatabase[req.params.id] = req.body.newLongURL
  console.log("long url updated...")
  res.redirect("/urls")
})

// Delete the url
app.post("/urls/:id/delete", (req, res) => {
  const user_id = req.session.user_id
  const shortURL = req.params.id
  removeFromUserURLS(user_id, shortURL)
  console.log("deleted...")
  res.redirect("/urls")
})

// Redirect /u/shorturl, adds HTTP:// to all id's
app.get("/u/:shortURL", (req, res) => {
  let longURL = urlDatabase[req.params.shortURL]
  if("http://" === longURL.slice(0,7)){
    longURL = longURL.slice(7);
  }
  res.redirect(`http://${longURL}`);
});


///////////////////////////////////// User Registration ////////////////////////////////////////////


app.get("/registration", function(req, res){
  let templateVar = {
    urls: urlDatabase,
    user: getUsername(req)
  };
  res.render("../userRegistration", templateVar);
});

// registration pagess
app.post("/registration", (req, res) => {
  if(!req.body["name"] || !req.body["email"]) {
    res.status(400).send("Error: Either your email or name is empty");
    return;
  } else if(isIdDuplicate(req.body["email"])) {
    res.status(400).send("Already Registered");
    return
  }
let id = generateRandomString()
  users[id] = {
    name: req.body["name"],
    email: req.body["email"],
    password: bcrypt.hashSync(req.body["password"],10),
    shortURLs: []
  };
  console.log(users)
  req.session.user_id = id
  res.redirect("/urls")
});


/////////////////////////////////////// Login / Logout //////////////////////////////////////////////////////

// creates the login view
app.get("/login", function(req, res){
  let templateVar = {
    urls: urlDatabase,
    user: getUsername(req)
  };
  res.render("../login", templateVar);
});

// finds the user in the DB and logs them in
app.post("/login", (req, res) => {
  let email = req.body["email"]
  let password = req.body["password"]
  let id = emailForId(email, password);
  if(bcrypt.compareSync(password, users[id]["password"])){
    console.log("id and password succesfull.. logging in...", id)
    req.session.user_id = id
    res.redirect("/urls")
    return
  }
  res.status(403).send("Error: Email or Password not Correct");
});

// Logs out user by deleting cookie
app.post("/logout", (req, res) => {
  res.clearCookie('user_id')
  res.redirect("/urls")
  console.log("logged out!")
});


///////////////////////////////////// Main Views ////////////////////////////////////////////


// Main URLS page
app.get("/urls", function(req, res){
  deleteOrphinCookies(req, res)
  let urls = generateUserURLS(req)
  console.log("the /urls get url object is...", urls)
  let templateVar = {
    user: getUsername(req),
    urls: urls
  };
  res.render("../urls_index", templateVar);
});

// go to existing tiny url
app.get("/urls/:id", function(req, res) {
  let templateVar = {
    urls: urlDatabase,
    user: getUsername(req)
  };
  templateVar.shortURL = req.params.id,
  res.render("../urls_show", templateVar);
});



