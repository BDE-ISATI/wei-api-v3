var RSA = require('hybrid-crypto-js').RSA;
var Crypt = require('hybrid-crypto-js').Crypt;


var currentKeyPairs = [];

async function generateKeyPairs() {
    const rsa = new RSA();

    var publicKey;

    await rsa.generateKeyPairAsync().then(keyPair => {
        publicKey = keyPair.publicKey;
        var privateKey = keyPair.privateKey;

        currentKeyPairs.push({ publicKey: publicKey, privateKey: privateKey });

        console.log("-------------------------------");
        console.log("-------------------------------");
        console.log("-------------------------------");
        console.log("Public key: " + publicKey);
        console.log("-------------------------------");
        console.log("-------------------------------");
        console.log("-------------------------------");
    }); 

    return publicKey;
}

function decrypt(message, key) {
    try {
        const crypt = new Crypt();
        var privateKey = currentKeyPairs.find(x => x.publicKey == key).privateKey;
        //Remove the privateKey/publicKey pair from the array

        var decrypted = crypt.decrypt(privateKey, message);

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