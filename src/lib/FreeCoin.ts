import {AptosEntryTxnBuilder} from "./transaction";
import {BCS} from "aptos";
import {BaseModule, Fields, FieldType} from "./BaseModule";
import {AnyFaucet} from "./AnyFaucet";

type StructsKey = Fields<FieldType<typeof FreeCoin, 'STRUCTS'>>;

export class FreeCoin extends BaseModule {
    static MODULE = 'free_coin';
    static METHODS = {claim: 'claim'} as const;
    static STRUCTS = {Coin: 'Coin'} as const;

    resourceTag(name: StructsKey) {
        return `${this.address!.hex()}::${FreeCoin.MODULE}::${FreeCoin.STRUCTS[name]}`;
    }

    async claim(amount: bigint) {
        const provider = this.provider!;
        const account = this.account!;
        const chainID = await provider.getChainId();
        const sn = await provider.getSequenceNumber(account);
        const txn = AptosEntryTxnBuilder.new(this.address!)
            .from(account.address())
            .module(FreeCoin.MODULE)
            .method(FreeCoin.METHODS.claim)
            .args([
                BCS.bcsSerializeUint64(BigInt(amount)),
            ])
            .maxGas(10000n)
            .chainId(chainID)
            .sequenceNumber(sn)
            .sign(account);
        return await provider.sendSignedTransactionAndWait(txn);
    }


}