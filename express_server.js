/*
Project Name: tinyURL
Description: this app reduces URL to unique string 6 characters long
Version: 1.0.0
Author: AJ
Github: https://github.com/smartnvm/tinyapp

*/

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

app.listen(PORT, () => {
  console.log(`tinyURL listening on port ${PORT}!`);
  console.log(`(c) AJ - 2021}!`);
  console.log(`----------------------------------------`);
});


const varInit = (statusCode, errCode, user, urls) => {
  const templateVars = { statusCode, errCode, user, urls };
  return templateVars;
};

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
  console.log(urls)
  const templateVars = varInit(200, 200, user, urls);
  res.render("urls_index", templateVars);
});

app.get("/urls/new", (req, res) => {
  const userId = req.session.user_id;
  const user = usersdB[userId];

  if (!user) {
    res.redirect("/login");
    return;
  }

  let urls = getURLsByUserId(userId, urlsDatabase)
  const templateVars = varInit(200, 200, user, urls);
  res.render('urls_new', templateVars);
});


const createNewURL = (shortURL, longURL, userId, timestamp, clicks, uClicks, ip) => {

  let newURL = { shortURL, userId, longURL, timestamp, clicks, uClicks, 'ips': {} }
  newURL.ips[ip] = 1
  return newURL
}

app.post("/urls", (req, res) => {

  const userId = req.session.user_id;
  const user = usersdB[userId];
  if (!user) {
    res.redirect("/login");
    return;
  }

  const longURL = req.body.longURL;
  console.log('check current user URLs!');
  console.log('.....................')
  let urls = getURLsByUserId(userId, urlsDatabase)
  const urlExist = checkUrlExists(urls, longURL);

  console.log(urlExist)

  if (urlExist) {
    let templateVars = varInit(200, 410, user, urls);
    res.render('urls_new', templateVars);
    return;
  } else if (!validateURL(longURL)) {
    let templateVars = varInit(200, 406, user, urls);
    res.render('urls_new', templateVars);
    return;
  }

  const shortURL = generateRandomString(6);
  const timestamp = getTimestamp();
  const clicks = 0;

  const IP = req.headers['x-forwarded-for'] || req.socket.remoteAddress

  const newURL = createNewURL(shortURL, longURL, userId, timestamp, 0, 0, IP)
  urlsDatabase[shortURL] = newURL

  console.log(`${shortURL} written to database!`)
  console.log('.....................')
  console.log(urlsDatabase)


  urls = getURLsByUserId(userId, urlsDatabase)

  console.log('filtered user URLs!')
  console.log('.....................')
  console.log(urls)
  templateVars = varInit(200, null, user, urls)


  res.redirect("urls")//, templateVars);
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

  console.log(urlsDatabase)
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

  const templateVars = varInit(200, 200, user, urls)
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
    const templateVars = varInit(200, 406, user, urls);
    res.render("urls_show", templateVars);
    return;
  }

  urlsDatabase[shortURL].longURL = longURL;
  const urls = urlsDatabase[shortURL]
  const templateVars = varInit(200, 200, user, urls);
  res.redirect("/urls");
  return;
});



app.post("/logout", (req, res) => {
  req.session = null;
  res.redirect("/login");
  return;
});

app.get("/login", (req, res) => {
  const templateVars = varInit(200, null, null);
  res.render('login', templateVars);
});



app.post("/login", (req, res) => {
  const email = req.body.username;
  const password = req.body.password;
  const user = getUserByEmail(email, usersdB);
  const authStatus = authenticateUser(email, password, user);

  console.log(password);

  // authStatus = authenticateUser(user.email, password, usersdB)
  console.log('-----------login:------', authStatus);
  let templateVars = varInit(null, null, user);

  if (user && authStatus.num === 200) {
    req.session.user_id = user.id;
    templateVars.statusCode = 200;
    res.render("urls_index", templateVars);
    return;
  }
  const statusCode = authStatus.num;
  console.log(authStatus, statusCode);

  const urls = getURLsByUserId(user.userId, urlsDatabase)
  templateVars = varInit(statusCode, null, user, urls);
  res.render('login', templateVars);
  return;

});



app.get("/register", (req, res) => {
  const templateVars = varInit(200, 200, null);
  res.render("register", templateVars);

});


app.post("/register", (req, res) => {
  const { name, email, strPassword } = req.body;
  const user = getUserByEmail(email, usersdB);
  const templateVars = varInit(200, null, user);
  if (user) {
    templateVars.statusCode = 410;
    res.render("register", templateVars);
    return;
  } else if (!email || !strPassword) {
    templateVars.statusCode = 400;
    res.render("register", templateVars);
    return;
  }

  const newUser = createUser(name, email, strPassword);
  usersdB[newUser.id] = newUser;

  console.log(newUser);
  //log the user => ask the browser to store in cookie
  req.session.user_id = newUser.id;

  res.redirect("/urls");

});


app.get("/404", (req, res) => {
  const userId = req.session.user_id;
  const user = usersdB[userId];
  const templateVars = varInit(200, 404, user);
  res.render("err_page", templateVars);
});


