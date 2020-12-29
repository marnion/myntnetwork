//410000000000000000000000000000000000000000
const zeroAddress = 'T9yD14Nj9j7xAB4dbGeiX9h8unkKHxuWwb'

const networks = {
    'mainnet': 'TBbdx9G136y5Bf3cPipYQPkq4iukNEvZMn',
    'shasta': 'TVGkcBivhgaHWHEoMmm6aYJz9DMpEDRSVJ'
}

const feeLimit = 150e6
const DEFAULT_AUTOROLL_INTERVAL = 5

let autoRollInterval = DEFAULT_AUTOROLL_INTERVAL
let autoRoll = false
let maxRound = 0



var contractAddress
var tronWeb
var currentAddress
var network
var tronLinkUrlPrefix
var daily
var waiting = 0
let supply = 1
let buyAmountInp, sellAmountInp, transferAmountInp, buyEstimate, sellEstimate, transferEstimate, numberSlider,prices


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

$(document).ready(async () => {
    setTimeout(main, 100);
})

async function main() {

    if (!(window.tronWeb && window.tronWeb.ready)) {
        waiting += 1;
        console.log('waiting', waiting)
        if (waiting == 50) {
            closeLoading()
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

        daily = await tronWeb.contract().at(contractAddress)
        console.log('found tronweb')
        currentAddress = tronWeb.defaultAddress['base58']
        console.log('current address', currentAddress)
        userTag(currentAddress)

        //First UI render
        Promise.all([mainLoop(), showStats()])
        closeLoading()
        //setTimeout(updateCountDown, 100)

        //Detect new account
        //newAccount()

        // Schedule loops
        setInterval(mainLoop, 2000)
        setInterval(showStats, 5000)
        setInterval(watchSelectedWallet, 2000)
        //setInterval(updateCountDown, 45000)
        loadTabsData()

    }

}

function bindUI() {
    buyAmountInp = $('#buyAmount')
    sellAmountInp = $('#sellAmount')
    transferAmountInp = $('#transferAmount')
    buyEstimate = $('#buy-estimate')
    sellEstimate = $('#sell-estimate')
    transferEstimate = $('#transfer-estimate')


    buyAmountInp.on("change paste keyup", (e) => {
        let amount = Number.parseInt(buyAmountInp.val().trim())
        let estimate = 100 * amount * 1e6 / supply
        buyEstimate.text(`${numeral(estimate).format('0.000000000')} %`)
    })


    $('#autoRollChb').change(async (e) => {
        autoRoll = $(e.currentTarget).prop('checked')
        console.log('AUTO ROLL IS SET TO: ', autoRoll)
        if (autoRoll) {
            showAutoRollModal()
        }
    })

    numberSlider = document.getElementById('dailySlider')

    let formatter = (value) => {
        return `Every ${Math.floor(value)} ${(value == 1) ? 'minute' : 'minutes'}`
    }

    if (typeof noUiSlider !== 'undefined') {
        if ($('#dailySlider').length > 0) {
            noUiSlider.create(numberSlider, {
                start: DEFAULT_AUTOROLL_INTERVAL,
                connect: [true, false],
                tooltips: true,
                range: {
                    min: 1,
                    max: 15
                },
                step: 1,
                format: {
                    to: formatter,
                    from: function (value) {
                        return value
                    }
                }
            });
        }
    }
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


async function mainLoop() {
    await showWalletInfo()
    await showUserStats()
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

function formatTRXCurTickets(trx) {
    return numeral(trx).format('0,0.000 a').toUpperCase()
}

function formatTRX(trx) {
    return numeral(trx).format('0,0 a').toUpperCase()
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

async function showWalletInfo() {
    try {
        $('#network').text(network)
        $('#currentAddress').text(currentAddress)
        $('#walletAddress').text(`${shortId(currentAddress, 5)}`)
        var bandwidth = await tronWeb.trx.getBandwidth()
        $('#getBandwidth').text(numeral(bandwidth).format('0,0 a').toUpperCase())
        var result = await tronWeb.trx.getAccountResources()
        var net = result.EnergyLimit - result.EnergyUsed
        $('#getEnergy').text(numeral(net).format('0,0 a').toUpperCase())
        showReferral(currentAddress)
        $('#walletBalanceValue').text(formatSun(await tronWeb.trx.getBalance()))
    } catch (e) {
    }
}

async function showStats() {
    try {
        let round = (await daily.round().call()).toNumber()
        let awardAmount = (await daily.awardAmount().call()).toNumber()
        let donatedAmount = awardAmount * 2;
        awardAmount =  numeral(tronWeb.fromSun(awardAmount)).format('0,0')
        donatedAmount =  numeral(tronWeb.fromSun(donatedAmount)).format('0,0')

        $('#round').text(round)
        $('#totalTxs').text(numeral((await daily.totalTxs().call()).toNumber()).format('0,0.000 a').toUpperCase())
        $('#getTotalMembers').text((await daily.players().call()).toNumber())
        $('#current-players').text((await daily.currentPlayers().call()).toNumber())
        let tronBalance = (await daily.totalTronBalance().call()).toNumber()
        $('#contractBalance').text(formatSun(tronBalance))
        $('#contractBalance-usdt').html(`${approxStr} ${formatSun(tronBalance * prices.usdt)} USDT`)
        $('#awardAmount').text(awardAmount)
        $('#donatedAmount').text(donatedAmount)
    } catch (e) {
        console.log('showStats error', e.message)
    }
}

async function updateCountDown() {
    let time = (await daily.timeLeft().call()).toNumber()
    console.log('time-left', time)
    let date = moment().add(time, 'seconds').toDate()

    /*
    if (time){
        time = `ends ${moment().add(time, 'seconds').fromNow()}`
    } else {
        time = 'is Ready!!!'
    }

   $('#time-left').text(time)
   */

    if (time) {

        $('#time-left').countdown(date).on('update.countdown', function (event) {
            var format = 'ends in %H:%M:%S';
            $(this).text(event.strftime(format));
        })
            .on('finish.countdown', function (event) {
                $(this).text('is Ready!!!')

            })
    } else {
        $('#time-left').text('is Ready!!!')
    }


}


async function showUserStats() {
    try {
        let ticketStats = await daily.ticketStats(currentAddress).call()
        $('#user-tickets').text(numeral(ticketStats[1].toNumber()).format('0.0 a').toUpperCase())
        $('#user-round').text(ticketStats[0].toNumber())
        $('#user-rounds').text(ticketStats[5].toNumber())
        $('#user-wins').text(ticketStats[6].toNumber())
        $('#user-awarded').text(formatSun(ticketStats[7].toNumber()))
        $('#user-awarded-usdt').html(`${approxStr} ${formatSun(ticketStats[7].toNumber() * prices.usdt)} USDT`)
    } catch (e) {

        console.log('showUserStats error', e.message, e)
    }

    //console.log('user stats', stats)
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

function autoRefresh(tx) {
    $('#autotxId').html(`<a href="${tronLinkUrlPrefix}${tx}">${shortId(tx, 5)}</a>`)
    $('#autotxModal').modal()
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

async function roll() {

    if (!await checkResources()) {
        return
    }

    daily.roll().send({callValue: 0, feeLimit: feeLimit }).then(tx => {
        console.log('roll', tx)
        if (autoRoll) {
            $.notify({
                message: `<span class="text-white">Scheduling roll in ${autoRollInterval} ${autoRollInterval == 1 ? 'minute' : 'minutes'}...</span>`
            }, {
                type: 'dark',
                delay: 1000,
                allow_dismiss: false,
                placement: {from: 'bottom', align: 'left'}
            })
            setTimeout(roll, autoRollInterval * 60000)
            setTimeout(autoRefresh, 2000, tx)
        } else {
            refresh(tx)
        }
    }).catch(e => {
        txError(e)
    })
}

function showAutoRollModal() {
    const selectedInterval = autoRollInterval
    numberSlider.noUiSlider.set(selectedInterval)
    $('#autoRollIntModal').modal()
}

function updateAutorollInterval() {
    autoRollInterval = numberSlider.noUiSlider.get().split(' ')[1]
    console.log('autoRollInterval', autoRollInterval)
}


const getNetworkName = () => {
    const url = tronWeb.currentProvider().fullNode.host
    const networkName = (url.indexOf('shasta') != -1) ? 'shasta' : 'main'
    return networkName
}

const loadNewActivityData = async () => {
    const ACTIVITY_EVENT = 'onPlayerSummary' //'onPurchase'
    let requestObj = {size: 100, eventName: ACTIVITY_EVENT}

    let round = (await daily.round().call()).toNumber().toString()

    if (round > maxRound) {
        maxRound = round
        updateCountDown()
    }

    let res
    try {
        res = await tronWeb.getEventResult(contractAddress, requestObj)
        let activityDbData = _.map(res, (obj) => {
            obj.timestamp = new Date(obj.timestamp)
            obj.event = obj.name
            delete obj.name
            if (obj.result) {
                obj.player = obj.result.player && tronWeb.address.fromHex(obj.result.player)
                obj.tickets = parseFloat(obj.result.totalTickets)
                obj.round = obj.result.round
                //obj.incomingtron = Math.floor(obj.result.incomingtron / SUN_IN_TRX)
            }

            delete obj.result
            delete obj.resourceNode
            return obj
        })
        activityDbData = _.filter(activityDbData, (obj)=>{
            return obj.tickets > 0;
        })

        activityDbData = _.slice(activityDbData,0,50)

        updateActivityUI(activityDbData)
    } catch (e) {
        console.log(e)
    }

}


let activityData = []

const updateActivityUI = async (newData) => {
    // const MAX_LENGTH = 50

    // activityData = newData.concat(activityData)
    // if (activityData.length > MAX_LENGTH) {
    //     activityData = activityData.slice(0, MAX_LENGTH + 1)
    // }

    activityData = newData

    const activityTemplateHtml =
        `<div class="row">
            <div class="col-12 list">
            <div class="card d-flex flex-row mb-3">
                <div class="d-flex flex-grow-1 min-width-zero">
                    <div class="card-body align-self-center d-flex row justify-content-between min-width-zero align-items-md-center">
                        <div class="col-12 col-xl-3 col-lg-3 col-md-3">    
                            Player
                        </div>
                        <p class="mb-1 col-4">Round</p>
                        <p class="mb-1 text-white col-4">Rolls</p>
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
                        <div class="card-body align-self-center d-flex row justify-content-between min-width-zero align-items-md-center">
                            <a class="p-1 btn btn-outline-primary list-item-heading mb-2 truncate col-12 col-xl-3 col-lg-3 col-md-3" onclick="clipCopy('${item.player}')">
                            ${shortId(item.player, 5)}
                            </a>
                            <div class="col-4">
                                 ${item.round}
                            </div>
                            <div class="mb-1 text-white col-4">${formatTRX(item.tickets)}</div>
                        </div>
                    </div>
                </div>
            </div>
        </div>`
        ).join('')}`

    $('#activityContent').html(activityTemplateHtml)
}


const loadNewHistoryData = async () => {
    const HISTORY_EVENT = 'onRoundSummary'
    let requestObj = {size: 50, eventName: HISTORY_EVENT}

    let res
    try {
        res = await tronWeb.getEventResult(contractAddress, requestObj)
        const historyDbData = _.map(res, (obj) => {
            obj = Object.assign(obj, obj.result)
            obj.timestamp = new Date(obj.timestamp)
            obj.event = obj.name
            delete obj.name
            if (obj.result) {
                obj.player = obj.result.wallet && tronWeb.address.fromHex(obj.result.wallet)
                obj.luckyWinner = obj.result.luckyWinner && tronWeb.address.fromHex(obj.result.luckyWinner)
            }

            delete obj.result
            delete obj.resourceNode
            return obj
        })

        updateHistoryUI(historyDbData)
    } catch (e) {
        console.log(e)
    }

}


let historyData = []

const updateHistoryUI = (newData) => {
    const MAX_LENGTH = 50
    historyData = newData;//.concat(historyData)
    if (historyData.length > MAX_LENGTH) {
        historyData = historyData.slice(0, MAX_LENGTH + 1)
    }

    const historyTemplateHtml =
        `<div class="row">
            <div class="col-12 list">
            <div class="card mb-3">
            <div class="min-width-zero">
                    <div class="card-body align-self-center row justify-content-between align-items-md-center">
                        <div class="col-6 col-xl-2 col-lg-2 col-md-2">    
                            Round
                        </div>
                        <div class="col-6 col-xl-2 col-lg-2 col-md-2 text-white">    
                            Total Players
                        </div>
                        <div class="col-12 col-xl-3 col-lg-3 col-md-3 text-white">
                            Lucky Winner
                        </div>
                        <div class="col-6 col-xl-2 col-lg-2 col-md-2">
                            Lucky Roll
                        </div>
                        <div class="col-6 col-xl-2 col-lg-2 col-md-2">
                            Total Awarded
                        </div>
                    </div>
            </div>
            </div>
            </div>
        </div>
        ${historyData.map((item) =>
            `<div class="row">
            <div class="col-12 list">
                <div class="card mb-3">
                    <div class="min-width-zero">
                        <div class="card-body align-self-center row  justify-content-between align-items-md-center">
                            <div class="col-6 col-xl-2 col-lg-2 col-md-2">
                                ${item.round}
                            </div>
                            <div class="col-6 col-xl-2 col-lg-2 col-md-2 text-white">
                                ${item.totalPlayers}
                            </div>
                            <a class="p-1 btn btn-outline-primary list-item-heading mb-2 truncate col-12 col-xl-3 col-lg-3 col-md-3" onclick="clipCopy('${item.luckyWinner}')">
                                ${shortId(item.luckyWinner, 5)}
                            </a>
                            <div class="col-6 col-xl-2 col-lg-2 col-md-2">
                                ${item.luckyPosition}
                            </div>
                            <div class="col-6 col-xl-2 col-lg-2 col-md-2">
                                ${formatSun(item.donatedAmount)}
                            </div>

                        </div>
                    </div>
                </div>
            </div>
        </div>`
        ).join('')}`

    $('#historyContent').html(historyTemplateHtml)
}

async function loadTabsData() {
    loadNewActivityData()
    loadNewHistoryData()
    setInterval(loadNewActivityData, 5000)
    setInterval(loadNewHistoryData, 5000)
}