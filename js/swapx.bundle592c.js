//410000000000000000000000000000000000000000
const zeroAddress = 'TS3CJptewhm9NM4gRLqPt2acxaD4gaER3K'

const networks = {
    'mainnet': 'TG8qehVpZb9AEQkeXTnMrs3odFJMNoGz8D',
    'shasta': 'TNKK3sLSBikAwVVwnCr16LGZ4kw9dZcqVP'//'TNVYQKhigG7YfJqV6jMkPWnDBYtQceFszH'
}

/*
Mainnet Test

Daily - TWvNVtYeFgRtLkzzzLUahvSejQNTLqtTbu
TokenMint - TRPyZKJkCe958zrfyMf8vHJi84ai8dbaqL
GameHub - TNpvL6PddcnE1kPc8a7LcqNuYaocyMecux

 */

const feeLimit = 150e6

const fastAddress = 'TNYMAeKiTPKDgeeAtD7hebneYYDUt9QdoY'
const myntAddress = 'TS87bnHCRDpqDYxRM4JuhTDDBDHDkfzdar'

let fastContract

var contractAddress
var tronWeb
var currentAddress
var network
var tronLinkUrlPrefix
let swapContract, myntMint, mynt
var waiting = 0
let buyAmountInp, sellAmountInp, addAmountInp, removeAmountInp, buyEstimate, sellEstimate, addEstimate, removeEstimate, prices, USDTVolume

let volumeLoaded = false
var players = {}

var balanceFeed = []
let balanceChart


$(document).ready(async () => {
    setTimeout(main, 100);
})

async function main() {

    if (!(window.tronWeb && window.tronWeb.ready)) {
        waiting += 1;
        if (waiting == 50) {
            $('#tronWebModal').modal()
            return
        }
        console.warn('main retries', 'Could not connect to TronLink.', waiting)
        setTimeout(main, 500);
        return;
    } else {

        tronWeb = window.tronWeb

        setNetwork()
        updateReferrer()
        bindUI()

        prices = await getPrices()



        swapContract = await tronWeb.contract().at(contractAddress)
        fastContract = await tronWeb.contract().at(fastAddress)
        mynt = await tronWeb.contract().at(myntAddress)

        console.log('found tronweb')
        currentAddress = tronWeb.defaultAddress['base58']

        userTag(currentAddress)
        console.log('current address', currentAddress)

        USDTVolume = await getFastVolume()

        //First UI render
        try {
            await mainLoop()
        } catch (e) {

        } finally {
            closeLoading()
        }

        //Detect new account
        //newAccount()

        // Schedule loops
        setInterval(mainLoop, 5000)
        setInterval(watchSelectedWallet, 2000)
        setInterval(showPrice,1000 * 15 )


        loadTabsData()
    }

}

async function getFastVolume() {
    const response = await axios.get('https://mynt-info.bankroll.network/volume/x/sun')
    volumeLoaded = true
    return parseInt(response.data)
}

