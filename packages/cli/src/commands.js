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
  const prompt = new Input({
      message: 'What name is transfer to?'
  })
  const dest = await prompt.run();

  const prompt2 = new NumberPrompt({
      name: 'value',
      message: 'transfer value'
    });
  value = await prompt2.run()

  const keyPair = KeyGenerator.instance.from(owner);
  const destPair = KeyGenerator.instance.from(dest);
  const tx = await genTransfer(api, keyPair, keyPair.address(), destPair.address(), value, 0);
  console.log(tx)
  const hash = await api.tx.childMvp
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

exports.send = async function(api, owner) {
  owner = await getSender(owner);
  const prompt = new Input({
      message: 'What name is send to?'
  })
  const dest = await prompt.run();

  const prompt2 = new NumberPrompt({
      name: 'value',
      message: 'send value'
    });
  value = await prompt2.run()

  const keyPair = KeyGenerator.instance.from(owner);
  const destPair = KeyGenerator.instance.from(dest);
  const hash = await api.tx.balances
    .transfer(destPair.address(), value)
    .signAndSend(keyPair);
  console.log('Success Send!: ', hash.toHex());
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