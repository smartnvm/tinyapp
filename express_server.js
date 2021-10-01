

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
  name: 'session',
  keys: ['test'],
  maxAge: 24 * 60 * 60 * 1000 // 24 hours
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
  authenticateUser } = require('./src/helpers');


const usersdB = {
  "testUser": {
    id: "testUser",
    name: 'test',
    email: "test@test.com",
    password: "password",
    urls: {}
  },
};

const urlsDatabase = {};


app.listen(PORT, () => {
  console.log(`tinyURL app listening on port ${PORT}!`);
  console.log(`(c) AJ - 2021}!`);
  console.log(`----------------------------------------`);
});


const varInit = (statusCode, errCode, user, shortURL, longURL, count, date) => {
  const templateVars = { statusCode, errCode, user, shortURL, longURL, count, date };
  return templateVars;
};

app.get("/", (req, res) => {
  res.redirect('/urls');
});


app.get("/urls", (req, res) => {
   
  console.log("urlsDatabase:", urlsDatabase);
  const userId = req.session.user_id;
  const user = usersdB[userId];
  if (!user) {
    res.redirect("/login");
    return;
  }
  console.log(user)
   
  const templateVars = varInit(200, 200, user);
  res.render("urls_index", templateVars);
});

app.get("/urls/new", (req, res) => {
  const userId = req.session.user_id;
  const user = usersdB[userId];

  if (!user) {
    res.redirect("/login");
    return;
  }
  const templateVars = varInit(200, 200, user);
  res.render('urls_new', templateVars);
});

app.get("/u/:shortURL", (req, res) => {
  const shortURL = req.params.shortURL;
  const longURL = urlsDatabase[shortURL].longURL;
  const userId = req.session.user_id;

  const user = usersdB[userId];

  const IP = req.headers['x-forwarded-for'] || req.socket.remoteAddress

  if (urlsDatabase[shortURL]) {
    //count = Number(parsedCookie) + 1;
    urlsDatabase[shortURL].clicks++// = count;
    urlsDatabase[shortURL].ipList = { 'testIp' : 1}
    urlsDatabase[shortURL].ipList[IP] = 1// = count;
    const uniqueVisitors = Object.keys(urlsDatabase[shortURL].ipList).length-1 // = count;
    urlsDatabase[shortURL].uniqueVisitor = uniqueVisitors
    console.log('visitors:',urlsDatabase[shortURL].uniqueVisitor)
    //req.session.shortURL = count;
   res.redirect(longURL);
    return;
  }

  res.redirect('/404');
});

app.post("/urls", (req, res) => {

  const userId = req.session.user_id;
  const user = usersdB[userId];


  if (!user) {
    res.redirect("/login");
    return;
  }

  const longURL = req.body.longURL;

  const urlExist = checkUrlExists(user.urls, longURL);
  let templateVars = varInit(200, null, user);


  if (urlExist) {
    templateVars.errCode = 410,
    res.render('urls_new', templateVars);
    return;
  } else if (!validateURL(longURL)) {
    templateVars.errCode = 406;
    res.render('urls_new', templateVars);
    return;
  }

  const shortURL = generateRandomString(6);
  const timestamp = getTimestamp();

  const clicks = 0;

  urlsDatabase[shortURL] = { longURL, timestamp, clicks };

  user.urls[shortURL] = { longURL, timestamp, clicks };
  urlsDatabase[shortURL] =  { longURL, timestamp, clicks };

  templateVars = varInit(200, null, user, shortURL, longURL, clicks, timestamp);
  res.render("urls_index", templateVars);

});



app.post("/urls/:shortURL/delete", (req, res) => {
  const userId = req.session.user_id;
  const user = usersdB[userId];


  if (!user) {
    res.redirect("/login");
    return;
  }
  const shortURL = req.params.shortURL;
  delete user.urls[shortURL];
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
  } else if (!user.urls[shortURL]) {
    res.redirect('/404');
    return;
  }
  let longURL = user.urls[shortURL].longURL;
  let clicks = user.urls[shortURL].clicks;
  const templateVars = varInit(200, 200, user, shortURL, longURL, clicks);
  res.render("urls_show", templateVars);
});

app.post("/urls/:shortURL", (req, res) => {

  const newURL = req.body.newURL;
  const shortURL = req.params.shortURL;

  const userId = req.session.user_id;
  const user = usersdB[userId];
  let longURL = user.urls[shortURL].longURL;

  const templateVars = varInit(200, 200, user, shortURL, longURL);

  if (!validateURL(newURL)) {
    templateVars.errCode = 406;
    res.render("urls_show", templateVars);
    return;
  }
  longURL = newURL;
  urlsDatabase[shortURL] = newURL;
  user.urls[shortURL].longURL = newURL;
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
    req.session.user_id =  user.id;
    templateVars.statusCode = 200;
    res.render("urls_index", templateVars);
    return;
  }

  const statusCode = authStatus.num;
  console.log(authStatus, statusCode);
  templateVars = varInit(statusCode, null, user);
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
  req.session.user_id =  newUser.id;
  
  res.redirect("/urls");

});


app.get("/404", (req, res) => {
  const userId = req.session.user_id;
  const user = usersdB[userId];
  const templateVars = varInit(200, 404, user);
  res.render("err_page", templateVars);
});


