"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const Bip39 = require("bip39");
const ethUtil = require("ethereumjs-util");
const bitcore_lib_1 = require("bitcore-lib");
const ENGLISH_WORDLIST = Bip39.wordlists.EN;
const MNEMONIC_WORDCOUNT = 24;
let MAINNET_MODE = true;
let NUM_WALLETS = 10;
let START_WALLET_INDEX = 0;
let BLOCKCHAIN_TYPE = 0;
const EXTENDED_KEYPAIR_PATH = `m/244'`;
// NOTE: I AM NOT USING THE SCHEMA VERIFICATION RIGHT NOW
// WE SHOULD USE SCHEMA VERIFICATION PRIOR TO RELEASING THIS

// build the schema to validate the seed format
function buildSeedPromptSchema() {
    let i = 1;
    const schema = Array.from({ length: MNEMONIC_WORDCOUNT }, () => {
        return {
            name: `Word ${i++}`,
            type: 'string',
            hidden: true,
            replace: '*',
            required: true,
            message: 'Mnemonic word is not correct.',
            before: (word) => {
                return word.toLowerCase().trim();
            },
            conform: (word) => {
                return ENGLISH_WORDLIST.find(val => val === word.toLowerCase().trim());
            },
        };
    });
    return schema;
}

// schema verification
function promptInputAsPromise(schema) {
    return new Promise((resolve) => {
        Prompt.get(schema, (error, input) => {
            if (error) {
                console.log('Input validation failed');
                process.exit(1);
            }
            return resolve(input);
        });
    });
}

// Extended Private Key
// Returns string with extended private key
function getExtendedPrivateKey(seed) {
    const xKey = getKeyPair(seed, EXTENDED_KEYPAIR_PATH);
    const xPrivateKey = xKey.extendedPrivateKey;
    var construction = `Extended Private Key (at ${EXTENDED_KEYPAIR_PATH}): ${xPrivateKey}`;
    return construction;
}

// Extended Public Key
// Returns string with extended public key
function getExtendedPublicKey(seed) {
    const xKey = getKeyPair(seed, EXTENDED_KEYPAIR_PATH);
    const xPublicKey = xKey.extendedPublicKey;
    var construction = `Extended Public Key (at ${EXTENDED_KEYPAIR_PATH}): ${xPublicKey}`;
    return construction;
}

// returns extendedPrivateKey, extendedPublicKey, privateKey and publicKey
// also checks for mainnet vs testnet
function getKeyPair(seed, derivationPath) {
    const hdPrivateKey = bitcore_lib_1.HDPrivateKey.fromSeed(seed, getBlockchainNetwork());
    let extendedPrivateKey = hdPrivateKey.derive(derivationPath);
    const extendedPublicKey = extendedPrivateKey.hdPublicKey.toString('hex');
    const privateKey = extendedPrivateKey.privateKey.toString('hex');
    const publicKey = extendedPrivateKey.publicKey.toString('hex');
    extendedPrivateKey = extendedPrivateKey.toString('hex');
    return {
        extendedPrivateKey,
        extendedPublicKey,
        privateKey,
        publicKey,
    };
}

// returns testnet vs mainnet
function getBlockchainNetwork() {
    return MAINNET_MODE ? bitcore_lib_1.Networks.livenet : bitcore_lib_1.Networks.testnet;
}

// constructs the derviation path
function getDerivationPath(blockchainId, walletIndex, addressIndex) {
    return `${EXTENDED_KEYPAIR_PATH}/0/${blockchainId}/${walletIndex}/0/${addressIndex}`;
}

// prints out wallets and loops through
// probably won't be needed
function printWallets(seed) {
    var htmlInsertion = "<br>";
    var construction = "";
    Array.from({ length: NUM_WALLETS }, (v, k) => k).forEach(i => {
        var wallet = printWalletDetails(seed, BLOCKCHAIN_TYPE, START_WALLET_INDEX + i);
        construction = `
        <div class="alert alert-info">
            Wallet Index: <strong>${wallet.walletIndex}</strong> at <strong>${wallet.path}</strong>
            <br>
            Public Key: <strong>${wallet.publicKey}</strong>
            <br>
            Private Key: <strong>${wallet.privateKey}</strong>
            <br>
            Address: <strong>${wallet.address}</strong>
        </div>
        `;
        htmlInsertion += construction; 
    });
    return htmlInsertion;
}

// prints out details relating to the wallet
function printWalletDetails(seed, blockchainId, walletIndex) {
    const path = getDerivationPath(blockchainId, walletIndex, 0);
    const keyPair = getKeyPair(seed, path);
    const publicKey = keyPair.publicKey;
    const privateKey = keyPair.privateKey;
    console.log(`Wallet Index ${walletIndex} (at ${path})`);
    console.log(`Public Key: ${publicKey}`);
    console.log(`Private Key: ${privateKey}`);
    switch (blockchainId) {
        case 0:
            var address = getBtcAddress(keyPair.privateKey);
            console.log(`Address: ${address}`);
            return {
                walletIndex,
                path,
                publicKey,
                privateKey,
                address
            }
        case 60:
            var address = getEthAddress(keyPair.privateKey);
            console.log(`Address: ${address}`);
            return {
                walletIndex,
                path,
                publicKey,
                privateKey,
                address
            }
    }
    console.log('\n');
}

// gets the eth address using the private key
function getEthAddress(privateKey) {
    const privKeyBuffer = ethUtil.toBuffer(ethUtil.addHexPrefix(privateKey));
    const addressBuffer = ethUtil.privateToAddress(privKeyBuffer);
    const hexAddress = addressBuffer.toString('hex');
    const checksumAddress = ethUtil.toChecksumAddress(hexAddress);
    return ethUtil.addHexPrefix(checksumAddress);
}

// gets the btc address using the private key
function getBtcAddress(privateKey) {
    return bitcore_lib_1.PrivateKey.fromString(privateKey).toAddress(getBlockchainNetwork()).toString();
}

// get the seed and return the raw seed
function getSeed() {
    var i;
    var arr = [];
    var mnemonic;
    for (i = 0; i < 24; i++) {
        var location = "#word" + i;
        var word = $(location).val().toLowerCase();
        arr.push(word);
    }
    mnemonic = arr.join(" ");
    const seed = Bip39.mnemonicToSeedHex(mnemonic, '');
    return seed;
}

function generate() {
    var seed = getSeed();
    MAINNET_MODE = $("#networkType option:selected").val() === 1;
    console.log("MAINNET_MODE: " + MAINNET_MODE);
    NUM_WALLETS = $("#numWallets").val()*1;
    console.log("NUM_WALLETS: " + NUM_WALLETS);
    START_WALLET_INDEX = $("#startWalletIndex").val()*1;
    console.log("START_WALLET_INDEX: " + START_WALLET_INDEX);
    BLOCKCHAIN_TYPE = $("#blockchainType option:selected").val()*1;
    console.log("BLOCKCHAIN_TYPE: " + BLOCKCHAIN_TYPE);
    var htmlInsertion = printWallets(seed);
    $("#walletInformation").html(htmlInsertion);
    $("#xPublicKey").html(getExtendedPublicKey(seed));
    $("#xPrivateKey").html(getExtendedPrivateKey(seed));
}

window.generate = generate;