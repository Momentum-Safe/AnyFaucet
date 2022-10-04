module coin::TestCoin {
    use faucet::Faucet;
    use std::signer;
    use aptos_framework::managed_coin;

    struct Coin {}

    fun init_module(sender: &signer) {
        let (name, symbol, decimals, monitor_supply) = Faucet::get_coin_info(signer::address_of(sender));
        managed_coin::initialize<Coin>(
            sender,
            name,
            symbol,
            decimals,
            monitor_supply,
        );
    }
}
