const { ApiPromise } = require('@polkadot/api');
const fs = require('fs');

async function main() {
    var typeList = JSON.parse(fs.readFileSync("./../../types.json"));

    const api = await ApiPromise.create({
        types: typeList
    });

    console.log('boot main!')
}

main()
  .then(() => console.log('Operator running. RPC running.') )
  .catch(e=> console.error(e) );