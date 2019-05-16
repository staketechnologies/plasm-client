const { BlockNumber, Vector, AccountId, u32, Hash, Signature, u128 } = require('@polkadot/types');
const { TxIn, TxOut, Tx, SignedTx } = require('./index.types');
import { blake2AsU8a } from '@polkadot/util-crypto';
import { u8aConcat } from '@polkadot/util';

export async function getBalance(api: any, user: string ): Promise<BigInt> {
    const utxoFinder = await api.query.utxo.unspentOutputsFinder(new AccountId(user));
    const utxoList = JSON.parse(utxoFinder);

    var sum = BigInt(0);
    for (var utxo of utxoList) {
        const utxoTxHash = new Hash(utxo[0]);
        const utxoOutIndex = new u32(utxo[1]);

        const utxoRef = u8aConcat(utxoTxHash.toU8a(), utxoOutIndex.toU8a());        
        const utxo_q = await api.query.utxo.unspentOutputs(utxoRef);
        const utxown = JSON.parse(utxo_q);
        sum += BigInt(utxown['value']);
    }
    return sum;
}

export async function getUtxoList(api: any, user: string): Promise<[any, any, bigint][]> {
    const utxoFinder = await api.query.utxo.unspentOutputsFinder(new AccountId(user));
    const utxoList = JSON.parse(utxoFinder);

    var retList: [any, any, bigint][] = [];
    for (var utxo of utxoList) {
        const utxoTxHash = new Hash(utxo[0]);
        const utxoOutIndex = new u32(utxo[1]);

        const utxoRef = u8aConcat(utxoTxHash.toU8a(), utxoOutIndex.toU8a());        
        const utxo_q = await api.query.utxo.unspentOutputs(utxoRef);
        const utxown = JSON.parse(utxo_q);
        retList.push( [utxoTxHash, utxoOutIndex, BigInt(utxown['value'])] );
    }
    return retList;
}

export async function genTransfer(api: any, signer: any, src: string, dest: string, value: number, fee: number) {
    var txInList = [];
    var sum: bigint = BigInt(0);
    for (var utxo of await getUtxoList(api, src)) {
        const utxoTxHash = utxo[0];
        const utxoOutIndex = utxo[1];
        sum += utxo[2];
        txInList.push(
            new TxIn({
                txHash: utxoTxHash,
                outIndex: utxoOutIndex
            }))
    }
    
    const new_value: bigint = sum - BigInt(value) - BigInt(fee);
    if (new_value < 0) {
        return false
    }
    const txOut = new TxOut({
      value: new u128(value),
      keys: new Vector(AccountId, [new AccountId(dest)]),
      quorum: new u32(1)
    })

    const txOutOwn = new TxOut({
        value: new u128(new_value.toString()),
        keys: new Vector(AccountId, [new AccountId(src)]),
        quorum: new u32(1)
      })
  
    const tx = new Tx({
      inputs: new Vector(TxIn, txInList),
      outputs: new Vector(TxOut, [txOut, txOutOwn]),
      lock_time: new BlockNumber(0) 
    })
  
    const txMessage = blake2AsU8a(tx.toU8a());
    const txSigWith = signer.sign(txMessage);
   
    const signedTx = new SignedTx({
      payload: new Tx(tx),
      signatures: new Vector(Signature, [new Signature(txSigWith)]),
      public_keys: new Vector(AccountId, [new AccountId(src)])
    });
    return signedTx;
}

async function sleep(sec: number) {
  return  new Promise(resolve => setTimeout(resolve, sec*1000))
}

export async function eventCatch(api: any, section: string, method: string, retry: number) {
  for (var i = 0; i < retry; i++ ) {
    const events = await api.query.system.events()
    // loop through the Vec<EventRecord>
    for (const record of  events) {
      // extract the phase, event and the event types
      const { event,  } = record;
      // show what we are busy with
      if (event.section == section && event.method == method) {
        return event.data
      }
    }
    await sleep(1);
  }
  return null;
}

// return [blocknumber, tx_hash, out_index, proofs, depth, index]
export async function getProof(api: any, signer: any, utxo: any) {
  const currentBlock = await api.query.child.currentBlock();
  if (currentBlock) { } else {
    console.log("unexits blocks...")
    return;
  }
  console.log(currentBlock)
  await api.tx.childMvp
    .getProof(currentBlock, utxo[0], utxo[1])
    .signAndSend(signer);
  const proofs = await eventCatch(api, "childMvp", "Proof", 10);
  console.log(proofs);
  return proofs;
}