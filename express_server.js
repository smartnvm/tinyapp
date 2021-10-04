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
  getURLsByUserId,
  fetchLocationByIP } = require('./src/helpers');


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
    uClicks: 0,
    visit: {},
    ips: {},
  }
};

//create new URL object
const createNewURL = (shortURL, longURL, userId, timestamp, clicks, uClicks, ip, visit) => {

  let newURL = { shortURL, userId, longURL, timestamp, clicks, uClicks, 'ips': {}, 'visit': {} }
  return newURL
}

//initalize template variable passed to ejs view
const varInit = (loggedIn, errCode, user, urls) => {
  const templateVars = { loggedIn, errCode, user, urls };
  return templateVars;
};

app.listen(PORT, () => {
  console.log(`tinyURL listening on port ${PORT}!`);
  console.log(`(c) AJ - 2021!`);
  console.log(`----------------------------------------`);
});


//redirct to /urls if user hit /
app.get("/", (req, res) => {
  res.redirect('/urls');
});


app.get("/urls", (req, res) => {
  const userId = req.session.user_id;
  const user = usersdB[userId];

  //check if user is logged in, and redirect to login if not
  if (!user) {
    res.redirect("/login");
    return;
  }

  //retrieve user specific urls
  const urls = getURLsByUserId(userId, urlsDatabase)

  //initalize template variable before passing to ejs view
  const templateVars = varInit(true, 200, user, urls);
  res.render("urls_index", templateVars);
});


//create new URL page
app.get("/urls/new", (req, res) => {
  const userId = req.session.user_id;
  const user = usersdB[userId];

  //check if user is logged in, and redirect to login if not
  if (!user) {
    res.redirect("/login");
    return;
  }

  //initalize template variable before passing to ejs view
  const templateVars = varInit(true, 200, user, null);
  res.render('urls_new', templateVars);
});


app.post("/urls", (req, res) => {
  const userId = req.session.user_id;
  const user = usersdB[userId];
  //check if user is logged in, and redirect to login if not
  if (!user) {
    res.redirect("/login");
    return;
  }

  //parse longURL
  const longURL = req.body.longURL;
  let urls = getURLsByUserId(userId, urlsDatabase)

  //check if URL already exist
  const urlExist = checkUrlExists(urls, longURL);

  if (urlExist) {
    //initalize template variable before passing to ejs 
    //errCode 410, url already exists
    let templateVars = varInit(true, 410, user, urls);
    res.render('urls_new', templateVars);
    return;
  } else if (!validateURL(longURL)) {
    //initalize template variable before passing to ejs 
    //errCode 406, invalid URL format
    let templateVars = varInit(true, 406, user, urls);
    res.render('urls_new', templateVars);
    return;
  }

  //generate random string of (6) characters
  const shortURL = generateRandomString(6);
  const timestamp = getTimestamp();

  //fetch IP address of visitor
  const IP = req.headers['x-forwarded-for'] || req.socket.remoteAddress

  //create newURL record
  const newURL = createNewURL(shortURL, longURL, userId, timestamp, 0, 0, IP)

  //write to master urlsDatabase
  urlsDatabase[shortURL] = newURL

  res.redirect("/urls")
});



app.get("/u/:shortURL", (req, res) => {
  const shortURL = req.params.shortURL;
  //we don't care if user is not logged in 
  //check to see if URL exist in urlsDatabase
  if (!urlsDatabase[shortURL]) {
    res.redirect('/404');
    return;
  }

  //found URL in the database
  let longURL = urlsDatabase[shortURL].longURL;

  //increment click counter
  urlsDatabase[shortURL].clicks++

  //fetch visitor IP
  let IP = req.headers['x-forwarded-for'] || req.socket.remoteAddress;

  //store IP for the given shortURL,
  //use object to avoid having duplicates :D
  urlsDatabase[shortURL].ips[IP] = 1;
  //get keys length 
  const uniqueIP = Object.keys(urlsDatabase[shortURL].ips).length
  urlsDatabase[shortURL].uClicks = uniqueIP

  //generate uuid for each click 
  const uuid = uuidv4().substring(0, 5)

  //API call to fetch user location based on IP
  fetchLocationByIP(IP, (error, country) => {
    if (error) {
      return `❌ ERROR: ${error.message}`
    }
    visitor = {
      timestamp: getTimestamp(),
      location: country
    }

    //add location and time stamp for the visit uuid
    urlsDatabase[shortURL].visit[uuid] = visitor
  })
  if (!longURL.includes('http://') || !longURL.includes('https://')) {
    //add 'http://' if URL does not have it
    //this is to avoid 404 when the URL actually exists
    longURL = 'http://' + longURL
  }

  //redirect to longURL
  res.redirect(longURL);
});



