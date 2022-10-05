# AnyFaucet

Serverless Faucet on Aptos. Allow anyone to create aptos faucet token and mint it freely.

## Why this repository?

In common practice, a faucet of a certain coin on Aptos will require a dedicated server to store the private key of the minter account, and handle the request from external users. However this is inefficient since it will need to setup an additional server to handle the request.

`AnyFaucet` propose a serverless solution that not a dedicated server is needed to handle mint request, but only interact with smart contract. For details, please check out the [code](https://github.com/Momentum-Safe/AnyFaucet/blob/main/move/faucet/sources/faucet.move).

## Install
run `npm install` or `yarn`

## Aptos Account Init
1. create address: `aptos init`
2. faucet more coin: `yarn faucet $account`
3. replace `faucet` in `./move/faucet/Move.toml` by the created account

## Deploy Faucet
1. deploy: `yarn deploy`
2. init faucet: `yarn faucet_init`

## Create a New Faucet Token
cmd: `yarn coin_new $name $symbol $decimals $monitor_supply $mint_rate`  
example: `yarn coin_new Bitcoin BTC 8 true 10000000`

## List all Faucet Token
cmd: `yarn coin_list`  
example output:
```
---------------------------------------------------------------------------------------------------- 0
coin type: 0xb56ce9aa82423955426137b1cb13cf1a579347a5dd89a7ed24fa55d3dd8b3968::TestCoin::Coin
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
example: `yarn coin_claim 0xb56ce9aa82423955426137b1cb13cf1a579347a5dd89a7ed24fa55d3dd8b3968::TestCoin::Coin`

## Disclaimer

* Use at your own risk.
* Coin has unlimited supply.
