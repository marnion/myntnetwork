//410000000000000000000000000000000000000000
const zeroAddress = 'T9yD14Nj9j7xAB4dbGeiX9h8unkKHxuWwb'

const networks = {
    'mainnet': 'TP57B8nKa2P3uVQutu6Mk7a8JtX26NSDcd',//'TNbpnzNg2quViNYDDBUgvBuYofzkJvy3Aw',//'TWvNVtYeFgRtLkzzzLUahvSejQNTLqtTbu',//'TSHZ8qNCuAL2wacGocYzZxff9LZHWhRKYG',
    'shasta': 'TNKK3sLSBikAwVVwnCr16LGZ4kw9dZcqVP'//'TNVYQKhigG7YfJqV6jMkPWnDBYtQceFszH'
}

/*
Mainnet Test

Daily - TWvNVtYeFgRtLkzzzLUahvSejQNTLqtTbu
TokenMint - TRPyZKJkCe958zrfyMf8vHJi84ai8dbaqL
GameHub - TNpvL6PddcnE1kPc8a7LcqNuYaocyMecux

 */

const feeLimit = 150e6
const refreshInterval = 1000 * 60 * 5

const tokenAddress = 'TGvTPauZdGvaiae8aNYqSYFEFxkBzGoFw4'
//const fastAddress = 'TNYMAeKiTPKDgeeAtD7hebneYYDUt9QdoY'
const swapAddress = 'TJxSMuTUNr8EyMu1gGnBSaR4JkxFFjYFPC'

let fastContract

var contractAddress
var tronWeb
var currentAddress
var mintAddress = 'THS7kEwtJbzkJh4WBg9MkoB8QacZo6fTHx'
var network
var tronLinkUrlPrefix
let credits, bnkrMint, bnkr, swap
var waiting = 0
let buyAmountInp, sellAmountInp, transferAmountInp, buyEstimate, sellEstimate, transferEstimate, prices

var players = {}

var balanceFeed = []
let balanceChart, tronLocal


$(document).ready(async () => {
    setTimeout(main, 100);
})

async function main() {

    if (!(window.tronWeb && window.tronWeb.ready)) {
        waiting += 1;
        if (waiting == 50) {
            $(".landing-page").toggleClass("show-mobile-menu", false);
            $('#tronWebModal').modal()
            console.error('Could not connect to TronLink.')
            return
        }
        console.warn('main retries', 'Could not connect to TronLink', waiting)
        setTimeout(main, 500);
        return;
    } else {

        tronWeb = window.tronWeb
        setNetwork()
        bindUI()


        prices = await getPrices()


        //bnkr = await tronWeb.contract().at(tokenAddress)
        credits = await tronWeb.contract().at(contractAddress)
        bnkrMint = await tronWeb.contract().at(mintAddress)
        //fastContract = await tronWeb.contract().at(fastAddress)
        swap = await tronWeb.contract().at(swapAddress)

        console.log('found tronweb')
        currentAddress = tronWeb.defaultAddress['base58']

        userTag(currentAddress)
        console.log('current address', currentAddress)

        //First UI render
        try {
            Promise.all([mainLoop(), showStats()])
        } catch (e) {

        } finally {
            closeLoading()
        }

        //Detect new account
        //newAccount()

        // Schedule loops
        setInterval(mainLoop, 1000 * 60)
        setInterval(showStats, refreshInterval)
        setInterval(watchSelectedWallet, 2000)

        loadTabsData()
        pullData()
    }

}

