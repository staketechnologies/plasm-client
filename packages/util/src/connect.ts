// connection to Plasm-Node.
import { ApiPromise, WsProvider } from "@polkadot/api";
import { Keyring } from "@polkadot/keyring";
import { KeyringPair } from "@polkadot/keyring/types";
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

export class KeyGenerator {
  private static _instance:KeyGenerator;
  public keyring: Keyring;

  private constructor() {
    this.keyring = new Keyring({type: "sr25519"});
  }

  public static get instance():KeyGenerator {
    if (!this._instance) {
      this._instance = new KeyGenerator();
    }
    return this._instance;
  }

  public from(uri: string):KeyringPair  {
    return this.keyring.addFromUri('//' + uri);
  }
}