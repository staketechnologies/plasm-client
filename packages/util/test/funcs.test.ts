// test but no run 
const { create, eventCatch } = require('../src/index');
import { Struct, u32 } from '@polkadot/types';
require('chai');

describe('eventCatch', function() {
    describe('#getEventChild', function() {
        it('should return proof paire.', async function() {
            const api = await create('ws://127.0.0.1:9944');
            const proofs = await eventCatch(api, "childMvp", "Submit", 10);
            console.log(proofs[0].toU8a().toString())
        });
    });
});

class TestStruct extends Struct {
    constructor (value?: any) {
        super({
            a: u32,
            b: u32
        }, value)
    }
}

describe('exitInfo', function() {
    describe('#getUtxoFromExitInfo', function() {
        it('should return utxo.', function() {

            const testStruct = new TestStruct({
                a: new u32(115),
                b: new u32(114)
            })
            console.log(testStruct)
            console.log(testStruct.get('a'))
            //console.log(testStruct.get('a').toString())
        });
    });
});