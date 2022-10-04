import fs from "fs";
import {BCS, HexString} from "aptos";
import {AptosEntryTxnBuilder} from "./lib/transaction";
import {DEFAULT_NETWORK} from "./lib/config";
import {Provider} from "./lib/provider";
import {AccountImpl} from "./lib/account";
import YAML from 'yaml';

const provider = new Provider(DEFAULT_NETWORK);
const FAUCET_ADDRESS = new HexString((process.env as any).FAUCET);

function getAccount(path:string, profile = 'default') {
    const config = fs.readFileSync(path);
    const prikey = YAML.parse(config.toString()).profiles[profile].private_key;
    return new AccountImpl(Buffer.from(prikey.slice(2),'hex'));
}

async function main() {

    const [,,name,symbol,decimals,monitor_supply,mint_rate] = process.argv;
    console.log("name(argv[2]):", name);
    console.log("symbol:", symbol);
    console.log("decimals:", decimals);
    console.log("monitor_supply:", monitor_supply);
    console.log("mint_rate:", mint_rate);
    const account = getAccount('./.aptos/config.yaml');
    const chainID = await provider.getChainId();
    const sn = await provider.getSequenceNumber(account);
    const bcsSingedTxn = AptosEntryTxnBuilder.new(FAUCET_ADDRESS)
        .from(account.address())
        .module('Faucet')
        .method('new_faucet_coin')
        .args([
            BCS.bcsSerializeStr(name),
            BCS.bcsSerializeStr(symbol),
            BCS.bcsSerializeU8(Number(decimals)),
            BCS.bcsSerializeBool(Boolean(monitor_supply)),
            BCS.bcsSerializeUint64(BigInt(mint_rate)),
        ])
        .maxGas(10000n)
        .chainId(chainID)
        .sequenceNumber(sn)
        .sign(account);
    let txn = await provider.sendSignedTransactionAndWait(bcsSingedTxn);
    console.log(txn);
}

main();