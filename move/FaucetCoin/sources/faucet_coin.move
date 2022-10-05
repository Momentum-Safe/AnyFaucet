module faucet_coin::faucet_coin {
    use faucet::faucet;
    use std::signer;
    use aptos_framework::managed_coin;

    struct Coin {}

    fun init_module(resource: &signer) {
        let (name, symbol, decimals, monitor_supply, _) = faucet::get_coin_info(signer::address_of(resource));
        managed_coin::initialize<Coin>(
            resource,
            name,
            symbol,
            decimals,
            monitor_supply,
        );
    }
}