function bindUI() {
    buyAmountInp = $('#buyAmount')
    sellAmountInp = $('#sellAmount')
    addAmountInp = $('#addAmount')
    removeAmountInp = $('#removeAmount')
    buyEstimate = $('#buy-estimate')
    sellEstimate = $('#sell-estimate')
    addEstimate = $('#add-liquidity-estimate')
    removeEstimate = $('#remove-liquidity-estimate')

    $('#swapingChb').change(async (e) => {
        let isSwaping = $(e.currentTarget).prop('checked')
        console.log('Enable Swaping: ', isSwaping)
        if (isSwaping) {
            enableSwap()
        } else {
            disableSwap()
        }
    })

    let calcTokens = async (e) => {
        let amount = Number.parseInt(buyAmountInp.val().trim())
        amount = tronWeb.toSun(amount)
        amount = (await swapContract.getUSDTToTokenInputPrice(amount).call()).toNumber()

        console.log('buy-amount-estimate', amount)
        buyEstimate.text(`${numeral(tronWeb.fromSun(amount)).format('0.000 a').toUpperCase()} myntX`)
    }

    let calcUSDT = async (e) => {
        let amount = Number.parseInt(sellAmountInp.val().trim())
        amount = tronWeb.toSun(amount)
        amount = (await swapContract.getTokenToUSDTInputPrice(amount).call()).toNumber()
        console.log('sell-amount-estimate', amount)
        sellEstimate.text(`${numeral(tronWeb.fromSun(amount)).format('0.000 a').toUpperCase()} USDT`)
    }

    let calcSwap = async (e) => {
        let supply = (await swapContract.totalSupply().call()).toNumber()

        if (supply > 0) {
            let amount = Number.parseInt(addAmountInp.val().trim())
            amount = tronWeb.toSun(amount)
            amount = (await swapContract.getUSDTToLiquidityInputPrice(amount).call()).toNumber()
            let myntAmount = (await swapContract.getLiquidityToReserveInputPrice(amount).call())[1].toNumber()


            console.log('add-amount-estimate', amount, myntAmount)
            addEstimate.text(`${formatSun(amount)} SWAP ; ${formatSun(myntAmount)} myntX required`)
        }
    }

    let calcReserve = async (e) => {
        let amount = Number.parseInt(removeAmountInp.val().trim())
        amount = tronWeb.toSun(amount)
        amount = (await swapContract.getLiquidityToReserveInputPrice(amount).call())
        console.log('sell-amount-estimate', amount)
        removeEstimate.text(`${numeral(tronWeb.fromSun(amount[0].toNumber())).format('0.000 a').toUpperCase()} USDT + ` + `${numeral(tronWeb.fromSun(amount[1].toNumber())).format('0.000 a').toUpperCase()} mynt`)
    }



    buyAmountInp.on("change paste keyup", _.debounce(calcTokens, 250))

    sellAmountInp.on("change paste keyup", _.debounce(calcUSDT, 250))

    addAmountInp.on("change paste keyup", _.debounce(calcSwap, 250))

    removeAmountInp.on("change paste keyup", _.debounce(calcReserve, 250))

}

async function isSwapEnabled() {
    let allowance = (await mynt.allowance(currentAddress, contractAddress).call()).toNumber();
    return allowance > 21e12 ? true : false
}

function enableSwap() {
    mynt.approve(contractAddress, 100e12).send({ callValue: 0, feeLimit: feeLimit }).then(tx => {
        refresh(tx)
    }).catch(e => {
        txError(e)
    })
}

