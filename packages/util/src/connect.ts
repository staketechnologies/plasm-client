// connection to Plasm-Node.
import { ApiPromise, WsProvider } from "@polkadot/api";
import * as types from './index.types';

export async function create(endpoint: string){
    return await ApiPromise.create({
        provider: new WsProvider(endpoint),
        types: {
            Value: types.Value,
            TranasctionInput: types.TransactionInput,
            TransactionOutput: types.TransactionOutput,
            Transaction: types.Transaction,
            SignedTransaction: types.SignedTransaction,
            TxIn: types.TxIn,
            TxOut: types.TxOut,
            Tx: types.Tx,
            SignedTx: types.SignedTx
        }
    });
}