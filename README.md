# AnyFaucet

Serverless Faucet on Aptos. Allow anyone to create aptos faucet token and mint it freely.

## Why this repository?

In common practice, a faucet of a certain coin on Aptos will require a dedicated server to store the private key of the minter account, and handle the request from external users. However this is inefficient since it will need to setup an additional server to handle the request.

`AnyFaucet` propose a serverless solution that not a dedicated server is needed to handle mint request, but only interact with smart contract. For details, please check out the [code](https://github.com/Momentum-Safe/AnyFaucet/blob/main/move/faucet/sources/faucet.move).

## FaucetCoin vs FreeCoin
AnyFaucet can work in one of two modes: `FaucetCoin` mode or `FreeCoin` mode.  
The difference between the two is how to claim test coins.

In `FaucetCoin` mode, AnyFaucet act as `coin factory` and `coin minter`.  
To mint coins, you should call `AnyFauct.claim<CoinType>(...)`.

In `FreeCoin` mode, AnyFaucet just act as `coin factory`, and `coin minter` is coin itself!  
To mint coins, you should call `coin.claim(...)`.

## Install
run `npm install` or `yarn`

## Aptos Account Init
1. create address: `aptos init`
2. faucet more coin: `yarn faucet $account`
3. replace `faucet` in `./move/faucet/Move.toml` by the created account

## Deploy Faucet
1. deploy: `yarn deploy`
2. init faucet: `yarn faucet_init [$useFreeCoin]`
   - useFreeCoin(bool): 'true' will work in `FreeCoin` mode, omit or 'false' will work in `FaucetCoin` mode.

## Create a New Faucet Token
cmd: `yarn coin_new $name $symbol $decimals $monitor_supply $mint_rate`
   - name(string): name of token
   - symbol(string): symbol of token
   - decimals(number): decimals of token
   - monitor_supply(bool): indicate if it monitors total supply
   - mint_rate(number): maximum amount of a single mint

example: `yarn coin_new Bitcoin BTC 8 true 10000000`

## List all Faucet Token
cmd: `yarn coin_list`  
example output:
```
---------------------------------------------------------------------------------------------------- 0
coin type(FaucetCoin): 0x3fc2de7809febca39a15e80804c1c803c18d19896c89c3e288f1a13baed1f886::faucet_coin::Coin
coin type(FreeCoin): 0x3fc2de7809febca39a15e80804c1c803c18d19896c89c3e288f1a13baed1f886::free_coin::Coin
coin meta: {
  decimals: 8,
  mint_rate: '10000',
  monitor_supply: true,
  name: 'Bitcoin',
  symbol: 'BTC'
}
```

## Register&Claim Faucet Token
cmd: `yarn coin_claim $coin_type`
   - coin_type(string): you can find it in `coin_list`

example: `yarn coin_claim 0x3fc2de7809febca39a15e80804c1c803c18d19896c89c3e288f1a13baed1f886::faucet_coin::Coin`

## Disclaimer

* Use at your own risk.
* Coin has unlimited supply.
