function generateRandomString() {
  var string = "";
  var possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";

  for (let i = 0; i < 7; i++)
    string += possible.charAt(Math.floor(Math.random() * possible.length));

  return string;
}


console.log(generateRandomString())