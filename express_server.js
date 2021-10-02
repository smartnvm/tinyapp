/**********************************************************/
// Project Name: tinyURL
// Description: this app reduces URL to unique string 6 characters long
// Version: 1.0.0
// Author: AJ
// Github: https://github.com/smartnvm/tinyapp
//
/**********************************************************/

const express = require("express");
const app = express();
const PORT = 8080;

app.set("view engine", "ejs");

const bodyParser = require("body-parser");
app.use(bodyParser.urlencoded({ extended: true }));

const session = require("cookie-session");
const morgan = require('morgan');
app.use(morgan('dev'));

app.use(session({
  name: 'session', keys: ['test'],
  maxAge: 24 * 60 * 60 * 1000
}));



app.use(express.static("src"));


const bcrypt = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');

const {
  generateRandomString,
  validateURL,
  checkUrlExists,
  getTimestamp,
  createUser,
  getUserByEmail,
  authenticateUser,
  getURLsByUserId } = require('./src/helpers');


const usersdB = {
  "testUser": {
    id: "testUser",
    name: 'test',
    email: "test@test.com",
    password: "password",
  },
};

const urlsDatabase = {
  b6UTxQ: {
    userId: "AJ",
    shortURL: 'b6UTxQ',
    longURL: "https://https://github.com/smartnvm/tinyapp",
    timestamp: 'Oct 2 2021 3:57 AM',
    clicks: 0,
    uClicks: 0
  }
};


const createNewURL = (shortURL, longURL, userId, timestamp, clicks, uClicks, ip) => {

  let newURL = { shortURL, userId, longURL, timestamp, clicks, uClicks, 'ips': {} }
  newURL.ips[ip] = 1
  return newURL
}
const varInit = (loggedIn, errCode, user, urls) => {
  const templateVars = { loggedIn, errCode, user, urls };
  return templateVars;
};



app.listen(PORT, () => {
  console.log(`tinyURL listening on port ${PORT}!`);
  console.log(`(c) AJ - 2021}!`);
  console.log(`----------------------------------------`);
});


app.get("/", (req, res) => {
  res.redirect('/urls');
});


app.get("/urls", (req, res) => {
  const userId = req.session.user_id;
  const user = usersdB[userId];
  if (!user) {
    res.redirect("/login");
    return;
  }

  const urls = getURLsByUserId(userId, urlsDatabase)
  const templateVars = varInit(true, 200, user, urls);
  res.render("urls_index", templateVars);
});


app.get("/urls/new", (req, res) => {
  const userId = req.session.user_id;
  const user = usersdB[userId];
  if (!user) {
    res.redirect("/login");
    return;
  }

  const templateVars = varInit(true, 200, user, null);
  res.render('urls_new', templateVars);
});


app.post("/urls", (req, res) => {

  const userId = req.session.user_id;
  const user = usersdB[userId];
  if (!user) {
    res.redirect("/login");
    return;
  }

  const longURL = req.body.longURL;
  let urls = getURLsByUserId(userId, urlsDatabase)
  const urlExist = checkUrlExists(urls, longURL);

  if (urlExist) {
    let templateVars = varInit(true, 410, user, urls);
    res.render('urls_new', templateVars);
    return;
  } else if (!validateURL(longURL)) {
    let templateVars = varInit(true, 406, user, urls);
    res.render('urls_new', templateVars);
    return;
  }

  const shortURL = generateRandomString(6);
  const timestamp = getTimestamp();

  const IP = req.headers['x-forwarded-for'] || req.socket.remoteAddress

  const newURL = createNewURL(shortURL, longURL, userId, timestamp, 0, 0, IP)
  urlsDatabase[shortURL] = newURL

  urls = getURLsByUserId(userId, urlsDatabase)
  templateVars = varInit(true, null, user, urls)
  res.redirect("/urls")
});



