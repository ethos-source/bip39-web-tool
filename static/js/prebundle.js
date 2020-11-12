"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const Bip39 = require("bip39");
const ethUtil = require("ethereumjs-util");
const bitcore_lib = require("bitcore-lib");
const litecore = require('litecore');
const dashcore = require('@dashevo/dashcore-lib');
const cardanoCrypto = require('cardano-crypto.js');

const ENGLISH_WORDLIST = Bip39.wordlists.EN;
const MNEMONIC_WORDCOUNT = 24;
let NUM_WALLETS = 10;
let START_WALLET_INDEX = 0;
let BLOCKCHAIN_TYPE = 0;
const CARDANO_EXTENDED_KEYPAIR_PATH = `m/244`;
const EXTENDED_KEYPAIR_PATH = `m/244'`;

// Extended Private Key
function selectExtendedPath(blockchainId) {
  if (blockchainId === 1815) return CARDANO_EXTENDED_KEYPAIR_PATH;
  return EXTENDED_KEYPAIR_PATH;
}
// Returns string with extended private key
function getExtendedPrivateKey(seed, blockchainId) {
    const path = selectExtendedPath(blockchainId);
    const xKey = getKeyPair(seed, path);
    const xPrivateKey = xKey.extendedPrivateKey;
    var construction = `Extended Private Key (at ${path}): ${xPrivateKey}`;
    return construction;
}

// Extended Public Key
// Returns string with extended public key
function getExtendedPublicKey(seed, blockchainId) {
    const path = selectExtendedPath(blockchainId);
    const xKey = getKeyPair(seed, path);
    const xPublicKey = xKey.extendedPublicKey;
    var construction = `Extended Public Key (at ${path}): ${xPublicKey}`;
    return construction;
}

// returns extendedPrivateKey, extendedPublicKey, privateKey and publicKey
// also checks for mainnet vs testnet
function getKeyPair(seed, derivationPath) {
    // instantiated up here to return blank if BLOCKCHAIN_TYPE isn't selected for the coin
    let ltcExportedWIF;
    let dashExportedWIF;

    // Cardano
    if (BLOCKCHAIN_TYPE == 1815) {
      return getCardanoKeys(derivationPath);
    }
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
    if (blockchainId === 1815) return `${CARDANO_EXTENDED_KEYPAIR_PATH}/0/${blockchainId}/${walletIndex}/0`;
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
        case 1815:
        // Cardano
            var address = getCardanoAddress(seed, path);
            console.log(`Address: ${address}`);
            return {
              walletIndex,
              path,
              publicKey,
              privateKey: keyPair.extendedPrivateKey,
              address
          }
    }
    console.log('\n');
}

/**
 * HD node groups privateKey, publicKey and chainCode
 * can be initialized from Buffers or single string
 * @param privateKey as Buffer
 * @param publicKey as Buffer
 * @param chainCode as Buffer
 */
const hdNode = ({ secret, privateKey, publicKey, chainCode }) => {
  let privateKeyToUse;
  let publicKeyToUse;
  let chainCodeToUse;
  let secretToUse;

  if (secret) {
    privateKeyToUse = secret.slice(0, 64);
    publicKeyToUse = secret.slice(64, 96);
    chainCodeToUse = secret.slice(96, 128);
  } else {
    secretToUse = Buffer.concat([privateKey, publicKey, chainCode]);
  }


  privateKeyToUse = privateKeyToUse ? privateKeyToUse : privateKey;
  publicKeyToUse = publicKeyToUse ? publicKeyToUse : publicKey;
  chainCodeToUse = chainCodeToUse ? chainCodeToUse : chainCode;
  secretToUse = secretToUse ? secretToUse : secret;

  const xpub = Buffer.concat([publicKeyToUse, chainCodeToUse], 64);

  const toBuffer = () => {
    return Buffer.concat([privateKeyToUse, xpub]);
  };

  const toString = () => {
    return toBuffer().toString('hex');
  };

  return {
    xpub,
    toBuffer,
    toString,
    privateKey: privateKeyToUse,
    publicKey: publicKeyToUse,
    chainCode: chainCodeToUse,
  };
};

function getCardanoKeys(derivationPath) {
  const childNode = deriveHdNodeCardano(getSeed(), derivationPath);
  const extendedPublicKey = childNode.xpub.toString('hex');
  const extendedPrivateKey = new Buffer.concat([childNode.privateKey, childNode.chainCode]).toString('hex');

  return {
    extendedPrivateKey,
    extendedPublicKey,
    privateKey: childNode.privateKey.toString('hex'),
    publicKey: childNode.publicKey.toString('hex'),
  };
}

