const { Input, NumberPrompt, Select } = require('enquirer');
const { KeyGenerator, genTransfer, getUtxoList, getBalance, getProof, getUnfinalizeExitIdList, genUtxo } = require('@plasm/util');

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
  if (utxoList.length == 0) {
    return null
  }
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
  const exitList = await getUnfinalizeExitIdList(api);
  if (exitList.length == 0) {
    return null
  }
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
  const hash = await api.tx.parent
    .deposit(value)
    .signAndSend(keyPair);

  // child deposit
  console.log('Success deposited!: ', hash.toHex());
}

exports.exit = async function(parent, child, owner) {
  owner = await getSender(owner);
  const keyPair = KeyGenerator.instance.from(owner);
  const utxo = await selectUtxo(child, keyPair.address())
  if (!utxo) {
    console.log('Empty utxo.')
    return;
  }
  //blocknumber, tx_hash, out_index, proofs, depth, index
  const proofs = await getProof(child, keyPair, utxo);
  const eUtxo = await genUtxo(child, utxo);
  //blk_num: T::BlockNumber, depth: u32, index: u64, proofs: Vec<T::Hash>, utxo: T::Utxo
  const hash = await parent.tx.parent
    .exitStart(proofs[0], proofs[4], proofs[5], proofs[3], eUtxo)
    .signAndSend(keyPair);
  console.log('Success exitStart!: ', hash.toHex());
}

exports.exitFinalize = async function(api, owner) {
  owner = await getSender(owner);
  const keyPair = KeyGenerator.instance.from(owner);
  const exitId = await selectUnfinalizeExitId(parent);
  if (!exitId) {
    console.log('Empty exitId');
    return;
  }
  const hash = await api.tx.parent
    .exitFinalize(exitId)
    .signAndSend(keyPair);
  console.log('Success exit Finalize!!: ', hash.toHex())
}

// getProof
// owner -> utxoList -> select
// get_proof(origin, blk_num: T::BlockNumber, tx_hash: T::Hash, out_index: u32) -> Result
exports.getProof = async function(api, owner) {
  console.log('getProof!')
  owner = await getSender(owner);
  const keyPair = KeyGenerator.instance.from(owner);
  const utxo = await selectUtxo(api, keyPair.address())
  if (!utxo) {
    console.log('Empty utxo.')
    return;
  }
  const proofs = await getProof(api, keyPair, utxo);
  console.log('getProof: ', proofs);
}

// getExitStatusStorage
exports.getExitInfo = async function(api) {
  const exitId = await selectUnfinalizeExitId(api)
  if (!exitId) {
    console.log('Empty exitId');
    return;
  }
  const exitInfo = await api.query.parent.exitStatusStorage(exitId)
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
  const hash = await api.tx.child
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