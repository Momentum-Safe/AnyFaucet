import {Vector} from "./types/MoveResource";
import {Types} from "aptos";

export type CoinInfo = {
    name: string,
    symbol: string,
    decimals: number,
    monitor_supply: boolean,
    mint_rate: Types.U64,
};

export type CoinList = {
    coins: Vector<Types.Address>
};