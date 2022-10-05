import {execSync} from 'child_process';
import fs from "fs";
import {BCS, HexString} from "aptos";
import {AptosEntryTxnBuilder} from "./lib/transaction";
import {DEFAULT_NETWORK} from "./lib/config";
import {Provider} from "./lib/provider";
import {AccountImpl} from "./lib/account";
import YAML from 'yaml';
import {sha3_256} from "@noble/hashes/sha3";

const ADDRESS_COIN = Buffer.from(sha3_256.create().update("MSAFE FAUCET").digest()).toString('hex');
const FAUCET_ADDRESS = new HexString((process.env as any).FAUCET);

async function moveCompile(moveDir: string, name: string) {
    const cmd = `aptos move compile --package-dir ${moveDir} --save-metadata --included-artifacts none --named-addresses ${name}=0x${ADDRESS_COIN}`;
    console.log(cmd);
    await execSync(cmd);
}

const provider = new Provider(DEFAULT_NETWORK);

function getAccount(path: string, profile = 'default') {
    const config = fs.readFileSync(path);
    const prikey = YAML.parse(config.toString()).profiles[profile].private_key;
    return new AccountImpl(Buffer.from(prikey.slice(2), 'hex'));
}

async function build(coinDir: string, coinPackage: string, coinAddressName: string, coinModule: string) {
    await moveCompile(coinDir, coinAddressName);
    const coin_meta = await fs.readFileSync(`${coinDir}/build/${coinPackage}/package-metadata.bcs`);
    const coin_code = await fs.readFileSync(`${coinDir}/build/${coinPackage}/bytecode_modules/${coinModule}.mv`);
    const regexp = new RegExp(ADDRESS_COIN, 'g');
    const matchIter = coin_code.toString('hex').matchAll(regexp);
    const indexes = [];
    while (true) {
        const match = matchIter.next();
        if (match.done) break;
        const index = match.value.index!;
        if (index & 1) continue;
        indexes.push(index / 2)
    }
    const address_indexes = Buffer.alloc(indexes.length * 2);
    indexes.forEach((offsetVal, i) => {
        address_indexes.writeInt16LE(offsetVal, i * 2)
    });
    return {coin_code, coin_meta, address_indexes};
}

async function getFucetCoin() {
    const coinNameAddress = 'faucet_coin';
    const coinModule = 'faucet_coin';
    const coinPackage = 'FaucetCoin';
    const coinDir = `./move/${coinPackage}`;
    return build(coinDir, coinPackage, coinNameAddress, coinModule);
}


async function getFreeCoin() {
    const coinNameAddress = 'free_coin';
    const coinModule = 'free_coin';
    const coinPackage = 'FreeCoin';
    const coinDir = `./move/${coinPackage}`;
    return build(coinDir, coinPackage, coinNameAddress, coinModule);
}


async function main() {
    const account = getAccount('./.aptos/config.yaml', 'local');
    const useFreeCoin = Boolean(process.argv[2]);
    console.log('use FreeCoin:', useFreeCoin);
    console.log(`init with ${useFreeCoin ? 'FreeCoin' : 'FaucetCoin'}...`);
    const {coin_code, coin_meta, address_indexes} = await (useFreeCoin ? getFreeCoin() : getFucetCoin());
    const chainID = await provider.getChainId();
    const sn = await provider.getSequenceNumber(account);
    const bcsSingedTxn = AptosEntryTxnBuilder.new(FAUCET_ADDRESS)
        .from(account.address())
        .module('faucet')
        .method('init_coin_code')
        .args([
            BCS.bcsSerializeBytes(coin_code),
            BCS.bcsSerializeBytes(coin_meta),
            BCS.bcsSerializeBytes(address_indexes),
        ])
        .maxGas(10000n)
        .chainId(chainID)
        .sequenceNumber(sn)
        .sign(account);
    let txn = await provider.sendSignedTransactionAndWait(bcsSingedTxn);
    console.log('hash:', txn.hash);
}

main();