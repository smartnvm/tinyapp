const bcrypt = require('bcryptjs'); // bcryptjs/dist/bcrypt');
const { use } = require('chai');

const { v4: uuidv4 } = require('uuid');

const generateRandomString = (length) => {
  let shortURL = '';
  let characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
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


const getTimestamp = () => {
  let months = ['Jan', 'Feb', 'Mar', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
    now = new Date(),
    formatted = now.getFullYear() + ' ' + months[now.getMonth() - 1] + ' ' + now.getDate() + ' ' + now.getHours().toString().padStart(2, '0') + ':' + now.getMinutes().toString().padStart(2, '0') + ':' + now.getSeconds().toString().padStart(2, '0');

  return formatted
}



const createUser = (name, email, strPassword) => {
  let password = bcrypt.hashSync(strPassword, 10);
  const userId = uuidv4().substring(0, 6)
  user = { id: userId, name, email, password }
  return user
}


const getUserByEmail = (email, users) => {
  for (let userId in users) {
    const user = users[userId]
    if (email === user.email) return user
  }
  return false
}



const authenticateUser = (email, password, user) => {
  let authStatus = {}
  console.log(user)

  console.log(bcrypt.hashSync(password, 10));
  console.log(user.password)
  if (user) {

    if (bcrypt.compareSync(password, user.password)) {
      err = 200 //user
      errMsg = 'Hello, ' + user.name

    } else {
      err = 403
      errMsg = 'Invalid password! Try again'
    }
  } else if (!user && email.length > 0) {
    err = 400
    errMsg = 'Error user not found!'
  } else {
    err = 410
    errMsg = 'Invalid user name or password!'
  }

  authStatus.num = err
  authStatus.errMsg = "❌ Error " + err + '\n' + errMsg
  return authStatus
}



const urlsDatabase = {
  b6UzxQ: {
    userId: "aJ48lW",
    longURL: "https://www.txsn.ca",
    timestamp: 'Oct 1 2021 3:57 PM',
    clicks: 0,
    ipList: { 'testIp': 1 },
    uClicks: 0
  },
  b6UTzQ: {
    userId: "aJ48lW",
    longURL: "https://www.tsn.ca",
    timestamp: 'Oct 1 2021 3:57 PM',
    clicks: 0,
    ipList: { 'testIp': 2 },
    uClicks: 0
  },
  b4UTzQ: {
    userId: "aJ58lW",
    longURL: "https://www.tsn.ca",
    timestamp: 'Oct 1 2021 3:57 PM',
    clicks: 0,
    ipList: { 'testIp': 3 },
    uClicks: 0
  },
  b6UxzQ: {
    userId: "aJ48lW",
    longURL: "https://www.tsn.ca",
    timestamp: 'Oct 1 2021 3:57 PM',
    clicks: 0,
    ipList: { 'testIp': 4 },
    uClicks: 0
  },
  b6UTxQ: {
    userId: "aJ48lW",
    longURL: "https://www.tsn.ca",
    timestamp: 'Oct 1 2021 3:57 PM',
    clicks: 0,
    ipList: { 'testIp': 5 },
    uClicks: 0
  }

};


const getURLsByUserId = (userId, urlsdB) => {
  let userURLs = {}
  for (const url in urlsdB) {
    if (urlsdB[url].userId === userId) {
      
      userURLs[url] = urlsdB[url]
    }
  }
  return userURLs

}

// urls = getURLsByUserId('aJ48lW', urlsDatabase)
// console.log(urls)

// for (url in urls) {
//   console.log(urls[url].longURL)
// }


const checkUrlExists = (urls, value) => {
  for (const url in urls) {
    if (urls[url].longURL === value) {
      return true
    }
  }
  return false
}

// const urlExist = checkUrlExists(urls, 'https://www.tsn.ca')
// console.log(urlExist)



module.exports = {
  generateRandomString, validateURL, checkUrlExists, getURLsByUserId, getTimestamp, createUser, getUserByEmail, authenticateUser
}