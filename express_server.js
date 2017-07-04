const express = require("express");
const app = express();
const port = process.env.PORT || 8080;

app.set("view engine", "ejs");

let urlDatabase = {
  "b2xVn2": "http://www.lighthouselabs.ca",
  "9sm5xK": "http://www.google.com"
};

app.get("/", function(req, res){
  res.end("I AM THE ROOT WEBPAGE, HELLOOO");
});

app.get("/urls", function(req, res){
  let templateVar = {urls: urlDatabase};
  res.render("../urls_index", templateVar);
});

app.get("/urls/:id", function(req, res) {
  let templateVar = {
    shortURL: req.params.id,
    urls: urlDatabase
  };
  res.render("../urls_show", templateVar);
});


app.listen(port, function(){
  console.log(`Hello, this is me, your express server, I'm listening... (on port ${port})`)
})