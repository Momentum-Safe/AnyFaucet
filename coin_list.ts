import fs from "fs";
import {HexString} from "aptos";
import {DEFAULT_NETWORK} from "./lib/config";
import {Provider} from "./lib/provider";
import {AccountImpl} from "./lib/account";
import YAML from 'yaml';
import {CoinInfo, CoinList} from "./facuetTypes";

const provider = new Provider(DEFAULT_NETWORK);

function getAccount(path: string, profile = 'default') {
    const config = fs.readFileSync(path);
    const prikey = YAML.parse(config.toString()).profiles[profile].private_key;
    return new AccountImpl(Buffer.from(prikey.slice(2), 'hex'));
}

async function getCoinList(address: HexString): Promise<CoinList> {
    const resource = await provider.getAccountResource(address, `${address.hex()}::Faucet::CoinList`);
    return resource.data as any;
}

async function getCoinInfo(contract: HexString, coin: HexString): Promise<CoinInfo> {
    const resource = await provider.getAccountResource(coin, `${contract.hex()}::Faucet::CoinInfo`);
    const coinInfo = resource.data as CoinInfo;
    const f = (hex: string) => Buffer.from(hex.slice(2), 'hex').toString();
    coinInfo.name = f(coinInfo.name);
    coinInfo.symbol = f(coinInfo.symbol);
    return coinInfo;
}

async function main() {
    const account = getAccount('./.aptos/config.yaml');
    const coin_list = await getCoinList(account.address());
    const coin_infos = await Promise.all(coin_list.coins.map(coin => getCoinInfo(account.address(), new HexString(coin))));
    coin_list.coins.forEach((coin, index) => {
        console.log('-'.repeat(100), index);
        console.log('coin type:', `${coin}::TestCoin::Coin`);
        console.log('coin meta:', coin_infos[index]);
    })
}

main();