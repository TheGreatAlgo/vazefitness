// Connect to Database
var fs = require("fs");
path = require('path')
var bodyParser = require('body-parser')
const  {Client}  = require('pg')
const fetch = require('node-fetch');
var request = require('request');
const solc = require('solc');
const { exec } = require('child_process');
var ethereumConnection = require('../src/ethereumConnection.js');


var Web3 = require('web3');
const HDWalletProvider = require('@truffle/hdwallet-provider');
const provider = new HDWalletProvider('', `https://kovan.infura.io/v3/`)
const web3 = new Web3(provider);




var connectionString = "postgres://postgres:postgres@localhost:5432/Users";
const client = new Client({
    connectionString: connectionString
});
client.connect();



function writeContract(ethereumWalletAddress, timeFrame, heartBeatZone, userID, contractDuration)
{
  var payoutAmount ='';
  var contractDurationTime ='';
  var oracleRequestTime ='';
  var requiredTime = '';
  switch(heartBeatZone)
  {
    case "fatBurn":
      heartBeatZone = '1';
      break;
    case "cardio":
      heartBeatZone = '2';
      break;
    case "peak":
      heartBeatZone = '3';
      break;
  }
  switch(timeFrame)
  {
    case "1d":
      payoutAmount = '100000000000000';
      oracleRequestTime = '1 days';
      requiredTime = '40';
      break;
    case "7d":
      payoutAmount = '2500000000000000';
      oracleRequestTime = '7 days';
      requiredTime = '200';
      break;
    case "30d":
      payoutAmount = '10000000000000000';
      oracleRequestTime = '30 days';
      requiredTime = '800';
      break;
  }
  switch(contractDuration)
  {
    case "2m":
      contractDurationTime = '60 days';
      break;
    case "6m":
      contractDurationTime = '180 days';
      break;
    case "12m":
      contractDurationTime = '365 days';
      break;
  }
  console.log(heartBeatZone);
  var data = `pragma solidity ^0.6.0;

import "@chainlink/contracts/src/v0.6/ChainlinkClient.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract heartRateConsumer`+ userID +` is ChainlinkClient, Ownable {

      uint256 public heartRateMinutes;

      uint256 public startTime;
      address payable private ownerVaze;
      address payable private receiver;
      address private oracle;
      bytes32 private jobId;
      uint256 private fee;

      /**
       * Network: Kovan
       * Oracle: Chainlink - 0x2f90A6D021db21e1B2A077c5a37B3C7E75D15b7e
       * Job ID: Chainlink - 29fa9aa13bf1468788b7cc4a500a45b8
       * Fee: 0.1 LINK
       */
      constructor() public {
          setPublicChainlinkToken();
          ownerVaze = msg.sender;
          receiver = `+ ethereumWalletAddress +`;
          startTime = now;
          oracle = 0x1d5a91701370dC3e30E0F031167683203740391b; // address of oracle
          jobId = "1cb47c60495b49188492db89a4b84050"; // this is the job ID of the heartRate Oracle
          fee = 0.1 * 10 ** 18; // 0.1 LINK
      }

    /**
       * Create a Chainlink request to retrieve API response, find heartRate Data
       */

      receive() external payable {

      }

      function requestHeartRateData() public returns (bytes32 requestId)
      {
          Chainlink.Request memory request = buildChainlinkRequest(jobId, address(this), this.fulfill.selector);
          request.addUint("until", now + `+ oracleRequestTime+ ` );
          // Set the URL to perform the GET request on the api endpoint as provided by the alarmclock function
         request.add("get", "http://10.100.76.236:3000/heartrate/api?code=`+ userID +`&zone=`+ heartBeatZone + `&timeInterval=`+ timeFrame +`");

          // Set the path to find the desired data in the API response, where the response format is:
          // {"HeartRate":63}
          request.add("path", "HeartRate");


          // Sends the request
          return sendChainlinkRequestTo(oracle, request, fee);
      }

      /**
       * Receive the response in the form of uint256
       */
      function fulfill(bytes32 _requestId, uint256 _minutes) public recordChainlinkFulfillment(_requestId)
      {
          heartRateMinutes = _minutes;
          if (heartRateMinutes > `+ requiredTime + `){
              receiver.transfer(`+payoutAmount +`);
          }
          if (now > (startTime + `+contractDurationTime + ` + 1 days )){
             ownerVaze.transfer(address(this).balance);
          }
          else{
          requestHeartRateData();
          }

      }

    function getChainlinkToken() public view returns (address) {
  return chainlinkTokenAddress();
}

     function withdrawLink() public onlyOwner {
     LinkTokenInterface link = LinkTokenInterface(chainlinkTokenAddress());
     require(link.transfer(msg.sender, link.balanceOf(address(this))), "Unable to transfer");
    }
  }
  `;
      fs.writeFile('contracts/smartContract'+userID+ '.sol', data, function(err)
      {
           if (err)
           {
              return console.error(err);
           }
           var migrationsSpec = `const Migrations = artifacts.require("heartRateConsumer`+userID+`");
            module.exports = function (deployer) {
              deployer.deploy(Migrations);
            };
            `
        /// Get Last Migration and Deploy
            const dir = './migrations';
            var lastMigration = 0;
            var currentMigration = 0;
            var migrationIndex = 0;

            // list all files in the directory
            fs.readdir(dir, (err, files) => {
                    if (err)
                    {
                        throw err;
                    }
                    // files object contains all files names
                    // log them on console
                    files.forEach(file => {
                        migrationIndex = file.indexOf("_",1);
                        currentMigration = file.slice(0,migrationIndex)
                        if (parseInt(currentMigration) > parseInt(lastMigration))
                        {
                          lastMigration = currentMigration;
                        }
                    });
                   lastMigration = (Number(lastMigration)+1).toString();
                   console.log(lastMigration);
                   fs.writeFile('migrations/'+ lastMigration +'_migrations_smartContract'+userID+ '.js', migrationsSpec, function(err)
                   {
                     if (err)
                     {
                       return console.error(err);
                     }
                     compileAndDeployContract(userID); // make sure writefile finished before compiling contract
                   });

                var contractName = "heartRateConsumer"+userID;

               console.log('Contract Written');
            //   compileAndDeployContract(userID,contractName);
            });
      });
};