app.post("/urls/:shortURL/delete", (req, res) => {
  const userId = req.session.user_id;
  const user = usersdB[userId];
  //check if user is logged in, and redirect to login if not
  if (!user) {
    res.redirect("/login");
    return;
  }
  //parse shortURL to be deleted
  const shortURL = req.params.shortURL;

  //filter urls for specific user
  //prevent user from deleting other users' URLs
  urls = getURLsByUserId(userId, urlsDatabase)
  if (!checkUrlExists(urls, urlsDatabase[shortURL].longURL)) {
    res.redirect('/404')
    return
  }
  
  delete urlsDatabase[shortURL];
  
  console.log('urlsdB', urlsDatabase)
  res.redirect("/urls");

});

//Edit URL page
app.get("/urls/:shortURL", (req, res) => {
  //parse anything after :
  const shortURL = req.params.shortURL;
  const userId = req.session.user_id;
  const user = usersdB[userId];
  //check if user is logged in, and redirect to login if not
  if (!user) {
    res.redirect("/login");
    return;
  }

  //retrieve user specific urls
  const urls = getURLsByUserId(userId, urlsDatabase)

  //check to see if url exist in the user's urls
  //redirect to 404 if not found
  if (!urls[shortURL]) {
    res.redirect('/404');
    return;
  }

  //initalize template variable before passing to ejs view
  const templateVars = varInit(true, 200, user, urls[shortURL])
  res.render("urls_show", templateVars);
});


// submit New URL 
app.post("/urls/:shortURL", (req, res) => {
  const userId = req.session.user_id;
  const user = usersdB[userId];
  //check if user is logged in, and redirect to login if not
  if (!user) {
    res.redirect("/login");
    return;
  }

  const longURL = req.body.newURL;
  const shortURL = req.params.shortURL;

  //check if URL format is valid 
  //render edit page if URL format is invalid
  if (!validateURL(longURL)) {
    const urls = urlsDatabase[shortURL]
    const templateVars = varInit(true, 406, user, urls);
    res.render("urls_show", templateVars);
    return;
  }

  //URL is valid - write to urlsDatabase
  urlsDatabase[shortURL].longURL = longURL;
  
  //redirect to myURLs page
  res.redirect("/urls");
  return;
});



app.post("/logout", (req, res) => {
  //clears cookie and redirect to login page
  req.session = null;
  res.redirect("/login");
  return;
});

app.get("/login", (req, res) => {
  //initialize template variable, 
  //if we are here we are not logged in
  const templateVars = varInit(false, null, null, null);
  res.render('login', templateVars);
});


app.post("/login", (req, res) => {
  //parse user email and password
  const email = req.body.username;
  const password = req.body.password;

  //retrieve user from user database for matching email
  const user = getUserByEmail(email, usersdB);
  
  //authenticate if matching user found
  const authStatus = authenticateUser(email, password, user);

  //authentication success - redirect to myURLs
  if (user && authStatus.num === 200) {
    req.session.user_id = user.id;
    res.redirect("/urls")
    return;
  }

  //authentication failed - 
  //redirect to login with appropriate error message
  const templateVars = varInit(false, authStatus.num, user, null);
  res.render('login', templateVars);
  return;

});


//register new user
app.get("/register", (req, res) => {
  //initalize template vars 
  const templateVars = varInit(false, null, null, null);
  res.render("register", templateVars);

});


app.post("/register", (req, res) => {
  const { name, email, strPassword } = req.body;
  const user = getUserByEmail(email, usersdB);
  
  //check if user exist
  if (user) {
    //errCode 410: user exist
    const templateVars = varInit(false, 410, user, null);
    res.render("register", templateVars);
    return;
  } else if (!email || !strPassword) {
    //errCode 400: Invalid user name or password
    const templateVars = varInit(false, 400, user, null);
    res.render("register", templateVars);
    return;
  }

  //user and password are OK - create new
  const newUser = createUser(name, email, strPassword);
  //wirte new user to usersdB
  usersdB[newUser.id] = newUser;

  //create session cookie
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
  //allowed routes
  const okRoute = ['/', '/urls', '/urls/new', '/u/', 'register', 'login']
  const url = req.params.any
  //redirect to 404 if route is not allowed
  if (!okRoute.includes(url)) {
    res.redirect('/404')
  }

});