
// @ts-check
// Import the API
import { BlockNumber, Vector, AccountId, u32, Hash, Struct, Signature, U128, u128, Tuple, Moment, Enum } from '@polkadot/types';

export class Value extends U128 {}

export class TransactionInput extends Struct {
	constructor (value?: any) {
		super({
		txHash: Hash,
		outIndex: u32
		}, value)
	}
}
export class TxIn extends TransactionInput {}

export class TransactionOutput extends Struct {
	constructor (value?: any) {
		super({
		value: u128,
		keys:  Vector.with(AccountId),
		quorum: u32
		}, value)
	}
}
export class TxOut extends TransactionOutput {}

export class Transaction extends Struct {
	constructor (value?: any) {
		super({
		inputs: Vector.with(TransactionInput),
		outputs: Vector.with(TransactionOutput),
		lock_time: BlockNumber,
		}, value)
	}
}

export class Tx extends Transaction {}

export class SignedTransaction extends Struct {
	constructor (value?: any) {
		super({
		payload: Transaction,
		signatures: Vector.with(Signature),
		public_keys: Vector.with(AccountId)
		}, value)
	}
}

export class SignedTx extends SignedTransaction {}

export class Utxo extends Tuple {
	constructor (value: any) {
        super({
          Transaction, u32,
        }, value);
    }
}

export class ExitState extends Enum {
	constructor (value?: any) {
		super([
		  'Exiting',
		  'Challenging',
		  'Challenged',
		  'Finalized'
		], value);
	  }
}

export class ExitStatus extends Struct {
	constructor (value?: any) {
		super({
			blkNum: BlockNumber,
			utxo: Utxo,
			started: Moment,
			expired: Moment,
			state: ExitState		
		}, value)
	}
}