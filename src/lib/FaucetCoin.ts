import {BaseModule, Fields, FieldType} from "./BaseModule";

type StructsKey = Fields<FieldType<typeof FaucetCoin, 'STRUCTS'>>;

export class FaucetCoin extends BaseModule {
    static MODULE = 'faucet_coin';
    static METHODS = {} as const;
    static STRUCTS = {Coin: 'Coin'} as const;

    resourceTag(name: StructsKey) {
        return `${this.address!.hex()}::${FaucetCoin.MODULE}::${FaucetCoin.STRUCTS[name]}`;
    }
}