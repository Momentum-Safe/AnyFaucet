import {BCS, HexString, TxnBuilderTypes} from "aptos";
import {Account, Transaction} from "../types/types";

// TODO: Use prophecy and gas analysis
const DEFAULT_MAX_GAS = 5000n;
const DEFAULT_GAS_PRICE = 100n;
const DEFAULT_EXPIRATION = 10;

abstract class AptosTxnBuilder {
    private _fromAddress: HexString | undefined;
    private _sequenceNumber: number | undefined;
    private _chainId: number | undefined;
    private _maxGas: bigint | undefined;
    private _gasPrice: bigint | undefined;
    private _expiration: number | undefined;

    abstract payload(): TxnBuilderTypes.TransactionPayload;

    abstract validateAndFix(): void;

    from(from: HexString): this {
        this._fromAddress = from;
        return this;
    }

    sequenceNumber(sn: number): this {
        this._sequenceNumber = sn;
        return this;
    }

    chainId(cid: number): this {
        this._chainId = cid;
        return this;
    }

    maxGas(mg: bigint): this {
        this._maxGas = mg;
        return this;
    }

    gasPrice(gp: bigint): this {
        this._gasPrice = gp;
        return this;
    }

    // exp is the expiration in seconds
    expiration(exp: number): this {
        this._expiration = exp;
        return this;
    }

    build(): Transaction {
        this.validateAndFix();
        this._validateAndFix();
        const raw = this.makeRawTransaction();
        return new Transaction(raw);
    }

    sign(signer: Account) {
        return signer.sign(this.build());
    }

    private _validateAndFix() {
        if (this._fromAddress === undefined) {
            throw new Error('When building transaction, from address must be specified');
        }
        if (this._sequenceNumber === undefined) {
            throw new Error('When building transaction, sequence number must be specified');
        }
        if (this._chainId === undefined) {
            throw new Error('When building transaction, chain ID must be specified');
        }
        if (this._gasPrice === undefined) {
            this._gasPrice = DEFAULT_GAS_PRICE;
        }
        if (this._expiration === undefined) {
            this._expiration = DEFAULT_EXPIRATION;
        }
        if (this._maxGas === undefined) {
            this._maxGas = DEFAULT_MAX_GAS;
        }
    }

    private makeRawTransaction(): TxnBuilderTypes.RawTransaction {
        return new TxnBuilderTypes.RawTransaction(
            TxnBuilderTypes.AccountAddress.fromHex(this._fromAddress as HexString),
            this.getSequenceNumber(),
            this.payload(),
            this._maxGas as bigint,
            this._gasPrice as bigint,
            this.getTargetExpiration(),
            this.getChainId(),
        );
    }

    private getSequenceNumber(): bigint {
        return BigInt(this._sequenceNumber as number);
    }

    // Current time plus expiration
    private getTargetExpiration(): bigint {
        return BigInt(Math.floor(Date.now() / 1000) + (this._expiration as number));
    }

    private getChainId(): TxnBuilderTypes.ChainId {
        return new TxnBuilderTypes.ChainId(this._chainId as number);
    }
}

export class AptosEntryTxnBuilder extends AptosTxnBuilder {
    private _contract!: HexString;
    private _module!: string;
    private _method!: string;
    private _type_args: any[] = [];
    private _args: any[] = [];

    contract(_contract: HexString): this {
        this._contract = _contract;
        return this;
    }

    module(_module: string): this {
        this._module = _module;
        return this;
    }

    method(_method: string): this {
        this._method = _method;
        return this;
    }

    args(_args: any[]): this {
        this._args = _args;
        return this;
    }

    type_args(_type_args: any[]): this {
        this._type_args = _type_args;
        return this;
    }

    validateAndFix() {
        if (this._module === undefined) {
            throw new Error('When building transaction, module name must be specified');
        }
        if (this._method === undefined) {
            throw new Error('When building transaction, method name must be specified');
        }
        if (this._contract === undefined) {
            throw new Error('When building transaction, contract address must be specified');
        }
    }

    payload(): TxnBuilderTypes.TransactionPayload {
        return new TxnBuilderTypes.TransactionPayloadEntryFunction(
            TxnBuilderTypes.EntryFunction.natural(
                `${this._contract.toString()}::${this._module}`,
                this._method,
                this._type_args,
                this._args,
            ),
        );
    }

    static new(contract: HexString): AptosEntryTxnBuilder {
        return new AptosEntryTxnBuilder().contract(contract);
    }
}

