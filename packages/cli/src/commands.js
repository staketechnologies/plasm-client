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
  return await prompt.run()
}

async function selectUtxo(api, accountId) {
  const utxoList = getUtxoList(api, accoundId);

  const prompt = new Select({
    name: 'utxo',
    message: `Select ${owner}'s utxo`, 
    choices: utxoList
  })
  return await prompt.run()
}

exports.deposit = async function(parent, owner) {
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
  console.error('Success deposited!: ', hash.toHex());
}

exports.exit = async function(parent, owner) {
  owner = await getSender(owner);
  //exit_start(origin, blk_num: T::BlockNumber, depth: u32, index: u64, proofs: Vec<T::Hash>, utxo: T::Utxo) -> Result {
  // exit_start(origin, tx_hash: T::Hash, out_index: u32) 

  // input:
  // owner -> utxoList -> select
  // exit!

  console.log('exit!!')
}

exports.exitFinalize = async function(api, owner) {
  owner = await getSender(owner);
  //exit_finalize(origin, exit_id: T::Hash)
  // 
  console.log('exit Finalize!!')
}

// getProof
// owner -> utxoList -> select
// get_proof(origin, blk_num: T::BlockNumber, tx_hash: T::Hash, out_index: u32) -> Result
exports.getProof = async function(api, owner) {
  owner = await getSender(owner);
  console.log('exit Finalize!!')
}

// getExitStatusStorage
exports.getExitInfo = async function(api, owner) {
  owner = await getSender(owner);
  const prompt = new Input({
    message: 'What ExitId?'
  })
  const exitId = await prompt.run();
  const exitInfo = await api.query.plasmParent.exitStatusStorage(new Hash(exitId))
  console.log(exitInfo);
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