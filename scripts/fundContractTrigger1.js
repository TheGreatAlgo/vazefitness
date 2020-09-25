const MyContract = artifacts.require('heartRateConsumer1')
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
                