const ERC20 = [{"constant":true,"inputs":[],"name":"name","outputs":[{"name":"","type":"string"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":false,"inputs":[{"name":"_spender","type":"address"},{"name":"_value","type":"uint256"}],"name":"approve","outputs":[{"name":"","type":"bool"}],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":true,"inputs":[],"name":"totalSupply","outputs":[{"name":"","type":"uint256"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":false,"inputs":[{"name":"_from","type":"address"},{"name":"_to","type":"address"},{"name":"_value","type":"uint256"}],"name":"transferFrom","outputs":[{"name":"","type":"bool"}],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":true,"inputs":[],"name":"decimals","outputs":[{"name":"","type":"uint8"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":true,"inputs":[{"name":"_owner","type":"address"}],"name":"balanceOf","outputs":[{"name":"balance","type":"uint256"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":true,"inputs":[],"name":"symbol","outputs":[{"name":"","type":"string"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":false,"inputs":[{"name":"_to","type":"address"},{"name":"_value","type":"uint256"}],"name":"transfer","outputs":[{"name":"","type":"bool"}],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":true,"inputs":[{"name":"_owner","type":"address"},{"name":"_spender","type":"address"}],"name":"allowance","outputs":[{"name":"","type":"uint256"}],"payable":false,"stateMutability":"view","type":"function"},{"payable":true,"stateMutability":"payable","type":"fallback"},{"anonymous":false,"inputs":[{"indexed":true,"name":"owner","type":"address"},{"indexed":true,"name":"spender","type":"address"},{"indexed":false,"name":"value","type":"uint256"}],"name":"Approval","type":"event"},{"anonymous":false,"inputs":[{"indexed":true,"name":"from","type":"address"},{"indexed":true,"name":"to","type":"address"},{"indexed":false,"name":"value","type":"uint256"}],"name":"Transfer","type":"event"}]

const config = {
  covalentKey: "cqt_rQDQ3pYkcbTtVh4hrhmJTfM6tCqM",
  nodeRPC: "https://eth.llamarpc.com"
}

window.onload = () => {
  const web3 = new Web3(config.nodeRPC)

  document.getElementById('scan').onclick = async () => {    
    const token = new web3.eth.Contract(ERC20, document.getElementById('tokenContract').value)
    const decimals = BigInt(Number(`1e${await token.methods.decimals().call()}`))
    const whitelistedContracts = document.getElementById('whitelistContracts').value.split('\n')

    let queryFinished = false
    let stuckTokens = 0n
    let checkedAddress = 0
     
    while (!queryFinished) {
      const fetchApi = async () => {
        return await fetch(`https://api.covalenthq.com/v1/eth-mainnet/tokens/${token.options.address}/token_holders_v2/?key=${config.covalentKey}&page-size=100`, { method: 'GET' }).catch(async () => {
          console.log('ERR: Fetching api failed, retrying...')
    
          return await fetchApi()
        })
      }
      const request = await fetchApi()
      const result = (await request.json()).data
      
      for (const holder of result.items) {
        const address = holder.address
        const balance = BigInt(holder.balance)
    
        if ((!whitelistedContracts.includes(address)) && isContract(address)) {
          stuckTokens += balance
        }
    
        checkedAddress += 1
      }
      
      document.getElementById('status').innerText += `\nChecked ${checkedAddress}/${result.pagination.total_count} in total, found ${stuckTokens / decimals} stuck tokens.`
    }
    
    document.getElementById('status').innerText += `\n${stuckTokens / decimals} amount of tokens is on unwhitelisted contracts.`
  }

  async function isContract (address) {
    const result = await web3.eth.getCode(address).catch(async () => {
      console.log('ERR: Executing ETH RPC failed, retrying...')
  
      return await isContract(address)
    })
  
    if (result !== "0x") {
      return true
    } else return false
  }
}