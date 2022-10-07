import {AptosAccount, HexString, MaybeHexString, TransactionBuilderEd25519, TxnBuilderTypes, BCS} from "aptos";
import {Account, MultiSigOwner, MultiSigWallet, SimpleAddress, Transaction} from "../types/types";
import { sha3_256 as sha3Hash } from "@noble/hashes/sha3";

export {HexString} from "aptos";

// SingleWallet is a single-signed wallet account
export class AccountImpl implements Account, MultiSigOwner {

    account: AptosAccount;

    constructor(privateKeyBytes?: Uint8Array | undefined, address?: MaybeHexString) {
        this.account = new AptosAccount(privateKeyBytes, address);
    }

    address(): HexString {
        return this.account.address();
    }

    publicKey(): HexString {
        return this.account.pubKey();
    }

    publicKeyBytes(): BCS.Bytes {
        return this.account.pubKey().toUint8Array();
    }

    sign(txn: Transaction): BCS.Bytes {
        const txnBuilder = new TransactionBuilderEd25519((message: TxnBuilderTypes.SigningMessage) => {
            return this.signFn(message);
        }, this.publicKey().toUint8Array());
        return txnBuilder.sign(txn.raw);
    }

    signFn(message: TxnBuilderTypes.SigningMessage) {
        const sig = this.account.signBuffer(message);
        return new TxnBuilderTypes.Ed25519Signature(sig.toUint8Array());
    }

    getSigData(txn: Transaction): [signing: TxnBuilderTypes.SigningMessage, signature: TxnBuilderTypes.Ed25519Signature[]] {
        const signingMessage = txn.getSigningMessage();
        const sig = this.signFn(signingMessage);
        return [signingMessage, [sig]];
    }

    ownedMultiSigs(): MultiSigWallet[] {
        return [];
    }
}

export class SimpleAddressImpl implements SimpleAddress {

    _publicKey: HexString;
    _authKey: HexString;
    _accountAddress: HexString;

    constructor(publicKey: MaybeHexString) {
        const pub = HexString.ensure(publicKey);
        this._publicKey = pub;
        this._authKey = this.computeAuthKey(pub);
        this._accountAddress = HexString.ensure(this._authKey.hex());
    }

    computeAuthKey(publicKey: HexString): HexString {
        const hash =  sha3Hash.create();
        hash.update(publicKey.toUint8Array());
        hash.update("\x00");
        return HexString.fromUint8Array(hash.digest());
    }

    address(): HexString {
        return this._accountAddress;
    }

    publicKey(): HexString {
        return this._publicKey;
    }

    publicKeyBytes(): BCS.Bytes {
        return this._publicKey.toUint8Array();
    }
}

