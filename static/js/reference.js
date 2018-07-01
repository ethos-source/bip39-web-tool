"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const Prompt = require("prompt");
const Bip39 = require("bip39");
const program = require("commander");
const ethUtil = require("ethereumjs-util");
const bitcore_lib_1 = require("bitcore-lib");
const ENGLISH_WORDLIST = Bip39.wordlists.EN;
const MNEMONIC_WORDCOUNT = 24;
let MAINNET_MODE = false;
let NUM_WALLETS = 10;
let START_WALLET_INDEX = 0;
const EXTENDED_KEYPAIR_PATH = `m/244'`;
Prompt.message = "Mnemonic";
Prompt.colors = false;
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
function promptInputToMnemonic(input) {
    const words = [];
    for (let i = 0; i <= MNEMONIC_WORDCOUNT; i++) {
        words.push(input[`Word ${i}`]);
    }
    return words.join(' ').trim();
}
function printDelimiter() {
    console.log('---------------------------------------');
}
function printExtendedKeys(seed, xKeyPath) {
    const xKey = getKeyPair(seed, xKeyPath);
    console.log(`Extended Private Key (at ${xKeyPath}): ${xKey.extendedPrivateKey}`);
    console.log(`Extended Public Key (at ${xKeyPath}): ${xKey.extendedPublicKey}`);
    console.log('\n');
}
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
function getBlockchainNetwork() {
    return MAINNET_MODE ? bitcore_lib_1.Networks.livenet : bitcore_lib_1.Networks.testnet;
}
function getDerivationPath(blockchainId, walletIndex, addressIndex) {
    return `${EXTENDED_KEYPAIR_PATH}/0/${blockchainId}/${walletIndex}/0/${addressIndex}`;
}
function printWallets(seed, numWallets) {
    Array.from({ length: NUM_WALLETS }, (v, k) => k).forEach(i => {
        printWalletDetails(seed, 0, START_WALLET_INDEX + i);
        printWalletDetails(seed, 60, START_WALLET_INDEX + i);
        printDelimiter();
    });
}
function printWalletDetails(seed, blockchainId, walletIndex) {
    const path = getDerivationPath(blockchainId, walletIndex, 0);
    const keyPair = getKeyPair(seed, path);
    console.log(`Wallet Index ${walletIndex} (at ${path})`);
    console.log(`Public Key: ${keyPair.publicKey}`);
    console.log(`Private Key: ${keyPair.privateKey}`);
    switch (blockchainId) {
        case 0:
            console.log(`Bitcoin Address: ${getBtcAddress(keyPair.privateKey)}`);
            break;
        case 60:
            console.log(`Ethereum Address: ${getEthAddress(keyPair.privateKey)}`);
            break;
    }
    console.log('\n');
}
function getEthAddress(privateKeyIn) {
    const privKeyBuffer = ethUtil.toBuffer(ethUtil.addHexPrefix(privateKeyIn));
    const addressBuffer = ethUtil.privateToAddress(privKeyBuffer);
    const hexAddress = addressBuffer.toString('hex');
    const checksumAddress = ethUtil.toChecksumAddress(hexAddress);
    return ethUtil.addHexPrefix(checksumAddress);
}
function getBtcAddress(privateKey) {
    return bitcore_lib_1.PrivateKey.fromString(privateKey).toAddress(getBlockchainNetwork()).toString();
}
function main() {
    program
        .version('0.1')
        .description('Hierarchical key generation tool to compute addresses and key pairs for Ethos wallets')
        .option('-n --network <type>', 'Network environment type for addresses and keys (main | test) [main]', 'main')
        .option('-c --walletCount <count>', 'Number of wallet to return [10]', parseInt, 10)
        .option('-i --walletIndex <index>', 'Starting index of first wallet returns [0]', parseInt, 0)
        .parse(process.argv);
    MAINNET_MODE = program.network === 'main';
    START_WALLET_INDEX = program.walletIndex;
    NUM_WALLETS = program.walletCount;
    console.log(`Generating addresses for wallet ${START_WALLET_INDEX}`
        + ` through ${START_WALLET_INDEX + NUM_WALLETS}`);
    console.log(`Address mode set to: ${program.network}`);
    console.log('\n');
    console.log('Enter mnemonic words:');
    promptInputAsPromise(buildSeedPromptSchema())
        .then((input) => {
        const mnemonic = promptInputToMnemonic(input);
        if (!Bip39.validateMnemonic(mnemonic)) {
            console.log(`Invalid mnemonic provided.`);
            process.exit(1);
        }

        const seed = Bip39.mnemonicToSeedHex(mnemonic, '');
        printDelimiter();
        printExtendedKeys(seed, EXTENDED_KEYPAIR_PATH);
        printDelimiter();
        printWallets(seed, NUM_WALLETS);
    });
}
main();
//# sourceMappingURL=index.js.map