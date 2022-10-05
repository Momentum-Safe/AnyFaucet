import {HexString} from "aptos";
import {DEFAULT_NETWORK} from "./lib/config";
import {Provider} from "./lib/provider";
import {CoinInfo, CoinList} from "./facuetTypes";

const provider = new Provider(DEFAULT_NETWORK);
const FAUCET_ADDRESS = new HexString((process.env as any).FAUCET);

async function getCoinList(address: HexString): Promise<CoinList> {
    const resource = await provider.getAccountResource(address, `${address.hex()}::faucet::CoinList`);
    return resource.data as any;
}

async function getCoinInfo(contract: HexString, coin: HexString): Promise<CoinInfo> {
    const resource = await provider.getAccountResource(coin, `${contract.hex()}::faucet::CoinInfo`);
    const coinInfo = resource.data as CoinInfo;
    const f = (hex: string) => Buffer.from(hex.slice(2), 'hex').toString();
    coinInfo.name = f(coinInfo.name);
    coinInfo.symbol = f(coinInfo.symbol);
    return coinInfo;
}

async function main() {
    const coin_list = await getCoinList(FAUCET_ADDRESS);
    const coin_infos = await Promise.all(coin_list.coins.map(coin => getCoinInfo(FAUCET_ADDRESS, new HexString(coin))));
    coin_list.coins.forEach((coin, index) => {
        console.log('-'.repeat(100), index);
        console.log('coin type(FaucetCoin):', `${coin}::faucet_coin::Coin`);
        console.log('coin type(FreeCoin):', `${coin}::free_coin::Coin`);
        console.log('coin meta:', coin_infos[index]);
    })
}

main();