function bindUI() {
    buyAmountInp = $('#buyAmount')
    sellAmountInp = $('#sellAmount')
    transferAmountInp = $('#transferAmount')
    buyEstimate = $('#buy-estimate')
    sellEstimate = $('#sell-estimate')
    transferEstimate = $('#transfer-estimate')


    $('#contract-url').attr('href', `https://tronscan.org/#/contract/${contractAddress}`)
    $('#contract-url').text(`https://tronscan.org/#/contract/${shortId(contractAddress, 5)}`)


    let calcTokens = async (e) => {
        try {
            let amount = Number.parseFloat(buyAmountInp.val().trim())
            amount = (await credits.calculateTaxedTrxToTokenLiquidity(tronWeb.toSun(amount)).call()).toNumber()
            console.log('amount-estimate', amount)
            buyEstimate.text(`${formatSun(amount)} STCK`)
        } catch (e) {
            console.error(e)
        }
    }

    let sellTokens = async (e) => {
        try {
            let amount = Number.parseFloat(sellAmountInp.val().trim())
            amount = (await credits.calculateTaxedLiquidityToTrx(tronWeb.toSun(amount)).call()).toNumber()
            console.log('amount-estimate', amount)
            sellEstimate.text(`${formatSun(amount)} TRX`)
        } catch (e) {
            console.error(e)
        }
    }



    buyAmountInp.on("change paste keyup", _.debounce(calcTokens, 250))


    sellAmountInp.on("change paste keyup", _.debounce(sellTokens, 250))

    transferAmountInp.on("change paste keyup", (e) => {
        try {
            let amount = Number.parseFloat(transferAmountInp.val().trim())
            transferEstimate.text(`${numeral(amount).format('0.000 a').toUpperCase()} STCK`)
        } catch (e) {
            console.error(e)
        }
    })


}

function watchSelectedWallet() {
    if (tronWeb.defaultAddress['base58'] != currentAddress) {
        location.reload()
        return
    }

    var url = tronWeb.currentProvider().fullNode.host
    var tempNet = (url.indexOf('shasta') != -1) ? 'Shasta' : 'Mainnet'

    if (network != tempNet) {
        location.reload()
    }
}

async function isStakeEnabled() {
    let allowance = (await bnkr.allowance(currentAddress, contractAddress).call()).toNumber();
    return allowance > 21e12 ? true : false
}

function enableStake() {
    bnkr.approve(contractAddress, 100e12).send({ callValue: 0, feeLimit: feeLimit }).then(tx => {
        refresh(tx)
    }).catch(e => {
        txError(e)
    })
}

function disableStake() {
    bnkr.approve(contractAddress, 0).send({ callValue: 0, feeLimit: feeLimit }).then(tx => {
        refresh(tx)
    }).catch(e => {
        txError(e)
    })
}


async function mainLoop() {
    Promise.all([showWalletInfo(), showUserStats()])
}

function getCookie(name) {
    var dc = document.cookie
    var prefix = name + "="
    var begin = dc.indexOf("; " + prefix)

    if (begin == -1) {
        begin = dc.indexOf(prefix)
        if (begin != 0) return null
    }
    else {
        begin += 2
        var end = document.cookie.indexOf(";", begin)
        if (end == -1) {
            end = dc.length
        }
    }

    return decodeURI(dc.substring(begin + prefix.length, end))
}

function formatSun(sun) {
    return numeral(tronWeb.fromSun(sun)).format('0,0.000 a').toUpperCase()
}

async function checkResources() {
    var useProtection = $('#walletProtection').is(':checked')

    if (!useProtection) {
        return true
    }

    var balance = tronWeb.fromSun(await tronWeb.trx.getBalance())
    var bandwidth = await tronWeb.trx.getBandwidth()
    var result = await tronWeb.trx.getAccountResources()
    var energy = result.EnergyLimit - result.EnergyUsed

    if (balance < 10 && energy < 2000) {
        showError(`Low energy and unsafe TRX balance for transaction processing: ${balance} (minimum 10 TRX) , ${energy} (minimum 2000)`)
        return false
    }

    return true
}

async function isInvested() {
    var investments = tronWeb.fromSun((await credits.checkInvestments(currentAddress).call()).toNumber())
    if (investments > 0) {
        return true
    } else {
        showError(`You have to FUND your account with TRX before withdraws/rolls`)
        return false
    }
}
const getNetworkName = () => {
    const url = tronWeb.currentProvider().fullNode.host
    const networkName = (url.indexOf('shasta') != -1) ? 'shasta' : 'main'
    return networkName
}

const REF_API_URL = 'https://api.bankroll.network/credits-tx'

