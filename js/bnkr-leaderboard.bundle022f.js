const networks = {
    'mainnet': 'TNo59Khpq46FGf4sD7XSWYFNfYfbc8CqNK',
    'shasta': 'TTEULtpjMtVgmRo4KjYvx6VTztZABCSCKQ'//'TNVYQKhigG7YfJqV6jMkPWnDBYtQceFszH'
}

var contractAddress
var tronWebLocal
var currentAddress
var network
var waiting
var stakeAddress = 'TXwYAQ9y9r8u4E2o6KrdeELMr5x6NFekge'
var bnkrStake, bnkr
var players = {}


$(document).ready(async () => {
    checkTronWeb()
})

const API_URL = 'https://api.bankroll.network/credits-tx'

function clipCopy(str) {
    // Create new element
    var el = document.createElement('textarea');
    // Set value (string to be copied)
    el.value = str;
    // Set non-editable to avoid focus and move outside of view
    el.setAttribute('readonly', '');
    el.style = {position: 'absolute', left: '-9999px'};
    document.body.appendChild(el);
    // Select text inside element
    el.select();
    // Copy text to clipboard
    document.execCommand('copy');
    // Remove temporary element
    document.body.removeChild(el);

    $.notify({
        message: `<span class="text-white">Copied ${str}</span>`
    }, {
        type: 'dark',
        delay: 2000,
        allow_dismiss: false
    });
}

function setNetwork() {
    var url = tronWebLocal.currentProvider().fullNode.host
    if (url.indexOf('shasta') != -1) {
        network = 'Shasta'
        contractAddress = networks['shasta']
        tronLinkUrlPrefix = 'https://shasta.tronscan.org/#/transaction/'
    } else {
        network = 'Mainnet'
        contractAddress = networks['mainnet']
        tronLinkUrlPrefix = 'https://tronscan.org/#/transaction/'
    }

    console.log('network detected', network, contractAddress)
}

async function showWalletInfo() {
    $('#network').text(network)
    $('#walletAddress').text(`${shortId(currentAddress, 5)}`)
    $('#walletBalanceValue').text(formatSun(await tronWebLocal.trx.getBalance()))
    var bandwidth = await tronWebLocal.trx.getBandwidth()
    $('#getBandwidth').text(numeral(bandwidth).format('0,0 a').toUpperCase())
    var result = await tronWebLocal.trx.getAccountResources()
    var net = result.EnergyLimit - result.EnergyUsed
    $('#getEnergy').text(numeral(net).format('0,0 a').toUpperCase())

}

async function checkTronWeb() {
    try {
        tronWebLocal = new TronWeb({
            fullNode: 'https://api.trongrid.io',
            solidityNode: 'https://api.trongrid.io',
            eventServer: 'https://api.trongrid.io/'
        })

        tronWebLocal.setAddress('TVJ6njG5EpUwJt4N9xjTrqU5za78cgadS2');
        setNetwork()

        console.log('found tronweb')
        bnkr = await tronWebLocal.contract().at(contractAddress)
        bnkrStake = await tronWebLocal.contract().at(stakeAddress)
        currentAddress = tronWebLocal.defaultAddress['base58']
        console.log('current address', currentAddress)

        await  main()
    } catch (e) {
        $('#elog').text(`${e.message} ${e.stack ? e.stack : ''}`)
    }

}



function shortId(str, size) {
    return str.substr(0, size) + '...' + str.substr(str.length - size, str.length);
}

function formatSun(sun) {
    return numeral(tronWebLocal.fromSun(sun)).format('0,0.000 a').toUpperCase()
}

async function pullData() {
    let pages = 0
    let repeats = 0
    let lastMin = 0
    let startTime = Math.floor(Date.now()/1000) - (86400 * 30) //48 hours in the past
    let fingerprint = await loadData(null, startTime)
    let breaker = {rank:0, min:0}
    while (fingerprint && (breaker.rank < 150 ? true : repeats < 40)){
        fingerprint = await loadData(fingerprint, startTime)
        breaker = await updateTopPlayers()
        if (breaker.min == lastMin) {
            repeats++
        } else {
            repeats = 0
            lastMin = breaker.min
        }
        pages++
        $("#loading").text(`Loading... ${pages}`)
    }
    $("#loading").text('')
}


