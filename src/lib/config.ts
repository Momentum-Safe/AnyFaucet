export enum Network {
    None = 'None',
    Mainnet = 'Mainnet',
    Testnet = 'Testnet',
    Devnet = 'Devnet',
    Localnet = 'localnet',
}

export const DEFAULT_NETWORK = (process.env.NETWORK || Network.Devnet) as Network;

export const DEVNET_NODE_URL = 'https://fullnode.devnet.aptoslabs.com';
export const DEVNET_FAUCET_URL = 'https://faucet.devnet.aptoslabs.com';
export const TESTNET_NODE_URL = 'https://fullnode.testnet.aptoslabs.com';
export const TESTNET_FAUCET_URL = 'https://faucet.testnet.aptoslabs.com';
export const LOCALNET_NODE_URL = 'http://localhost:8080';
export const LOCALNET_FAUCET_URL = 'http://localhost:8081';

export class Default {
    static getDefaultNodeURL(network: Network) {
        switch (network) {
            case Network.Devnet:
                return DEVNET_NODE_URL;
            case Network.Localnet:
                return LOCALNET_NODE_URL;
            case Network.Testnet:
                return TESTNET_NODE_URL;
            default:
                return undefined;
        }
    }

    static getDefaultFaucetURL(network: Network) {
        switch (network) {
            case Network.Devnet:
                return DEVNET_FAUCET_URL;
            case Network.Localnet:
                return LOCALNET_FAUCET_URL;
            case Network.Testnet:
                return TESTNET_FAUCET_URL;
            default:
                return undefined;
        }
    }
}
