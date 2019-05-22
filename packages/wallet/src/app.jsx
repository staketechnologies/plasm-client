import React from 'react';
require('semantic-ui-css/semantic.min.css');
import { Icon, Accordion, List, Checkbox, Label, Header, Segment, Divider, Button } from 'semantic-ui-react';
import { Bond, TransformBond } from 'oo7';
import { ReactiveComponent, If, Rspan } from 'oo7-react';
import {
	calls, runtime, chain, system, runtimeUp, ss58Decode, ss58Encode, pretty,
	addressBook, secretStore, metadata, nodeService, bytesToHex, hexToBytes, AccountId, addCodecTransform
} from 'oo7-substrate';
import Identicon from 'polkadot-identicon';
import { AccountIdBond, SignerBond } from './AccountIdBond.jsx';
import { BalanceBond } from './BalanceBond.jsx';
import { InputBond } from './InputBond.jsx';
import { TransactButton } from './TransactButton.jsx';
import { FileUploadBond } from './FileUploadBond.jsx';
import { StakingStatusLabel } from './StakingStatusLabel';
import { WalletList, SecretItem } from './WalletList';
import { UtxoList } from './UtxoList';
import { AddressBookList } from './AddressBookList';
import { TransformBondButton } from './TransformBondButton';
import { Pretty } from './Pretty';
import { ChildPretty } from './ChildPretty';
import { genTransfer, create, KeyGenerator, getUtxoList } from '@plasm/util';

export class App extends ReactiveComponent {
	constructor() {
		super([], { ensureRuntime: runtimeUp })

		// For debug only.
		window.runtime = runtime;
		window.secretStore = secretStore;
		window.addressBook = addressBook;
		window.chain = chain;
		window.calls = calls;
		window.system = system;
		window.that = this;
		window.metadata = metadata;
		addCodecTransform("<Tasbalances::Trait>::Balance", 'Balance');
	}

	readyRender() {
		return (<div>
			<Heading />
			<WalletSegment />
			<Divider hidden />
			<AddressBookSegment />
			<Divider hidden />
			<FundingSegment />
			<Divider hidden />
			<TransferSegment />
			<Divider hidden />
			<DepositSegment />
			<Divider hidden />
			<ExitSegment />
			<Divider hidden />		
		</div>);
	}
}

class Heading extends React.Component {
	render() {
		return <div>
			<If
				condition={nodeService().status.map(x => !!x.connected)}
				then={<Label>Connected <Label.Detail>
					<Pretty className="value" value={nodeService().status.sub('connected')} />
				</Label.Detail></Label>}
				else={<Label>Not connected</Label>}
			/>
			<Label>Name <Label.Detail>
				<Pretty className="value" value={system.name} /> v<Pretty className="value" value={system.version} />
			</Label.Detail></Label>
			<Label>Chain <Label.Detail>
				<Pretty className="value" value={system.chain} />
			</Label.Detail></Label>
			<Label>Runtime <Label.Detail>
				<Pretty className="value" value={runtime.version.specName} /> v<Pretty className="value" value={runtime.version.specVersion} /> (
					<Pretty className="value" value={runtime.version.implName} /> v<Pretty className="value" value={runtime.version.implVersion} />
				)
			</Label.Detail></Label>
			<Label>Height <Label.Detail>
				<Pretty className="value" value={chain.height} /> (with <Pretty className="value" value={chain.lag} /> lag)
			</Label.Detail></Label>
			<Label>Authorities <Label.Detail>
				<Rspan className="value">{
					runtime.core.authorities.mapEach((a, i) => <Identicon key={bytesToHex(a) + i} account={a} size={16} />)
				}</Rspan>
			</Label.Detail></Label>
			<Label>Total issuance <Label.Detail>
				<Pretty className="value" value={runtime.balances.totalIssuance} />
			</Label.Detail></Label>
		</div>
	}
}

