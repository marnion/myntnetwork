//410000000000000000000000000000000000000000
const zeroAddress = 'T9yD14Nj9j7xAB4dbGeiX9h8unkKHxuWwb'

const networks = {
    'mainnet': 'TNbpnzNg2quViNYDDBUgvBuYofzkJvy3Aw',//'TWvNVtYeFgRtLkzzzLUahvSejQNTLqtTbu',//'TSHZ8qNCuAL2wacGocYzZxff9LZHWhRKYG',
    'shasta': 'TNKK3sLSBikAwVVwnCr16LGZ4kw9dZcqVP'//'TNVYQKhigG7YfJqV6jMkPWnDBYtQceFszH'
}

/*
Mainnet Test

Daily - TWvNVtYeFgRtLkzzzLUahvSejQNTLqtTbu
TokenMint - TRPyZKJkCe958zrfyMf8vHJi84ai8dbaqL
GameHub - TNpvL6PddcnE1kPc8a7LcqNuYaocyMecux

 */

const feeLimit = 150e6

const tokenAddress = 'TNo59Khpq46FGf4sD7XSWYFNfYfbc8CqNK'
const fastAddress = 'TNYMAeKiTPKDgeeAtD7hebneYYDUt9QdoY'

let fastContract

var contractAddress
var tronWeb
var currentAddress
var mintAddress = 'TFMcU3QBGVB5ghtYw8g9wMV3rTFdkH2avv'
var network
var tronLinkUrlPrefix
let credits, bnkrMint, bnkr
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
        console.log('waiting', waiting)
        if (waiting == 50) {
            $('#tronWebModal').modal()
            return
        }
        console.error('Could not connect to TronLink.')
        setTimeout(main, 500);
        return;
    } else {

        tronWeb = window.tronWeb
        setNetwork()
        updateReferrer()
        bindUI()

        prices = await getPrices()

        bnkr  = await tronWeb.contract().at(tokenAddress)
        credits = await tronWeb.contract().at(contractAddress)
        bnkrMint = await tronWeb.contract().at(mintAddress)
        fastContract = await tronWeb.contract().at(fastAddress)

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
        setInterval(mainLoop, 5000)
        setInterval(showStats, 5000)
        setInterval(watchSelectedWallet, 2000)

        loadTabsData()
        pullData()
        initChart()
        loadChartData()
    }

}

