const express = require("express");
const app = express();
const PORT = 8080;

app.set("view engine", "ejs");

const bodyParser = require("body-parser");
app.use(bodyParser.urlencoded({ extended: true }));


const generateRandomString = (length) => {
  let shortURL = '';
  let characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@$^()-+][><~=';
  let charLength = characters.length
  for (i = 0; i < length; i++) {

    // let num = Math.floor((Math.random() * 127))
    // shortURL += String.fromCharCode(num)

    let num = Math.floor((Math.random() * charLength))
    shortURL += characters[num]
  }
  return shortURL
}

const validateURL = (str) => {
  const pattern = new RegExp('^(http?:\\/\\/)?' + // protocol
    '((([a-z\\d]([a-z\\d-]*[a-z\\d])*)\\.)+[a-z]{2,}|' + // domain name
    '((\\d{1,3}\\.){3}\\d{1,3}))' + // OR ip (v4) address
    '(\\:\\d+)?(\\/[-a-z\\d%_.~+]*)*' + // port and path
    '(\\?[;&a-z\\d%_.~+=-]*)?' + // query string
    '(\\#[-a-z\\d_]*)?$', 'i'); // fragment locator

  const pattern2 = new RegExp('^(https?:\\/\\/)?' + // protocol
    '((([a-z\\d]([a-z\\d-]*[a-z\\d])*)\\.)+[a-z]{2,}|' + // domain name
    '((\\d{1,3}\\.){3}\\d{1,3}))' + // OR ip (v4) address
    '(\\:\\d+)?(\\/[-a-z\\d%_.~+]*)*' + // port and path
    '(\\?[;&a-z\\d%_.~+=-]*)?' + // query string
    '(\\#[-a-z\\d_]*)?$', 'i'); // fragment locator

  // console.log('http: ',pattern.test(str))
  // console.log('https:',pattern2.test(str))
  return !!pattern.test(str) || !!pattern2.test(str);
}


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
  const templateVars = { urls: urlDatabase };
  //console.log(templateVars)
  res.render("urls_index", templateVars);
});


app.get("/urls/new", (req, res) => {
  const errCode = 200
  console.log({ errCode })
  res.render('urls_new', { errCode })
});


//found
app.get("/u/:shortURL", (req, res) => {
  const shortURL = req.params.shortURL
  const longURL = urlDatabase[shortURL]
  res.redirect(longURL);
})

//retrieve user input 
app.post("/urls", (req, res) => {
  const longURL = req.body.longURL
  console.log(req.body)
  //return
  if (!validateURL(longURL)) {
    errCode = 406
    console.log({ errCode })
    res.render('urls_new', { errCode })
    return
  }
  const shortURL = generateRandomString(6)
  urlDatabase[shortURL] = longURL
  res.redirect("/")

});



app.post("/urls/:shortURL/delete", (req, res) => {
  const shortURL = req.params.shortURL
  delete urlDatabase[shortURL]
  res.redirect("/")

});


// //show uRL card view "urls_show"
app.get("/urls/:shortURL", (req, res) => {
  //parse anything after : 
  const shortURL = req.params.shortURL

  if (!urlDatabase.hasOwnProperty(shortURL)) {
    res.redirect('/error')

  }

  const templateVars = {
    shortURL: shortURL,
    longURL: urlDatabase[shortURL],
    errCode : 200
  };

  
  console.log(templateVars)
  oldKey = shortURL;

  res.render("urls_show", templateVars);
});


const getKeyByValue = (object, value) => {
  return Object.keys(object).find(key => object[key] === value);
}

//retrieve user input 
app.post("/urls/:shortURL", (req, res) => {

  const newURL = req.body.newURL
  const oldKey = req.params.shortURL

  console.log('oldKey:', oldKey, "new:", newURL)

  if (!validateURL(newURL)) {
    const templateVars = {
      shortURL: oldKey,
      longURL: urlDatabase[oldKey],
      errCode : 406
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
  const templateVars = { errCode: 404 }

  console.log(templateVars)
  res.render("err_page", templateVars);
})