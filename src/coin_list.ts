import {HexString} from "aptos";
import {DEFAULT_NETWORK} from "./lib/config";
import {Provider} from "./lib/provider";
import {AnyFaucet} from "./lib/AnyFaucet";

const provider = new Provider(DEFAULT_NETWORK);
const FAUCET_ADDRESS = new HexString((process.env as any).FAUCET);

async function main() {
    const faucet = AnyFaucet.new(FAUCET_ADDRESS, provider);
    const coin_list = await faucet.getCoinList();
    const coin_infos = await Promise.all(coin_list.coins.map(coin => faucet.getCoinInfo(new HexString(coin))));
    coin_list.coins.forEach((coin, index) => {
        console.log('-'.repeat(100), index);
        console.log('coin type(FaucetCoin):', `${coin}::faucet_coin::Coin`);
        console.log('coin type(FreeCoin):', `${coin}::free_coin::Coin`);
        console.log('coin meta:', coin_infos[index]);
    })
}

main();