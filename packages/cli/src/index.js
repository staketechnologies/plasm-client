const { AutoComplete, Form } = require('enquirer');
const {deposit, exit, transfer, setOwner} =  require('./commands');
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
    limit: 3,
    choices: [
      'transfer',
      'deposit',
      'exit',
      'set_owner',
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
        case 'set_owner':
          owner = await setOwner()
          break;
        default:
          console.log('unimplemented command.');
          break;
      }
      start(parent, child, owner)
    })
    .catch(console.error);  
}
