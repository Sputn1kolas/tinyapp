
///////////////////////////////////// Intiate Server ////////////////////////////////////////////

const express = require("express");
const cookieParser = require('cookie-parser')
const bodyParser = require("body-parser");

const app = express();
app.set("view engine", "ejs");
const port = process.env.PORT || 8080;
app.use(bodyParser.urlencoded({extended: true}));
app.use(cookieParser())


// Get app to listen on port 8080
app.listen(port, function(){
  console.log(`Good News Everyone!, I'm listening... on port ${port}`)
})

///////////////////////////////////// Databases ////////////////////////////////////////////


//Short URL -Database
let urlDatabase = {
  "b2xVn2": "http://www.lighthouselabs.ca",
  "9sm5xK": "http://www.google.com"
};

/// User Database Object
const users = {
  "userRandomID": {
    name: "Nikolas",
    email: "nikolas.clark@gmail.com",
    password: "password"
  },
 "user2RandomID": {
    name: "user2RandomID",
    email: "user2@example.com",
    password: "dishwasher-funk"
  }
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
  if(!req.cookies["user_id"]){
    return ""
  }
  // console.log("user object called", users[req.cookies["user_id"]])
  return users[req.cookies["user_id"]]
}


function isIdDuplicate(email){
  for(let id in users) {
    if(email === users[id]["email"]){
      return true
    }
  }
  return false
}

function emailandPasswordForId(email, password){
  for(let id in users) {
    if(email === users[id]["email"]) {
      if(password === users[id]["password"]){
        return id
      }
    }
  }
  return false
}

// Defining pages/views
// app.get("/", function(req, res){
//   res.end("I AM THE ROOT WEBPAGE, HELLOOO");
// });

///////////////////////////////////// Main Views ////////////////////////////////////////////

// Main URLS page
app.get("/urls", function(req, res){
  let templateVar = {
    urls: urlDatabase,
    user: getUsername(req),
  };
  console.log("renderin urls with.. ", templateVar)
  res.render("../urls_index", templateVar);
});

app.post("/urls", (req, res) => {
  console.log(req.body["longURL"]) // debug statement to see POST parameters
  urlDatabase[generateRandomString()] = req.body["longURL"];
  res.redirect("/urls")
  console.log("302")
});


app.get("/urls/:id", function(req, res) {
  let templateVar = {
    urls: urlDatabase,
    user: getUsername(req)
  };
  templateVar.shortURL = req.params.id,
  res.render("../urls_show", templateVar);
});

///////////////////////////////////// Create or Delete tinyurls ////////////////////////////////////////////


// View for creating urls
app.get("/urls/new", (req, res) => {
  let templateVar = {
    urls: urlDatabase,
    user: getUsername(req)
  };
  res.render("../urls_new",templateVar);
});

// Create new URL
app.post("/urls/:id", (req, res) => {
  urlDatabase[req.params.id] = req.body.newLongURL
  console.log("long url updated...")
  res.redirect("/urls")
})

// Delete the url
app.post("/urls/:id/delete", (req, res) => {
  delete urlDatabase[req.params.id]
  console.log("deleted...")
  res.redirect("/urls")
})

// Redirect at /u/shorturl
app.get("/u/:shortURL", (req, res) => {
  res.redirect(urlDatabase[req.params.shortURL]);
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
    password: req.body["password"]
  };
  res.cookie('user_id', id, { maxAge: 900000})
  console.log(id)
  res.redirect("/urls")
});


/////////////////////////////////////// Login / Logout //////////////////////////////////////////////////////


app.get("/login", function(req, res){
  let templateVar = {
    urls: urlDatabase,
    user: getUsername(req)
  };
  res.render("../login", templateVar);
});

app.post("/login", (req, res) => {
  let email = req.body["email"]
  let password = req.body["password"]
  let id = emailandPasswordForId(email, password);
  if(id) {
    console.log("id in db, logging in...", id)
    res.cookie('user_id', id, { maxAge: 900000})
    res.redirect("/urls")
    return
  }
  res.status(403).send("Error: Email or Password not Correct");
});

// Logout + delete cookie
app.post("/logout", (req, res) => {
  res.clearCookie('user_id')
  res.redirect("/urls")
  console.log("logged out!")
});




