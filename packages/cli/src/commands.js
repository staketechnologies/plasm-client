const { Input, NumberPrompt } = require('enquirer');
const { KeyGenerator, genTransfer, getUtxoList, getBalance } = require('@plasm/util');

async function getSender(owner) {
  if(owner) {} else {
    owner = '';
  }
  const prompt = new Input({
    message: 'What is tx sender name?',
    initial: owner
  });
  answer = await prompt.run()
  return answer
}

exports.deposit = async function(api, owner) {
  owner = await getSender(owner);

  const prompt = new NumberPrompt({
      name: 'value',
      message: 'deposit value'
    });
  value = await prompt.run()

  // generate keypair form `${owner}`.
  const keyPair = KeyGenerator.instance.from(owner);
  const hash = await api.tx.parentMvp
    .deposit(value)
    .signAndSend(keyPair);
  console.error('Success deposited!: ', hash.toHex());
}

exports.exit = async function(api, owner) {
  owner = await getSender(owner);
  console.log('exit!!')
}

exports.transfer = async function(api, owner) {
  owner = await getSender(owner);
  console.log('transfer!!')

  const prompt = new Input({
      message: 'What name is transfer to?'
  })
  const dest = await prompt.run();

  prompt = new NumberPrompt({
      name: 'value',
      message: 'deposit value'
    });
  value = await prompt.run()

  const keyPair = KeyGenerator.instance.from(owner);
  const tx = genTransfer(api, keyPair, keyPair.address(), dest, value, 100);
  const hash = await api.tx.utxoMvp
    .execute(tx)
    .signAndSend(keyPair);
  console.log('Success Tx!: ', hash.toHex())
}

exports.setOwner = async function() {
  const prompt = new Input({
      message: 'What is tx sender name?'
    });
    
  answer = await prompt.run()
  return answer
}

exports.displayBalance = async function(api, owner) {
  owner = await getSender(owner);
  const keyPair = KeyGenerator.instance.from(owner);
  const balance = await api.query.balances.freeBalance(keyPair.address());
  console.log(`${owner} has parent balance: ${balance}.`);
}

exports.displayUtxo = async function(api, owner) {
  owner = await getSender(owner);
  const keyPair = KeyGenerator.instance.from(owner);
  const utxoList = await getUtxoList(api, keyPair.address())
  console.log(`${owner} has child utxoList: ${utxoList}`);
  const balance = await getBalance(api, keyPair.address());
  console.log(`Sum of child balance: ${balance}`);
}