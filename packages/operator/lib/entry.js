async function main() {
    console.log('boot main!')
}

main()
  .then(() => console.log('Operator running. RPC running.') )
  .catch(e=> console.error(e) );