async function loadData(fingerprint = null, startTime) {
    let requestObj = {size: 200, eventName: 'Transfer'}

    if (fingerprint != null) {
        requestObj.previousLastEventFingerprint = fingerprint
    }

    let res
    let lastTime = 0

    try {
        res = await tronWebLocal.getEventResult(contractAddress, requestObj)

        if (res.length) {
            fingerprint = res[res.length - 1].fingerprint
            _.forEach(res, async value => {
                let account, stats, levelInfo
                let from = tronWebLocal.address.fromHex(value.result.from)
                let to = tronWebLocal.address.fromHex(value.result.to)

                let timestamp = Math.floor(value.timestamp/1000)
                lastTime = timestamp

                console.log(from, to, timestamp)

                if (players[from] == null) {
                    account = {player: from}
                    account.balance = (await bnkr.balanceOf(from).call()).toNumber()
                    stats = await bnkrStake.statsOf(from).call()
                    levelInfo = await bnkrStake.levelOf(from).call()
                    account.balance += stats[0].toNumber()
                    account.level = levelInfo[0].toNumber()
                    players[from] = account
                }

                if (players[to] == null) {
                    account = {player: to}
                    account.balance = (await bnkr.balanceOf(to).call()).toNumber()
                    stats = await bnkrStake.statsOf(to).call()
                    levelInfo = await bnkrStake.levelOf(to).call()
                    account.balance += stats[0].toNumber()
                    account.level = levelInfo[0].toNumber()
                    players[to] = account
                }

                //lastTime = timestamp
            })

            return lastTime > startTime ? fingerprint : null
        }

    } catch (e) {
    }

    return null;

}

const getNetworkName = () => {
    const url = tronWebLocal.currentProvider().fullNode.host
    const networkName = (url.indexOf('shasta') != -1) ? 'shasta' : 'main'
    return networkName
}

const updateTopPlayers = async () => {

    let playerRes = _.values(players)

    playerRes = _.orderBy(playerRes, ['balance'], ['desc'])

    playerRes = _.filter(playerRes, value => {
        return value.player !== stakeAddress && value.balance > 0
    })

    let rank = 1
    let minimum
    let playersList = _.map(playerRes, (obj) => {
        obj.rank = rank++
        return obj
    })

    playersList = _.slice(playersList, 0, 100)

    if (playersList.length == 100) {
        minimum = _.last(playersList).balance
    }

//  const tronscanPrefix = networkName === 'shasta' ? 'shasta.' : ''

    const investTemplateHtml = `
  <div class="row">
      <div class="col-12 list">
          <div class="card d-flex flex-row mb-3">
              <div class="d-flex flex-grow-1 min-width-zero">
                  <div class="card-body align-self-center d-flex flex-column flex-md-row justify-content-between min-width-zero align-items-md-center">
                      <div class="mb-1 w-10 w-xs-100">Rank</div>

                      <div class="w-30 w-xs-100">    
                        Player
                      </div>
                      <p class="mb-1 text-white w-30 w-xs-100">Balance</p>
                       <p class="mb-1  w-10 w-xs-100">Level</p> 
                  </div>
              </div>
          </div>
      </div>
    </div>
  ${playersList.map((item) => {
      let addr = item.player == 'TPmqRz2HmrUDVDRgGxhZv4yAKBRWsRex4E' ? 'BNKR  Custody' : shortId(item.player, 5)
      addr = item.player == 'TLrxkiYqWtbZdETvR1p38UE91pRKNNN3ie' ? 'BNKR Depot' : addr 
          
        return `<div class="row">
      <div class="col-12 list">
          <div class="card d-flex flex-row mb-3">
              <div class="d-flex flex-grow-1 min-width-zero">
                  <div class="card-body align-self-center d-flex flex-column flex-md-row justify-content-between min-width-zero align-items-md-center">
                      <div class="w-10 w-xs-100">
                          ${item.rank}
                      </div>
                      <div class="w-30 w-xs-100">
                      <a class="pt-1 pb-1 btn btn-outline-primary text-center list-item-heading mb-2 pr-5 pl-5" onclick="clipCopy('${item.player}')">
                          ${addr}
                      </a>
                      </div>
                      <p class="mb-1 text-white w-30 w-xs-100">${formatSun(item.balance)}</p>
                      <p class="mb-1  w-10 w-xs-100">${item.level}</p> 
                  </div>
              </div>
          </div>
      </div>
    </div>`}
    ).join('')}`
    $('#investContent').html(investTemplateHtml)
    return {rank:rank,min:minimum}
}

async function main() {
    showWalletInfo()
    pullData()
}




