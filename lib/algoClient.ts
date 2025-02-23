import algosdk from 'algosdk';

// Ensure that your environment variables are defined
const algodToken = 'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa';
const algodServer = 'https://testnet-api.algonode.cloud:443';
const algodPort = process.env.ALGOD_PORT;

if (!algodToken || !algodServer ) {
  throw new Error('Missing Algorand environment variables.');
}

// Initialize the Algod client
const algodClient = new algosdk.Algodv2(algodToken, algodServer);

export default algodClient;



export const QUEST_COIN_ASSET_ID = '734399300'
