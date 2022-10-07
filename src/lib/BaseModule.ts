import {Provider} from "./provider";
import {HexString} from "aptos";
import {Account} from "../types/types";

export type FieldType<T, V extends Fields<T>> = T[V];
export type Fields<T> = keyof T;

export abstract class BaseModule {
    constructor(public readonly provider: Provider, public address?: HexString, public account?: Account) {
    }

    abstract resourceTag(name: string):string;
    // behavior is not same as ethers.js
    attach(address: HexString): this {
        this.address = address;
        return this;
    }

    connect(account: Account): this {
        this.account = account;
        return this;
    }
}