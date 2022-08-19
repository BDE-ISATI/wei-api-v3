const EncryptRsa = require('encrypt-rsa').default;


var currentKeyPairs = [];

function generateKeyPairs() {
    const encryptRsa = new EncryptRsa();
    //privateKey, publicKey
    const pair = encryptRsa.createPrivateAndPublicKeys();
    currentKeyPairs.push(pair);
    return pair.publicKey;
}

function decrypt(encrypted, key) {
    try {
        const privateKey = currentKeyPairs.find(pair => pair.publicKey === key).privateKey;
        const decrypt = encryptRsa.decrypt(encrypted, privateKey);
        currentKeyPairs = currentKeyPairs.splice(currentKeyPairs.findIndex(pair => pair.publicKey === key), 1);
        return decrypt;
    } catch (error) {
        console.log(error);
        return "";
    }
}

module.exports = {
    generateKeyPairs, 
    decrypt,
    currentKeyPairs
}