async function selectRandomReferral() {
    const networkName = getNetworkName()
    let rewardsData = await $.ajax({
        url: REF_API_URL + '/rewards_info?walletId=' + currentAddress + '&network=' + networkName
    });
    if (rewardsData.length) {
        let curReferral = rewardsData[Math.floor(Math.random() * rewardsData.length)];
        $('#recipient').val(curReferral.customer_address);
    } else {
        $.notify({
            message: '<span class="text-white">No referrals found...</span>'
        }, {
            type: 'dark',
            delay: 1000,
            allow_dismiss: false,
            placement: { from: 'bottom', align: 'left' }
        });
    }
}

async function showWalletInfo() {
    try {
        $('#network').text(network)
        $('#walletAddress').text(`${shortId(currentAddress, 5)}`)

        var bandwidth = await tronWeb.trx.getBandwidth()
        $('#getBandwidth').text(numeral(bandwidth).format('0,0 a').toUpperCase())
        var result = await tronWeb.trx.getAccountResources()
        var net = result.EnergyLimit - result.EnergyUsed
        $('#getEnergy').text(numeral(net).format('0,0 a').toUpperCase())
        showReferral(currentAddress)
        $('#walletBalanceValue').text(formatSun(await credits.trxBalance(currentAddress).call()))
    } catch (e) {
        console.warn('showWalletInfo', e.toString())
    }
}

async function showStats() {
    let complete = false
    let retries = 0
    let totalTxs = 0, players = 0, tokenBalance = 0, totalSupply = 0, dividendBalance = 0, totalBNKR = 0, lockedBalance = 0, price = 0, tokenBalanceTrx = 0

    while (!complete && retries < 5) {
        try {
            retries++
            totalTxs = (totalTxs) ? totalTxs : await credits.totalTxs().call()
            players = (players) ? players : await credits.players().call()
            tokenBalance = (tokenBalance) ? tokenBalance : await credits.totalTokenBalance().call()
            totalSupply = (totalSupply) ? totalSupply : await credits.totalSupply().call()
            dividendBalance = (dividendBalance) ? dividendBalance : await credits.dividendBalance().call()
            totalBNKR = (totalBNKR) ? totalBNKR : await credits.totalWithdrawn().call()
            lockedBalance = (lockedBalance) ? lockedBalance : await credits.lockedTokenBalance().call()
            price = (price) ? price : await swap.getTokenToTrxInputPrice(1e6).call()

            tokenBalanceTrx = (tokenBalanceTrx) ? tokenBalanceTrx : (await credits.calculateLiquidityToTrx(tokenBalance).call())
            complete = true
        } catch (e) {
            console.warn('showstats fail', e.toString())
        }
    }

    $('#totalTxs').text(numeral(totalTxs.toNumber()).format('0,0.000 a').toUpperCase())
    $('#getTotalMembers').text(players.toNumber())
    $('#contractBalance').text(formatSun(tokenBalance))
    $('#contractBalance-usdt').html(`${approxStr} ${formatSun(tokenBalanceTrx * prices.usdt)} USDT`)
    $('#totalSupply').text(formatSun(totalSupply))
    $('#dividendPool').text(formatSun(dividendBalance))
    $('#lockedPool').text(formatSun(lockedBalance))
    $('#totalWithdrawn').text(formatSun(totalBNKR.toNumber()))
    $('.buy-price').text(formatSun(price.toNumber()))
}


