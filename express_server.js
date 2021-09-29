

const express = require("express");
const app = express();
const PORT = 8080;

app.set("view engine", "ejs");

const bodyParser = require("body-parser");
app.use(bodyParser.urlencoded({ extended: true }));

const cookies = require("cookie-parser");
app.use(cookies());

const { generateRandomString, validateURL, getKeyByValue } = require('./src/appFn')

const urlDatabase = {
  "b2xVn2": "http://www.lighthouselabs.ca",
  "9sm5xK": "http://www.google.com"
};


app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});


app.get("/", (req, res) => {
  res.redirect('urls')
});


//main app view "urls_index"
app.get("/urls", (req, res) => {
  const templateVars = {
    errCode: 300,
    username: req.cookies["username"],
    urls: urlDatabase
  };
  console.log(templateVars)
  res.render("urls_index", templateVars);
});


app.get("/urls/new", (req, res) => {
  const templateVars = {
    errCode: 200,
    username: req.cookies["username"],
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
  
  username = req.cookies["username"]
  
  const longURL = req.body.longURL
  console.log(req.body)

  const urlExist = getKeyByValue(urlDatabase, longURL)

  if (urlExist) {
    const templateVars = {
      errCode: 410,
      username: username,
      urls: urlDatabase
    }
    //console.log({ errCode })
    res.render('urls_new', templateVars)
    return

  }

  //return
  if (!validateURL(longURL)) {
    const templateVars = {
      errCode: 406,
      username: username,
      urls: urlDatabase
    }
    //console.log({ errCode })
    res.render('urls_new', templateVars)
    return
  }


  const shortURL = generateRandomString(6)
  urlDatabase[shortURL] = longURL

  const templateVars = {
    errCode: 200,
    username: username,
    urls: urlDatabase
  };
  res.render("urls_index", templateVars)
});

app.post("/login", (req, res) => {

  const username = req.body.username

  if (username.length < 6) {
    const templateVars = {
      errCode: 400,
      urls: urlDatabase,
      username: undefined
    }
    console.log({ templateVars })
    res.render('urls_index', templateVars)
    return
  }

  res.cookie('username', username)

  const templateVars = {
    errCode: 200,
    urls: urlDatabase,
    username: username
  }

  console.log(templateVars)
  res.render("urls_index", templateVars);
  return

  // res.redirect("/")
  return
})

app.post("/logout", (req, res) => {
  res.clearCookie("username", req.body.username);
  const templateVars = {
    errCode: 200,
    username: undefined, //req.cookies["username"]
    urls: urlDatabase
  }

  res.render("urls_index", templateVars);
  return
})


app.post("/urls/:shortURL/delete", (req, res) => {
  const shortURL = req.params.shortURL
  delete urlDatabase[shortURL]
  res.redirect("/")

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
    errCode: 200,
    username: req.cookies["username"]
  };

  console.log(templateVars)

  res.render("urls_show", templateVars);
});




//retrieve user input 
app.post("/urls/:shortURL", (req, res) => {

  const newURL = req.body.newURL
  const oldKey = req.params.shortURL

  console.log('oldKey:', oldKey, "new:", newURL)
  oldKey
  if (!validateURL(newURL)) {
    const templateVars = {
      shortURL: oldKey,
      longURL: urlDatabase[oldKey],
      errCode: 406,
      username: req.cookies["username"]
    };

    console.log(templateVars)
    res.render("urls_show", templateVars);
    return
  }

  urlDatabase[oldKey] = newURL
  res.redirect("/")

})



//main app view "urls_index"
app.get("/:random", (req, res) => {

  const templateVars = {
    errCode: 404,
    username: req.cookies["username"]
  }

  console.log(templateVars)
  res.render("err_page", templateVars);
})