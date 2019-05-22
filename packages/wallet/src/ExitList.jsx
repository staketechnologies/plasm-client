import React from 'react';
import {List, Icon, Button, Label, Popup} from 'semantic-ui-react';
import {ReactiveComponent} from 'oo7-react';
import {runtime, secretStore} from 'oo7-substrate';
import Identicon from 'polkadot-identicon';
import {TransactionProgressLabel, styleStatus} from './TransactionProgressLabel';
import {create, KeyGenerator, getProof, genExit} from '@plasm/util';

export class ExitList extends ReactiveComponent {
	constructor () {
		super(["src", "exitList"], {
            status: {}
        })
    }
    
    handleExitFinalize(src, exitId) {
        this.setState({status: {[exitId]: 'sending'}});
		create('ws://127.0.0.1:9944').then((api) => {
            let signer = KeyGenerator.instance.from(secretStore().find(src).uri.slice(2));
            api.tx.parentMvp
                .exitFinalize(exitId)
                .signAndSend(signer, ({ events = [], status }) => {
                    console.log('Transaction status:', status.type);
                    this.setState({status: {[exitId]: status.type}});
              
                    if (status.isFinalized) {
                      console.log('Completed at block hash', status.asFinalized.toHex());
                      console.log('Events:');
              
                      events.forEach(({ phase, event: { data, method, section } }) => {
                        console.log('\t', phase.toString(), `: ${section}.${method}`, data.toString());
                      });
                    }
                  });
        });
    }

	readyRender () {
		return <List divided verticalAlign='bottom' style={{padding: '0 0 4px 4px', overflow: 'auto', maxHeight: '20em'}}>{
            this.state.exitList.map((exitId) =>
				<List.Item key={exitId}>
					<List.Content floated='right'>
                        <Button 
                            icon='send'
                            size='small'
                            color={styleStatus(this.state.status[exitId]).color}
                            content = 'ExitFinalize'
                            onClick={() => this.handleExitFinalize(this.state.src, exitId)}
                            label={this.state.status[exitId] ? (<TransactionProgressLabel
                                value={this.state.status[exitId]}
                                showContent={false}
                                showIcon={true}
                            />) : null}
                        />
					</List.Content>
					<List.Content>
                        <List.Content floated='left'>
                            <div>ExitId</div>
                            <div style={{fontWeight: 'bold', width: '38em', color: '#050'}}>
                                {exitId.toString()}
                            </div>
                        </List.Content>
					</List.Content>
				</List.Item>
			)
		}</List>
	}
}