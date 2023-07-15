const { Web3 } = require('web3')
const ERC20 = require('./erc20.abi.json')

const config = require('./config.json')
const tokenContract = process.argv[2] ?? config.web3.token.contractAddress
const whitelistedHolders = config.web3.token.whitelistedContracts

const web3 = new Web3(config.web3.nodeRPC)
const token = new web3.eth.Contract(ERC20, tokenContract)

const headers = new Headers()
headers.set('Authorization', `Bearer ${config.covalent.apiKey}`);

(async () => {
  const decimals = BigInt(Number(`1e${await token.methods.decimals().call()}`))

  let queryFinished = false
  let stuckTokens = 0n
  let checkedAddress = 0
 
  while (!queryFinished) {
    const fetchApi = async () => {
      return await fetch(`https://api.covalenthq.com/v1/eth-mainnet/tokens/${tokenContract}/token_holders_v2/?page-size=1000`, { method: 'GET', headers: headers }).catch(async () => {
        console.log('ERR: Fetching api failed, retrying...')

        return await fetchApi()
      })
    }
    const request = await fetchApi()
    const result = (await request.json()).data
  
    for (const holder of result.items) {
      const address = holder.address
      const balance = BigInt(holder.balance)

      if (isContract(address) && (!whitelistedHolders.includes(address))) {
        stuckTokens += balance
      }

      checkedAddress += 1
    }
  
    console.log(`PROGRESS: Checked ${checkedAddress}/${result.pagination.total_count} in total, found ${stuckTokens / decimals} stuck tokens.`)
  }

  console.log(`RESULT: ${stuckTokens / decimals} amount(raw) of token is on unwhitelisted contracts.`)
})()

async function isContract (address) {
  const result = await web3.eth.getCode(address).catch(async () => {
    console.log('ERR: Executing ETH RPC failed, retrying...')

    return await isContract(address)
  })

  if (result !== "0x") {
    return true
  } else return false
}