import {BCS, HexString, TxnBuilderTypes} from "aptos";
import {Account} from "../types/types";
import {AptosEntryTxnBuilder} from "./transaction";
import {Provider} from "./provider";
import {Vector} from "../types/MoveResource";
import {Types} from "aptos";
import {BaseModule, Fields, FieldType} from "./BaseModule";
import {FreeCoin} from "./FreeCoin";
import {FaucetCoin} from "./FaucetCoin";


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

enum Mode {
    FreeCoin,
    FaucetCoin
}

type StructsKey = Fields<FieldType<typeof AnyFaucet, 'STRUCTS'>>;

export class AnyFaucet extends BaseModule {
    static MODULE = 'faucet';
    static METHODS = {
        claim: 'claim',
        new_faucet_coin: 'new_faucet_coin',
        init_coin_code: 'init_coin_code',
    } as const;
    static STRUCTS = {
        CoinList: 'CoinList',
        CoinInfo: 'CoinInfo',
    }

    private constructor(public readonly mode: Mode, public readonly provider: Provider, address?: HexString, account?: Account) {
        super(provider, address, account);
    }

    resourceTag(name: StructsKey) {
        return `${this.address!.hex()}::${AnyFaucet.MODULE}::${AnyFaucet.STRUCTS[name]}`;
    }

    async initCode(coin_code: Buffer, coin_meta: Buffer, address_indexes: Buffer) {
        const provider = this.provider;
        const account = this.account!;
        const chainID = await provider.getChainId();
        const sn = await provider.getSequenceNumber(account);
        const bcsSingedTxn = AptosEntryTxnBuilder.new(this.address!)
            .from(account.address())
            .module(AnyFaucet.MODULE)
            .method(AnyFaucet.METHODS.init_coin_code)
            .args([
                BCS.bcsSerializeBytes(coin_code),
                BCS.bcsSerializeBytes(coin_meta),
                BCS.bcsSerializeBytes(address_indexes),
            ])
            .maxGas(10000n)
            .chainId(chainID)
            .sequenceNumber(sn)
            .sign(account);
        return await provider.sendSignedTransactionAndWait(bcsSingedTxn);
    }

    async newCoin(name: string, symbol: string, decimals: number, monitor_supply: boolean, mint_rate: bigint) {
        const account = this.account!;
        const provider = this.provider;
        const chainID = await provider.getChainId();
        const sn = await provider.getSequenceNumber(account);
        const bcsSingedTxn = AptosEntryTxnBuilder.new(this.address!)
            .from(account.address())
            .module(AnyFaucet.MODULE)
            .method(AnyFaucet.METHODS.new_faucet_coin)
            .args([
                BCS.bcsSerializeStr(name),
                BCS.bcsSerializeStr(symbol),
                BCS.bcsSerializeU8(decimals),
                BCS.bcsSerializeBool(monitor_supply),
                BCS.bcsSerializeUint64(mint_rate),
            ])
            .maxGas(20000n)
            .chainId(chainID)
            .sequenceNumber(sn)
            .sign(account);
        return await provider.sendSignedTransactionAndWait(bcsSingedTxn);
    }

    async claim(coin: HexString, amount: bigint) {
        const account = this.account!;
        const provider = this.provider;
        const isFaucetCoin = this.mode == Mode.FaucetCoin;
        if (!isFaucetCoin) return new FreeCoin(provider).attach(coin).connect(account).claim(amount);

        const contract = this.address!;
        const chainID = await provider.getChainId();
        const sn = await provider.getSequenceNumber(account);
        const coinTag = new FaucetCoin(provider, coin).resourceTag('Coin');
        const token = new TxnBuilderTypes.TypeTagStruct(TxnBuilderTypes.StructTag.fromString(coinTag));
        const txn = AptosEntryTxnBuilder.new(contract)
            .from(account.address())
            .module(AnyFaucet.MODULE)
            .method(AnyFaucet.METHODS.claim)
            .args([
                BCS.bcsSerializeUint64(BigInt(amount)),
            ])
            .maxGas(10000n)
            .chainId(chainID)
            .sequenceNumber(sn)
            .type_args([token])
            .sign(account);
        return await provider.sendSignedTransactionAndWait(txn);
    }

    async getCoinList(): Promise<CoinList> {
        const resource = await this.provider.getAccountResource(this.address!, this.resourceTag('CoinList'));
        return resource.data as any;
    }

    async getCoinInfo(coin: HexString): Promise<CoinInfo> {
        const resource = await this.provider.getAccountResource(coin, this.resourceTag('CoinInfo'));
        const coinInfo = resource.data as CoinInfo;
        const format = (hex: string) => Buffer.from(hex.slice(2), 'hex').toString();
        coinInfo.name = format(coinInfo.name);
        coinInfo.symbol = format(coinInfo.symbol);
        return coinInfo;
    }

    /// address: token address
    getTokenResourceTag(address: HexString) {
        const token = this.mode == Mode.FaucetCoin ?
            new FaucetCoin(this.provider, address) :
            new FreeCoin(this.provider, address);
        return AnyFaucet.getCoinResourceTag(token.resourceTag('Coin'))
    }

    static getCoinResourceTag(coinStructTag: string):string {
        return `0x1::coin::CoinStore<${coinStructTag}>`;
    }
    static new(address: HexString, provider: Provider, useFaucetCoin = true): AnyFaucet {
        const mode = useFaucetCoin ? Mode.FaucetCoin : Mode.FreeCoin;
        return new AnyFaucet(mode, provider, address);
    }
}