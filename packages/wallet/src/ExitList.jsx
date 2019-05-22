import React from 'react';
import {List, Icon, Button, Label, Popup} from 'semantic-ui-react';
import {ReactiveComponent} from 'oo7-react';
import {runtime, secretStore} from 'oo7-substrate';
import Identicon from 'polkadot-identicon';
import { create, KeyGenerator, getProof, genExit } from '@plasm/util';

export class ExitList extends ReactiveComponent {
	constructor () {
		super(["src", "exitList"])
    }
    
    handleExitFinalize(src, exitId) {
		create('ws://127.0.0.1:9944').then((api) => {
            let signer = KeyGenerator.instance.from(secretStore().find(src).uri.slice(2));
            api.tx.parentMvp
                .exitFinalize(exitId)
                .signAndSend(signer);
        });
    }

	readyRender () {
		return <List divided verticalAlign='bottom' style={{padding: '0 0 4px 4px', overflow: 'auto', maxHeight: '20em'}}>{
            this.state.exitList.map((exitId) =>
				<List.Item key={exitId}>
					<List.Content floated='right'>
						<Button size='small' onClick={() => this.handleExitFinalize(this.state.src, exitId)}>ExitFinalize</Button>
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