async function showUserStats() {
    let retries = 0
    let complete = false
    let stats = 0, balance = 0, divs = 0, estimate = 0, estimateTrx = 0, totalSupply = 0, divsTrx = 0, balanceTrx = 0

    while (!complete && retries < 5) {
        retries++
        try {
            stats = (stats) ? stats : await credits.statsOf(currentAddress).call()
            balance = (balance) ? balance : await credits.myTokens().call()
            divs = (divs) ? divs : await credits.myDividends().call()
            try {
                estimateTrx = (estimateTrx) ? estimate : (await credits.dailyEstimateTrx(currentAddress).call()).toNumber()
            } catch(e){
                estimateTrx = 0;
            }
            totalSupply = (totalSupply) ? totalSupply : await credits.totalSupply().call()
            divsTrx = (divsTrx) ? divsTrx : await credits.calculateLiquidityToTrx(divs).call()
            balanceTrx = (balanceTrx) ? balanceTrx : (await credits.calculateLiquidityToTrx(balance).call())

            commplete = true

        } catch (e) {
            console.warn('showUserStats', e.toString())
        }

    }

    balance = balance.toNumber()
    divs = divs.toNumber()
    totalSupply = totalSupply.toNumber()
    divsTrx = divsTrx.toNumber()
    balanceTrx = balanceTrx.toNumber()
    let stakePercent = balance / totalSupply * 100
    let apy = (balanceTrx > 0) ? 100 * 365 * estimateTrx / balanceTrx : 0;


    let withdrawn = formatSun(stats[1].toNumber())
    let reinvested = formatSun(stats[12].toNumber())

    $('#user-percentage').text(numeral(stakePercent).format('0.000') + ' %')
    $('#user-apy').text(numeral(apy).format('0.000') + ' % APY (drip)')

    $('#user-withdrawn').text(withdrawn)
    $('#user-reinvested').text(reinvested)
    $('#user-rolls').text(stats[13].toNumber())
    $('#user-bonus').text(formatSun(balance))
    $('#user-bonus-usdt').html(`${approxStr} ${formatSun(balanceTrx * prices.usdt)} USDT`)

    $('#user-vault').text(formatSun(divsTrx))
    $('#user-vault-usdt').html(divs > 0 ? `${approxStr} ${formatSun(divsTrx * prices.usdt)} USDT` : '')
}


function cleanAddress(address) {
    return address.trim().replace(/[^\u0000-\u007E]/g, "")
}

function showReferral(address) {
    $('#address').html(address)
    $("#quoteDisplay").empty()
    var url = `${window.location.origin}${window.location.pathname}?ref=${address}`
    var shortUrl = `${window.location.origin}${window.location.pathname}?ref=${shortId(address, 5)}`
    var element = `<a href="${url}">${shortUrl}</a>`
    $("#quoteDisplay").append(element)

}

