const CryptoJS = require('../pages/lib/cryptojs/lib/mode-ecb')

module.exports = function(msg, pwd) {
  var keyHex = CryptoJS.enc.Utf8.parse(pwd)
  var encrypted = CryptoJS.DES.encrypt(msg, keyHex, {
    mode: CryptoJS.mode.ECB,
    // padding: CryptoJS.pad.Pkcs7
  })
  return encrypted.ciphertext.toString(CryptoJS.enc.Base64)
}
