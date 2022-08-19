const subtle = new SubtleCrypto();

const currentKeyPairs = [];

const settings = {
    name: "RSA-PSS",
    modulusLength: 4096,
    publicExponent: [0x01, 0x00, 0x01],
    hash: "SHA-256"
}

function generateKeyPairs() {
    subtle.generateKey(settings, true, ["encrypt", "decrypt"]).then(keyPair => {
        console.log(keyPair);
    });
}

module.exports = {
    generateKeyPairs, 
    currentKeyPairs
}