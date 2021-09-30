

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
    password: "purple-monkey-dinosaur"
  },
  "user2RandomID": {
    id: "user2RandomID",
    name: 'name2',
    email: "user2@example.com",
    password: "dishwasher-funk"
  }
}



const urlDatabase = {
  "b2xVn2": "http://www.lighthouselabs.ca",
  "9sm5xK": "http://www.google.com"
};


app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});


app.get("/", (req, res) => {
  res.redirect('/login')
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
    user: user,
    urls: urlDatabase
  };
  res.render("urls_index", templateVars);
});


app.get("/urls/new", (req, res) => {
  const templateVars = {
    statusCode: 200,
    user: usersdB[req.cookies["user_id"]],
    urls: urlDatabase
  }

  res.render('urls_new', templateVars)
});

//found
app.get("/u/:shortURL", (req, res) => {
  const shortURL = req.params.shortURL
  const longURL = urlDatabase[shortURL]
  res.redirect(longURL);
})

//retrieve user input 
app.post("/urls", (req, res) => {

  username = req.cookies["user_id"]

  const longURL = req.body.longURL
  const urlExist = getKeyByValue(urlDatabase, longURL)

  if (urlExist) {
    const templateVars = {
      statusCode: 410,
      username: username,
      urls: urlDatabase
    }
  
    res.render('urls_new', templateVars)
    return

  }

  //return
  if (!validateURL(longURL)) {
    const templateVars = {
      statusCode: 406,
      username: username,
      urls: urlDatabase
    }
    
    res.render('urls_new', templateVars)
    return
  }


  const shortURL = generateRandomString(6)
  urlDatabase[shortURL] = longURL

  const templateVars = {
    statusCode: 200,
    username: username,
    urls: urlDatabase
  };
  res.render("urls_index", templateVars)
});



app.post("/urls/:shortURL/delete", (req, res) => {
  const shortURL = req.params.shortURL
  delete urlDatabase[shortURL]
  res.redirect("/urls")

});


// //show uRL card view "urls_show"
app.get("/urls/:shortURL", (req, res) => {
  //parse anything after : 
  const shortURL = req.params.shortURL

  if (!urlDatabase[shortURL]) {
    res.redirect('/404')
    return
  }

  const templateVars = {
    shortURL: shortURL,
    longURL: urlDatabase[shortURL],
    statusCode: 200,
    username: req.cookies["user_id"]
  };


  res.render("urls_show", templateVars);
});




//retrieve user input 
app.post("/urls/:shortURL", (req, res) => {

  const newURL = req.body.newURL
  const oldKey = req.params.shortURL

  oldKey
  if (!validateURL(newURL)) {
    const templateVars = {
      shortURL: oldKey,
      longURL: urlDatabase[oldKey],
      statusCode: 406,
      username: req.cookies["user_id"]
    };

    res.render("urls_show", templateVars);
    return
  }

  urlDatabase[oldKey] = newURL
  res.redirect("/urls")

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
    user: undefined, //req.cookies["user_id"]
    urls: urlDatabase
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
    statusCode:200,
    urls: urlDatabase
  }


  if (user && authStatus) {
    //create cookie with user name
    res.cookie('user_id', user.id)
    res.render("urls_index", templateVars)
    templateVars.user = user
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
  
  newUser = { id: userId, name, email, password }
  usersdB[userId] = newUser

  //log the user => ask the browser to store in cookie
  res.cookie('user_id', userId)
  res.redirect("/urls")

})




// //main app view "urls_index"
// app.get("/:random", (req, res) => {

//   const templateVars = {
//     statusCode: 404,
//     username: req.cookies['user_id']
//   }

//   console.log(templateVars)
//   res.render("err_page", templateVars);
// })