function bindUI(){
    buyAmountInp = $('#buyAmount')
    sellAmountInp = $('#sellAmount')
    transferAmountInp = $('#transferAmount')
    buyEstimate = $('#buy-estimate')
    sellEstimate = $('#sell-estimate')
    transferEstimate = $('#transfer-estimate')



    buyAmountInp.on("change paste keyup", (e) => {
        let amount = Number.parseFloat(buyAmountInp.val().trim())
        buyEstimate.text(`${numeral(amount * 0.90).format('0.000 a').toUpperCase()} STCK`)
    })

    sellAmountInp.on("change paste keyup", (e) => {
        let amount = Number.parseFloat(sellAmountInp.val().trim())
        sellEstimate.text(`${numeral(amount * 0.90).format('0.000 a').toUpperCase()} BNKR`)
    })

    transferAmountInp.on("change paste keyup", (e) => {
        let amount = Number.parseFloat(transferAmountInp.val().trim())
        transferEstimate.text(`${numeral(amount).format('0.000 a').toUpperCase()} STCK`)
    })

    $('#stakingChb').change(async (e) => {
        let isStaking = $(e.currentTarget).prop('checked')
        console.log('Enable Staking: ', isStaking)
        if (isStaking) {
            enableStake()
        } else {
            disableStake()
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
    bnkr.approve(contractAddress, 100e12).send({callValue: 0, feeLimit: feeLimit}).then(tx => {
        refresh(tx)
    }).catch(e => {
        txError(e)
    })
}

function disableStake() {
    bnkr.approve(contractAddress, 0).send({callValue: 0, feeLimit: feeLimit}).then(tx => {
        refresh(tx)
    }).catch(e => {
        txError(e)
    })
}


async function mainLoop() {
    Promise.all([showWalletInfo(),showUserStats()])
}

async function newAccount(){
    let investments =   (await credits.checkInvestments(currentAddress).call()).toNumber()
    let sponsorships = (await credits.checkCurrentSponsorships(currentAddress).call()).toNumber()
    let title, msg
    let withdrawals = (await credits.checkWithdrawals(currentAddress).call()).toNumber()

    if (withdrawals){
        title = 'Important Action Needed'
        msg = `To maintain access to your account, please click 'Withdraw'. A 1 TRX buy will be applied to reset internal metrics`
        showAlert(title, msg)
    }

    if (!investments){
        if (sponsorships){
            title = 'A Member Invited You To Bankroll!'
            msg = 'Congratulations on the sponsorship.  You can access it by funding your account 1 TRX'
        } else {
            title = 'Welcome to Bankroll!'
            msg = 'To start using Bankroll you can activate your account with just 1 TRX'
        }

        showAlert(title,msg)
    }
}

function updateReferrer() {
    var url_string = window.location.href
    var url = new URL(url_string)
    var address = url.searchParams.get("ref")

    if (address !== null) {
        address = cleanAddress(address)
        if (!tronWeb.isAddress(address)) {
            $('#invalidRefAddressModal').modal()
        } else {
            document.cookie = "ref=" + address
        }
    } else {

        var refCookie = getCookie("ref")

        if (refCookie === null) {
            console.log("Ref cookie was null. Setting to default.")
            document.cookie = `ref=${zeroAddress}`
        } else {
            // do nothing if the cookie is already set and there is no new mnode link
        }
    }
}

function getReferrer() {
    return getCookie('ref').split(';')[0]
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

    if (!useProtection){
        return true
    }

    var balance = tronWeb.fromSun(await tronWeb.trx.getBalance())
    var bandwidth = await tronWeb.trx.getBandwidth()
    var result = await tronWeb.trx.getAccountResources()
    var energy = result.EnergyLimit - result.EnergyUsed

    if (balance < 10 && energy < 2000){
        showError(`Low energy and unsafe TRX balance for transaction processing: ${balance} (minimum 10 TRX) , ${energy} (minimum 2000)`)
        return false
    }

    return true
}

async function isInvested() {
    var investments = tronWeb.fromSun((await credits.checkInvestments(currentAddress).call()).toNumber())
    if (investments > 0 ) {
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

async function selectRandomReferral(){
    const networkName = getNetworkName()
    let rewardsData = await $.ajax({
      url: REF_API_URL + '/rewards_info?walletId=' + currentAddress + '&network=' + networkName
    });
    if (rewardsData.length){
      let curReferral = rewardsData[Math.floor(Math.random()*rewardsData.length)];
      $('#recipient').val(curReferral.customer_address);
    } else {
        $.notify({
            message: '<span class="text-white">No referrals found...</span>'
        }, {
            type: 'dark',
            delay: 1000,
            allow_dismiss: false,
            placement: {from: 'bottom', align: 'left'}
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
        $('#walletBalanceValue').text(formatSun(await bnkr.balanceOf(currentAddress).call()))
    } catch(e){
        console.error(e)
    }
}

async function showStats() {
    try {

        let [totalTxs, players, tokenBalance, totalSupply, dividendBalance,totalBNKR] =
            await Promise.all(
                [
                    credits.totalTxs().call(),
                    credits.players().call(),
                    credits.totalTokenBalance().call(),
                    credits.totalSupply().call(),
                    credits.dividendBalance_().call(),
                    credits.totalClaims().call()
                ]
            )

        $('#totalTxs').text(numeral(totalTxs.toNumber()).format('0,0.000 a').toUpperCase())
        $('#getTotalMembers').text(players.toNumber())
        $('#contractBalance').text(formatSun(tokenBalance))
        $('#contractBalance-usdt').html(`${approxStr} ${formatSun(tokenBalance * prices.bnkr)} USDT`)
        $('#totalSupply').text(formatSun(totalSupply))
        $('#dividendPool').text(formatSun(dividendBalance))
        $('#totalBNKR').text(formatSun(totalBNKR.toNumber()))
    }catch(e){
        console.error(e)
    }
}


async function showUserStats() {
    let [stats, balance, divs, estimate, totalSupply] =
        await Promise.all(
            [
                credits.statsOf(currentAddress).call(),
                credits.myTokens().call(),
                credits.myDividends().call(),
                credits.dailyEstimate(currentAddress).call(),
                credits.totalSupply().call()

            ]
        )

    balance = balance.toNumber()
    divs = divs.toNumber()
    estimate = estimate.toNumber()
    totalSupply = totalSupply.toNumber()

    let stakePercent = balance / totalSupply * 100


    let withdrawn = formatSun(stats[1].toNumber())
    let reinvested = formatSun(stats[12].toNumber())

    let isStaking = await isStakeEnabled()


    $('#staking-status').text(isStaking ? 'Staking enabled' : 'Staking disabled')
    $('#stakingChb').prop('checked', isStaking)
    $('#user-percentage').text(numeral(stakePercent).format('0.000') + ' %')

    $('#user-withdrawn').text(withdrawn)
    $('#user-reinvested').text(reinvested)
    $('#user-rolls').text(stats[13].toNumber())
    $('#user-bonus').text(formatSun(balance))
    $('#user-bonus-usdt').html(`${approxStr} ${formatSun(balance * prices.bnkr)} USDT`)

    $('#user-vault').text(formatSun(divs))
    $('#user-vault-usdt').html(divs > 0 ? `${approxStr} ${formatSun(divs * prices.bnkr)} USDT`:'')

    $('#user-estimate').html(estimate ? `&#8776; ${formatSun(estimate)} BNKR daily` : 'Reliable TRX and BNKR Earnings')
    $('#user-estimate-usdt').html(estimate ? `${approxStr} ${formatSun(estimate * prices.bnkr)} USDT`:'')

}


function cleanAddress(address){
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

function showAlert(title, msg){
    $('#alertTitle').text(title)
    $('#alertId').text(msg)
    $('#alertModal').modal()
}

function showError(msg){
    $('#errorId').text(msg)
    $('#errorModal').modal()
    setTimeout(mainLoop)
}

function shortId(str, size) {
    return str.substr(0, size) + '...' + str.substr(str.length - size, str.length);
}

/************ Chain Functions *******************/

async function transfer() {
    if (!await checkResources()){
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
            credits.transfer(address, tronWeb.toSun(amount)).send({callValue: 0, feeLimit: feeLimit }).then(tx => {
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


    let isStaking = await isStakeEnabled()

    if (!isStaking) {
        showAlert('Enable Staking', 'Staking is not enabled.  Look for the toggle and make sure it is on (purple)!')
        return
    }

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
        credits.sell(tronWeb.toSun(amount)).send({callValue: 0, feeLimit: feeLimit }).then(tx => {
            console.log('sell', amount, tx)
            refresh(tx)
        }).catch(e => {
            txError(e)
        })
    }

    return false;
}

async function withdraw() {
    if (!((await credits.myDividends().call()).toNumber())){
        showAlert('NO DIVS!!!','Slow down there buddy, you need to have some divs first!')
        return
    }

    credits.withdraw().send({callValue: 0, feeLimit: feeLimit }).then(tx => {
        console.log('withdraw', tx)
        refresh(tx)
    }).catch(e => {
        txError(e)
    })


    return false;
}


async function reinvest() {

    if (!((await credits.myDividends().call()).toNumber())){
        showAlert('NO DIVS!!!','Slow down there buddy, you need to have some divs first!')
        return
    }

    credits.reinvest().send({callValue: 0, feeLimit: feeLimit }).then(tx => {
        console.log('reinvest', tx)
        refresh(tx)
    }).catch(e => {
        txError(e)
    })

    return false;
}

async function buy() {

    let isStaking = await isStakeEnabled()

    if (!isStaking) {
        showAlert('Enable Staking', 'Staking is not enabled.  Look for the toggle and make sure it is on (purple)!')
        return
    }

    var amount = $('#buyAmount').val().trim()
    if (amount <= 0 || !isFinite(amount) || amount === '') {
        $('#invalidAmountModal').modal()
    } else {
        credits.buy(tronWeb.toSun(amount)).send({callValue: 0, feeLimit: feeLimit}).then(tx => {
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
    setInterval(loadPumps, 5000)
    setInterval(loadDumps(), 5000)
}



async function loadData(fingerprint = null, startTime) {
    let requestObj = {size: 200, eventName: 'onLeaderBoard'}

    if (fingerprint != null) {
        requestObj.previousLastEventFingerprint = fingerprint
    }

    let res
    let lastTime = 0

    try {
        res = await tronWeb.getEventResult(contractAddress, requestObj)

        if (res.length) {
            fingerprint = res[res.length - 1].fingerprint
            _.forEach(res, async value => {
                let account
                let player = tronWeb.address.fromHex(value.result.customerAddress)

                let timestamp = Math.floor(value.timestamp/1000)
                lastTime = timestamp


                if (players[player] == null) {
                    account = {player: player}
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
                      <p class="mb-1  w-15 w-xs-100">BNKR (rewards)</p>
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
    return {rank:rank,min:minimum}
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
    //loadDistribution()
    setInterval(loadPumps, 5000)
    setInterval(loadDumps, 5000)
    //setInterval(loadDistribution,5000)
}

const loadNewActivityData = async (activity, content) => {
    const ACTIVITY_EVENT = activity //'onPurchase'
    let requestObj = {size: 50, eventName: ACTIVITY_EVENT}

    let res
    try {
        res = await tronWeb.getEventResult(contractAddress, requestObj)
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

        updateActivityUI(content,activityDbData)
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

const loadDistribution = async () => {
    const ACTIVITY_EVENT = 'onDistribution' //'onPurchase'
    let requestObj = {size: 50, eventName: ACTIVITY_EVENT}

    let res
    try {
        res = await tronWeb.getEventResult(contractAddress, requestObj)
        let activityDbData = _.map(res, (obj) => {
            obj.timestamp = new Date(obj.timestamp)
            obj.event = obj.name
            delete obj.name
            if (obj.result) {
                obj.profit = parseFloat(obj.result.profit)
                obj.pool = parseFloat(obj.result.pool)
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

        updateDistroUI(activityDbData)
    } catch (e) {
        console.log(e)
    }

}

const updateDistroUI = async (activityData) => {


    const activityTemplateHtml =
        `<div class="row">
            <div class="col-12 list">
            <div class="card d-flex flex-row mb-3">
                <div class="d-flex flex-grow-1 min-width-zero">
                    <div class="card-body align-self-center d-flex flex-column flex-md-row justify-content-between min-width-zero align-items-md-center">
                        <div class="w-30 w-xs-100">Profit (SUN)</div>       
                    </div>
                    <div class="card-body align-self-center d-flex flex-column flex-md-row justify-content-between min-width-zero align-items-md-center">
                        <div class="w-30 w-xs-100">BNKR Depot (SUN)</div>   
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
                            <div class="mb-1 text-white w-30 w-xs-100 ">${numeral(item.profit).format('0,0 a').toUpperCase()}</div>
                        </div>
                        <div class="card-body align-self-center d-flex flex-column flex-md-row justify-content-between min-width-zero align-items-md-center">
                            <div class="mb-1 text-white w-30 w-xs-100 ">${numeral(item.pool).format('0,0 a').toUpperCase()}</div>
                        </div>
                    </div>
                </div>
            </div>
        </div>`
        ).join('')}`

    $(`#distributionActivityContent`).html(activityTemplateHtml)
}

async function initChart() {
    /* 03.01. Getting Colors from CSS */
    var rootStyle = getComputedStyle(document.body);
    var themeColor1 = rootStyle.getPropertyValue("--theme-color-1").trim();
    var themeColor2 = rootStyle.getPropertyValue("--theme-color-2").trim();
    var themeColor3 = rootStyle.getPropertyValue("--theme-color-3").trim();
    var themeColor4 = rootStyle.getPropertyValue("--theme-color-4").trim();
    var themeColor5 = rootStyle.getPropertyValue("--theme-color-5").trim();
    var themeColor6 = rootStyle.getPropertyValue("--theme-color-6").trim();
    var themeColor1_10 = rootStyle
        .getPropertyValue("--theme-color-1-10")
        .trim();
    var themeColor2_10 = rootStyle
        .getPropertyValue("--theme-color-2-10")
        .trim();
    var themeColor3_10 = rootStyle
        .getPropertyValue("--theme-color-3-10")
        .trim();
    var themeColor4_10 = rootStyle
        .getPropertyValue("--theme-color-4-10")
        .trim();

    var themeColor5_10 = rootStyle
        .getPropertyValue("--theme-color-5-10")
        .trim();
    var themeColor6_10 = rootStyle
        .getPropertyValue("--theme-color-6-10")
        .trim();
    var primaryColor = rootStyle.getPropertyValue("--primary-color").trim();
    var foregroundColor = rootStyle
        .getPropertyValue("--foreground-color")
        .trim();
    var separatorColor = rootStyle.getPropertyValue("--separator-color").trim();

    Chart.defaults.global.defaultFontFamily = "'Nunito', sans-serif";

    var balanceTooltip = {
        backgroundColor: foregroundColor,
        titleFontColor: primaryColor,
        borderColor: separatorColor,
        borderWidth: 0.5,
        bodyFontColor: primaryColor,
        bodySpacing: 10,
        xPadding: 15,
        yPadding: 15,
        cornerRadius: 0.15,
        displayColors: false,
        mode: 'index',
        callbacks: {
            label: function (tooltipItem, myData) {
                var label = myData.datasets[tooltipItem.datasetIndex].label || '';
                if (label) {
                    label += ': ';
                }
                label = numeral(tooltipItem.yLabel).format('0.000 a').toUpperCase() + ' STCK' // parseFloat(tooltipItem.value).toFixed(2);
                return label;
            }
        }
    };

    Chart.defaults.LineWithShadow = Chart.defaults.line;
    Chart.controllers.LineWithShadow = Chart.controllers.line.extend({
        draw: function(ease) {
            Chart.controllers.line.prototype.draw.call(this, ease);
            var ctx = this.chart.ctx;
            ctx.save();
            ctx.shadowColor = "rgba(0,0,0,0.15)";
            ctx.shadowBlur = 10;
            ctx.shadowOffsetX = 0;
            ctx.shadowOffsetY = 10;
            ctx.responsive = true;
            ctx.stroke();
            Chart.controllers.line.prototype.draw.apply(this, arguments);
            ctx.restore();
        }
    });

    var ctx = document.getElementById("balanceChart").getContext("2d");
    balanceChart = new Chart(ctx, {
        type: "LineWithShadow",
        options: {
            plugins: {
                datalabels: {
                    display: false
                }
            },
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                yAxes: [
                    {
                        scaleLabel: {
                            display: true,
                            labelString: 'STCK'
                        },
                        gridLines: {
                            display: true,
                            lineWidth: 1,
                            color: "rgba(0,0,0,0.1)",
                            drawBorder: false
                        },
                        ticks: {
                            callback: function (label, index, labels) {
                                return numeral(label).format('0.0 a').toUpperCase();
                            },
                            beginAtZero: true,
                            // stepSize: 100,
                            // min: 300,
                            // max: 800,
                            //padding: 20
                        }
                    }
                ],
                xAxes: [
                    {
                        type: 'time',
                        distribution: 'series',
                        offset: true,
                        gridLines: {
                            display: false
                        },
                        time: {
                            displayFormats: {
                                'millisecond': 'MMM D, ha',
                                'second': 'MMM D, ha',
                                'minute': 'MMM D, ha',
                                'hour': 'MMM D, ha',
                                'day': 'MMM D, ha',
                            }
                        },
                        ticks: {
                            source: 'data',
                            autoSkip: true,
                        }
                    }
                ]
            },
            legend: {
                display: false
            },
            tooltips: balanceTooltip
        },
        data: {
            labels: [],
            datasets: [
                {
                    label: [],
                    data: [],
                    borderColor: themeColor1,
                    pointBackgroundColor: foregroundColor,
                    pointBorderColor: themeColor1,
                    pointHoverBackgroundColor: themeColor1,
                    pointHoverBorderColor: foregroundColor,
                    pointRadius: 2,
                    pointBorderWidth: 2,
                    pointHoverRadius: 8,
                    fill: false
                }
            ]
        }
    });

}

async function loadChartData() {
    let pages = 0

    balanceFeed = []

    let startTime = Math.floor(Date.now()/1000) - (86400 * 30) //48 hours in the past
    let fingerprint = await loadPriceData(null, startTime)
    while (fingerprint){
        fingerprint = await loadPriceData(fingerprint, startTime)
        pages++
        $("#chart-loading").text(`Loading... ${pages}`)
    }

    balanceChart.data.datasets[0].data = balanceFeed
    $("#chart-loading").text('')
}


async function loadPriceData(fingerprint = null, startTime) {

    let requestObj = {size: 200, eventName: 'onBalance'}

    if (fingerprint != null) {
        requestObj.previousLastEventFingerprint = fingerprint
    }

    let res
    let lastTime = 0

    try {
        res = await tronWeb.getEventResult(contractAddress, requestObj)

        if (res.length) {
            fingerprint = res[res.length - 1].fingerprint
            _.forEach(res, async value => {


                let timestamp = Math.floor(value.timestamp)
                let price = (value.result.price / 1e6).toFixed(3)
                let balance = (value.result.balance / 1e6).toFixed(3)

                balanceFeed.push({y:balance,t:timestamp})
            })

            return lastTime > startTime ? fingerprint : null
        }

    } catch (e) {
    }

    return null;

}



