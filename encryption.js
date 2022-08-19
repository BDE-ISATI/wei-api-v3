export const currentKeyPairs = [];

export function generateKeyPairs() {
    const settings = {
        name: "RSA-PSS",
        modulusLength: 4096,
        publicExponent: [0x01, 0x00, 0x01],
        hash: "SHA-256"
    }

    SubtleCrypto.generateKey(settings, false, ["encrypt", "decrypt"]).then(keyPair => {
        console.log(keyPair);
    });
}