class WalletSegment extends React.Component {
	constructor() {
		super()
		this.seed = new Bond;
		this.seedAccount = this.seed.map(s => s ? secretStore().accountFromPhrase(s) : undefined)
		this.seedAccount.use()
		this.name = new Bond;
	}
	render() {
		return <Segment style={{ margin: '1em' }}>
			<Header as='h2'>
				<Icon name='key' />
				<Header.Content>
					Wallet
					<Header.Subheader>Manage your secret keys</Header.Subheader>
				</Header.Content>
			</Header>
			<div style={{ paddingBottom: '1em' }}>
				<div style={{ fontSize: 'small' }}>seed</div>
				<InputBond
					bond={this.seed}
					reversible
					placeholder='Some seed for this key'
					validator={n => n || null}
					action={<Button content="Another" onClick={() => this.seed.trigger(secretStore().generateMnemonic())} />}
					iconPosition='left'
					icon={<i style={{ opacity: 1 }} className='icon'><Identicon account={this.seedAccount} size={28} style={{ marginTop: '5px' }} /></i>}
				/>
			</div>
			<div style={{ paddingBottom: '1em' }}>
				<div style={{ fontSize: 'small' }}>name</div>
				<InputBond
					bond={this.name}
					placeholder='A name for this key'
					validator={n => n ? secretStore().map(ss => ss.byName[n] ? null : n) : null}
					action={<TransformBondButton
						content='Create'
						transform={(name, seed) => secretStore().submit(seed, name)}
						args={[this.name, this.seed]}
						immediate
					/>}
				/>
			</div>
			<div style={{ paddingBottom: '1em' }}>
				<WalletList />
			</div>
		</Segment>
	}
}

class AddressBookSegment extends React.Component {
	constructor() {
		super()
		this.nick = new Bond
		this.lookup = new Bond
	}
	render() {
		return <Segment style={{ margin: '1em' }} padded>
			<Header as='h2'>
				<Icon name='search' />
				<Header.Content>
					Address Book
					<Header.Subheader>Inspect the status of any account and name it for later use</Header.Subheader>
				</Header.Content>
			</Header>
			<div style={{ paddingBottom: '1em' }}>
				<div style={{ fontSize: 'small' }}>lookup account</div>
				<AccountIdBond bond={this.lookup} />
				<If condition={this.lookup.ready()} then={<div>
					<Label>Parent Balance
						<Label.Detail>
							<Pretty value={runtime.balances.balance(this.lookup)} />
						</Label.Detail>
					</Label>
					<Label>Child Balance
						<Label.Detail>
							<ChildPretty src={this.lookup} />
						</Label.Detail>
					</Label>
					<Label>Nonce
						<Label.Detail>
							<Pretty value={runtime.system.accountNonce(this.lookup)} />
						</Label.Detail>
					</Label>
					<If condition={runtime.indices.tryIndex(this.lookup, null).map(x => x !== null)} then={
						<Label>Short-form
							<Label.Detail>
								<Rspan>{runtime.indices.tryIndex(this.lookup).map(i => ss58Encode(i) + ` (index ${i})`)}</Rspan>
							</Label.Detail>
						</Label>
					} />
					<Label>Address
						<Label.Detail>
							<Pretty value={this.lookup} />
						</Label.Detail>
					</Label>
				</div>} />
			</div>
			<div style={{ paddingBottom: '1em' }}>
				<div style={{ fontSize: 'small' }}>name</div>
				<InputBond
					bond={this.nick}
					placeholder='A name for this address'
					validator={n => n ? addressBook().map(ss => ss.byName[n] ? null : n) : null}
					action={<TransformBondButton
						content='Add'
						transform={(name, account) => { addressBook().submit(account, name); return true }}
						args={[this.nick, this.lookup]}
						immediate
					/>}
				/>
			</div>
			<div style={{ paddingBottom: '1em' }}>
				<AddressBookList />
			</div>
		</Segment>
	}
}

