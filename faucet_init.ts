import {execSync} from 'child_process';
import fs from "fs";
import {BCS, HexString} from "aptos";
import {AptosEntryTxnBuilder} from "./lib/transaction";
import {DEFAULT_NETWORK} from "./lib/config";
import {Provider} from "./lib/provider";
import {AccountImpl} from "./lib/account";
import YAML from 'yaml';
import {PackageMetadata} from "./lib/PackageMetadata";

const ADDRESS_COIN = 'a5'.repeat(32);
const FAUCET_ADDRESS = new HexString((process.env as any).FAUCET);

async function moveCompile(moveDir: string) {
    const cmd = `aptos move compile --package-dir ${moveDir} --save-metadata --included-artifacts none --named-addresses coin=0x${ADDRESS_COIN}`;
    console.log(cmd);
    await execSync(cmd);
}

const provider = new Provider(DEFAULT_NETWORK);

function getAccount(path:string, profile = 'default') {
    const config = fs.readFileSync(path);
    const prikey = YAML.parse(config.toString()).profiles[profile].private_key;
    return new AccountImpl(Buffer.from(prikey.slice(2),'hex'));
}

async function main() {
    await moveCompile('./move/coin');
    const account = getAccount('./.aptos/config.yaml');
    const metadata = await fs.readFileSync('./move/coin/build/Coin/package-metadata.bcs');
    PackageMetadata.fromBuffer(metadata).modules.map(x=>console.log(x))
    const coin_code = await fs.readFileSync('./move/coin/build/Coin/bytecode_modules/TestCoin.mv');
    const regexp = new RegExp(ADDRESS_COIN, 'g');
    const matchIter = coin_code.toString('hex').matchAll(regexp);
    const indexes = [];
    while(true){
        const match = matchIter.next();
        if(match.done) break;
        const index = match.value.index!;
        if(index & 1) continue;
        indexes.push(index/2)
    }
    const address_indexes = Buffer.alloc(indexes.length*2);
    indexes.forEach((offsetVal, i)=>{
        address_indexes.writeInt16LE(offsetVal, i * 2)
    });

    const chainID = await provider.getChainId();
    const sn = await provider.getSequenceNumber(account);
    const bcsSingedTxn = AptosEntryTxnBuilder.new(FAUCET_ADDRESS)
        .from(account.address())
        .module('Faucet')
        .method('init_coin_code')
        .args([
            BCS.bcsSerializeBytes(coin_code),
            BCS.bcsSerializeBytes(metadata),
            BCS.bcsSerializeBytes(address_indexes),
        ])
        .maxGas(10000n)
        .chainId(chainID)
        .sequenceNumber(sn)
        .sign(account);
    let txn = await provider.sendSignedTransactionAndWait(bcsSingedTxn);
    console.log(txn);
}

main();