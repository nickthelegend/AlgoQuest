
import algosdk from "algosdk"


export function SignWithSk(txnsArray: algosdk.Transaction[], sk: Uint8Array) {
    const signedTxns = [];
    for (let i = 0; i < txnsArray.length; i++) {
      signedTxns.push(algosdk.signTransaction(txnsArray[i], sk).blob);
    }
    return signedTxns;
  }