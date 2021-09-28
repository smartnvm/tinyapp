const express = require("express");
const app = express();
const PORT = 8080;

app.set("view engine", "ejs");

const bodyParser = require("body-parser");
app.use(bodyParser.urlencoded({ extended: true }));


const generateRandomString = (length) => {
  let shortURL = '';
  let characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$^()-+][><?~=';
  let charLength = characters.length
  for (i = 0; i < length; i++) {

    // let num = Math.floor((Math.random() * 127))
    // shortURL += String.fromCharCode(num)

    let num = Math.floor((Math.random() * charLength))
    shortURL += characters[num]
  }
  return shortURL
}



const urlDatabase = {
  "b2xVn2": "http://www.lighthouselabs.ca",
  "9sm5xK": "http://www.google.com"
};

app.get("/", (req, res) => {
  //  res.send("Hello!");
  const templateVars = { greeting: 'Hello World!' };
  res.render("hello_world", templateVars);

});

app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});


app.get("/urls.json", (req, res) => {
  res.json(urlDatabase);
});

app.get("/hello", (req, res) => {
  res.send("<html><body>Hello <b>World</b></body></html>\n");
});

app.get("/urls", (req, res) => {
  const templateVars = { urls: urlDatabase };
  console.log(templateVars)
  res.render("urls_index", templateVars);
});


app.get("/urls/new", (req, res) => {
  console.log(req.params)
  res.render("urls_new");
});


app.get("/urls/:shortURL", (req, res) => {
  //parse anything after : 
  const shortURL = req.params.shortURL

  const templateVars = {
    shortURL: shortURL,
    longURL: urlDatabase[shortURL]
  };
  console.log(templateVars)
  res.render("urls_show", templateVars);
});


app.post("/urls", (req, res) => {
  console.log(req.body);  // Log the POST request body to the console


  const longURL = req.body.longURL
  const shortURL = generateRandomString(6)
  
  urlDatabase[shortURL] = longURL

  console.log(urlDatabase)
  res.send("Ok");         // Respond with 'Ok' (we will replace this)
});




