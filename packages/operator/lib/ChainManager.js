const { ApiPromise, WsProvider } = require('@polkadot/api');
const { Keyring } = require('@polkadot/keyring');
const fs = require('fs');

const red     = '\u001b[31m';
const green   = '\u001b[32m';
const cyan    = '\u001b[36m';
const white   = '\u001b[37m';
const yellow  = '\u001b[33m';

class ChainManager {
    constructor(types_path, operator_uri, parent_endpoint, child_endpoint) {
        const keyring = new Keyring({type: 'sr25519'});
        this.typeList = JSON.parse(fs.readFileSync(types_path));
        this.operator = keyring.addFromUri('//' + operator_uri);
        this.parentEndpoint = parent_endpoint;
        this.childEndpoint = child_endpoint;
        this.timer = null;
        this.parent = null;
        this.child = null;
    }

    async parentHandle() {
        this.parent.query.system.events((events) => {
            console.log(white + `\nParentReceived ${events.length} events:`);
        
            // loop through the Vec<EventRecord>
            events.forEach((record) => {
              // extract the phase, event and the event types
              const { event, phase } = record;
              const types = event.typeDef;
        
              // show what we are busy with
              console.log(white + `\t${event.section}:${event.method}:: (phase=${phase.toString()})`);
              console.log(white + `\t\t${event.meta.documentation.toString()}`);
        
              // loop through each of the parameters, displaying the type and data
              event.data.forEach((data, index) => {
    
                console.log(white + `\t\t\t${types[index].type}: ${data.toString()}`);
              });
            });
          });
    }

    async childHandle() {
        this.child.query.system.events((events) => {
            console.log(white + `\nChildReceived ${events.length} events:`);
        
            // loop through the Vec<EventRecord>
            events.forEach((record) => {
              // extract the phase, event and the event types
              const { event, phase } = record;
              const types = event.typeDef;
        
              // show what we are busy with
              console.log(white + `\t${event.section}:${event.method}:: (phase=${phase.toString()})`);
              console.log(white + `\t\t${event.meta.documentation.toString()}`);
        
              // loop through each of the parameters, displaying the type and data
              event.data.forEach((data, index) => {
    
                console.log(white + `\t\t\t${types[index].type}: ${data.toString()}`);
              });
            });
          });
    }
    
    async start() {
        this.parent = await ApiPromise.create({
            provider: new WsProvider(this.parentEndpoint),
            types: this.typeList
        });
        this.child = await ApiPromise.create({
            provider: new WsProvider(this.childEndpoint),
            types: this.typeList
        });
        
        this.parentHandle();
        this.childHandle();
    }

    async submitHandle() {

    }

    async depositHandle() {
      
    }

    async exitHandle() {

    }
}

module.exports = ChainManager