const deriveChildNode = (node, childIndex) => {
  const result = cardanoCrypto.derivePrivate(node.toBuffer(), childIndex, 2);
  return hdNode({
    secret: null,
    privateKey: result.slice(0, 64),
    publicKey: result.slice(64, 96),
    chainCode: result.slice(96, 128),
  });
}

function deriveHdNodeCardano(seedHex, derivationPath) {
  const seed = Buffer.from(seedHex, 'hex');
  const parentNode = hdNode({
    secret: seed,
    privateKey: null,
    publicKey: null,
    chainCode: null,
  });

  const pathArray = convertDerivationPathToArray(derivationPath);
  return pathArray.reduce(deriveChildNode, parentNode);
};

function getXpubPair(seedHex, derivationPath) {
  const seed = Buffer.from(seedHex, 'hex');
  const parentNode = hdNode({
    secret: seed,
    privateKey: null,
    publicKey: null,
    chainCode: null,
  });

  const pathArray = convertDerivationPathToArray(derivationPath);
  const xpubChildNode = pathArray.reduce(deriveChildNode, parentNode);
  return {
    xpub: xpubChildNode.xpub,
    xpubMaster: parentNode.xpub,
  };
};

function convertDerivationPathToArray(bip32Path) {
  if (typeof bip32Path === 'number') return [bip32Path];
  if (typeof bip32Path !== 'string') throw new Error('Specify Bip32 path in the correct format.');

  const pathSplitArray = bip32Path.split('/');
  const path = [];

  for (let i = 0; i < pathSplitArray.length; i += 1) {
    if (i === 0 && pathSplitArray[0].toLowerCase() === 'm') continue;
    path.push(parseInt(pathSplitArray[i], 10));
  }
  return path;
}

// gets the eth address using the private key
function getEthAddress(privateKey) {
    const privKeyBuffer = ethUtil.toBuffer(ethUtil.addHexPrefix(privateKey));
    const addressBuffer = ethUtil.privateToAddress(privKeyBuffer);
    const hexAddress = ethUtil.addHexPrefix(addressBuffer.toString('hex'));
    return ethUtil.toChecksumAddress(hexAddress);
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

function getCardanoAddress(seed, derivationPath) {
  const xpubPair = getXpubPair(seed, derivationPath);
  const xpubHash = xpubPair.xpub.toString('hex');
  const hdPassphrase = cardanoCrypto.xpubToHdPassphrase(Buffer.from(xpubHash, 'hex'));
  return cardanoCrypto.packAddress([], Buffer.from(xpubHash, 'hex'), hdPassphrase, 2);
}

async function execute() {
  if (isValidMnemonicPhrase()) {
    setDerivationErrorState(false);
    await loadSeed();
    generate();
  } else {
    setDerivationErrorState(true);
  }
}

function generate() {
    var seed = getSeed();
    NUM_WALLETS = $("#numWallets").val()*1;
    console.log(`NUM_WALLETS: ${ NUM_WALLETS }`);
    START_WALLET_INDEX = $("#startWalletIndex").val()*1;
    console.log(`START_WALLET_INDEX: ${ START_WALLET_INDEX }`);
    console.log(`BLOCKCHAIN_TYPE: ${ BLOCKCHAIN_TYPE }`);
    var htmlInsertion = printWallets(seed);
    $("#walletInformation").html(htmlInsertion);
    $("#xPublicKey").html(getExtendedPublicKey(seed, BLOCKCHAIN_TYPE));
    $("#xPrivateKey").html(getExtendedPrivateKey(seed, BLOCKCHAIN_TYPE));
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
  const btn = document.getElementById('deriveAddressBtn');
  btn.addEventListener('click', execute);

}

function *mnemonicInputs() {
  for (let i=0; i < 24; i++) {
    yield document.getElementById(`word${i}`);
  }
}

let seed;

const loadSeed = async () => {
  BLOCKCHAIN_TYPE = parseInt(document.getElementById('blockchainType').value, 10);
  if (BLOCKCHAIN_TYPE === 1815) {
    const mnemonicSecret = await cardanoCrypto.mnemonicToRootKeypair(getMnemonicPhrase(), 2);
    seed = cardanoCrypto.cardanoMemoryCombine(mnemonicSecret, '');
    seed = seed.toString('hex');
    return;
  }
  seed = Bip39.mnemonicToSeedSync(getMnemonicPhrase(), '');
};

const getSeed = () => seed;

const getMnemonicWords = () => Array.from(mnemonicInputs(), (input) => input.value.toLowerCase());
const getMnemonicPhrase = () => getMnemonicWords().join(' ');

const isValidMnemonicPhrase = () => (getMnemonicWords().filter(w => w.trim() !== '').length === 24) &&
  Bip39.validateMnemonic(getMnemonicPhrase());
const isValidBip39Word = (word) => Bip39.wordlists.english.includes(word.toLowerCase().trim());

registerEvents();
window.execute = execute;
