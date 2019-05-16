// test but no run 
const { create, eventCatch } = require('../dest/index');

var chai = require('chai');
var should = chai.should();

describe('eventCatch', function() {
    describe('#getEventChild', function() {
        it('should return proof paire.', async function() {
            const api = await create('ws://127.0.0.1:9944');
            const proofs = await eventCatch(api, "childMvp", "Submit", 10);
            console.log(proofs[0].toU8a().toString())
        });
    });
});