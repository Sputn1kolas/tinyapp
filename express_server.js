// Known bugs: 2017/07/07 Error: Can't set headers after they are sent., when rendering

///////////////////////////////////// Intiate Settings + Server ////////////////////////////////////////////

const express = require("express")
const cookieSession = require('cookie-session')
const cookieParser = require('cookie-parser')
const bodyParser = require("body-parser")
const bcrypt = require('bcrypt')
const port = process.env.PORT || 8080
const cookieOptions = ["rocks"]
const app = express()


app.set("view engine", "ejs")
app.use(bodyParser.urlencoded({extended: true}))
app.use(cookieParser())
app.use(cookieSession({ secret: 'Banannnas!', cookie: { maxAge: 60 * 60 * 1000 }}))

// Get app to listen on port 8080
app.listen(port, function(){
  console.log(`Good News Everyone!, I'm listening... on port ${port}`)
})



///////////////////////////////////// Databases ////////////////////////////////////////////


// Short URL "Database" objects
const urlDatabase = {
}

/// User "Database" Object
const users = {
}

// urlStatistics "Database" Object
const urlStatistics = {
}

///////////////////////////////////// Accessory Functions /////////////////////////////////

// creates a new statistics object within urlstatistics for a short URL
function urlStatisticsInitalize(shortURL){
  if(!urlStatistics[shortURL]){
    urlStatistics[shortURL] = {
      visits: 0,
      visitedBy: {},
      uniqueVisitors: 0
    }
  }
}

// returns true if a user has permission to edit or delete a short url, false otherwise
function permission(shortURL, req){
if(req.session.user_id){
  let user_id = req.session.user_id
  let urlArray =  users[user_id]["shortURLs"]
  for(var i = 0; i < urlArray.length; i++) {
    if(shortURL === urlArray[i]){
      return true
    }
  }
}
return false
}

// generate a random 7 ch string from lower case, uppercase or numbers
function generateRandomString() {
  var string = ""
  var possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789"
  for (let i = 0; i < 7; i++)
    string += possible.charAt(Math.floor(Math.random() * possible.length))
  return string
}

// returns the username given the user_id
function getUsername(req) {
  if(!req.session){
    return ""
  }
  return users[req.session.user_id]
}

// returns the email if given an id
function emailForId(email){
  for(let id in users) {
    if(email === users[id]["email"]) {
      return id
    }
  }
  return false
}

// checks if an id exists in the db, if it does returns true, else false
function isIdDuplicate(email){
  for(let id in users) {
    if(email === users[id]["email"]){
      return true
    }
  }
  return false
}

// returns an array containing the shortURLs belonging to the user signed in
function generateUserURLS(req) {
 if(req.session) {
  const user_id = req.session.user_id
  const urlArray = users[user_id]["shortURLs"]
  let urls = {}
  for(var i in urlArray) {
    const shortURL = urlArray[i]
    urls[shortURL] = urlDatabase[shortURL]
  }
  return urls
}
return {}
}

// if a cookied user does not exist in the db, it deletes the cookies
function deleteOrphinCookies(req, res) {
  if(!getUsername(req)) {
    req.session = null
      // res.clearCookie('user_id')
    }
  }


// deletes a shortURL from the user's list of created urls
function removeFromUserURLS(user_id, shortURL){
  let urlArray = users[user_id]["shortURLs"]
  var index = urlArray.indexOf(shortURL)
  delete users[user_id]["shortURLs"][index]
}

// returns how many unique visitors a partiular short url has.
function calcUniqueVisitors(shortURL) {
  return Object.keys(urlStatistics[shortURL]["visitedBy"]).length
}



///////////////////////////////////// Create or Delete tinyurls ////////////////////////////////////////////


// Creates a shortURL from a longURL and posts to database, short url added to user's list
app.post("/urls", (req, res) => {
  const shortURL = generateRandomString()
  if(req.session.user_id){
    const user = req.session.user_id
    urlDatabase[shortURL] = req.body["longURL"]
    users[user]["shortURLs"].push(shortURL)
    res.status(301)
    res.redirect("/urls")
  }
  res.status(403).send("Error: You don't have permission to do that!")
})


// View for creating urls
app.get("/urls/new", (req, res) => {
  if(!req.session.user_id){
    res.redirect("/login")
  }
  let templateVar = {
    urls: urlDatabase,
    user: getUsername(req)
  }
  res.render("urls_new",templateVar)
})


// View to change the a given short URL, if there is permission
app.post("/urls/:id", (req, res) => {
  const shortURL = req.params.id
  if(permission(shortURL, req)){
    urlDatabase[req.params.id] = req.body.newLongURL
    console.log("long url updated...")
    res.redirect("/urls")
  }
  res.status(403).send("Error: You don't have permission to do that!")
})

