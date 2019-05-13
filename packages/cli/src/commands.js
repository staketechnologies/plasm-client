const { Input, NumberPrompt } = require('enquirer');

async function getSender(owner) {
    if(owner) {} else {
        owner = '';
    }
    const prompt = new Input({
        message: 'What is tx sender name?',
        initial: owner
      });
    answer = await prompt.run()
    return answer
}

exports.deposit = async function(api, owner) {
    owner = await getSender(owner);

    const prompt = new NumberPrompt({
        name: 'value',
        message: 'deposit value'
      });      
    value = await prompt.run()
    
}

exports.exit = async function(api, owner) {
    owner = await getSender(owner);
    console.log('exit!!')
}

exports.transfer = async function(api, owner) {
    owner = await getSender(owner);
    console.log('transfer!!')
}

exports.setOwner = async function() {
    const prompt = new Input({
        message: 'What is tx sender name?'
      });
      
    answer = await prompt.run()
    return answer
}