module free_coin::free_coin {
    use std::signer;
    use aptos_framework::coin;
    use aptos_framework::coin::MintCapability;
    use std::string;
    use faucet::faucet;

    const EMINT_TOO_MUCH: u64 = 1;

    struct Coin {}

    struct CoinInfo has key {
        mint_rate: u64,
        mint_cap: MintCapability<Coin>
    }

    fun init_module(resource: &signer) {
        let (name, symbol, decimals, monitor_supply, mint_rate) = faucet::get_coin_info(signer::address_of(resource));
        let (burn_cap,freeze_cap, mint_cap) = coin::initialize<Coin>(
            resource,
            string::utf8(name),
            string::utf8(symbol),
            decimals,
            monitor_supply,
        );
        coin::destroy_burn_cap(burn_cap);
        coin::destroy_freeze_cap(freeze_cap);
        move_to(resource, CoinInfo {
            mint_rate,
            mint_cap
        });
        faucet::retrieve_resource_account_cap(resource);
    }

    public entry fun mint(to: address, amount: u64) acquires CoinInfo {
        let fcoin = borrow_global<CoinInfo>(@free_coin);
        assert!(amount <= fcoin.mint_rate, EMINT_TOO_MUCH);
        let mint = coin::mint<Coin>(amount, &fcoin.mint_cap);
        coin::deposit(to, mint);
    }

    public entry fun claim(claimer: &signer, amount: u64) acquires CoinInfo {
        let to = signer::address_of(claimer);
        if (!coin::is_account_registered<Coin>(to)) {
            coin::register<Coin>(claimer)
        };
        mint(to, amount)
    }
}
