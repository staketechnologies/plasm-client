const { ApiPromise, WsProvider } = require('@polkadot/api');
const { Keyring, KeyringPair } = require('@polkadot/keyring');
const { BlockNumber, Vector, AccountId, u32, Hash, Struct, Signature, Tuple, u128, Option } = require('@polkadot/types');
const { TxIn, TxOut, Tx, SignedTx } = require('./index.types');
import { blake2AsU8a } from '@polkadot/util-crypto';
import { u8aConcat } from '@polkadot/util';
import { Class } from '@babel/types';

export async function getBalance(api: any, user: string ): Promise<number> {
    const utxoFinder = await api.query.utxo.unspentOutputsFinder(new AccountId(user));
    const utxoList = JSON.parse(utxoFinder);

    var sum = Number(0);
    for (var utxo in utxoList) {
        const utxoTxHash = new Hash(utxo[0]);
        const utxoOutIndex = new u32(utxo[1]);

        const utxoRef = u8aConcat(utxoTxHash.toU8a(), utxoOutIndex.toU8a());        
        const utxo_q = await api.query.utxo.unspentOutputs(utxoRef);
        const utxown = JSON.parse(utxo_q);
        sum += Number(utxown['value']);
    }
    return sum;
}

export async function getUtxoList(api: any, user: string): Promise<[any, any, number][]> {
    const utxoFinder = await api.query.utxo.unspentOutputsFinder(new AccountId(user));
    const utxoList = JSON.parse(utxoFinder);

    var retList: [any, any, number][] = [];
    for (var utxo in utxoList) {
        const utxoTxHash = new Hash(utxo[0]);
        const utxoOutIndex = new u32(utxo[1]);

        const utxoRef = u8aConcat(utxoTxHash.toU8a(), utxoOutIndex.toU8a());        
        const utxo_q = await api.query.utxo.unspentOutputs(utxoRef);
        const utxown = JSON.parse(utxo_q);
        retList.push( [utxoTxHash, utxoOutIndex, Number(utxown['value'])] );
    }
    return retList;
}

export async function genTransfer(api: any, signer: any, src: string, dest: string, value: number, fee: number) {
    var txInList: Class[] = [];
    var sum: number = Number(0);
    for (var utxo in await getUtxoList(api, src)) {
        const utxoTxHash = utxo[0];
        const utxoOutIndex = utxo[1];
        sum += Number(utxo[2]);
        txInList.push(
            new TxIn({
                txHash: utxoTxHash,
                outIndex: utxoOutIndex
            }))
    }
    
    const new_value = sum - value;
    if (new_value < 0) {
        return false
    }
    const txOut = new TxOut({
      value: new (Tuple.with([u128]))([new u128(value)]),
      keys: new Vector(AccountId, [new AccountId(dest)]),
      quorum: new u32(1)
    })

    const txOutOwn = new TxOut({
        value: new(Tuple.with([u128]))([new u128(new_value.toString())]),
        keys: new Vector(AccountId, [new AccountId(src)]),
        quorum: new u32(1)
      })
  
    const tx = new Tx({
      inputs: new Vector(TxIn, txInList),
      outputs: new Vector(TxOut, [txOut, txOutOwn]),
      lock_time: new u128(0) 
    })
  
    const txMessage = blake2AsU8a(tx.toU8a());
    const txSigWith = signer.sign(txMessage);
   
    const signedTx = new SignedTx({
      payload: new Option(Tx, new Tx(tx)),
      signatures: new Vector(Signature, [new Signature(txSigWith)]),
      public_keys: new Vector(AccountId, [new AccountId(src)])
    });
    return signedTx;
}