class FundingSegment extends React.Component {
	constructor() {
		super()

		this.source = new Bond;
		this.amount = new Bond;
		this.destination = new Bond;
	}
	render() {
		return <Segment style={{ margin: '1em' }} padded>
			<Header as='h2'>
				<Icon name='send' />
				<Header.Content>
					Send Funds @ ParentWallet
					<Header.Subheader>Send funds from your account to another At ParentChain</Header.Subheader>
				</Header.Content>
			</Header>
			<div style={{ paddingBottom: '1em' }}>
				<div style={{ fontSize: 'small' }}>from</div>
				<SignerBond bond={this.source} />
				<If condition={this.source.ready()} then={<span>
					<Label>Parent Balance
						<Label.Detail>
							<Pretty value={runtime.balances.balance(this.source)} />
						</Label.Detail>
					</Label>
					<Label>Child Balance
						<Label.Detail>
							<ChildPretty src={this.source} />
						</Label.Detail>
					</Label>
					<Label>Nonce
						<Label.Detail>
							<Pretty value={runtime.system.accountNonce(this.source)} />
						</Label.Detail>
					</Label>
				</span>} />
			</div>
			<div style={{ paddingBottom: '1em' }}>
				<div style={{ fontSize: 'small' }}>to</div>
				<AccountIdBond bond={this.destination} />
				<If condition={this.destination.ready()} then={<span>
					<Label>Parent Balance
						<Label.Detail>
							<Pretty value={runtime.balances.balance(this.destination)} />
						</Label.Detail>
					</Label>
					<Label>Child Balance
						<Label.Detail>
							<ChildPretty src={this.destination} />
						</Label.Detail>
					</Label>
				</span>} />
			</div>
			<div style={{ paddingBottom: '1em' }}>
				<div style={{ fontSize: 'small' }}>amount</div>
				<BalanceBond bond={this.amount} />
			</div>
			<TransactButton
				content="Send"
				icon='send'
				tx={{
					sender: runtime.indices.tryIndex(this.source),
					call: calls.balances.transfer(runtime.indices.tryIndex(this.destination), this.amount),
					compact: false,
					longevity: true
				}}
			/>
		</Segment>
	}
}

class TransferSegment extends React.Component {
	constructor() {
		super()

		this.state = {transfer: null}

		this.source = new Bond;
		this.amount = new Bond;
		this.destination = new Bond;
		this.transfer = new Bond;
		this.genTx = Bond.all([this.source, this.destination, this.amount])
		
		create('ws://127.0.0.1:9944').then((api) => {
			this.genTx.tie(([source, dest, amount]) => {
				let signer = KeyGenerator.instance.from(secretStore().find(source).uri.slice(2));
				console.log('genTx: ',signer,  source, dest, amount)
				genTransfer(api, signer, source, dest, Number(amount), 0)
					.then((tx) => this.transfer.changed(tx.toU8a()));
			})
		});
	}
	render() {
		return <Segment style={{ margin: '1em' }} padded>
			<Header as='h2'>
				<Icon name='send' />
				<Header.Content>
					Send Funds @ ChildWallet
					<Header.Subheader>Send funds from your account to another At ChildChain</Header.Subheader>
				</Header.Content>
			</Header>
			<div style={{ paddingBottom: '1em' }}>
				<div style={{ fontSize: 'small' }}>from</div>
				<SignerBond bond={this.source} />
				<If condition={this.source.ready()} then={<span>
					<Label>Parent Balance
						<Label.Detail>
							<Pretty value={runtime.balances.balance(this.source)} />
						</Label.Detail>
					</Label>
					<Label>Child Balance
						<Label.Detail>
							<ChildPretty src={this.source} />
						</Label.Detail>
					</Label>
					<Label>Nonce
						<Label.Detail>
							<Pretty value={runtime.system.accountNonce(this.source)} />
						</Label.Detail>
					</Label>
				</span>} />
			</div>
			<div style={{ paddingBottom: '1em' }}>
				<div style={{ fontSize: 'small' }}>to</div>
				<AccountIdBond bond={this.destination} />
				<If condition={this.destination.ready()} then={<span>
					<Label>Parent Balance
						<Label.Detail>
							<Pretty value={runtime.balances.balance(this.destination)} />
						</Label.Detail>
					</Label>
					<Label>Child Balance
						<Label.Detail>
							<ChildPretty src={this.destination} />
						</Label.Detail>
					</Label>
				</span>} />
			</div>
			<div style={{ paddingBottom: '1em' }}>
				<div style={{ fontSize: 'small' }}>amount</div>
				<BalanceBond bond={this.amount} />
			</div>
			<TransactButton
				content="Send"
				icon='send'
				tx={{
					sender: runtime.indices.tryIndex(this.source),
					call: calls.childMvp.execute(this.transfer),
					compact: false,
					longevity: true
				}}
			/>
		</Segment>
	}
}

