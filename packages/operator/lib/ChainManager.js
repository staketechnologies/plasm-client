const { genTransfer, KeyGenerator, create } = require('@plasm/util');
const { Hash } = require('@polkadot/types')
const { blake2AsU8a } = require('@polkadot/util-crypto');
const fs = require('fs');

const red     = '\u001b[31m';
const green   = '\u001b[32m';
const cyan    = '\u001b[36m';
const white   = '\u001b[37m';
const yellow  = '\u001b[33m';

class ChainManager {
  constructor(operator_uri, parent_endpoint, child_endpoint) {
    this.operator = KeyGenerator.instance.from(operator_uri);
    this.parentEndpoint = parent_endpoint;
    this.childEndpoint = child_endpoint;

    this.fee = 0;

    this.localNonce = 0;
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
  
        if (event.section == "parentMvp") {
          // show what we are busy with
          console.log(white + `\t${event.section}:${event.method}:: (phase=${phase.toString()})`);
          console.log(white + `\t\t${event.meta.documentation.toString()}`);

          // loop through each of the parameters, displaying the type and data
          event.data.forEach((data, index) => {    
            console.log(white + `\t\t\t${types[index].type}: ${data.toString()}`);
          });
          switch (event.method) {
            case "Submit":
              this.commitHandle(event.data)
              break;
            case "Deposit":
              this.depositHandle(event.data)
              break;
            case "ExitStart":
              this.exitHandle(event.data)
              break;                  
          }
        }
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
  
        if (event.section == "childMvp") {
          // show what we are busy with
          console.log(white + `\t${event.section}:${event.method}:: (phase=${phase.toString()})`);
          console.log(white + `\t\t${event.meta.documentation.toString()}`);

          // loop through each of the parameters, displaying the type and data
          event.data.forEach((data, index) => {
            console.log(white + `\t\t\t${types[index].type}: ${data.toString()}`);
          });

          switch (event.method) {
            case "Submit":
              this.submitHandle(event.data)
              break;
          }
        }
      });
    });
  }

  async start() {
    this.parent = await create(this.parentEndpoint);
    this.child = await create(this.childEndpoint);
    
    this.parentHandle();
    this.childHandle();
  }

  // eventData = [Hash, ]
  async submitHandle(eventData) {
    console.log("submitHandle...");
    const hash = await this.parent.tx.parentMvp.submit(eventData[0]).signAndSend(this.operator);
    console.log("Success submitHandle!: ", hash.toHex());
  }

  // eventData = [Hash, BlockNumber]
  async commitHandle(eventData) {
    console.log("commitHandle...");
    const blkHash = eventData[0];
    const blkNum = eventData[1];
    const hash = await this.child.tx.childMvp.commit(blkNum, blkHash).signAndSend(this.operator);
    console.log("Success commitHandle!: ", hash.toHex());
  }

  // eventData = [AccountId, Balance]
  async depositHandle(eventData) {
    console.log("depositHandle...")
    const accountId = eventData[0];
    const balance = eventData[1];
    const tx = await genTransfer(this.child, this.operator, this.operator.address(), accountId.toString(), Number(balance.toString()), this.fee);
    const hash = await this.child.tx.childMvp.deposit(tx).signAndSend(this.operator);
    console.log("Success depositHandle!: ", hash.toHex());
  }

  // eventData = [AccountId, exitId: Hash]
  async exitHandle(eventData) {
    console.log("exitHandle...");
    const exitId = eventData[1];
    const exitInfo = await this.parent.query.parent.exitStatusStorage(exitId);
    console.log(exitInfo);
    const tx = exitInfo.unwrap().get('utxo')[0];
    const txHash = new Hash(blake2AsU8a(tx.toU8a()))
    const outIndex = exitInfo.unwrap().get('utxo')[1];
    console.log('txHash: ', txHash);
    console.log('outIndex: ', outIndex);
    const hash = await this.child.tx.childMvp.exitStart(txHash, outIndex).signAndSend(this.operator);
    console.log("Success exitHandle!: ", hash.toHex());
  }
}

module.exports = ChainManager