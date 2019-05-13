const { AutoComplete, Form } = require('enquirer');
const {deposit, exit, transfer } =  require('./commands');


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
  .then(value => start(value.parent_endpoint, value.child_endpoint))
  .catch(console.error);

const start = (parent, child) => {
  console.log(`${parent}, ${child}`);
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
    .then(answer => {
      console.log('Command:', answer)
      switch (answer) {
        case 'transfer':
          transfer()
          break;
        case 'deposit':
          deposit()
          break;
        case 'exit':
          exit()
          break;
        default:
          console.log('unimplemented command.');
          break;
      }
      start(parent, child)
    })
    .catch(console.error);  
}
