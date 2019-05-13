#!/usr/bin/env node
require('shelljs/global')

program = require('commander')
prompt = require('co-prompt')
co = require('co')

program
  .arguments('<file>')
  .option('-u, --username <username>', 'The user to authenticate as')
  .option('-p, --password <password>', 'The user\'s password')
  .action(function(file) {
    co(function *() {
      var username, password
      if (program.username) {
        username = program.username
      } else {
        username = yield prompt('username: ')
      }
      password = yield prompt.password('password: ')
      display(username, password, file)
    })
  })
  .parse(process.argv)

display = (username, password, file) => {
  echo(`user: ${username} pass: ${password} file: ${file}`)
}