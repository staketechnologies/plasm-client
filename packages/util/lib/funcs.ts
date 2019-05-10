const { ApiPromise, WsProvider } = require('@polkadot/api');
const { Keyring, CryptoKeyPair } = require('@polkadot/keyring');
const { BlockNumber, Vector, AccountId, u32, Hash, Struct, Signature, Tuple, u64, u128, Option } = require('@polkadot/types');
const { TxIn, TxOut, Tx, SignedTx } = require('./index.types');
import { blake2AsU8a } from '@polkadot/util-crypto';
import { u8aConcat } from '@polkadot/util';

export async function getBalance(api: ApiPromise, user: AccountId ) {
    const utxoFinder = await api.query.utxo.unspentOutputsFinder(user);
    const utxoList = JSON.parse(utxoFinder);

    var sum = Number(0);
    for var utxo in utxoList {
        const utxoTxHash = new Hash(utxo[0]);
        const utxoOutIndex = new u32(utxo[1]);

        const utxoRef = u8aConcat(utxoTxHash.toU8a(), utxoOutIndex.toU8a());        
        const utxo_q = await api.query.utxo.unspentOutputs(utxoRef);
        const utxown = JSON.parse(utxo_q);
        sum += Number(utxown['value']);
    }
    return sum;
}

export async function genTransfer(api: any, signer: any, src: any, dest: any, value: any) {

    const utxoFinder = await api.query.utxo.unspentOutputsFinder(src);
    const utxoList = JSON.parse(utxoFinder);
    const utxoTxHash = new Hash(utxoList[0][0]);
    const utxoOutIndex = new u32(utxoList[0][1]);
  
    //const utxoRef = new Hash(blake2AsU8a(u8aConcat(new Hash(utxoList[0][0]).toU8a(), new u32(utxoList[0][1]).toU8a())));
    const utxoRef = u8aConcat(utxoTxHash.toU8a(), utxoOutIndex.toU8a());
    
    const utxo = await api.query.utxo.unspentOutputs(utxoRef);
    const utxown = JSON.parse(utxo);
    console.log(cyan + `${src} has balances: ${Number(utxown['value'])}`);
    
    const txIn = new TxIn({
        txHash: utxoTxHash,
        outIndex:  utxoOutIndex})
    const ret2 = await api.tx.plasmUtxo.exin(txIn)
        .signAndSend(signer);
    const txInHash = new Hash(blake2AsU8a(txIn.toU8a()));  
    console.log(`ret txin v : ${ret2}`);
    
    const new_value = Number(utxown['value']) - value;
    const txOut = new TransactionOutput({
      value: new (Tuple.with([u64]))([new u64(value)]),
      keys: new Vector(AccountId, [new AccountId(dest)]),
      quorum: new u32(1)
    })
    // const ret3 = await api.tx.plasmUtxo.exout(txOut)
    // .signAndSend(signer);
    // console.log(`ret3 v : ${ret3}`);

    const txOutOwn = new TransactionOutput({
        value: new(Tuple.with([u64]))([new u64(new_value.toString())]),
        keys: new Vector(AccountId, [new AccountId(src)]),
        quorum: new u32(1)
      })
  
    const tx = new Transaction({
      inputs: new Vector(TransactionInput, [txIn]),
      outputs: new Vector(TransactionOutput, [txOut, txOutOwn]),
      lock_time: new u64(0) 
    })
  
    const txMessage = blake2AsU8a(tx.toU8a());
    const txSigWith = signer.sign(txMessage);
   
    const signedTx = new SignedTransaction({
      payload: new Option(Transaction, new Transaction(tx)),
      signatures: new Vector(Signature, [new Signature(txSigWith)]),
      public_keys: new Vector(AccountId, [new AccountId(src)])
    });

    return signedTx;
}
