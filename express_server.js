

const express = require("express");
const app = express();
const PORT = 8080;

app.set("view engine", "ejs");

const bodyParser = require("body-parser");
app.use(bodyParser.urlencoded({ extended: true }));

const cookies = require("cookie-parser");
app.use(cookies());

const { v4: uuidv4 } = require('uuid');

const { generateRandomString, validateURL, getKeyByValue } = require('./src/appFn')


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


app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});


app.get("/", (req, res) => {
  res.redirect('/urls')
});


//main app view "urls_index"
app.get("/urls", (req, res) => {
  //fetch current user_id from cookie
  const userId = req.cookies["user_id"]
  const user = usersdB[userId]

  if (!user) {
    res.redirect("/login")
    return
  }

  const templateVars = {
    statusCode: 200,
    user: user
  };
  console.log('user URLs', '\n-------------\n',user.urls)
  
  res.render("urls_index", templateVars);
});


app.get("/urls/new", (req, res) => {
  const userId = req.cookies["user_id"]
  const user = usersdB[userId]

  if (!user) {
    res.redirect("/login")
    return
  }


  const templateVars = {
    statusCode: 200,
    user: user,
    errCode: 200
  }

  res.render('urls_new', templateVars)
});

//found
app.get("/u/:shortURL", (req, res) => {
  const shortURL = req.params.shortURL
  const longURL = user.urls[shortURL]
  res.redirect(longURL);
})

//retrieve user input 
app.post("/urls", (req, res) => {

  const userId = req.cookies["user_id"]
  const user = usersdB[userId]

  if (!user) {
    res.redirect("/login")
    return
  }

  const longURL = req.body.longURL

  let urlExist = getKeyByValue(user.urls, longURL)
  
  
  const templateVars = {
    statusCode: 200,
    user: user
  }
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
  
  res.render("urls_index", templateVars)
});



app.post("/urls/:shortURL/delete", (req, res) => {
  const shortURL = req.params.shortURL

  const userId = req.cookies["user_id"]
  const user = usersdB[userId]


  
  delete user.urls[shortURL]
  res.redirect("/urls")

});


// //show uRL card view "urls_show"
app.get("/urls/:shortURL", (req, res) => {
  //parse anything after : 
  const shortURL = req.params.shortURL
const userId = req.cookies["user_id"]
  const user = usersdB[userId]

  if (!user.urls[shortURL]) {
    res.redirect('/404')
    return
  }


  
  const templateVars = {
    statusCode: 200,
    errCode: 200,
    user: user,
    longURL: user.urls[shortURL],
    shortURL: shortURL
  };


  res.render("urls_show", templateVars);
});

//retrieve user input 
app.post("/urls/:shortURL", (req, res) => {

  const newURL = req.body.newURL
  const shortURL = req.params.shortURL


  const userId = req.cookies["user_id"]
  const user = usersdB[userId]

  const templateVars = {
    statusCode: 200,
    user: user,
    longURL: user.urls[shortURL],
    shortURL: shortURL
  };
  
  if (!validateURL(newURL)) {
    templateVars.errCode = 406
    res.render("urls_show", templateVars);
    return
  };



  
  user.urls[shortURL] = newURL

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
  const user = findUserByEmail(email, users)
  if (user && user.password === password) {
    return user
  }
  return false
}


app.post("/logout", (req, res) => {
  res.clearCookie("user_id", req.body.username);
  const templateVars = {
    statusCode: 200,
    user: null, //req.cookies["user_id"]

  }

  res.redirect("/login")//, templateVars);
  return
})

//login view 
app.get("/login", (req, res) => {
  const templateVars = { user: null, statusCode: 200 }
  res.render('login', templateVars)
})

//login view 
app.post("/login", (req, res) => {

  const username = req.body.username
  const password = req.body.password

  user = findUserByEmail(username, usersdB)
  authStatus = authenticateUser(user.email, password, usersdB)

  const templateVars = {
    user: user,
  }

  if (user && authStatus) {
    //create cookie with user name
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
  const templateVars = { user: null, statusCode: 200 }
  res.render("register", templateVars)

})


//regoster view "
app.post("/register", (req, res) => {
  const { name, email, password } = req.body
  const user = findUserByEmail(email, usersdB)

  const templateVars = {
    statusCode: 200,
    user: user
  };


  if (user) {
    templateVars.statusCode = 410;
    res.render("register", templateVars)
    return
  } else if ((email.length === 0) || (password.length === 0)) {
    templateVars.statusCode = 400;
    res.render("register", templateVars)
    return
  }

  const userId = uuidv4().substring(0, 6)
  let urls = {}
  newUser = { id: userId, name, email, password, urls }
  usersdB[userId] = newUser

  //log the user => ask the browser to store in cookie
  res.cookie('user_id', userId)
  res.redirect("/urls")

})




//main app view "urls_index"
app.get("/404", (req, res) => {
  const userId = req.cookies["user_id"]
  const user = usersdB[userId]

  const templateVars = {
    statusCode: 200,
    errCode: 404,
    user: user
  }
  res.render("err_page", templateVars);
})