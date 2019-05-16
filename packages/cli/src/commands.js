const { Input, NumberPrompt, Select } = require('enquirer');
const { KeyGenerator, genTransfer, getUtxoList, getBalance, getProof, getUnfinalizeExitIdList } = require('@plasm/util');

async function getSender(owner) {
  if(owner) {} else {
    owner = '';
  }
  const prompt = new Input({
    message: 'What is tx sender name?',
    initial: owner
  });
  return await prompt.run()
}

async function selectUtxo(api, accountId) {
  const utxoList = await getUtxoList(api, accountId);

  const prompt = new Select({
    name: 'utxo',
    message: `Select ${accountId}'s utxo`, 
    limit: 7,
    choices: utxoList.map((v) => v.toString())
  })
  const utxoStr = await prompt.run();
  return utxoList.filter((v) => v.toString() == utxoStr)[0]
}

async function selectUnfinalizeExitId(api) {
  const exitList = await getUnfinalizeExitIdList(accountId);
  const prompt = new Select({
    name: 'exit',
    message: `Select unfinalize exits`, 
    limit: 7,
    choices: exitList.map((v) => v.toString())
  })
  const exitStr = await prompt.run();
  return exitList.filter((v) => v.toString() == exitStr)[0]
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

  // child deposit
  console.log('Success deposited!: ', hash.toHex());
}

exports.exit = async function(parent, child, owner) {
  owner = await getSender(owner);
  const keyPair = KeyGenerator.instance.from(owner);
  const utxo = await selectUtxo(child, keyPair.address())
  const proofs = await getProof(child, keyPair, utxo);
  const eUtxo = genUtxo(child, utxo);
  const hash = await parent.tx.parentMvp
    .exitStart(proofs[0], proofs[1], proofs[2], proofs[3], eUtxo)
    .signAndSend(keyPair);
  console.log('Success exitStart!: ', hash.toHex());
}

exports.exitFinalize = async function(api, owner) {
  owner = await getSender(owner);
  const keyPair = KeyGenerator.instance.from(owner);
  const exitId = await selectUnfinalizeExitId(parent);
  const hash = await api.tx.parentMvp
    .exit_finalize(exitId)
    .signAndSend(keyPair);
  console.log('Success exit Finalize!!: ', hash.toHex())
}

async function sleep(sec) {
  return  new Promise(resolve => setTimeout(resolve, sec*1000))
}

// getProof
// owner -> utxoList -> select
// get_proof(origin, blk_num: T::BlockNumber, tx_hash: T::Hash, out_index: u32) -> Result
exports.getProof = async function(api, owner) {
  console.log('getProof!')
  owner = await getSender(owner);
  const keyPair = KeyGenerator.instance.from(owner);
  const utxo = await selectUtxo(api, keyPair.address())
  const proofs = await getProof(api, keyPair, utxo);
  console.log('getProof: ', proofs);
}

// getExitStatusStorage
exports.getExitInfo = async function(api, owner) {
  owner = await getSender(owner);
  const exitId = selectUnfinalizeExitId(api)
  const exitInfo = await api.query.parent.exitStatusStorage(new Hash(exitId))
  console.log('exitInfo: ', exitInfo);
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