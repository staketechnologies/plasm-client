import React from 'react';
import {List, Icon, Button, Label, Popup} from 'semantic-ui-react';
import {ReactiveComponent} from 'oo7-react';
import {runtime, secretStore} from 'oo7-substrate';
import Identicon from 'polkadot-identicon';
import {TransactionProgressLabel, styleStatus} from './TransactionProgressLabel';
import { create, KeyGenerator, getProof, genUtxo } from '@plasm/util';

export class UtxoList extends ReactiveComponent {
	constructor () {
		super(["src", "utxoList"], {
            status: {}
        })
    }
    
    handleExit(src, txHash, outIndex) {
		create('ws://127.0.0.1:9944').then((api) => {
            let signer = KeyGenerator.instance.from(secretStore().find(src).uri.slice(2));
            this.setState({status: {
                [this.key(txHash, outIndex)]: 'signing'
            }});
            getProof(api, signer, [txHash, outIndex])
                .then((proofs) => {
                    this.setState({status: {
                        [this.key(txHash, outIndex)]: 'sending'
                    }});
                    genUtxo(api, [txHash, outIndex])
                        .then((eUtxo) => {
                            if (!eUtxo) {
                                this.setState({status: {
                                    [this.key(txHash, outIndex)]: 'Failed'
                                }});
                            } else {
                                api.tx.parentMvp
                                    .exitStart(proofs[0], proofs[4], proofs[5], proofs[3], eUtxo)
                                    .signAndSend(signer, ({ events = [], status }) => {
                                        console.log('Transaction status:', status.type);
                                        this.setState({status: {
                                            [this.key(txHash, outIndex)]: status.type
                                        }});
                                        if (status.isFinalized) {
                                        console.log('Completed at block hash', status.asFinalized.toHex());
                                        console.log('Events:');
                                
                                        events.forEach(({ phase, event: { data, method, section } }) => {
                                            console.log('\t', phase.toString(), `: ${section}.${method}`, data.toString());
                                        });
                                        }
                                    });
                            }
                        })
                })
			});
    }

    key(txHash, outIndex) {
        return txHash.toString() + outIndex.toString();
    }

	readyRender () {
		return <List divided verticalAlign='bottom' style={{padding: '0 0 4px 4px', overflow: 'auto', maxHeight: '20em'}}>{
            this.state.utxoList.map(([txHash,outIndex,balance]) =>
				<List.Item key={this.key(txHash, outIndex)}>
					<List.Content floated='right'>
                        <Button 
                            icon='send'
                            size='small'
                            color={styleStatus(this.state.status[this.key(txHash, outIndex)]).color}
                            content = 'ExitStart'
                            onClick={() => this.handleExit(this.state.src, txHash, outIndex)}
                            label={this.state.status[this.key(txHash, outIndex)] ? (<TransactionProgressLabel
                                value={this.state.status[this.key(txHash, outIndex)]}
                                showContent={false}
                                showIcon={true}
                            />) : null}
                        />
					</List.Content>
					<List.Content>
                        <List.Content floated='left'>
                            <div>TxHash</div>
                            <div style={{fontWeight: 'bold', width: '38em', color: '#050'}}>
                                {txHash.toString()}
                            </div>
                        </List.Content>
					</List.Content>
					<List.Content floated='left'>
						<div>OutIndex</div>
						<div style={{fontWeight: 'bold', width: '4em', color: '#dad'}}>
                            {outIndex.toString()}
						</div>
					</List.Content>
					<List.Content floated='left'>
						<div>Balance</div>
						<div style={{fontWeight: 'bold', width: '8em', color: '#dd3'}}>
                            {balance.toString()}
						</div>
					</List.Content>
				</List.Item>
			)
		}</List>
	}
}
