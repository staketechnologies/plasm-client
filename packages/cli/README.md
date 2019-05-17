# @plasm/cli

## CLI functions
### transfer
At ChildChain, utxo based transfer A to B value is V.

### deposit
At ParentChain, deposit to ChildChain. Specify Account and Value.

### exit
At ParentChain, exitStart from ChildChain. Specify utxo.

### exitFinalize
At ParentChain, exitFinalize. Specify unfinalized exitId.

### getExitInfo
At ParentChain, getExitInfo. Specify unfinalized exitId.

### getProof
At ChildChain, getProof. Specify utxo.

### send
At ParentChain, account based transfer(send) A to B balance is V.

### set_owner
At CLI, set owner accounts.

### balance
At ParentChain, get balance. Specify accountUri.

### utxo
At ChildChain, get utxo and balance. Specify accountUri.

### quit
End of CLI.