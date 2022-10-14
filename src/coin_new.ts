import {HexString} from "aptos";
import {DEFAULT_NETWORK} from "./lib/config";
import {Provider} from "./lib/provider";
import {AccountImpl} from "./lib/account";
import {AnyFaucet} from "./lib/AnyFaucet";

const provider = new Provider(DEFAULT_NETWORK);
const FAUCET_ADDRESS = new HexString((process.env as any).FAUCET);

async function main() {
    const [,,name,symbol,decimals,monitor_supply,mint_rate] = process.argv;
    console.log("name(argv[2]):", name);
    console.log("symbol:", symbol);
    console.log("decimals:", decimals);
    console.log("monitor_supply:", monitor_supply);
    console.log("mint_rate:", mint_rate);
    const account = new AccountImpl();
    await provider.fundAccount(account, 2000000);
    const faucet = AnyFaucet.new(FAUCET_ADDRESS, provider).connect(account);
    const txn = await faucet.newCoin(name, symbol, Number(decimals), Boolean(monitor_supply), BigInt(mint_rate));
    console.log('hash:', txn.hash);
}

main();