class DepositSegment extends React.Component {
	constructor() {
		super()

		this.source = new Bond;
		this.amount = new Bond;
	}
	render() {
		return <Segment style={{ margin: '1em' }} padded>
			<Header as='h2'>
				<Icon name='send' />
				<Header.Content>
					Deposit Child Wallet from Parent Wallet.
					<Header.Subheader>Send funds from your account to another</Header.Subheader>
				</Header.Content>
			</Header>
			<div style={{ paddingBottom: '1em' }}>
				<div style={{ fontSize: 'small' }}>from</div>
				<SignerBond bond={this.source} />
				<If condition={this.source.ready()} then={<span>
					<Label>Parent Balance
						<Label.Detail>
							<Pretty value={runtime.balances.balance(this.source)} />
						</Label.Detail>
					</Label>
					<Label>Child Balance
						<Label.Detail>
							<ChildPretty src={this.source} />
						</Label.Detail>
					</Label>
					<Label>Nonce
						<Label.Detail>
							<Pretty value={runtime.system.accountNonce(this.source)} />
						</Label.Detail>
					</Label>
				</span>} />
			</div>
			<div style={{ paddingBottom: '1em' }}>
				<div style={{ fontSize: 'small' }}>amount</div>
				<BalanceBond bond={this.amount} />
			</div>
			<TransactButton
				content="Send"
				icon='send'
				tx={{
					sender: runtime.indices.tryIndex(this.source),
					call: calls.parentMvp.deposit(this.amount),
					compact: false,
					longevity: true
				}}
			/>
		</Segment>
	}
}

class ExitSegment extends React.Component {
	constructor() {
		super()

		this.source = new Bond;
		this.utxoList = new Bond;
		create('ws://127.0.0.1:9944').then((api) => {
			this.source.tie((source) => {
				getUtxoList(api, source)
					.then((ret) => this.utxoList.changed(ret.map(([a,b,c]) => [a,b,c.toString()])));
			})
		});
	}
	render() {
		return <Segment style={{ margin: '1em' }} padded>
			<Header as='h2'>
				<Icon name='send' />
				<Header.Content>
					Exit Child Wallet to Parent Wallet.
					<Header.Subheader>Send funds from your account to another</Header.Subheader>
				</Header.Content>
			</Header>
			<div style={{ paddingBottom: '1em' }}>
				<div style={{ fontSize: 'small' }}>from</div>
				<SignerBond bond={this.source} />
				<If condition={this.source.ready()} then={<span>
					<Label>Parent Balance
						<Label.Detail>
							<Pretty value={runtime.balances.balance(this.source)} />
						</Label.Detail>
					</Label>
					<Label>Child Balance
						<Label.Detail>
							<ChildPretty src={this.source} />
						</Label.Detail>
					</Label>
					<Label>Nonce
						<Label.Detail>
							<Pretty value={runtime.system.accountNonce(this.source)} />
						</Label.Detail>
					</Label>
				</span>} />
			</div>
			<div style={{ paddingBottom: '1em' }}>
				<UtxoList utxoList={this.utxoList} />
			</div>

		</Segment>
	}
}