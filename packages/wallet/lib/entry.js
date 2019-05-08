async function main() {
    console.log('boot main!')
}

main()
  .then(() => console.log('Wallet running. RPC running.') )
  .catch(e=> console.error(e) );