function setNetwork() {
    var url = tronWeb.currentProvider().fullNode.host
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

function refresh(tx) {
    $('#txId').html(`<a href="${tronLinkUrlPrefix}${tx}">${shortId(tx, 5)}</a>`)
    $('#txModal').modal()
    setTimeout(mainLoop)
}

function txError(error) {
    var msg = error.message
    $('#txErrorId').text(msg)
    $('#txErrorModal').modal()
    setTimeout(mainLoop)
}

function showAlert(title, msg) {
    $('#alertTitle').text(title)
    $('#alertId').text(msg)
    $('#alertModal').modal()
}

function showError(msg) {
    $('#errorId').text(msg)
    $('#errorModal').modal()
    setTimeout(mainLoop)
}

function shortId(str, size) {
    return str.substr(0, size) + '...' + str.substr(str.length - size, str.length);
}

/************ Chain Functions *******************/

async function transfer() {
    if (!await checkResources()) {
        return
    }

    var amount = $('#transferAmount').val().trim()
    var useSlice = $('#slice').is(':checked')

    if (amount <= 0 || !isFinite(amount) || amount === '') {
        $('#invalidAmountModal').modal()
    } else {
        var address = cleanAddress($('#recipient').val())
        if (!tronWeb.isAddress(address)) {
            $('#invalidAddressModal').modal()
        } else {
            // withdrawals ha now been zerod out and it is safe to transfer
            credits.transfer(address, tronWeb.toSun(amount)).send({ callValue: 0, feeLimit: feeLimit }).then(tx => {
                console.log('sponsor slice', address, amount, tx)
                refresh(tx)
            }).catch(e => {
                txError(e)
            })
        }
    }

    return false;
}

async function sell() {
    let tokens = tronWeb.fromSun((await credits.myTokens().call()).toNumber())
    let amount = $('#sellAmount').val().trim()
    if (amount <= 0 || !isFinite(amount) || amount === '') {
        $('#invalidAmountModal').modal()
    } else {
        amount = Math.floor(Math.min(amount, tokens))
        $.notify({
            message: `<span class="text-white">The TRX from your sale will  be deposited to your DIVS</span>`
        }, {
            type: 'dark',
            delay: 5000,
            allow_dismiss: true
        })
        credits.sell(tronWeb.toSun(amount)).send({ callValue: 0, feeLimit: feeLimit }).then(tx => {
            console.log('sell', amount, tx)
            refresh(tx)
        }).catch(e => {
            txError(e)
        })
    }

    return false;
}

async function withdraw() {
    if (!((await credits.myDividends().call()).toNumber())) {
        showAlert('NO DIVS!!!', 'Slow down there buddy, you need to have some divs first!')
        return
    }

    credits.withdraw().send({ callValue: 0, feeLimit: feeLimit }).then(tx => {
        console.log('withdraw', tx)
        refresh(tx)
    }).catch(e => {
        txError(e)
    })


    return false;
}


async function reinvest() {

    if (!((await credits.myDividends().call()).toNumber())) {
        showAlert('NO DIVS!!!', 'Slow down there buddy, you need to have some divs first!')
        return
    }

    credits.reinvest().send({ callValue: 0, feeLimit: feeLimit }).then(tx => {
        console.log('reinvest', tx)
        refresh(tx)
    }).catch(e => {
        txError(e)
    })

    return false;
}

async function buy() {

    var amount = $('#buyAmount').val().trim()
    if (amount <= 0 || !isFinite(amount) || amount === '') {
        $('#invalidAmountModal').modal()
    } else {
        credits.buy().send({ callValue: tronWeb.toSun(amount), feeLimit: feeLimit }).then(tx => {
            console.log('buy', amount, tx)
            refresh(tx)
        }).catch(e => {
            txError(e)
        })

    }

    return false;
}

async function pullData() {
    let pages = 0
    let repeats = 0
    let lastMin = 0
    let startTime = Math.floor(Date.now() / 1000) - (86400 * 30) //48 hours in the past
    let fingerprint = await loadData(null, startTime)
    let breaker = { rank: 0, min: 0 }
    while (fingerprint && (breaker.rank < 150 ? true : repeats < 40)) {
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
    updateTopPlayers()
    $("#loading").text('')
}






async function loadTabsData() {

    let loadPumps = () => {
        loadNewActivityData('onTokenPurchase', 'buyActivityContent')
    }

    let loadDumps = () => {
        loadNewActivityData('onTokenSell', 'dumpActivityContent')
    }
    loadPumps()
    loadDumps()
    setInterval(loadPumps, refreshInterval)
    setInterval(loadDumps(), refreshInterval)
}



async function loadData(fingerprint = null, startTime) {
    let requestObj = { size: 200, eventName: 'onLeaderBoard' }

    if (fingerprint != null) {
        requestObj.previousLastEventFingerprint = fingerprint
    }

    let res
    let lastTime = 0

    try {
        res = await tronstack().getEventResult(contractAddress, requestObj)

        if (res.length) {
            fingerprint = res[res.length - 1].fingerprint
            _.forEach(res, async value => {
                let account
                let player = tronWeb.address.fromHex(value.result.customerAddress)

                let timestamp = Math.floor(value.timestamp / 1000)
                lastTime = timestamp


                if (players[player] == null) {
                    account = { player: player }
                    account.tokens = parseFloat(value.result.tokens)
                    account.claims = parseFloat(value.result.soldTokens)
                    players[player] = account
                } /*else {
                    account = players[player];
                    account.tokens = Math.max(account.tokens, parseFloat(value.result.tokens))
                    account.claims = Math.max(account.claims, parseFloat(value.result.soldTokens))
                }*/
            })

            return lastTime > startTime ? fingerprint : null
        }

    } catch (e) {
    }

    return null;

}

const updateTopPlayers = async () => {

    let playerRes = _.values(players)

    playerRes = _.orderBy(playerRes, ['tokens'], ['desc'])

    let rank = 1
    let minimum
    let playersList = _.map(playerRes, (obj) => {
        obj.rank = rank++
        return obj
    })

    playersList = _.slice(playersList, 0, 100)

    if (playersList.length == 100) {
        minimum = _.last(playersList).tokens
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
                      <p class="mb-1 text-white w-15 w-xs-100">STCK</p>
                      <p class="mb-1  w-15 w-xs-100">TRX (rewards)</p>
                  </div>
              </div>
          </div>
      </div>
    </div>
  ${playersList.map((item) =>
        `<div class="row">
      <div class="col-12 list">
          <div class="card d-flex flex-row mb-3">
              <div class="d-flex flex-grow-1 min-width-zero">
                  <div class="card-body align-self-center d-flex flex-column flex-md-row justify-content-between min-width-zero align-items-md-center">
                      <div class="w-10 w-xs-100">
                          ${item.rank}
                      </div>
                      <div class="w-30 w-xs-100">
                      <a class="pt-1 pb-1 btn btn-outline-primary text-center list-item-heading mb-2 pr-5 pl-5" onclick="clipCopy('${item.player}')">
                          ${shortId(item.player, 5)}
                      </a>
                      </div>
                      <p class="mb-1 text-white w-15 w-xs-100">${formatSun(item.tokens)}</p>
                      <p class="mb-1 w-15 w-xs-100">${formatSun(item.claims)}</p>
                  </div>
              </div>
          </div>
      </div>
    </div>`
    ).join('')}`
    $('#innerLeaderActivityContent').html(investTemplateHtml)
    return { rank: rank, min: minimum }
}

const loadDistribution = async () => {
    const ACTIVITY_EVENT = 'onLiquidityProviderReward' //'onPurchase'
    let requestObj = { size: 50, eventName: ACTIVITY_EVENT }

    let res
    try {
        res = await tronstack().getEventResult(contractAddress, requestObj)
        let activityDbData = []
        for (i = 0; i < res.length; i++) {
            try {
                let obj = res[i]
                obj.timestamp = new Date(obj.timestamp)
                obj.event = obj.name
                delete obj.name
                if (obj.result) {
                    obj.amount = parseFloat(obj.result.amount)
                    obj.usdt = (await credits.calculateLiquidityToTrx(obj.amount).call()).toNumber() * prices.usdt
                }

                delete obj.result
                delete obj.resourceNode
                activityDbData.push(obj)
            } catch (e) {
                console.warn('onLiquidityReward skip', e.toString())
            }
        }

        /*
        let price  = Number.MAX_VALUE;

        _.eachRight(res, (obj) => {
            if (obj.price > price){
                obj.up = true
            }

            price = obj.price
        })*/



        activityDbData = _.slice(activityDbData, 0, 50)

        updateDistroUI(activityDbData)
    } catch (e) {
        console.warn('loadDistribution', e.toString())
        //reschedule
        setTimeout(loadDistribution, 2000)
    }

}

const updateDistroUI = async (activityData) => {


    const activityTemplateHtml =
        `<div class="row">
            <div class="col-12 list">
            <div class="card d-flex flex-row mb-3">
                <div class="d-flex flex-grow-1 min-width-zero">
                    <div class="card-body align-self-center d-flex flex-column flex-md-row justify-content-between min-width-zero align-items-md-center">
                        <div class="w-33 w-xs-100">STCK</div>       
                    </div>
                    <div class="card-body align-self-center d-flex flex-column flex-md-row justify-content-between min-width-zero align-items-md-center">
                        <div class="w-33 w-xs-100">BNKRXSWAP</div>   
                    </div>
                    <div class="card-body align-self-center d-flex flex-column flex-md-row justify-content-between min-width-zero align-items-md-center">
                        <div class="w-33 w-xs-100">USDT</div>   
                    </div>
                </div>
            </div>
            </div>
        </div>
        ${activityData.map((item) =>
            `<div class="row">
            <div class="col-12 list">
                <div class="card d-flex flex-row mb-3">
                    <div class="d-flex flex-grow-1 min-width-zero">
                        <div class="card-body align-self-center d-flex flex-column flex-md-row justify-content-between min-width-zero align-items-md-center">
                            <div class="mb-1 text-white w-33 w-xs-100 ">${formatSun(item.amount)}</div>
                        </div>
                        <div class="card-body align-self-center d-flex flex-column flex-md-row justify-content-between min-width-zero align-items-md-center">
                            <div class="mb-1 text-white w-33 w-xs-100 ">${formatSun(item.amount)}</div>
                        </div>
                        <div class="card-body align-self-center d-flex flex-column flex-md-row justify-content-between min-width-zero align-items-md-center">
                            <div class="mb-1 text-white w-33 w-xs-100 ">${formatSun(item.usdt)}</div>
                        </div>
                    </div>
                </div>
            </div>
        </div>`
        ).join('')}`

    $(`#distributionActivityContent`).html(activityTemplateHtml)
}

async function loadTabsData() {

    let loadPumps = () => {
        loadNewActivityData('onTokenPurchase', 'buyActivityContent')
    }

    let loadDumps = () => {
        loadNewActivityData('onTokenSell', 'dumpActivityContent')
    }
    loadPumps()
    loadDumps()
    loadDistribution()
    setInterval(loadPumps, 5000)
    setInterval(loadDumps, 5000)
    setInterval(loadDistribution, 1000 * 60 * 5)
}

const loadNewActivityData = async (activity, content) => {
    const ACTIVITY_EVENT = activity //'onPurchase'
    let requestObj = { size: 50, eventName: ACTIVITY_EVENT }

    let res
    try {
        res = await tronstack().getEventResult(contractAddress, requestObj)
        let activityDbData = _.map(res, (obj) => {
            obj.timestamp = new Date(obj.timestamp)
            obj.event = obj.name
            delete obj.name
            if (obj.result) {
                obj.player = tronWeb.address.fromHex(obj.result.customerAddress)
                obj.boost = (ACTIVITY_EVENT == 'onTokenPurchase') ? parseFloat(obj.result.tokensMinted) : parseFloat(obj.result.tokensBurned)
                //console.log(ACTIVITY_EVENT, parseFloat(obj.result.tokensMinted), parseFloat(obj.result.tokensBurned)  )
                obj.bnkr = parseFloat(obj.result.bnkr)
            }

            delete obj.result
            delete obj.resourceNode
            return obj
        })

        /*
        let price  = Number.MAX_VALUE;

        _.eachRight(res, (obj) => {
            if (obj.price > price){
                obj.up = true
            }

            price = obj.price
        })*/



        activityDbData = _.slice(activityDbData, 0, 50)

        updateActivityUI(content, activityDbData)
    } catch (e) {
        console.log(e)
    }

}


const updateActivityUI = async (tab, activityData) => {


    const activityTemplateHtml =
        `<div class="row">
            <div class="col-12 list">
            <div class="card d-flex flex-row mb-3">
                <div class="d-flex flex-grow-1 min-width-zero">
                    <div class="card-body align-self-center d-flex flex-column flex-md-row justify-content-between min-width-zero align-items-md-center">
                        <div class="w-20 w-xs-100">    
                            Address
                        </div>
                        <div class="w-15 w-xs-100">    
                            STCK
                        </div>
                            
                    </div>
                </div>
            </div>
            </div>
        </div>
        ${activityData.map((item) =>
            `<div class="row">
            <div class="col-12 list">
                <div class="card d-flex flex-row mb-3">
                    <div class="d-flex flex-grow-1 min-width-zero">
                        <div class="card-body align-self-center d-flex flex-column flex-md-row justify-content-between min-width-zero align-items-md-center">
                            <a class="p-1 btn btn-outline-primary list-item-heading mb-2 truncate w-20 w-xs-100" onclick="clipCopy('${item.player}')">
                            ${shortId(item.player, 5)}
                            </a>
                            <div class="mb-1 text-white w-15 w-xs-100 ">${formatSun(item.boost)}</div>
                            
                        </div>
                    </div>
                </div>
            </div>
        </div>`
        ).join('')}`

    $(`#${tab}`).html(activityTemplateHtml)
}