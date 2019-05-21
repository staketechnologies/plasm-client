import React from 'react';
import { ReactiveComponent } from 'oo7-react';
import { ss58Encode, pretty } from 'oo7-substrate';
import {TransformBond, bond } from 'oo7';
import { getBalance, create } from '@plasm/util';

export class ChildPretty extends React.Component {
	constructor (props) {
        super(props)
        this.state = {
            value: 0,
        }        
    }

    componentDidMount() {
        create('ws://127.0.0.1:9944').then((api) => {
            this.api = api;
            this.handleValue = this.handleValue.bind(this);
            console.log('props: ', this.props.src);
            this.props.src.tie(this.handleValue)
        })
    }

    handleValue(v1) {
        console.log('handle! ', ss58Encode(v1));
        console.log('api: ', this.api);
        getBalance(this.api, ss58Encode(v1)).then((balance) => {
            console.log('balance: ',balance)
            this.setState({value: balance});
            });
    }

	render () {
        console.log('child render: ');
		if (this.props.default == null) {
            console.log('props: ',this.props.src);
            console.log('state: ',this.state.src);
			return (<span className={this.state.className} name={this.props.name}>
				{(this.props.prefix || '') + pretty(this.state.value) + (this.props.suffix || '')}
            </span>)
		} else {
			return <span>{this.props.default}</span>
		}
	}
}
