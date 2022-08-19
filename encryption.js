var RSA = require('hybrid-crypto-js').RSA;
var Crypt = require('hybrid-crypto-js').Crypt;


var currentKeyPairs = [];

function generateKeyPairs() {
    const rsa = new RSA();

    var publicKey;

    rsa.generateKeyPair(function(keyPair) {
        // Callback function receives new key pair as a first argument
        publicKey = keyPair.publicKey;
        var privateKey = keyPair.privateKey;

        currentKeyPairs.push({
            publicKey: publicKey,
            privateKey: privateKey
        });
    });   

    console.log("-------------------------------");
    console.log("-------------------------------");
    console.log("-------------------------------");
    console.log("Public key: " + publicKey);
    console.log("-------------------------------");
    console.log("-------------------------------");
    console.log("-------------------------------");
    return publicKey;
}

function decrypt(message, key) {
    try {
        var privateKey = currentKeyPairs.find(x => x.publicKey == key).privateKey;
        var decrypted = Crypt.decrypt(privateKey, message);

        return decrypted;
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