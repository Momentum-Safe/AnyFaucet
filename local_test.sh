set -e

echo run 'yarn local-node'
export NETWORK=localnet
source .env
yarn local-faucet "$FAUCET"
yarn local-deploy
if [ "$1" == 'true' ]; then
  yarn faucet_init true
else
  yarn faucet_init false
fi
yarn coin_new "bitcoin aptos" BTC 8 true 10000
yarn coin_list

if [ "$1" == 'true' ]; then
  coin=$(yarn coin_list | grep FreeCoin | cut -d " " -f 3)
else
  coin=$(yarn coin_list | grep FaucetCoin | cut -d " " -f 3)
fi
yarn coin_claim "$coin" 10000
