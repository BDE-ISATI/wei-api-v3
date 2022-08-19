const EncryptRsa = require('encrypt-rsa').default;
const encryptRsa = new EncryptRsa();


const currentKeyPairs = [];

function generateKeyPairs() {
    //privateKey, publicKey
    const pair = encryptRsa.createPrivateAndPublicKeys();
    currentKeyPairs.push(pair);
    return pair.publicKey;
}

module.exports = {
    generateKeyPairs, 
    currentKeyPairs
}