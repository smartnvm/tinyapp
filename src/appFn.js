const bcrypt = require('../node_modules/bcryptjs') // bcryptjs/dist/bcrypt');

const { v4: uuidv4 } = require('../node_modules/uuid');

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

const checkUrlExists = (urls, value) => {
  if (urls) {
    return Object.keys(urls).find(key => urls[key].longURL === value);
  }
  return false
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
  let urls = {}
  user = { id: userId, name, email, password, urls }
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



module.exports = {
  generateRandomString, validateURL, checkUrlExists, getTimestamp, createUser, getUserByEmail, authenticateUser
}