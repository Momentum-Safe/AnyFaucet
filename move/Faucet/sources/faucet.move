module faucet::faucet {
    use std::vector;
    use aptos_framework::account::{Self, SignerCapability};
    use aptos_framework::code;
    use std::bcs;
    use std::signer;
    use aptos_framework::managed_coin;
    use aptos_std::type_info;
    use aptos_framework::coin;
    use std::option::{Self, Option};

    const EMINT_TOO_MUCH: u64 = 1;

    const COIN_FACTORY_SEED: vector<u8> = b"COIN FACTORY SEED";

    /// should be either Faucet Coin or Free Coin
    struct CodeStore has key {
        code: vector<u8>,
        meta_info: vector<u8>,
        address_indexes: vector<u8>
    }

    struct CapStore has key,drop {
        cap: Option<SignerCapability>,
    }

    struct CoinInfo has key, drop {
        name: vector<u8>,
        symbol: vector<u8>,
        decimals: u8,
        monitor_supply: bool,
        mint_rate: u64,
    }

    struct CoinList has key {
        coins: vector<address>
    }

    fun init_module(sender: &signer) {
        new_resource_account(sender, COIN_FACTORY_SEED);
        move_to(sender, CoinList {
            coins: vector::empty()
        })
    }

    public entry fun init_coin_code(s: &signer, code: vector<u8>, meta_info: vector<u8>, address_indexes: vector<u8>) {
        move_to(s, CodeStore {
            code,
            meta_info,
            address_indexes
        })
    }

    fun get_coin_factory(): signer acquires CapStore {
        let factory_address = account::create_resource_address(&@faucet, COIN_FACTORY_SEED);
        get_signer(factory_address)
    }

    fun get_signer(addr: address): signer acquires CapStore {
        let store = borrow_global<CapStore>(addr);
        account::create_signer_with_capability(option::borrow(&store.cap))
    }

    fun get_coin_signer<CoinType>(): signer acquires CapStore {
        let coin = coin_address<CoinType>();
        get_signer(coin)
    }

    fun new_resource_account(s: &signer, seed: vector<u8>): signer {
        let (account, cap) = account::create_resource_account(s, seed);
        move_to(&account, CapStore {
            cap: option::some(cap)
        });
        account
    }

    fun create_coin_account(seed: vector<u8>): signer acquires CapStore {
        let factory = get_coin_factory();
        new_resource_account(&factory, seed)
    }

    fun publish_coin_code(new_coin: &signer) acquires CodeStore {
        let code_store = borrow_global<CodeStore>(@faucet);
        let new_code = get_code(code_store, signer::address_of(new_coin));
        code::publish_package_txn(new_coin, code_store.meta_info, vector::singleton(new_code));
    }

    // optional: Coin module can call this function to get back owenr's SignerCapability, so it can self manage
    public fun retrieve_resource_account_cap (resource: &signer):SignerCapability acquires CapStore {
        let store = move_from<CapStore>(signer::address_of(resource));
        option::extract(&mut store.cap)
    }

    public entry fun new_faucet_coin(name: vector<u8>, symbol: vector<u8>, decimals: u8, monitor_supply: bool, mint_rate: u64) acquires CapStore, CoinList, CodeStore {
        // use name as seed
        let new_coin = create_coin_account(name);
        // must save CoinInfo before code publish
        move_to(&new_coin, CoinInfo {
            name,
            symbol,
            decimals,
            monitor_supply,
            mint_rate
        });
        publish_coin_code(&new_coin);
        let coins_list = borrow_global_mut<CoinList>(@faucet);
        vector::push_back(&mut coins_list.coins, signer::address_of(&new_coin));
    }
    /// only work for Faucet Coin
    public entry fun mint<CoinType>(to: address, amount: u64) acquires CapStore, CoinInfo {
        let coin = get_coin_signer<CoinType>();
        let coin_info = borrow_global<CoinInfo>(signer::address_of(&coin));
        assert!(amount <= coin_info.mint_rate, EMINT_TOO_MUCH);
        managed_coin::mint<CoinType>(&coin, to, amount)
    }
    /// only work for Faucet Coin
    public entry fun claim<CoinType>(claimer: &signer, amount: u64) acquires CapStore, CoinInfo {
        let to = signer::address_of(claimer);
        if(!coin::is_account_registered<CoinType>(to)) {
            coin::register<CoinType>(claimer)
        };
        mint<CoinType>(to, amount)
    }

    fun coin_address<CoinType>(): address {
        let type_info = type_info::type_of<CoinType>();
        type_info::account_address(&type_info)
    }

    public fun get_coin_info(s: address): (vector<u8>, vector<u8>, u8, bool, u64) acquires CoinInfo {
        let coin_info = borrow_global<CoinInfo>(s);
        (coin_info.name, coin_info.symbol, coin_info.decimals, coin_info.monitor_supply, coin_info.mint_rate)
    }

    fun get_code(code_store: &CodeStore, new_address: address): vector<u8> {
        let address_bytes = bcs::to_bytes(&new_address);
        replace_all(&code_store.code, &code_store.address_indexes, address_bytes)
    }

    fun replace_all(code_template: &vector<u8>, address_indexes: &vector<u8>, new_address_bytes: vector<u8>): vector<u8> {
        let new_code = vector::empty();
        let i = 0u64;
        while (i < vector::length(address_indexes)) {
            let offset = read_u16(vector_slice(address_indexes, i, i + 2));
            i = i + 2;
            let code_slice = vector_slice(code_template, vector::length(&new_code), offset);
            vector::append(&mut new_code, code_slice);
            vector::append(&mut new_code, new_address_bytes);
        };
        let last_piece = vector_slice(code_template, vector::length(&new_code), vector::length(code_template));
        vector::append(&mut new_code, last_piece);
        new_code
    }

    fun read_u16(bytes: vector<u8>): u64 {
        let low = *vector::borrow(&bytes, 0);
        let high = *vector::borrow(&bytes, 1);
        ((high as u64)<<8) | (low as u64)
    }

    fun vector_slice<T: copy>(vec: &vector<T>, start: u64, end: u64): vector<T> {
        let vec_slice = vector::empty<T>();
        while (start < end) {
            vector::push_back(&mut vec_slice, *vector::borrow(vec, start));
            start = start + 1;
        };
        vec_slice
    }

    #[test]
    fun test_replace_all() {
        let new_code = replace_all(&b"--23--6789--cd--", &x"000004000a000e00", b"==");
        assert!(new_code == b"==23==6789==cd==", 0);
        let new_code = replace_all(&b"--23--6789--cd", &x"000004000a00", b"==");
        assert!(new_code == b"==23==6789==cd", 0);
        let new_code = replace_all(&b"0123--6789--cd", &x"04000a00", b"==");
        assert!(new_code == b"0123==6789==cd", 0);
    }

}