app.get("/u/:shortURL", (req, res) => {
  const shortURL = req.params.shortURL;

  if (!urlsDatabase[shortURL]) {
    res.redirect('/404');
    return;
  }
  const longURL = urlsDatabase[shortURL].longURL;

  let IP = req.headers['x-forwarded-for'] || req.socket.remoteAddress;

  urlsDatabase[shortURL].clicks++
  urlsDatabase[shortURL].ips[IP] = 1
  const uniqueIP = Object.keys(urlsDatabase[shortURL].ips).length
  urlsDatabase[shortURL].uClicks = uniqueIP

  res.redirect(longURL);
});



app.post("/urls/:shortURL/delete", (req, res) => {
  const userId = req.session.user_id;
  const user = usersdB[userId];

  if (!user) {
    res.redirect("/login");
    return;
  }

  const shortURL = req.params.shortURL;
  delete urlsDatabase[shortURL];
  res.redirect("/urls");

});


app.get("/urls/:shortURL", (req, res) => {
  //parse anything after :
  const shortURL = req.params.shortURL;
  const userId = req.session.user_id;
  const user = usersdB[userId];

  if (!user) {
    res.redirect("/login");
    return;
  } else if (!urlsDatabase[shortURL]) {
    res.redirect('/404');
    return;
  }

  const urls = urlsDatabase[shortURL]
  const templateVars = varInit(true, 200, user, urls)
  res.render("urls_show", templateVars);
});

app.post("/urls/:shortURL", (req, res) => {

  const userId = req.session.user_id;
  const user = usersdB[userId];
  if (!user) {
    res.redirect("/login");
    return;
  }

  const longURL = req.body.newURL;
  const shortURL = req.params.shortURL;

  if (!validateURL(longURL)) {
    const urls = urlsDatabase[shortURL]
    const templateVars = varInit(true, 406, user, urls);
    res.render("urls_show", templateVars);
    return;
  }

  urlsDatabase[shortURL].longURL = longURL;
  const urls = urlsDatabase[shortURL]
  const templateVars = varInit(true, 200, user, urls);
  res.redirect("/urls");
  return;
});



app.post("/logout", (req, res) => {
  req.session = null;
  res.redirect("/login");
  return;
});

app.get("/login", (req, res) => {
  const templateVars = varInit(false, null, null, null);
  res.render('login', templateVars);
});


app.post("/login", (req, res) => {
  const email = req.body.username;
  const password = req.body.password;
  const user = getUserByEmail(email, usersdB);
  const authStatus = authenticateUser(email, password, user);

  if (user && authStatus.num === 200) {
    req.session.user_id = user.id;
    res.redirect("/urls")
    return;
  }

  const templateVars = varInit(false, authStatus.num, user, null);
  res.render('login', templateVars);
  return;

});



app.get("/register", (req, res) => {
  const templateVars = varInit(false, 200, null, null);
  res.render("register", templateVars);

});


app.post("/register", (req, res) => {
  const { name, email, strPassword } = req.body;
  const user = getUserByEmail(email, usersdB);
  const templateVars = varInit(true, 200, user, null);
  if (user) {
    const templateVars = varInit(true, 410, user, null);
    res.render("register", templateVars);
    return;
  } else if (!email || !strPassword) {
    const templateVars = varInit(true, 400, user, null);
    res.render("register", templateVars);
    return;
  }

  const newUser = createUser(name, email, strPassword);
  usersdB[newUser.id] = newUser;
  req.session.user_id = newUser.id;

  res.redirect("/urls");

});


app.get("/404", (req, res) => {
  const userId = req.session.user_id;
  const user = usersdB[userId];
  const templateVars = varInit(true, 404, user, null);
  res.render("err_page", templateVars);
});


app.get("/:url", (req, res) => {

  const okRoute = ['/', '/urls', '/urls/new', '/u/', 'register', 'login']
  const url = req.params.any

  if (!okRoute.includes(url)) {
    res.redirect('/404')
  }

});