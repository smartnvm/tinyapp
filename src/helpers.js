const request = require('request');
const bcrypt = require('bcryptjs'); // bcryptjs/dist/bcrypt');
const { use } = require('chai');

const { v4: uuidv4 } = require('uuid');


//generate random string from a set of allowed characters
const generateRandomString = (length) => {
  let shortURL = '';
  let characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let charLength = characters.length
  for (i = 0; i < length; i++) {
    let num = Math.floor((Math.random() * charLength))
    shortURL += characters[num]
  }
  return shortURL
}

//validate URL with RegExp
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
  return !!pattern.test(str) || !!pattern2.test(str);
}

//get timestamp and return friendly format
const getTimestamp = () => {
  let months = ['Jan', 'Feb', 'Mar', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
    now = new Date(),
    formatted = now.getFullYear() + ' ' + months[now.getMonth() - 1] + ' ' + now.getDate() + ' ' + now.getHours().toString().padStart(2, '0') + ':' + now.getMinutes().toString().padStart(2, '0') + ':' + now.getSeconds().toString().padStart(2, '0');
  return formatted
}


//creates new user
const createUser = (name, email, strPassword) => {
  let password = bcrypt.hashSync(strPassword, 10);
  const userId = uuidv4().substring(0, 6)
  user = { id: userId, name, email, password }
  return user
}

//find user in a database by email
const getUserByEmail = (email, users) => {
  for (let userId in users) {
    const user = users[userId]
    if (email === user.email) return user
  }
  return false
}


//authenticate user 
const authenticateUser = (email, password, user) => {
  let authStatus = {}
  if (user) {

    if (bcrypt.compareSync(password, user.password)) {
      err = 200 //user
      errMsg = 'Hello, ' + user.name

    } else {
      err = 401
      errMsg = 'Invalid password! Try again'
    }
  } else if (!user && email.length > 0) {
    err = 400
    errMsg = 'Error user not found!'
  } else {
    err = 402
    errMsg = 'Invalid user name or password!'
  }

  authStatus.num = err
  authStatus.errMsg = "❌ Error " + err + '\n' + errMsg
  return authStatus
}

//filter urls database by userId
const getURLsByUserId = (userId, urlsdB) => {
  let userURLs = {}
  for (const url in urlsdB) {
    if (urlsdB[url].userId === userId) {
      userURLs[url] = urlsdB[url]
    }
  }
  return userURLs

}

//check if URL exist in dB
const checkUrlExists = (urls, value) => {
  for (const url in urls) {
    if (urls[url].longURL === value) {
      return true
    }
  }
  return false
}

//API call to fetch location based on IP
//returns city and region code, i.e. Ottawa, ON
const fetchLocationByIP = (ip,callback) => {
  let domain = `https://freegeoip.app/json/${ip}`;  
  request(domain, (error, response, body) => {
    if (error) {
      const errMsg = `❌ ERROR: ${error.message}`
      callback(errMsg,null);
    }
    if (response.statusCode !== 200) {
      const errMsg = console.log(`🚩 Status Code ${response && response.statusCode} when fetching URL: ${domain}`);
      return callback(errMsg, null)
    }
    const location = JSON.parse(body).city +', '+ JSON.parse(body).region_code
    callback(null,location)
  });
};

module.exports = {
  generateRandomString, validateURL, checkUrlExists, getURLsByUserId, getTimestamp, createUser, getUserByEmail, authenticateUser, fetchLocationByIP
}