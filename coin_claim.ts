import {BCS, HexString, TxnBuilderTypes} from "aptos";
import {AptosEntryTxnBuilder} from "./lib/transaction";
import {DEFAULT_NETWORK} from "./lib/config";
import {Provider} from "./lib/provider";
import {AccountImpl} from "./lib/account";

const provider = new Provider(DEFAULT_NETWORK);
const FAUCET_ADDRESS = new HexString((process.env as any).FAUCET);

async function coin_balance(account: HexString, coin: string) {
    const resource = await provider.getAccountResource(account, coin);
    return resource.data;
}
function sleep(ms:number) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

async function main() {
    const [, , coin, amount] = process.argv;
    const token = new TxnBuilderTypes.TypeTagStruct(TxnBuilderTypes.StructTag.fromString(coin));
    console.log('faucet coin(argv[2]):', coin);
    console.log('faucet amount:', amount);
    const account = new AccountImpl();
    console.log('faucet to:', account.address().hex());
    await provider.fundAccount(account, 10_000_000);
    const chainID = await provider.getChainId();
    const sn = await provider.getSequenceNumber(account);
    const bcsSingedTxn = AptosEntryTxnBuilder.new(FAUCET_ADDRESS)
        .from(account.address())
        .module('Faucet')
        .method('claim')
        .type_args([token])
        .args([
            BCS.bcsSerializeUint64(BigInt(amount)),
        ])
        .maxGas(10000n)
        .chainId(chainID)
        .sequenceNumber(sn)
        .sign(account);
    let txn = await provider.sendSignedTransactionAndWait(bcsSingedTxn);
    console.log(txn);
    //await sleep(3000);
    const coinTag = (coin:string)=>`0x1::coin::CoinStore<${coin}>`
    const balance = await coin_balance(account.address(), coinTag(coin));
    console.log((balance as any).coin.value);
}

main();