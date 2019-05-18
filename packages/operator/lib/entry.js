#! /usr/bin/env node

const { waitReady } = require('@polkadot/wasm-crypto');
const { ChainManager } = require('./index');

async function main() {
  // waiting wasm load.
  await waitReady();

  const chainManager = new ChainManager(
    process.env.OPERATOR_URI,
    process.env.PARENT_END_POINT,
    process.env.CHILD_END_POINT
  );

  await chainManager.start()
}

main()
  .then(() => console.log('Operator running. RPC running.'))
  .catch(e=> console.error(e) );