//Get LastMigration
function getLastMigration()
{

  const dir = './migrations';
  var lastMigration = 0;
  var currentMigration = 0;
  var migrationIndex = 0;

  // list all files in the directory
  fs.readdir(dir, (err, files) => {
      if (err)
      {
          throw err;
      }
      // files object contains all files names
      // log them on console
      files.forEach(file => {
          migrationIndex = file.indexOf("_",1);
          currentMigration = file.slice(0,migrationIndex)
          if (parseInt(currentMigration) > parseInt(lastMigration))
          {
            lastMigration = currentMigration;
          }
      });
  });

 lastMigration = parseInt(lastMigration);
 console.log(lastMigration);
 return lastMigration;
}

function compileAndDeployContract(userID)
{

    exec('truffle migrate --network kovan', (err, stdout, stderr) => {
      if (err)
      {
        //some err occurred
        console.error(err)
        return 0;
      }
      else
      {
             // the *entire* stdout and stderr (buffered)
           console.log(`stdout: ${stdout}`);
           console.log(`stderr: ${stderr}`);
           if (stdout.includes('transaction hash:'))
           {
                console.log(stdout.indexOf('transaction hash:'));
                console.log(stdout.indexOf('contract address:'));
                console.log(stdout.indexOf('block number:'));
                transactionHashIndex = stdout.indexOf('transaction hash:');
                contractAddressIndex = stdout.indexOf('contract address:');
                blockNumberIndex = stdout.indexOf('block number:');
                var transactionHash = stdout.slice(transactionHashIndex+21,transactionHashIndex+21+66);
                var contractAddress = stdout.slice(contractAddressIndex+21,contractAddressIndex+21+42);
                var blockNumber = stdout.slice(blockNumberIndex+21,blockNumberIndex+21+8);
                var network ="Ethereum: Kovan Testnet";
                console.log(transactionHash,contractAddress, blockNumber,network )
                 var query = `
                 INSERT INTO userContracts(userID, contractaddress,transactionhash, blocknumber, network)
                 VALUES (`+ userID + `, '` + contractAddress + `'` + `, ` +  `'` + transactionHash + `'` +`, ` +  `'` + blockNumber + `'` + `, '` + network +`')`
                 ;
                 console.log(query);
                 client.query(query, (err, res) => {
                     if (err)
                     {
                         console.error(err);
                         return;
                     }
                     console.log(res);
                });
                var fundData =`const MyContract = artifacts.require('heartRateConsumer`+userID+`')
                const LinkTokenInterface = artifacts.require('LinkTokenInterface')
                LinkTokenInterface._json.abi = [
                  {
                    "inputs": [
                      {
                        "internalType": "address",
                        "name": "owner",
                        "type": "address"
                      },
                      {
                        "internalType": "address",
                        "name": "spender",
                        "type": "address"
                      }
                    ],
                    "name": "allowance",
                    "outputs": [
                      {
                        "internalType": "uint256",
                        "name": "remaining",
                        "type": "uint256"
                      }
                    ],
                    "stateMutability": "view",
                    "type": "function"
                  },
                  {
                    "inputs": [
                      {
                        "internalType": "address",
                        "name": "spender",
                        "type": "address"
                      },
                      {
                        "internalType": "uint256",
                        "name": "value",
                        "type": "uint256"
                      }
                    ],
                    "name": "approve",
                    "outputs": [
                      {
                        "internalType": "bool",
                        "name": "success",
                        "type": "bool"
                      }
                    ],
                    "stateMutability": "nonpayable",
                    "type": "function"
                  },
                  {
                    "inputs": [
                      {
                        "internalType": "address",
                        "name": "owner",
                        "type": "address"
                      }
                    ],
                    "name": "balanceOf",
                    "outputs": [
                      {
                        "internalType": "uint256",
                        "name": "balance",
                        "type": "uint256"
                      }
                    ],
                    "stateMutability": "view",
                    "type": "function"
                  },
                  {
                    "inputs": [],
                    "name": "decimals",
                    "outputs": [
                      {
                        "internalType": "uint8",
                        "name": "decimalPlaces",
                        "type": "uint8"
                      }
                    ],
                    "stateMutability": "view",
                    "type": "function"
                  },
                  {
                    "inputs": [
                      {
                        "internalType": "address",
                        "name": "spender",
                        "type": "address"
                      },
                      {
                        "internalType": "uint256",
                        "name": "addedValue",
                        "type": "uint256"
                      }
                    ],
                    "name": "decreaseApproval",
                    "outputs": [
                      {
                        "internalType": "bool",
                        "name": "success",
                        "type": "bool"
                      }
                    ],
                    "stateMutability": "nonpayable",
                    "type": "function"
                  },
                  {
                    "inputs": [
                      {
                        "internalType": "address",
                        "name": "spender",
                        "type": "address"
                      },
                      {
                        "internalType": "uint256",
                        "name": "subtractedValue",
                        "type": "uint256"
                      }
                    ],
                    "name": "increaseApproval",
                    "outputs": [],
                    "stateMutability": "nonpayable",
                    "type": "function"
                  },
                  {
                    "inputs": [],
                    "name": "name",
                    "outputs": [
                      {
                        "internalType": "string",
                        "name": "tokenName",
                        "type": "string"
                      }
                    ],
                    "stateMutability": "view",
                    "type": "function"
                  },
                  {
                    "inputs": [],
                    "name": "symbol",
                    "outputs": [
                      {
                        "internalType": "string",
                        "name": "tokenSymbol",
                        "type": "string"
                      }
                    ],
                    "stateMutability": "view",
                    "type": "function"
                  },
                  {
                    "inputs": [],
                    "name": "totalSupply",
                    "outputs": [
                      {
                        "internalType": "uint256",
                        "name": "totalTokensIssued",
                        "type": "uint256"
                      }
                    ],
                    "stateMutability": "view",
                    "type": "function"
                  },
                  {
                    "inputs": [
                      {
                        "internalType": "address",
                        "name": "to",
                        "type": "address"
                      },
                      {
                        "internalType": "uint256",
                        "name": "value",
                        "type": "uint256"
                      }
                    ],
                    "name": "transfer",
                    "outputs": [
                      {
                        "internalType": "bool",
                        "name": "success",
                        "type": "bool"
                      }
                    ],
                    "stateMutability": "nonpayable",
                    "type": "function"
                  },
                  {
                    "inputs": [
                      {
                        "internalType": "address",
                        "name": "to",
                        "type": "address"
                      },
                      {
                        "internalType": "uint256",
                        "name": "value",
                        "type": "uint256"
                      },
                      {
                        "internalType": "bytes",
                        "name": "data",
                        "type": "bytes"
                      }
                    ],
                    "name": "transferAndCall",
                    "outputs": [
                      {
                        "internalType": "bool",
                        "name": "success",
                        "type": "bool"
                      }
                    ],
                    "stateMutability": "nonpayable",
                    "type": "function"
                  },
                  {
                    "inputs": [
                      {
                        "internalType": "address",
                        "name": "from",
                        "type": "address"
                      },
                      {
                        "internalType": "address",
                        "name": "to",
                        "type": "address"
                      },
                      {
                        "internalType": "uint256",
                        "name": "value",
                        "type": "uint256"
                      }
                    ],
                    "name": "transferFrom",
                    "outputs": [
                      {
                        "internalType": "bool",
                        "name": "success",
                        "type": "bool"
                      }
                    ],
                    "stateMutability": "nonpayable",
                    "type": "function"
                  }
                ];

                /*
                This script is meant to assist with funding the requesting
                contract with LINK. It will send 1 LINK to the requesting
                contract for ease-of-use. Any extra LINK present on the contract
                can be retrieved by calling the withdrawLink() function.
                */

                const payment = process.env.TRUFFLE_CL_BOX_PAYMENT || '100000000000000000'

                module.exports = async callback => {
                try {
                const mc = await MyContract.deployed()
                const tokenAddress = await mc.getChainlinkToken()
                const token = await LinkTokenInterface.at(tokenAddress)
                const ethertx = await mc.send(web3.utils.toWei("0.01", "ether")).then(function(result) {
                // Same result object as above.
                });
                console.log('Funding contract:', mc.address)
                const tx = await token.transfer(mc.address, payment)
                const callFunction = await mc.requestHeartRateData().then(function(result) {
                // Same result object as above.
                });
                callback(tx.tx)
                } catch (err) {
                callback(err)
                }
                }
                `;

                fs.writeFile('./scripts/fundContractTrigger'+userID+ '.js', fundData, function(err)
                {
                 if (err)
                 {
                    return console.error(err);
                 }
                       exec('npx truffle exec ./scripts/fundContractTrigger'+userID+'.js --network kovan', (err, stdout, stderr) => {
                           if (err)
                           {
                             console.error(err)
                             return 0;
                           } else
                           {
                             console.log("Contract Launched and Funded");
                           }
                      });
              });
          }
        }
    });

};

module.exports = { writeContract, compileAndDeployContract, getLastMigration };
