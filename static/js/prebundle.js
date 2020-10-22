"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const Bip39 = require("bip39");
const ethUtil = require("ethereumjs-util");
const bitcore_lib = require("bitcore-lib");
const litecore = require('litecore');
const dashcore = require('@dashevo/dashcore-lib');
const ENGLISH_WORDLIST = Bip39.wordlists.EN;
const MNEMONIC_WORDCOUNT = 24;
let NUM_WALLETS = 10;
let START_WALLET_INDEX = 0;
let BLOCKCHAIN_TYPE = 0;
const EXTENDED_KEYPAIR_PATH = `m/244'`;

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
    // instantiated up here to return blank if BLOCKCHAIN_TYPE isn't selected for the coin
    let ltcExportedWIF;
    let dashExportedWIF;
    // litecoin logic
    if (BLOCKCHAIN_TYPE == 2) {
        const ltcHDPrivateKey = litecore.HDPrivateKey.fromSeed(seed, litecore.Networks.livenet);
        let ltcExtendedPrivateKey = ltcHDPrivateKey.derive(derivationPath);
        ltcExportedWIF = ltcExtendedPrivateKey.privateKey.toWIF();
    }
    // dash logic
    if (BLOCKCHAIN_TYPE == 5) {
        const dashHDPrivateKey = dashcore.HDPrivateKey.fromSeed(seed, dashcore.Networks.livenet);
        let dashExtendedPrivateKey = dashHDPrivateKey.derive(derivationPath);
        dashExportedWIF = dashExtendedPrivateKey.privateKey.toWIF();
    }
    // generic logic (Bitcoin/Ethereum)
    const hdPrivateKey = bitcore_lib.HDPrivateKey.fromSeed(seed, bitcore_lib.Networks.livenet);
    let extendedPrivateKey = hdPrivateKey.derive(derivationPath);
    const extendedPublicKey = extendedPrivateKey.hdPublicKey.toString('hex');
    const privateKey = extendedPrivateKey.privateKey.toString('hex');
    const publicKey = extendedPrivateKey.publicKey.toString('hex');
    const exportedWIF = extendedPrivateKey.privateKey.toWIF();
    extendedPrivateKey = extendedPrivateKey.toString('hex');
    return {
        extendedPrivateKey,
        extendedPublicKey,
        privateKey,
        publicKey,
        exportedWIF,
        ltcExportedWIF,
        dashExportedWIF
    };
}

// constructs the derviation path
function getDerivationPath(blockchainId, walletIndex) {
    return `${EXTENDED_KEYPAIR_PATH}/0/${blockchainId}/${walletIndex}/0/0`;
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
    const path = getDerivationPath(blockchainId, walletIndex);
    const keyPair = getKeyPair(seed, path);
    const publicKey = keyPair.publicKey;
    const privateKey = keyPair.privateKey;
    const exportedWIF = keyPair.exportedWIF;
    console.log(`Wallet Index ${walletIndex} (at ${path})`);
    console.log(`Public Key: ${publicKey}`);
    console.log(`Private Key: ${privateKey}`);
    switch (blockchainId) {
        case 0:
        // Bitcoin logic
            var address = getBtcAddress(keyPair.exportedWIF);
            console.log(`Address: ${address}`);
            return {
                walletIndex,
                path,
                publicKey,
                privateKey,
                address
            }
        case 2:
        // Litecoin logic
            var address = getLtcAddress(keyPair.ltcExportedWIF);
            console.log(`Address: ${address}`);
            return {
                walletIndex,
                path,
                publicKey,
                privateKey,
                address
            }
        case 5:
        // Dash logic
            var address = getDashAddress(keyPair.dashExportedWIF);
            console.log(`Address: ${address}`);
            return {
                walletIndex,
                path,
                publicKey,
                privateKey,
                address
            }
        case 60:
        // Ethereum Logic
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
function getBtcAddress(WIF) {
    return bitcore_lib.PrivateKey.fromWIF(WIF).toAddress().toString();
}
// gets the ltc address using the private key
function getLtcAddress(WIF) {
    return litecore.PrivateKey.fromWIF(WIF).toAddress().toString();
}
// gets the dash address using the private key
function getDashAddress(WIF) {
    return dashcore.PrivateKey.fromWIF(WIF).toAddress().toString();
}

function execute() {
  if (isValidMnemonicPhrase()) {
    setDerivationErrorState(false);
    generate();
  } else {
    setDerivationErrorState(true);
  }
}

function generate() {
    var seed = getSeed();
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

function setDerivationErrorState(isError) {
  const btn = document.getElementById('deriveAddressBtn');
  const errorMsg = document.getElementById('errorNotification');

  if (isError) {
    btn.classList.add('btn-danger');
    btn.classList.remove('btn-success');
    btn.setAttribute('disabled', 'true');
    errorMsg.classList.remove('hidden');
  } else {
    btn.classList.add('btn-success');
    btn.classList.remove('btn-danger');
    btn.removeAttribute('disabled');
    errorMsg.classList.add('hidden');
  }
}

function registerEvents() {
  for (const input of mnemonicInputs()) {
    input.addEventListener('change', function(e) {
      if ((this.value.length >= 3) && !isValidBip39Word(this.value)) {
        this.setCustomValidity('Incorrect mnemonic word');
        if (!isValidMnemonicPhrase()) setDerivationErrorState(true);
      }
    });
    input.addEventListener('input', function(e) {
      if ((this.value.length == 0) || isValidBip39Word(this.value)) {
        this.setCustomValidity('');
        if (isValidMnemonicPhrase()) setDerivationErrorState(false);
      }
    });
  }
}

function *mnemonicInputs() {
  for (let i=0; i < 24; i++) {
    yield document.getElementById(`word${i}`);
  }
}

const getMnemonicWords = () => Array.from(mnemonicInputs(), (input) => input.value.toLowerCase());
const getMnemonicPhrase = () => getMnemonicWords().join(' ');
const getSeed = () => Bip39.mnemonicToSeedSync(getMnemonicPhrase(), '');
const isValidMnemonicPhrase = () => (getMnemonicWords().filter(w => w.trim() !== '').length === 24) &&
  Bip39.validateMnemonic(getMnemonicPhrase());
const isValidBip39Word = (word) => Bip39.wordlists.english.includes(word.toLowerCase().trim());

registerEvents();
window.execute = execute;