// Deletes the shortURL posted to :id
app.post("/urls/:id/delete", (req, res) => {
  const user_id = req.session.user_id
  const shortURL = req.params.id
  if(permission(shortURL,req)){
    removeFromUserURLS(user_id, shortURL)
    console.log("deleted...")
    res.redirect("/urls")
  }
  res.status(403).send("Error: You don't have permission to do that!")
})


// Redirects to the long url given /u/shorurl, adds HTTP:// to all id's
app.get("/u/:shortURL", (req, res) => {
  let shortURL = req.params.shortURL
  let longURL = urlDatabase[shortURL]
  let user_id = req.session.user_id
  let timestamp = new Date()
  if("http://" === longURL.slice(0,7)){   //ensures all redirects are to a HTTP://
    longURL = longURL.slice(7)
  }
  if("www." === longURL.slice(0,4)){   //ensures all redirects are to www.
    longURL = longURL.slice(4)
  }
  urlStatisticsInitalize(shortURL)
  urlStatistics[shortURL]["visits"] += 1 //iterates url statistics
  if(!urlStatistics[shortURL]["visitedBy"][user_id]) {
    urlStatistics[shortURL]["visitedBy"][user_id] = [] // adds each user an array, to log visits if it does not exist
  }
  urlStatistics[shortURL]["visitedBy"][user_id].push(timestamp)
  urlStatistics[shortURL]["uniqueVisitors"] = calcUniqueVisitors(shortURL)
  res.redirect(`http://www.${longURL}`)
})


///////////////////////////////////// User Registration ////////////////////////////////////////////

// creates registration view
app.get("/registration", function(req, res){
  let templateVar = {
    urls: urlDatabase,
    user: getUsername(req)
  }
  res.render("userRegistration", templateVar)
})

// Posts a new registed user to the db
app.post("/registration", (req, res) => {
  if(!req.body["name"] || !req.body["email"]) {
    res.status(400).send("Error: Either your email or name is empty")
    return
  } else if(isIdDuplicate(req.body["email"])) {
    res.status(400).send("Already Registered")
    return
  }
  let id = generateRandomString()
  users[id] = {
    name: req.body["name"],
    email: req.body["email"],
    password: bcrypt.hashSync(req.body["password"],10),
    shortURLs: []
  };
  req.session.user_id = id
  res.redirect("/urls")
});


/////////////////////////////////////// Login / Logout ////////////////////////////////////////////


// creates the login view
app.get("/login", function(req, res){
  let templateVar = {
    urls: urlDatabase,
    user: getUsername(req)
  };
  res.render("login", templateVar)
});

// finds the user in the DB and logs them in
app.post("/login", (req, res) => {
  let email = req.body["email"]
  let password = req.body["password"]
  if(!emailForId(email, password)) {
    res.status(403).send("Error: Wrong Email Address")
    return
  }
  let id = emailForId(email, password)
  console.log(bcrypt.compareSync(password, users[id]["password"]))
  if(bcrypt.compareSync(password, users[id]["password"])) {
    console.log("id and password succesfull.. logging in...", id)
    req.session.user_id = id
    res.redirect("/urls")
    return
  }
  res.status(403).send("Error: Password not Correct")
});

// Logs out user by deleting cookie
app.post("/logout", (req, res) => {
  // res.clearCookie('user_id')
  req.session = null
  res.redirect("/urls")
  console.log("logged out!")
});


///////////////////////////////////// Main Views ////////////////////////////////////////////

// Home Page
app.get("/", function(req, res){
  deleteOrphinCookies(req, res)
  let urls = generateUserURLS(req)
  let templateVar = {
    user: getUsername(req),
    urls: urls
  }
  res.render("home", templateVar)
})


// Main URLS page
app.get("/urls", function(req, res){
  deleteOrphinCookies(req, res)
  let urls = generateUserURLS(req)
  let templateVar = {
    user: getUsername(req),
    urls: urls
  }
  res.render("urls_index", templateVar)
})

// go to existing tiny url
app.get("/urls/:id", function(req, res) {
  let shortURL = req.params.id
  if(permission(shortURL, req)){
    urlStatisticsInitalize(shortURL)
    console.log("the short url is...", shortURL)
    let templateVar = {
      urls: urlDatabase,
      user: getUsername(req),
      shortURL: req.params.id,
      urlStatistics: urlStatistics[req.params.id]
    }
    res.render("urls_show", templateVar)
  }
  res.status(403).send("Error: You don't have permission to do that!")
});