function disableSwap() {
    mynt.approve(contractAddress, 0).send({ callValue: 0, feeLimit: feeLimit }).then(tx => {
        refresh(tx)
    }).catch(e => {
        txError(e)
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


async function mainLoop() {
    await showWalletInfo()
    await showUserStats()
    await showStats()
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



const getNetworkName = () => {
    const url = tronWeb.currentProvider().fullNode.host
    const networkName = (url.indexOf('shasta') != -1) ? 'shasta' : 'main'
    return networkName
}


async function showWalletInfo() {
    try {
        $('#network').text(network)
        $('#walletAddress').text(`${shortId(currentAddress, 5)}`)

        var bandwidth = await tronWeb.USDT.getBandwidth()
        $('#getBandwidth').text(numeral(bandwidth).format('0,0 a').toUpperCase())
        var result = await tronWeb.USDT.getAccountResources()
        var net = result.EnergyLimit - result.EnergyUsed
        $('#getEnergy').text(numeral(net).format('0,0 a').toUpperCase())
        $('#walletBalanceValue').text(formatSun(await fastContract.balanceOf(currentAddress).call()))
    } catch (e) {
        console.error(e)
    }
}

async function showPrice(){
    try {

        let price
        let complete = false
        let retries = 0

        while (!complete && retries < 5) {
            try {
                retries++
                price = (price) ? price : await swapContract.getTokenToUSDTInputPrice(1e6).call()
                complete = true
            } catch (e) {
                console.warn('showstats fail', e.toString())
            }
        }

        $('.buy-price').text(formatSun(price.toNumber()))
    } catch (e) { }
}

async function showStats() {
    try {

        let totalTxs, players, USDTBalance, totalmynt, price, supply
        let complete = false
        let retries = 0

        while (!complete && retries < 5) {
            try {
                retries++
                totalTxs = (totalTxs) ? totalTxs : await swapContract.totalTxs().call()
                    players = (players) ? players : await swapContract.providers().call()
                    USDTBalance = (USDTBalance) ? USDTBalance : await swapContract.USDTBalance().call()
                    totalmynt = (totalmynt) ? totalmynt : await swapContract.tokenBalance().call()
                    price = (price) ? price : await swapContract.getTokenToUSDTInputPrice(1e6).call()
                    supply = (supply) ? supply : await swapContract.totalSupply().call()
                complete = true
            } catch (e) {
                console.warn('showstats fail', e.toString())
            }
        }


        if (volumeLoaded) {
            $('#volume').text(formatSun(USDTVolume))
            $('#volume-USDT').html(`${approxStr} ${formatSun(USDTVolume * prices.USDT)} USDT`)
            $('#earnings').text(formatSun(USDTVolume * 0.003))
            $('#earnings-USDT').html(`${approxStr} ${formatSun(USDTVolume * 0.003 * prices.USDT)} USDT`)
        }
        $('#liquidity').text(formatSun(supply.toNumber()))
        $('#liquidity-USDT').html(`${approxStr} ${formatSun(USDTBalance * prices.USDT + totalmynt.toNumber() * prices.myntx)} USDT`)
        $('#totalTxs').text(numeral(totalTxs.toNumber()).format('0,0.000 a').toUpperCase())
        $('#providers').text(players.toNumber())
        $('#contractBalance').text(formatSun(USDTBalance))
        $('#contractBalance-USDT').html(`${approxStr} ${formatSun(USDTBalance * prices.USDT)} USDT`)
        $('.buy-price').text(formatSun(price.toNumber()))
        $('#price-USDT').html(`${approxStr} ${formatSun(price.toNumber() * prices.USDT)} USDT`)
        $('#totalSupply').text(formatSun(totalmynt.toNumber()))
        $('#totalSupply-USDT').html(`${approxStr} ${formatSun(totalmynt.toNumber() * prices.myntx)} USDT`)
    } catch (e) { }
}


async function showUserStats() {
    let userUSDT, usermynt, userSwap, supply, userTXs
    let complete = false
    let retries = 0

    while (!complete && retries < 5) {
        try {
            retries++

            userUSDT = (userUSDT) ? userUSDT : await fastContract.balanceOf(currentAddress).call()
            usermynt = (usermynt) ? usermynt : await mynt.balanceOf(currentAddress).call()
            userSwap = (userSwap) ? userSwap : await swapContract.balanceOf(currentAddress).call()
            supply = (supply) ? supply : await swapContract.totalSupply().call()
            userTXs = (userTXs) ? userTXs : await swapContract.txs(currentAddress).call()
            complete = true
        } catch (e) {
            console.warn('showstats fail', e.toString())
        }
    }

    userUSDT = userUSDT.toNumber()
    usermynt = usermynt.toNumber()
    userSwap = userSwap.toNumber()
    supply = supply.toNumber()
    userTXs = userTXs.toNumber()



    let isSwaping = await isSwapEnabled()
    $('#swaping-status').text(isSwaping ? 'Swap enabled' : 'Swap disabled')
    $('#swapingChb').prop('checked', isSwaping)
    $('#user-txs').text(numeral(userTXs).format('0,0.000 a').toUpperCase())
    $('.user-balance-mynt').text(formatSun(usermynt))
    $('.user-balance-USDT').text(formatSun(userUSDT))
    $('.user-balance-mynt-USDT').html(`${approxStr} ${formatSun(usermynt * prices.myntx)} USDT`)
    $('.user-balance-USDT-USDT').html(`${approxStr} ${formatSun(userUSDT * prices.USDT)} USDT`)
    $('.user-balance-swap').text(formatSun(userSwap))
    if (userSwap > 0) {
        let estimate = (userSwap / supply) * 0.003 * USDTVolume
        $("#user-estimate").html(volumeLoaded ? `&#8776; ${formatSun(estimate)} USDT in 24H fees` : 'Loading volume data...')
        $("#user-estimate-USDT").html(`${approxStr} ${formatSun(estimate * prices.USDT)} USDT`)
        $('#user-swap-percentage').text(numeral((userSwap / supply) * 100).format('0.000') + ' %')
        amount = (await swapContract.getLiquidityToReserveInputPrice(userSwap).call())
        console.log('sell-amount-estimate', amount)
        let USDT_value = amount[0].toNumber()
        $('#user-balance-estimate').html(`<h5 class="color-theme-1 mr-2">Staked Value</h5> <h5><span class="text-white">${formatSun(USDT_value)}</span> USDT + ` + `<span class="text-white">${formatSun(amount[1].toNumber())}</span> myntX = <span class="text-success">${formatSun(USDT_value * 2)}</span> USDT</h5>`)
        $('#user-balance-estimate-USDT').html(`${approxStr} ${formatSun(USDT_value * 2 * prices.USDT)} USDT`)
    } else {
        $("#user-estimate").html('Add USDT and mynt liquidity to earn 0.3%')
        $('#user-balance-estimate').text('')
    }


}


function cleanAddress(address) {
    return address.trim().replace(/[^\u0000-\u007E]/g, "")
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


async function sell() {

    let isSwaping = await isSwapEnabled()
    if (!isSwaping) {
        showAlert('Enable Swap', 'Swap is not enabled.  Look for the toggle and make sure it is on (purple)!')
        return
    }

    //let tokens = tronWeb.fromSun((await mynt.balanceOf(currentAddress).call()).toNumber())
    //let amount = $('#sellAmount').val().trim()
    var amount = Number.parseFloat($('#sellAmount').val().trim())
    if (amount <= 0 || !isFinite(amount) || amount === '') {
        showAlert('Whoops', `Enter a valid amount of mynt`)
        return
    } else {

        let balance = await mynt.balanceOf(currentAddress).call()
        amount = tronWeb.toBigNumber(amount * Math.pow(10, 6))

        //The solution to the decimals bug
        console.log(balance.toString(10), amount.toString(10), amount.gt(balance))
        amount = (amount.gt(balance)) ? balance : amount

        let amount_hex = `0x${tronWeb.toBigNumber(amount).toString(16)}`
        console.log('selltokens', amount, amount_hex)

        swapContract.tokenToUSDTSwapInput(amount_hex, 1).send({ callValue: 0, feeLimit: feeLimit }).then(tx => {
            console.log('sell', amount, tx)
            refresh(tx)
        }).catch(e => {
            txError(e)
        })
    }

    return false;
}


async function buy() {

    let isSwaping = await isSwapEnabled()
    if (!isSwaping) {
        showAlert('Enable Swap', 'Swap is not enabled.  Look for the toggle and make sure it is on (purple)!')
        return
    }

    //var amount = $('#buyAmount').val().trim()
    var amount = Number.parseFloat($('#buyAmount').val().trim())
    if (amount <= 0 || !isFinite(amount) || amount === '') {
        showAlert('Whoops', `Enter a valid amount of USDT`)
        return
    } else {


        let balance = await fastContract.balanceOf(currentAddress).call()
        amount = tronWeb.toBigNumber(amount * Math.pow(10, 6))

        //The solution to the decimals bug
        console.log(balance.toString(10), amount.toString(10), amount.gt(balance))
        amount = (amount.gt(balance)) ? balance : amount

        let amount_hex = `0x${tronWeb.toBigNumber(amount).toString(16)}`
        console.log('buy tokens', amount, amount_hex)


        swapContract.USDTToTokenSwapInput(1).send({ callValue: amount_hex, feeLimit: feeLimit }).then(tx => {
            console.log('buy', amount, tx)
            refresh(tx)
        }).catch(e => {
            txError(e)
        })

    }

    return false;
}

async function addLiquidity() {

    let isSwaping = await isSwapEnabled()
    if (!isSwaping) {
        showAlert('Enable Swap', 'Swap is not enabled.  Look for the toggle and make sure it is on (purple)!')
        return
    }

    let balancedTokens
    let supply = (await swapContract.totalSupply().call()).toNumber()

    var amount = $('#addAmount').val().trim()
    if (amount <= 0 || !isFinite(amount) || amount === '') {
        showAlert('Whoops', `Enter a valid amount of USDT`)
        return
    } else {

        amount = tronWeb.toSun(amount)

        if (supply == 0) {
            balancedTokens = Math.floor(amount / 2.5)
        } else {
            let tokens = (await mynt.balanceOf(currentAddress).call()).toNumber()

            let liquid_amount = (await swapContract.getUSDTToLiquidityInputPrice(amount).call()).toNumber()
            balancedTokens = (await swapContract.getLiquidityToReserveInputPrice(liquid_amount).call())[1].toNumber()
            balancedTokens = Math.floor(Math.min(balancedTokens * 1.2, tokens))
        }

        swapContract.addLiquidity(1, balancedTokens).send({ callValue: amount, feeLimit: feeLimit }).then(tx => {
            console.log('addLiquidity', amount, tx)
            refresh(tx)
        }).catch(e => {
            txError(e)
        })

    }

    return false;
}

async function removeLiquidity() {

    let isSwaping = await isSwapEnabled()
    if (!isSwaping) {
        showAlert('Enable Swap', 'Swap is not enabled.  Look for the toggle and make sure it is on (purple)!')
        return
    }

    let tokens = tronWeb.fromSun((await swapContract.balanceOf(currentAddress).call()).toNumber())
    if (tokens == 0) {
        showAlert('No Liquidity', `You don't have any SWAP tokens`)
        return
    }

    let amount = $('#removeAmount').val().trim()
    if (amount <= 0 || !isFinite(amount) || amount === '') {
        showAlert('Whoops', `Enter a valid amount of tokens`)
        return
    } else {
        amount = Math.floor(Math.min(amount, tokens))
        swapContract.removeLiquidity(tronWeb.toSun(amount), 1, 1).send({ callValue: 0, feeLimit: feeLimit }).then(tx => {
            console.log('removeLiquidity', amount, tx)
            refresh(tx)
        }).catch(e => {
            txError(e)
        })
    }

    return false;
}


async function transfer() {


    var amount = $('#transferAmount').val().trim()
    let tokens = tronWeb.fromSun((await swapContract.balanceOf(currentAddress).call()).toNumber())

    if (tokens == 0) {
        showAlert('No Liquidity', `You don't have any SWAP tokens`)
        return
    }

    if (amount <= 0 || !isFinite(amount) || amount === '') {
        showAlert('Whoops', `Enter a valid amount of tokens`)
        return
    } else {
        var address = cleanAddress($('#recipient').val())
        if (!tronWeb.isAddress(address)) {
            $('#invalidAddressModal').modal()
        } else {

            amount = Math.floor(Math.min(amount, tokens))

            // withdrawals ha now been zerod out and it is safe to transfer
            swapContract.transfer(address, tronWeb.toSun(amount)).send({ callValue: 0, feeLimit: feeLimit }).then(tx => {
                console.log('transfer', address, amount, tx)
                refresh(tx)
            }).catch(e => {
                txError(e)
            })
        }
    }
}









async function loadTabsData() {

    let loadPumps = () => {
        loadNewActivityData('onTokenPurchase', 'buyActivityContent')
    }

    let loadDumps = () => {
        loadNewActivityData('onUSDTPurchase', 'sellActivityContent')
    }

    

    try {
        await Promise.all([loadPumps(), loadDumps()])
    } catch (e) {
        loadTabsData()
        return
    }


    setInterval(loadPumps, 15000)
    setInterval(loadDumps, 15000)
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
                obj.player = (obj.result.buyer) ? tronWeb.address.fromHex(obj.result.buyer) : tronWeb.address.fromHex(obj.result.provider)
                obj.mynt = parseFloat(obj.result.token_amount)
                obj.tron = parseFloat(obj.result.USDT_amount)
            }

            delete obj.result
            delete obj.resourceNode
            return obj
        })

        activityDbData = _.slice(activityDbData, 0, 50)

        updateActivityUI(activity, content, activityDbData)
    } catch (e) {
        console.log(e)
    }

}


const updateActivityUI = async (activity, tab, activityData) => {


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
                            USDT 
                        </div>
                        <div class="w-15 w-xs-100">    
                            myntX 
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
                            <div class="mb-1 text-white w-15 w-xs-100 ">${formatSun(item.USDT)}</div>
                            <div class="mb-1 text-white w-15 w-xs-100 ">${formatSun(item.mynt)}</div>
                        </div>
                    </div>
                </div>
            </div>
        </div>`
        ).join('')}`

    $(`#${tab}`).html(activityTemplateHtml)
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
                label = numeral(tooltipItem.yLabel).format('0.000 a').toUpperCase() + ' USDT' // parseFloat(tooltipItem.value).toFixed(2);
                return label;
            }
        }
    };

    Chart.defaults.LineWithShadow = Chart.defaults.line;
    Chart.controllers.LineWithShadow = Chart.controllers.line.extend({
        draw: function (ease) {
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
                            labelString: 'USDT'
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

    let startTime = Math.floor(Date.now() / 1000) - (86400 * 30) //48 hours in the past
    let fingerprint = await loadPriceData(null, startTime)
    while (fingerprint) {
        fingerprint = await loadPriceData(fingerprint, startTime)
        pages++
        $("#chart-loading").text(`Loading... ${pages}`)
    }

    let lastIndex = 0;
    let interval = 60 * 60 * 24 * 1000

    balanceFeed = _.orderBy(balanceFeed, ['t'])
    balanceFeed = _.filter(balanceFeed, (value, key, feed) => {

        if (key > 0) {
            if (value.t - interval >= feed[lastIndex].t) {
                lastIndex = key
                return true
            } else {
                return false;
            }
        } else {
            lastIndex = key
            return true
        }

    })
    balanceChart.data.datasets[0].data = balanceFeed
    $("#chart-loading").text('')
}

async function updateVolume() {

    USDTVolume = 1;

    try {
        await Promise.all([loadVolume('onTokenPurchase'), loadVolume('onUSDTPurchase')])
    } catch (e) {
    }

    volumeLoaded = true


}

async function loadVolume(activity) {

    let startTime = Date.now() - (86400 * 1000) //24 hours in the past
    let altTime = moment().subtract(1, "days").utc().valueOf()
    let fingerprint = await loadVolumeData(null, activity, startTime)
    while (fingerprint != null) {
        fingerprint = await loadVolumeData(fingerprint, activity, startTime)
    }

}

const loadVolumeData = async (fingerprint, activity, startTime) => {
    const ACTIVITY_EVENT = activity
    let requestObj = { size: 200, eventName: ACTIVITY_EVENT }

    if (fingerprint != null) {
        requestObj.previousLastEventFingerprint = fingerprint
    }

    let res
    let lastTime = 0
    let amount

    try {
        res = await tronstack().getEventResult(contractAddress, requestObj)
        fingerprint = res[res.length - 1].fingerprint
        _.each(res, (obj) => {
            let timestamp = obj.timestamp
            let time_length = `${obj.timestamp}`.length
            if (obj.timestamp > startTime) {
                amount = parseInt(obj.result.USDT_amount)
                USDTVolume += amount
                console.log(activity, 'volume counted', timestamp, timestamp - startTime, time_length, amount)
            } else {
                console.log(activity, 'volume discounted', timestamp, timestamp - startTime, time_length, amount)
            }

        })

        lastTime = res[res.length - 1].timestamp


    } catch (e) {
        console.log(e)
    }

    return lastTime > startTime ? fingerprint : null

}


async function loadPriceData(fingerprint = null, startTime) {

    let requestObj = { size: 200, eventName: 'onSummary' }

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


                let timestamp = Math.floor(value.timestamp)
                let balance = (value.result.liquidity / 1e6).toFixed(3)

                balanceFeed.push({ y: balance, t: timestamp })

                lastTime = timestamp

            })

            return lastTime > startTime ? fingerprint : null
        }

    } catch (e) {
    }

    return null;

}



