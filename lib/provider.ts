import {AptosClient, FaucetClient, BCS} from "aptos";

import {Default, Network} from "./config";
import {AccountImpl, HexString} from "./account";
import {Account, SimpleAddress} from "../types/types";
import * as Gen from "aptos/src/generated";

const APTOS_COIN_RESOURCE_TYPE = '0x1::coin::CoinStore<0x1::aptos_coin::AptosCoin>';


// TODO: how to add another interface without question mark?
interface Config {
    nodeURL?: string;
    faucetURL?: string | undefined;
}

export class Provider {

    readonly config: Config;
    readonly backend: AptosClient;
    readonly faucet: FaucetClient | undefined;
    accounts: Account[]; // only single signed accounts
    accountMap: Set<HexString>;
    private chainID: number | undefined;

    constructor(network: Network, c?: Config) {
        this.config = this.parseConfig(network, c);

        if (!this.config.nodeURL) {
            throw new Error(`nodeURL must be specified for ${network}`);
        }
        this.backend = new AptosClient(this.config.nodeURL);

        if (this.config.faucetURL) {
            this.faucet = new FaucetClient(this.config.nodeURL, this.config.faucetURL);
        }
        this.accounts = [];
        this.accountMap = new Set();
    }

    addAccounts(accounts: Account[]) {
        accounts.forEach(this.addAccount);
    }

    createNewAccounts(num: number) {
        for (let _i = 0; _i < num; _i++) {
            this.addAccount(new AccountImpl());
        }
    }

    async fundAccount(account: SimpleAddress | HexString, amount: number): Promise<void> {
        if (!this.faucet) {
            throw new Error("No faucet given. Funding failed");
        }
        const address = account instanceof HexString ? account : account.address();
        await this.faucet?.fundAccount(address, amount);
    }

    // Only get the default coin at the moment
    // TODO: replace with smart contract function calls
    async getBalance(account: SimpleAddress | HexString): Promise<number> {
        const address = account instanceof HexString ? account : account.address();
        const resources = await this.backend.getAccountResources(address);
        const coinResource = resources.find((r) => r.type == APTOS_COIN_RESOURCE_TYPE);
        return parseInt((coinResource?.data as any).coin.value);
    }

    async getSequenceNumber(account: SimpleAddress | HexString): Promise<number> {
        const res = await this.backend.getAccount(account instanceof HexString ? account : account.address());
        return parseInt(res.sequence_number);
    }

    async getChainId(): Promise<number> {
        if (this.chainID !== undefined) {
            return this.chainID;
        }
        return this.backend.getChainId();
    }

    async sendSignedTransactionAndWait(message: BCS.Bytes): Promise<Gen.Transaction_UserTransaction> {
        const res = await this.backend.submitSignedBCSTransaction(message);
        await this.backend.waitForTransaction(res.hash);
        const tx = (await this.getTransactionDetails(res.hash)) as Gen.Transaction_UserTransaction;
        if (!tx.success) {
            console.log('tx:', tx);
            throw tx.vm_status;
        }
        return tx;
    }

    async sendSignedTransactionAsync(message: BCS.Bytes): Promise<Gen.PendingTransaction> {
        return await this.backend.submitSignedBCSTransaction(message);
    }

    async waitForTransaction(txnHash: string): Promise<Gen.Transaction_UserTransaction> {
        await this.backend.waitForTransaction(txnHash);
        const tx = (await this.getTransactionDetails(txnHash)) as Gen.Transaction_UserTransaction;
        if (!tx.success) {
            console.log('tx failed', tx);
            throw tx.vm_status;
        }
        return tx;
    }

    async getTransactionDetails(hash: string): Promise<Gen.Transaction> {
        return await this.backend.getTransactionByHash(hash);
    }

    async getAccountResource(addr: HexString, resourceTag: string): Promise<Gen.MoveResource> {
        return this.backend.getAccountResource(addr, resourceTag);
    }

    private parseConfig(network: Network, c?: Config) {
        const nodeURL = c?.nodeURL || Default.getDefaultNodeURL(network);
        // TODO: Any better solutions?
        if (!nodeURL) {
            throw new Error(`must specify a node URL for ${network} `);
        }

        const faucetURL = c?.faucetURL || Default.getDefaultFaucetURL(network);
        // TODO: Any better solutions?
        if (!faucetURL && network != Network.Mainnet) {
            throw new Error(`must specify a node URL for ${network}`);
        }

        return {
            nodeURL: nodeURL,
            faucetURL: faucetURL,
        };
    }

    private addAccount(account: Account) {
        if (this.accountMap.has(account.address())) {
            return;
        }
        this.accountMap.add(account.address());
        this.accounts.push(account);
    }
}
