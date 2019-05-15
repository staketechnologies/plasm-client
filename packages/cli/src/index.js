const { AutoComplete, Form } = require('enquirer');
const {deposit, exit, transfer, setOwner, send, displayBalance, displayUtxo, exitFinalize, getExitInfo, getProof} =  require('./commands');
const { create } = require('@plasm/util')

var default_p_endpoint = ''
var default_c_endpoint = ''
if (process.env.PARENT_CHAIN_ENDPOINT) {
  default_p_endpoint = process.env.PARENT_CHAIN_ENDPOINT
}
if (process.env.CHILD_CHAIN_ENDPOINT) {
  default_c_endpoint = process.env.CHILD_CHAIN_ENDPOINT
}

const prompt = new Form({
  name: 'endpoints',
  message: 'Please endpoints the following information:',
  choices: [
    { name: 'parent_endpoint', message: 'Parent Endpoint', initial: default_p_endpoint },
    { name: 'child_endpoint', message: 'Child Endpoint', initial: default_c_endpoint },
  ]
});

async function main() {
  prompt.run()
    .then(async value => {
      parent = await create(value.parent_endpoint);
      child = await create(value.child_endpoint);
      await start(parent, child, null)
    })
    .catch(console.error);

  const start = async (parent, child, owner) => {
    console.log(`${parent}, ${child}, ${owner}`);
    const main_prompt = new AutoComplete({
      name: 'command',
      message: 'What do you do now?',
      limit: 10,
      choices: [
        'transfer',
        'deposit',
        'exit',
        'exitFinalize',
        'getExitInfo',
        'getProof',
        'send',
        'set_owner',
        'balance',
        'utxo',
        'quit'
      ]
    });
    main_prompt.run()
      .then(async answer => {
        console.log('Command:', answer)
        switch (answer) {
          case 'transfer':
            await transfer(child, owner)
            break;
          case 'deposit':
            await deposit(parent, owner)
            break;
          case 'exit':
            await exit(parent, owner)
            break;
          case 'exitFinalize':
            await exitFinalize(parent, owner);
            break;
          case 'getExitInfo':
            await getExitInfo(parent, owner);
            break;
          case 'getProof':
            await getProof(child, owner);
            break;
          case 'send':
            await send(parent, owner)
            break;
          case 'set_owner':
            owner = await setOwner()
            break;
          case 'balance':
            await displayBalance(parent, owner)
            break;
          case 'utxo':
            await displayUtxo(child, owner)
            break;
          case 'quit':
            throw 'quit!';
          default:
            console.log('unimplemented command.');
            break;
        }
        start(parent, child, owner)
      })
  }
}

main()
  .then(() => console.log('Run the Plasm CLI') )
  .catch(e=> console.error(e) )