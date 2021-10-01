

const express = require("express");
const app = express();
const PORT = 8080;

app.set("view engine", "ejs");

const bodyParser = require("body-parser");
app.use(bodyParser.urlencoded({ extended: true }));

const cookies = require("cookie-parser");
app.use(cookies());

app.use(express.static("src"));


const bcrypt = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');

const {
  generateRandomString,
  validateURL,
  getKeyByValue,
  fetchMyIP,
  getTimestamp } = require('./src/appFn')


const usersdB = {
  "userRandomID": {
    id: "userRandomID",
    name: 'name1',
    email: "ajsmartnvxm",
    password: "purple-monkey-dinosaur",
    urls: {}
  },
  "user2RandomID": {
    id: "user2RandomID",
    name: 'name2',
    email: "user2@example.com",
    password: "dishwasher-funk",
    urls: {}
  }
}

const urlsDatabase = {}


app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});


const varInit = (statusCode, errCode, user, shortURL, longURL, count, date) => {

  const templateVars = { statusCode, errCode, user, shortURL, longURL, count, date }
  return templateVars
}


app.get("/", (req, res) => {
  res.redirect('/urls')
});


app.get("/urls", (req, res) => {
  //fetch current user_id from cookie
  const userId = req.cookies["user_id"]
  const user = usersdB[userId]

  if (!user) {
    res.redirect("/login")
    return
  }
  //let parsedCookie = req.cookies[shortURL]
  //const count = parsedCookie.count
  //const date = parsedCookie.dateCreated
  const templateVars = varInit(200, 200, user)//,shortURL,null,count, date)
  console.log(`${user.name} URLs`, user.urls, '\n-------------\n', urlsDatabase)
  res.render("urls_index", templateVars);
});

app.get("/urls/new", (req, res) => {
  const userId = req.cookies["user_id"]
  const user = usersdB[userId]

  if (!user) {
    res.redirect("/login")
    return
  }
  const templateVars = varInit(200, 200, user)

  res.render('urls_new', templateVars)
});

app.get("/u/:shortURL", (req, res) => {
  const shortURL = req.params.shortURL
  const longURL = urlsDatabase[shortURL]

  let parsedCookie = req.cookies[shortURL]

  console.log(parsedCookie)

  if (urlsDatabase[shortURL]) {
    count = parsedCookie.count + 1
    res.cookie([shortURL], { count: count, dateCreated: parsedCookie.dateCreated })
    res.redirect(longURL);
    return
  }

  res.redirect('/404')
})

app.post("/urls", (req, res) => {

  const userId = req.cookies["user_id"]
  const user = usersdB[userId]


  if (!user) {
    res.redirect("/login")
    return
  }

  const longURL = req.body.longURL
  let urlExist = getKeyByValue(user.urls, longURL)
  let templateVars = varInit(200, null, user)

  if (urlExist) {
    templateVars.errCode = 410,
      res.render('urls_new', templateVars)
    return
  } else if (!validateURL(longURL)) {
    templateVars.errCode = 406
    res.render('urls_new', templateVars)
    return
  }

  const shortURL = generateRandomString(6)
  user.urls[shortURL] = longURL
  urlsDatabase[shortURL] = longURL


  const timestamp = getTimestamp()
    res.cookie([shortURL], { count: 0, dateCreated: timestamp })
  templateVars = varInit(200, null, user, shortURL, longURL, 0, timestamp)
  res.render("urls_index", templateVars)
});



app.post("/urls/:shortURL/delete", (req, res) => {
  const shortURL = req.params.shortURL

  const userId = req.cookies["user_id"]
  const user = usersdB[userId]
  delete user.urls[shortURL]
  res.redirect("/urls")

});


app.get("/urls/:shortURL", (req, res) => {
  //parse anything after : 
  const shortURL = req.params.shortURL
  const userId = req.cookies["user_id"]
  const user = usersdB[userId]

  if (!user.urls[shortURL]) {
    res.redirect('/404')
    return
  }

  const templateVars = varInit(200, 200, user, shortURL, user.urls[shortURL])
  res.render("urls_show", templateVars);
});

app.post("/urls/:shortURL", (req, res) => {

  const newURL = req.body.newURL
  const shortURL = req.params.shortURL
  const userId = req.cookies["user_id"]
  const user = usersdB[userId]

  const templateVars = varInit(200, 200, user, shortURL, user.urls[shortURL])

  if (!validateURL(newURL)) {
    templateVars.errCode = 406
    res.render("urls_show", templateVars);
    return
  };
  user.urls[shortURL] = newURL
  urlsDatabase[shortURL] = newURL
  res.redirect("/urls")
  return
})


const findUserByEmail = (email, users) => {
  for (let userId in users) {
    const user = users[userId]
    if (email === user.email) return user
  }
  return false
}

const authenticateUser = (email, password, users) => {
  console.log(email, password)
  if (password === undefined) return false
  const user = findUserByEmail(email, users)
  if (user ) {
    validatePassword = bcrypt.compareSync(password, user.password)
    if (validatePassword) {

       return user
      }

  }
  return false
}

app.post("/logout", (req, res) => {
  res.clearCookie("user_id", req.body.username);
  const templateVars = varInit(200, 200, null)
  res.redirect("/login")
  return
})

app.get("/login", (req, res) => {
  const templateVars = varInit(200, null, null)
  res.render('login', templateVars)
})


app.post("/login", (req, res) => {
  const username = req.body.username
  const password = req.body.password
  const user = findUserByEmail(username, usersdB)

  console.log(username, password, user)
  authStatus = authenticateUser(username,password, usersdB)

  const templateVars = varInit(null, null, user)

  if (user && authStatus) {
    res.cookie('user_id', user.id)
    templateVars.statusCode = 200
    res.render("urls_index", templateVars)
    return
  } else if (user && !authStatus) {
    templateVars.statusCode = 403
    res.render('login', templateVars)
    return

  } else if (!user && username.length > 0) {
    templateVars.statusCode = 400
    res.render('login', templateVars)
    return

  }

  templateVars.statusCode = 410
  res.render('login', templateVars)
  return

})


app.get("/register", (req, res) => {
  const templateVars = varInit(200, 200, null)

  res.render("register", templateVars)

})


app.post("/register", (req, res) => {
  const { name, email, strPassword } = req.body
  const user = findUserByEmail(email, usersdB)
  const templateVars = varInit(200, null, user)
  if (user) {
    templateVars.statusCode = 410;
    res.render("register", templateVars)
    return
  } else if ((email.length === 0) || (strPassword.length === 0)) {
    templateVars.statusCode = 400;
    res.render("register", templateVars)
    return
  }
  

  password = bcrypt.hashSync(strPassword, 10);


  const userId = uuidv4().substring(0, 6)
  let urls = {}
  newUser = { id: userId, name, email, password, urls }
  usersdB[userId] = newUser

  console.log(newUser)
  //log the user => ask the browser to store in cookie
  res.cookie('user_id', userId)
  
  res.redirect("/urls")

})

app.get("/404", (req, res) => {
  const userId = req.cookies["user_id"]
  const user = usersdB[userId]
  const templateVars = varInit(200, 404, user)
  res.render("err_page", templateVars);
})

