const { get } = require('request');
const request = require('request')

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

const getKeyByValue = (object, value) => {
  return Object.keys(object).find(key => object[key] === value);
}



const fetchMyIP = function (callback) {
  // use request to fetch IP address from JSON API

  let domain = 'https://api.ipify.org?format=json';

  request(domain, (error, response, body) => {

    if (error) return callback(`\n ERROR: ${error.message}`, null);

    if (response.statusCode !== 200) {
      callback(Error(`Status Code ${response.statusCode} when fetching IP: ${body}`), null);

    }

    //you can fetch IP also by response.body
    const ip = JSON.parse(body).ip;
    callback(null, ip);
  });

};



// const getIP = (callback) => {
//   fetchMyIP((error, IP) => {

//     if (error) {
//       return callback(error, null);
//     }
//     callback(null, IP)
//   })

// }


// console.log(getIP())

module.exports = { generateRandomString, validateURL, getKeyByValue, fetchMyIP }