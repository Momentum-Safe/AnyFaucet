import {BCS, HexString, TxnBuilderTypes} from "aptos";
import {DEFAULT_NETWORK} from "./lib/config";
import {Provider} from "./lib/provider";
import {AccountImpl} from "./lib/account";
import {AnyFaucet} from "./lib/AnyFaucet";

const provider = new Provider(DEFAULT_NETWORK);
const FAUCET_ADDRESS = new HexString((process.env as any).FAUCET);

async function coin_balance(account: HexString, coin: string) {
    const resource = await provider.getAccountResource(account, coin);
    return resource.data;
}

function sleep(ms: number) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

async function main() {
    const [, , coin, amount] = process.argv;
    console.log('faucet coin(argv[2]):', coin);
    console.log('faucet amount:', amount);
    const account = new AccountImpl();
    console.log('faucet to:', account.address().hex());
    await provider.fundAccount(account, 10_000_000);
    const [coinAddress, coinModule] = coin.split('::');
    const isFaucetCoin = coinModule == 'faucet_coin';

    const faucet = AnyFaucet.new(FAUCET_ADDRESS, provider, isFaucetCoin).connect(account);
    console.log(`use ${isFaucetCoin?'FaucetCoin':'FreeCoin'}`);
    const txn = await faucet.claim(new HexString(coinAddress), BigInt(amount));
    console.log('hash:', txn.hash);
    //await sleep(3000);
    const coinTag = (coin: string) => `0x1::coin::CoinStore<${coin}>`
    const balance = await coin_balance(account.address(), coinTag(coin));
    console.log((balance as any).coin.value);
}

main();