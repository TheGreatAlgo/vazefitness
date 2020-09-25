// Connect to Database
var fs = require("fs");

var bodyParser = require('body-parser')
const  {Client}  = require('pg')
const fetch = require('node-fetch');
var request = require('request');

const Web3 = require('web3')
const rpcURL = 'https://kovan.infura.io/v3/' // Your RPC URL goes here
const web3 = new Web3(rpcURL)
const address = '0x2Bc7D3c2B56Ce938C75Faa5997Fe22FCE8D08f02' // Your account address goes here




var connectionString = "postgres://postgres:postgres@localhost:5432/Users";
const client = new Client({
    connectionString: connectionString
});
client.connect();


function getBalance()
{
  var balance = 0;
  web3.eth.getBalance(address, (err, wei) => {
    balance = web3.utils.fromWei(wei.toString(), 'ether')
    console.log(balance);
  })
  console.log(balance);
  return balance;
};


module.exports = { getBalance };
