//410000000000000000000000000000000000000000
const zeroAddress = 'T9yD14Nj9j7xAB4dbGeiX9h8unkKHxuWwb'

const networks = {
    'mainnet': 'TRXYvAoYvCqmvZWpFCTLc4rdQ7KxbLsUSj',
    'shasta': 'TNKK3sLSBikAwVVwnCr16LGZ4kw9dZcqVP'//'TNVYQKhigG7YfJqV6jMkPWnDBYtQceFszH'
}

/*
Mainnet Test

Daily - TWvNVtYeFgRtLkzzzLUahvSejQNTLqtTbu
TokenMint - TRPyZKJkCe958zrfyMf8vHJi84ai8dbaqL
GameHub - TNpvL6PddcnE1kPc8a7LcqNuYaocyMecux

 */

const feeLimit = 150e6
const refreshInterval = 5000

const fastAddress = 'TNYMAeKiTPKDgeeAtD7hebneYYDUt9QdoY'
const bnkrAddress = 'TNo59Khpq46FGf4sD7XSWYFNfYfbc8CqNK'
const bnkrxAddress = 'TKSLNVrDjb7xCiAySZvjXB9SxxVFieZA7C'
const wtrxAddress = 'TNUC9Qb1rRpS5CbWLmNMxXBjyFoydXjWFR'
const mintAddress = 'TPY3P5CNW4XdFzqrJEf5ehvfp9Pg2Bjjgz'//'TFMcU3QBGVB5ghtYw8g9wMV3rTFdkH2avv'
const custodyAddress = 'TPmqRz2HmrUDVDRgGxhZv4yAKBRWsRex4E'
const buddyAddress = 'TLiPH8Z9xUK57hxhuYvXrZQATZovFq7kfQ'
const swapxAddress = 'TB4S2pvyX8uQsBPrTDWYCuSDfYSg6tMJm7'
const readerAddress = 'THKMpho5tmX4Hfu6VeFYNQg2H9NZNwjZJ4'
const APPROVE_MAX = '0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff' //1.157920892373162e+77


let fastContract

var contractAddress
var tronWeb
var currentAddress
var network
var tronLinkUrlPrefix
var bnkr
var bnkrMint
var buddy
var swapx
var reader
var bnkr_logo = '/img/farm/TNo59Khpq46FGf4sD7XSWYFNfYfbc8CqNK.png'
var bnkrx_logo = '/img/farm/TKSLNVrDjb7xCiAySZvjXB9SxxVFieZA7C.png'
var waiting = 0
var prices

var players = {}

let closed_assets = ['TN6x7WDr8UMkmQQ3ZC1hWZaJhVjjv8bW9Q', 'TAkw3L7QdXwFmDNTh9FhewhbqPtQ44pGaK', 'TQHgS4uEEBbpDsBPjpDEjiqTSRd4THHqgV', 'TSL7HPvjMEs4fzLLFqFW1UxKRHgv1Yj6KM', 'TL2Nxcqvw7Zm1LtTqPKX1R81Nz3ZcsbZbW', 'TT8c62CvFHaGUp8spaW5uYnoZu4y5ugrAp',
    'TXqizoYBwiMwriPMj1j66p4UP7KZcMquSq', 'TQ4zMrXKmWDyG3EV26pMuToQXsntztDGAX', 'TCrGsca96rHeSwiJ1BpSLRWxQXeSkHwmdf', 'TQJzCGFpWWAMvcPHrC3X6jLvEno8bK1Vpz', 'TCrGsca96rHeSwiJ1BpSLRWxQXeSkHwmdf', 'TQJzCGFpWWAMvcPHrC3X6jLvEno8bK1Vpz',
    'TQ5ZVjbJwYk6a9n6RrpsYVuFaiVK2r1GAb', 'TB8ahQC5qE3eSFRc3EToNYK9XdZNzmYcq3', 'TQ79PHjcqxun2PWiKDKi55ovGJJtKN2ia8']

let assets = [
    { farmAddress: 'TWoAG3vvhzaLmyNKmhiWAfK29Erezks3e2', tokenAddress: 'TKSLNVrDjb7xCiAySZvjXB9SxxVFieZA7C', exchangeAddress: 'TB4S2pvyX8uQsBPrTDWYCuSDfYSg6tMJm7', url: 'https://bankroll.network/swapx.html', bnkrx: true }, //BNKRX
    { farmAddress: 'TEL2fjud77iieRbieh4XhrSfDVaQhpBUnr', tokenAddress: 'TN3W4H6rK2ce4vX9YnFQHwKENnHjoxb3m9', exchangeAddress: 'TKAtLoCB529zusLfLVkGvLNis6okwjB7jf', bnkrx: true, version: 'v2' }, //BTC v2
    { farmAddress: 'TVLqW3Jktf5BeqQSNai4SBBtfUNm8i2g9o', tokenAddress: 'TR7NHqjeKQxGTCi8q8ZY4pL8otSzgjLj6t', exchangeAddress: 'TQn9Y2khEsLJW1ChVWFMSMeRDow5KcbLSE', bnkrx: true, version: 'v2' }, //USDT v2
    { farmAddress: 'TVp1pxjcRmiQCAQbe8yKX4dtvTX7q65g67', tokenAddress: 'TNUC9Qb1rRpS5CbWLmNMxXBjyFoydXjWFR', exchangeAddress: 'TTnSHzUoho1CU6zFYVzVSCKq8EX8ZddkVv', bnkrx: true, url: 'https://just.tronscan.io/?lang=en-US#/trans', version: 'v3' }, //WTRX v3
    { farmAddress: 'TFvjppxiDpiD2uemmFQyQ7FptcaxxkMHLp', tokenAddress: 'TKfjV9RNKJJCqPvBtK8L7Knykh7DNWvnYt', exchangeAddress: 'TH2mEwTKNgtg8psR6Qx2RBUXZ48Lon1ygu', bnkrx: true, url: 'https://just.tronscan.io/?lang=en-US#/wbtt', version: 'v2' },  //WBTT v2
    { farmAddress: 'TNmqVJ1LFMicRuRRuSD5MjqiMgwKE5Nd2w', tokenAddress: 'TKkeiboTkxXKJpbmVFbv4a8ov5rAfRDMf9', exchangeAddress: 'TUEYcyPAqc4hTg1fSuBCPc18vGWcJDECVw', bnkrx: true, xbase: true, version: 'v2'}, //SUN v2
    { farmAddress: 'TMxfvJ8So9CYRjPrz2yWQTAUMyKxdvtqUM', tokenAddress: 'TVj7RNVHy6thbM7BWdSe9G6gXwKhjhdNZS', exchangeAddress: 'TWBQ6uh7B3jm5o9tiTzfh6dQGp9cxnYKEa', bnkrx: true, xbase: true, version: 'v2', apyAddress: custodyAddress }, //KLV v2
    { farmAddress: 'TFxpkvc1oyGLodQEdwLnQUFSa9phc5YkgZ', tokenAddress: 'TCFLL5dx5ZJdKnWuesXxi1VPwjLVmWZZy9', exchangeAddress: 'TYukBQZ2XXCcRCReAUguyXncCWNY9CEiDQ', bnkrx: true, xbase: true, version: 'v2' }, //JST v2
    { farmAddress: 'TRwuYxsHeVDk1Nc6k6uFPePEXrzVXpZfSr', tokenAddress: 'TLa2f6VPqDgRE67v1736s7bJ8Ray5wYjU7', exchangeAddress: 'TYN6Wh11maRfzgG7n5B6nM5VW1jfGs9chu', bnkrx: true, xbase: true, version: 'v2' }, //WIN v2

    //Retired
    { farmAddress: 'TAkw3L7QdXwFmDNTh9FhewhbqPtQ44pGaK', tokenAddress: 'TNUC9Qb1rRpS5CbWLmNMxXBjyFoydXjWFR', exchangeAddress: 'TTnSHzUoho1CU6zFYVzVSCKq8EX8ZddkVv', url: 'https://just.tronscan.io/?lang=en-US#/trans', version: 'v2' }, //WTRX v2
    { farmAddress: 'TQHgS4uEEBbpDsBPjpDEjiqTSRd4THHqgV', tokenAddress: 'TN3W4H6rK2ce4vX9YnFQHwKENnHjoxb3m9', exchangeAddress: 'TKAtLoCB529zusLfLVkGvLNis6okwjB7jf' }, //BTC
    { farmAddress: 'TSL7HPvjMEs4fzLLFqFW1UxKRHgv1Yj6KM', tokenAddress: 'TR7NHqjeKQxGTCi8q8ZY4pL8otSzgjLj6t', exchangeAddress: 'TQn9Y2khEsLJW1ChVWFMSMeRDow5KcbLSE' }, //USDT
    { farmAddress: 'TL2Nxcqvw7Zm1LtTqPKX1R81Nz3ZcsbZbW', tokenAddress: 'TKkeiboTkxXKJpbmVFbv4a8ov5rAfRDMf9', exchangeAddress: 'TUEYcyPAqc4hTg1fSuBCPc18vGWcJDECVw' }, //SUN
    { farmAddress: 'TT8c62CvFHaGUp8spaW5uYnoZu4y5ugrAp', tokenAddress: 'TVj7RNVHy6thbM7BWdSe9G6gXwKhjhdNZS', exchangeAddress: 'TWBQ6uh7B3jm5o9tiTzfh6dQGp9cxnYKEa', apyAddress: custodyAddress }, //KLV
    { farmAddress: 'TXqizoYBwiMwriPMj1j66p4UP7KZcMquSq', tokenAddress: 'TCFLL5dx5ZJdKnWuesXxi1VPwjLVmWZZy9', exchangeAddress: 'TYukBQZ2XXCcRCReAUguyXncCWNY9CEiDQ' }, //JST,
    { farmAddress: 'TQ4zMrXKmWDyG3EV26pMuToQXsntztDGAX', tokenAddress: 'TLa2f6VPqDgRE67v1736s7bJ8Ray5wYjU7', exchangeAddress: 'TYN6Wh11maRfzgG7n5B6nM5VW1jfGs9chu' }, //WIN 
    { farmAddress: 'TCrGsca96rHeSwiJ1BpSLRWxQXeSkHwmdf', tokenAddress: 'TMwFHYXLJaRUPeW6421aqXL4ZEzPRFGkGT', exchangeAddress: 'TQcia2H2TU3WrFk9sKtdK9qCfkW8XirfPQ' }, //USDJ    
    { farmAddress: 'TQJzCGFpWWAMvcPHrC3X6jLvEno8bK1Vpz', tokenAddress: 'TKfjV9RNKJJCqPvBtK8L7Knykh7DNWvnYt', exchangeAddress: 'TH2mEwTKNgtg8psR6Qx2RBUXZ48Lon1ygu', url: 'https://just.tronscan.io/?lang=en-US#/wbtt' },  //WBTT
    { farmAddress: 'TN6x7WDr8UMkmQQ3ZC1hWZaJhVjjv8bW9Q', tokenAddress: 'TNUC9Qb1rRpS5CbWLmNMxXBjyFoydXjWFR', exchangeAddress: 'TTnSHzUoho1CU6zFYVzVSCKq8EX8ZddkVv', url: 'https://just.tronscan.io/?lang=en-US#/trans' }, //WTRX
    { farmAddress: 'TQ5ZVjbJwYk6a9n6RrpsYVuFaiVK2r1GAb', tokenAddress: 'TBwoSTyywvLrgjSgaatxrBhxt3DGpVuENh', exchangeAddress: 'TMFvnLMR1r1awHVGZsciwP4e3PVD7eiMWe', url: 'https://tron.unifiprotocol.com/' }, //SEED
    { farmAddress: 'TB8ahQC5qE3eSFRc3EToNYK9XdZNzmYcq3', tokenAddress: 'TDyvndWuvX5xTBwHPYJi7J3Yq8pq8yh62h', exchangeAddress: 'TLLBBiX3HqVZZsUQTBXgurA3pdw317PmjM' }, //HT
    { farmAddress: 'TQ79PHjcqxun2PWiKDKi55ovGJJtKN2ia8', tokenAddress: 'TKttnV3FSY1iEoAwB4N52WK2DxdV94KpSd', exchangeAddress: 'TJmTeYk5zmg8pNPGYbDb2psadwVLYDDYDr' } //DICE
]

let farms = {}

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
        console.warn('Could not connect to TronLink.')
        setTimeout(main, 500);
        return;
    } else {

        tronWeb = window.tronWeb

        setNetwork()
        updateReferrer()

        prices = await getPrices()

        fastContract = await tronWeb.contract().at(fastAddress)
        bnkr = await tronWeb.contract().at(bnkrAddress)
        bnkrx = await tronWeb.contract().at(bnkrxAddress)
        bnkrMint = await tronWeb.contract().at(mintAddress)
        buddy = await tronWeb.contract().at(buddyAddress)
        swapx = await tronWeb.contract().at(swapxAddress)
        reader = await tronWeb.contract().at(readerAddress)



        console.log('found tronweb')
        currentAddress = tronWeb.defaultAddress['base58']

        userTag(currentAddress)
        console.log('current address', currentAddress)

        let success = await initFarms()

        if (!success) {
            return
        }
        //First UI render
        try {
            await mainLoop()
        } catch (e) {
            console.error(e)
            showAlert('ERROR LOADING!!!', 'We are having difficulty loading the onchain data. Avoid using Trongrid and use a node like tronstack instead.')
        } finally {
            closeLoading()
        }


        // Schedule loops
        setInterval(watchSelectedWallet, 2000)
        //setInterval(mainLoop, 60 * 1000 * 2) //update every minute


    }

}

async function initAssets() {

    for (i = 0; i < assets.length; i++) {
        let complete = false;

        //skip over retired contracts
        if (!isRetired && closed_assets.includes(assets[i].farmAddress)) {
            continue;
        }

        complete = await loadFarm(assets[i])

        if (!complete) {
            showAlert('POOR CONNECTION!!!', 'We are having difficulty loading onchain info. Avoid using Trongrid and use a node like tronstack instead.')
            $('#load-symbol').text('')
            return
        }

    }
    $('#load-symbol').text('')
}

async function initFarms() {
    for (i = 0; i < assets.length; i++) {
        let asset = assets[i]
        let complete = false;
        let retries = 0;

        //skip over retired contracts
        if (!isRetired && closed_assets.includes(asset.farmAddress)) {
            continue;
        }

        while (!complete && retries < 5) {
            try {
                retries++

                [asset.farm, asset.token] = await Promise.all([tronWeb.contract().at(asset.farmAddress), tronWeb.contract().at(asset.tokenAddress) ])
                //asset.farm = await tronWeb.contract().at(asset.farmAddress)
                //asset.token = await tronWeb.contract().at(asset.tokenAddress)
                asset.symbol = await asset.token.symbol().call()
                $('#load-symbol').text(`Loading ${asset.symbol} contract...`)
                complete = true
            } catch (e) {
                console.warn('init fail', asset.tokenAddress, e.toString())
            }
        }

        if (!complete) {
            showAlert('POOR CONNECTION!!!', 'We are having difficulty loading onchain info. Avoid using Trongrid and use a node like tronstack instead.')
            return false
        }
    }

    return true
}

async function loadFarm(asset) {
    let retries = 0
    let complete = false
    let user = {}

    while (!complete && retries < 5) {
        try {
            retries++
            $('#load-symbol').text(`Loading ${asset.symbol} data...`)
            asset.stats = (asset.stats) ?  asset.stats : await reader.stats(asset.farmAddress, currentAddress).call()
            asset.decimals = (asset.decimals) ? asset.decimals : (await asset.token.decimals().call())
            asset.bonus = asset.stats[0].toNumber()
            asset.players = asset.stats[1].toNumber()
            asset.balance = asset.stats[2].toNumber()
            asset.userBalance = asset.stats[3].toNumber()
            asset.txs = asset.stats[4].toNumber()
            asset.annualReturn = asset.stats[5].toNumber()
            asset.closed = (closed_assets.includes(asset.farmAddress)) ? 1 : 0


            asset.counterBalance = asset.stats[6]

            asset.counterBalanceTrx = asset.stats[7]

            if (asset.apyAddress) {
                user.counterBalance = (user.counterBalance) ? user.counterBalance : (await asset.farm.balanceOfCounter(asset.apyAddress).call())

                user.counterTrx = (user.counterTrx) ? user.counterTrx : (await asset.farm.counterToTrx(user.counterBalance).call()).toNumber()

                user.baseBalance = (user.baseBalance) ? user.baseBalance : (await asset.farm.balanceOfBase(asset.apyAddress).call()).toNumber()
                user.baseTrx = (user.baseTrx) ? user.baseTrx : (await asset.farm.baseToTrx(user.baseBalance).call()).toNumber()
                user.estimate = (user.estimate) ? user.estimate : await asset.farm.dailyEstimate(asset.apyAddress).call()
                asset.apy = (asset.apy) ? asset.apy : 100 * 365 * ((await asset.farm.baseToTrx(user.estimate).call()).toNumber() / (user.counterTrx * 2))
            } else {
                asset.apy = (asset.apy) ? asset.apy : 100 * 365 * ((await asset.farm.baseToTrx(await asset.farm.totalDailyEstimate().call()).call()).toNumber() / (asset.counterBalanceTrx * 2))
            }

            console.log('init load', asset.symbol)

            asset.title = `${asset.symbol} / ${(asset.xbase) ? 'BNKRX':'BNKR'} Saver Pool${(asset['version'] != null) ? ` ${asset.version}` : ''}`
            asset.logo = `/img/farm/${asset.tokenAddress}.png`
            asset.baseLogo = (asset.xbase) ? bnkrx_logo : bnkr_logo
            asset.baseToken = (asset.xbase) ? bnkrx : bnkr
            asset.baseSymbol = (asset.xbase) ? 'BNKRX' : 'BNKR'
            asset.url = (asset['url'] != null) ? asset.url : `https://justswap.org/#/scan/detail/trx/${asset.tokenAddress}`
            farms[asset.farmAddress] = asset

            complete = true
        } catch (e) {
            console.error('init fail', asset.tokenAddress, e.toString())
        }
    }

    return complete
}


async function renderAssets() {

    let cards = []
    let retired = []
    for (i = 0; i < assets.length; i++) {
        let asset = assets[i]

        //skip over retired contracts
        if (!isRetired && closed_assets.includes(asset.farmAddress)) {
            continue;
        }

        let card = `
        <div class="container col-12 col-xl-4 col-lg-4 col-md-4 mb-4">
        <div class="card">
            <div class="card-body">
                <div class="row">
                    <div class="text-center col-12">
                        <h3>${asset.title}</h3>
                        <p class="text-white-50 col-12 mb-1">${formatSun(asset.balance * prices.usdt)} ${(asset.userBalance) ? ` / <span class="text-success">${formatSun(asset.userBalance * prices.usdt)}</span> ` : ''}USDT</p>
                        <img src="${asset.logo}" width="100px" class="m-2"/>
                        <h4><a href="${asset.url}" target="_blank">Get ${asset.symbol}</a></h4>
                        ${(asset.closed == 0) ? `<h2 class="text-success mb-2">${numeral(asset.apy).format()} % APY</h2>` : `<h2 class="text-danger mb-2">Retired</h2>`}
                        <p class="col-12">${asset.bonus}X Bonus</p>
                        <p class="col-12 white">
                            <a class="btn btn-outline-semi-light btn-block default mb-0 mr-4"
                               onclick="showFarm('${asset.farmAddress}');">SELECT</a>
                        </p>
                        <p class="text-white-50 col-12 mb-1"><a target="_blank" href="https://tronscan.io/#/contract/${asset.farmAddress}/code">${shortId(asset.farmAddress, 5)}</a></p>
                    </div>
                </div>
            </div>
        </div>
    </div> 
        `
        if (asset.closed == 0) {
            cards.push(card)
        } else {
            retired.push(card)
        }

    }
    $('#farm-retired').html(retired.join('\n'))
    $('#farm-cards').html(cards.join('\n'))

}

async function isTokenApproved(token, address) {
    let allowance = await token.allowance(currentAddress, address).call()

    if (allowance['remaining'] && allowance['remaining']['_hex'] != null) {
        allowance = tronWeb.toBigNumber(allowance.remaining._hex)
    }
    let balance = (await token.balanceOf(currentAddress).call())
    console.log('isTokenApproved', address, allowance.toString(), balance.toString())
    return allowance.gte(balance)

}
async function approveToken(token, address) {
    try {
        let amount = `0x${tronWeb.toBigNumber(APPROVE_MAX).toString(16)}`
        if (token['MAX_UINT'] != null) {
            amount = await token.MAX_UINT().call()
        }
        let tx = await token.approve(address, amount).send({ callValue: 0, feeLimit: feeLimit })
        //refresh(tx)
    } catch (e) {
        txError(e)
    }
}

async function revokeToken(token, address) {
    try {
        let tx = await token.approve(address, 0).send({ callValue: 0, feeLimit: feeLimit })
        //refresh(tx)
    } catch (e) {
        console.error(e)
    }
}

async function revokeFarm(farmAddress) {
    let asset = farms[farmAddress]

    await revokeToken(asset.token, farmAddress)
    await revokeToken(asset.baseToken, farmAddress)
}

async function approveFarm(farmAddress) {
    let asset = farms[farmAddress]

    await approveToken(asset.token, farmAddress)
    await approveToken(asset.baseToken, farmAddress)
    console.log('approved tokens')
    $('#showFarm').modal('hide')
    showAlert('Approval Processing', 'Farm will be ready for deposits shortly...')
    await timeout(5000)
    hideAlert()

}

async function showFarm(farmAddress) {
    let asset = farms[farmAddress]
    let farm = asset.farm
    let user = {}
    let retries = 0
    let complete = false

    while (!complete && retries < 5) {
        try {
            retries++
            user.tokenApproved = (user.tokenApproved) ? user.tokenApproved : await isTokenApproved(asset.token, asset.farmAddress)
            user.bnkrApproved = (user.bnkrApproved) ? user.bnkrApproved : await isTokenApproved(asset.baseToken, asset.farmAddress)

            user.approved = user.tokenApproved && user.bnkrApproved

            user.divs = (user.divs) ? user.divs : (await farm.availableMint().call()).toNumber()
            user.counterBalance = (user.counterBalance) ? user.counterBalance : (await farm.balanceOfCounter(currentAddress).call())

            user.counterTrx = (user.counterTrx) ? user.counterTrx : (await farm.counterToTrx(user.counterBalance).call()).toNumber()

            user.baseBalance = (user.baseBalance) ? user.baseBalance : (await farm.balanceOfBase(currentAddress).call()).toNumber()
            user.baseTrx = (user.baseTrx) ? user.baseTrx : (await farm.baseToTrx(user.baseBalance).call()).toNumber()
            user.estimate = (user.estimate) ? user.estimate : await farm.dailyEstimate(currentAddress).call()
            user.apy = (user.apy) ? user.apy : 100 * 365 * ((await farm.baseToTrx(user.estimate).call()).toNumber() / (user.counterTrx * 2))
            user.referrals = (user.referrals) ? user.referrals : (await farm.totalReferralOf(currentAddress).call()).toNumber()
            user.txs = (user.txs) ? user.txs : (await farm.txsOf(currentAddress).call()).toNumber()
            user.minted = (user.minted) ? user.minted : (await farm.totalMintedOf(currentAddress).call()).toNumber()
            complete = true
        } catch (e) {
            console.warn('show farm fail', farmAddress, e.toString())
        }
    }

    if (!complete) {
        showAlert('POOR CONNECTION!!!', 'We are having difficulty loading onchain info. Avoid using Trongrid and use a node like tronstack instead.')
        return false
    }


    let tplBody = `
    <div id="topStatsContainer" class="row">
        <h4 class="col-12 text-center pb-2 mb-2"><a href="${(asset.xbase) ? '/swapx.html' : '/swap.html'}" target="_blank" class="mb-2">Get ${(asset.xbase) ? 'BNKRX' : 'BNKR'}</a></h4>
        <div class="container col-6 col-xl-4 col-lg-4 col-md-4  text-center">
            <div class="price-top-part">
                <i class="iconsmind-Coins large-icon"></i>
                <h5 class="mb-0 font-weight-semibold color-theme-1 mb-2">Divs</h5>
                <p class="text-large mb-2 text-white">${formatSun(user.divs)}</p>
                <p class="text-muted text-small">${(asset.bnkrx) ? 'BNKRX' : 'BNKR'} ${user.divs > 0 ? `${approxStr} ${formatSun(user.divs * ((asset.bnkrx) ? prices.bnkrx : prices.bnkr))} USDT` : ''}</p>
            </div>
        </div>

        <div class="container col-6 col-xl-4 col-lg-4 col-md-4  text-center">
            <div class="price-top-part">
                <!--<i class="iconsmind-Astronaut  large-icon"></i>-->
                <img src="${asset.logo}" width="40px"/>
                <h5 class="mb-0 font-weight-semibold color-theme-1 mb-2">Balance</h5>
                <p class="text-large mb-2 text-white">${formatAsset(asset, user.counterBalance)}</p>
                <p class="text-muted text-small">${asset.symbol} ${user.counterTrx > 0 ? `${approxStr} ${formatSun(user.counterTrx * prices.usdt)} USDT` : ''}</p>
            </div>
        </div>

        <div class="container col-6 col-xl-4 col-lg-4 col-md-4  text-center">
            <div class="price-top-part">
                <!--<i class="iconsmind-Astronaut  large-icon"></i>-->
                <img src="${asset.baseLogo}" width="40px"/>
                <h5 class="mb-0 font-weight-semibold color-theme-1 mb-2">Balance</h5>
                <p class="text-large mb-2 text-white">${formatSun(user.baseBalance)}</p>
                <p class="text-muted text-small">${asset.baseSymbol} ${user.baseTrx > 0 ? `${approxStr} ${formatSun(user.baseTrx * prices.usdt)} USDT` : ''}</p>
            </div>
        </div>
        <div class="container col-6 col-xl-4 col-lg-4 col-md-4  text-center">
            <div class="price-top-part">
                <i class="iconsmind-Mine large-icon"></i>
                <h5 class="mb-0 font-weight-semibold color-theme-1 mb-2">Harvested</h5>
                <p class="text-large mb-2 text-white">${formatSun(user.minted)}</p>
                <p class="text-muted text-small">${(asset.bnkrx) ? 'BNKRX' : 'BNKR'}</p>
            </div>
        </div>
      
        <div class="container col-6 col-xl-4 col-lg-4 col-md-4  text-center">
            <div class="price-top-part">
                <i class="iconsmind-Gaugage large-icon"></i>
                <h5 class="mb-0 font-weight-semibold color-theme-1 mb-2">Return</h5>
                <p class="text-large mb-2 text-white">${numeral(user.apy).format('0.000')}</p>
                <p class="text-muted text-small">APY %</p>
            </div>
        </div>

        <div class="container col-6 col-xl-4 col-lg-4 col-md-4  text-center">
            <div class="price-top-part">
                <i class="iconsmind-Handshake large-icon"></i>
                <h5 class="mb-0 font-weight-semibold color-theme-1 mb-2">Rewards</h5>
                <p class="text-large mb-2 text-white">${formatSun(user.referrals)}</p>
                <p class="text-muted text-small">${(asset.bnkrx) ? 'BNKRX' : 'BNKR'}</p>
            </div>
        </div>

        <!--<div class="container col-6 col-xl-4 col-lg-4 col-md-4  text-center">
            <div class="price-top-part">
                <i class="iconsmind-Sync large-icon"></i>
                <h5 class="mb-0 font-weight-semibold color-theme-1 mb-2">Txs</h5>
                <p class="text-large mb-2 text-white">${numeral(user.txs).format('0.000')}</p>
                <p class="text-muted text-small">Count</p>
            </div>
        </div>-->
        ${(asset.closed > 0) ? `<h4 class="col-12 text-danger text-center mb-2 mt-2">This pool is retired, please withdraw</h4>` : ''}
        <p class="col-12 white mb-3">
            ${(user.approved) ?
            `${(asset.closed == 0) ? `<a class="btn btn-outline-semi-light btn-block default mb-0 mr-4"
                onclick="claim('${asset.farmAddress}');">CLAIM</a>
                <a class="btn btn-outline-semi-light btn-block default mb-4 mr-4 "
                onclick="depositFarm('${asset.farmAddress}');">DEPOSIT</a>` : ''}
                <a class="btn btn-outline-semi-light btn-block default mb-0 mr-4"
                onclick="unfreezeFarm('${asset.farmAddress}');">WITHDRAW ALL AND REVOKE</a>` :
            (asset.closed == 0) ? `<a class="btn btn-outline-semi-light btn-block default mb-0 mr-4"
                onclick="approveFarm('${asset.farmAddress}');">APPROVE</a>` : ''}
        </p>
    </div>
    `

    let tplDialog = `
    <div class="modal-dialog" role="document">
        <div class="modal-content">
            <div class="modal-header">
                <h5 class="modal-title">${asset.title}</h5>
                <button type="button" class="close" data-dismiss="modal" aria-label="Close">
                    <span aria-hidden="true">&times;</span>
                </button>
            </div>
            <div class="modal-body">
                ${tplBody}
            </div>
            <div class="modal-footer text-center">
                <button type="button" class="btn btn-outline-semi-light default"
                        data-dismiss="modal">Close
                </button>
            </div>
        </div>
    </div>
    `

    $('#showFarm').html(tplDialog)
    $('#showFarm').modal()
}

async function hideFarm() {
    $('#showFarm').modal('hide')
}

async function unfreezeFarm(farmAddress) {
    hideFarm()

    var tpl = `
    <div class="modal-dialog" role="document">
        <div class="modal-content">
            <div class="modal-header">
                <h5 class="modal-title">Withdraw and Revoke</h5>
                <button type="button" class="close" data-dismiss="modal" aria-label="Close">
                    <span aria-hidden="true">&times;</span>
                </button>
            </div>
            <div class="modal-body">
                <h3>Withdrawing from your farm?</h3>
                <p>Saver pools store unbalanced assets.  If you withdraw your TVL for this farm will be impacted. Do you want to continue?</p>
            </div>
            <div class="modal-footer text-center">
                <button type="button" class="btn btn-outline-semi-light default"
                        data-dismiss="modal" onclick="unfreeze('${farmAddress}');">YES
                </button>
                <button type="button" class="btn btn-outline-semi-light default"
                        data-dismiss="modal">NO
                </button>
            </div>
        </div>
    </div>
    
    `
    $('#unfreezeFarm').html(tpl);
    $('#unfreezeFarm').modal();
}

async function depositFarm(farmAddress) {
    hideFarm()
    var asset = farms[farmAddress]

    var balance = (await asset.token.balanceOf(currentAddress).call())
    var bnkrBalance = (await asset.baseToken.balanceOf(currentAddress).call())

    var tpl = `
    <div class="modal-dialog" role="document">
        <div class="modal-content">
            <div class="modal-header">
                <h5 class="modal-title">${asset.title}</h5>
                <button type="button" class="close" data-dismiss="modal" aria-label="Close">
                    <span aria-hidden="true">&times;</span>
                </button>
            </div>
            <div class="modal-body">
                <h3>Deposit ${asset.symbol} and BNKR</h3>

                    <form>
                        <div class="form-group">
                            <div class="row">
                                <div class="col-3 text-left">
                                    <label for="addAmount">Amount</label>
                                </div>
                                <div class="col-9 text-right">
                                    <label class="text-white">${formatAsset(asset, balance)}</label> ${asset.symbol} &nbsp;<label class="text-white">${formatSun(bnkrBalance)}</label> ${asset.baseSymbol}
                                </div>
                            </div>
                            <input type="number" class="form-control" id="stakeAmount"
                                    aria-describedby="buyTrxHelp"
                                    placeholder="${asset.symbol}">
                            <small  class="form-text text-muted">Estimate <span class="notranslate" id="bnkr-estimate"></span>
                            </small>
                        </div>
                        <p class="text-left">
                            <a class="btn btn-outline-semi-light default mb-0"
                                 onclick="freeze('${asset.farmAddress}');">DEPOSIT</a>
                        </p>
                    </form>
            </div>
            <div class="modal-footer text-center">
                <button type="button" class="btn btn-outline-semi-light default"
                        data-dismiss="modal">Close
                </button>
            </div>
        </div>
    </div>
    `
    $('#depositFarm').html(tpl)

    var buyAmountInp = $('#stakeAmount')
    var bnkrEstimate = $('#bnkr-estimate')

    var calcTokens = async (e) => {
        var amount = Number.parseFloat(buyAmountInp.val().trim())
        //amount = `${amount}e${asset.decimals}`
        amount = tronWeb.toBigNumber(amount * Math.pow(10, asset.decimals))
        console.log('calctokens', amount, `0x${tronWeb.toBigNumber(amount).toString(16)}`)

        amount = (await asset.farm.counterToBaseAmount(`0x${tronWeb.toBigNumber(amount).toString(16)}`).call()).toNumber()

        console.log('stake-amount-estimate', amount)
        bnkrEstimate.html(`${approxStr} ${formatSun(amount)} ${asset.baseSymbol} is required to stake`)
    }



    buyAmountInp.on("change paste keyup", _.debounce(calcTokens, 250))

    $('#depositFarm').modal()
}

function hideDepositFarm() {
    $('#depositFarm').modal('hide')
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
    await initAssets()
    await showUserStats()
    await showStats()
    await renderAssets()
    $('#load-symbol').text('')
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

async function getReferrer() {
    return await buddy.myBuddy().call()
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

function formatAsset(asset, amount) {
    return numeral(amount / (10 ** asset.decimals)).format('0,0.000 a').toUpperCase()
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

        var bandwidth = await tronWeb.trx.getBandwidth()
        $('#getBandwidth').text(numeral(bandwidth).format('0,0 a').toUpperCase())
        var result = await tronWeb.trx.getAccountResources()
        var net = result.EnergyLimit - result.EnergyUsed
        $('#getEnergy').text(numeral(net).format('0,0 a').toUpperCase())
        $('#walletBalanceValue').text(formatSun(await fastContract.balanceOf(currentAddress).call()))
        $('#walletBalanceValue-bnkr').text(formatSun(await bnkr.balanceOf(currentAddress).call()))
        var ref = tronWeb.address.fromHex(await getReferrer())
        ref = (ref == zeroAddress) ? 'None' : ref
        $('#current-buddy').text(ref)
    } catch (e) {
        console.error(e)
    }
}


//[{"_spender":"TQn9Y2khEsLJW1ChVWFMSMeRDow5KcbLSE"},{"_value":1.157920892373162e+77}]

async function showUserStats() {

    await showWalletInfo()

    try {
        var divs = 0, balance = 0, mined = 0, rewards = 0

        for (i = 0; i < assets.length; i++) {
            var asset = assets[i]
            let divsT = 0, balanceT = 0, minedT = 0, rewardsT = 0, temp = 0
            let complete = false
            let retries = 0;

            //skip over retired contracts
            if (closed_assets.includes(asset.farmAddress)) {
                continue;
            }

            while (!complete && retries < 5) {
                try {
                    retries++
                    $('#load-symbol').text(`Loading ${asset.symbol} user data...`)

                    balanceT = (balanceT) ? balanceT : (await asset.farm.balanceOf(currentAddress).call()).toNumber()
                    if (balanceT > 0) {
                        
                        divsT = (divsT) ? divsT : (await asset.farm.availableMint().call()).toNumber()
                        minedT = (minedT) ? minedT : (await asset.farm.totalMintedOf(currentAddress).call()).toNumber()
                        rewardsT = (rewardsT) ? rewardsT : (await asset.farm.totalReferralOf(currentAddress).call()).toNumber()
                    }
                    complete = true
                } catch (e) {
                    console.warn('user fail', asset.tokenAddress, e.toString())
                }
            }

            if (!complete) {
                showAlert('POOR CONNECTION!!!', 'We are having difficulty loading onchain info. Avoid using Trongrid and use a node like tronstack instead.')
                return
            }

            divs += divsT
            balance += balanceT
            mined += minedT
            rewards += rewardsT
        }

        $('#user-divs').text(formatSun(divs))
        $('#user-divs-usdt').html((divs > 0) ? `${approxStr} ${formatSun(divs * prices.bnkrx)} USDT` : '')
        $('#user-balance').text(formatSun(balance))
        $('#user-balance-usdt').html((balance > 0) ? `${approxStr} ${formatSun(balance * prices.usdt)} USDT` : '')
        $('#user-mined').text(formatSun(mined))
        $('#user-rewards').text(formatSun(rewards))
        $('#load-symbol').text('')
    } catch (e) {
        console.error(e)
    }

}

async function showStats() {


    var players = 0, balance = 0, txs = 0, price = 0, annual = 0, mined = 0, difficulty = 0

    for (i = 0; i < assets.length; i++) {
        let asset = assets[i]
        let complete = false
        let retries = 0;

         //skip over retired contracts
         if (!isRetired && closed_assets.includes(asset.farmAddress)) {
            continue;
        }

        while (!complete && retries < 5) {
            try {
                retries++
                if (price == 0) {
                    //Just using a farm to pullthe BNKR price
                    price = (price) ? price : await swapx.getTokenToTrxInputPrice(1e6).call()
                    //price = (price) ? price : (await assets[0].farm.baseToTrx(1e6).call()).toNumber()
                    mined = (mined) ? mined : (await bnkrx.mintedSupply().call()).toNumber()
                    difficulty = (difficulty) ? difficulty : (await bnkrMint.mintingDifficulty().call()).toNumber()
                    difficulty = 365 * 100 / difficulty;

                }
                complete = true
            } catch (e) {
                console.warn('showStats', asset.farmAddress, e.toString())
            }
        }

        if (!complete) {
            showAlert('POOR CONNECTION!!!', 'We are having difficulty loading onchain info. Avoid using Trongrid and use a node like tronstack instead.')
            return
        }

        players += asset.players
        balance += asset.balance
        txs += asset.txs
        annual += asset.annualReturn

    }



    $('#referral').html(`<span class="text-white">Earn 10% on referrals!</span><br><a class="btn btn-outline-semi-light default" onclick="clipCopy('${currentAddress}');">Click to copy your address</a>`)



    $('#totalTxs').text(numeral(txs).format('0,0.000 a').toUpperCase())
    $('#getTotalMembers').text(players)
    $('#contractBalance').text(formatSun(balance))
    $('#contractBalance-usdt').html(`${approxStr} ${formatSun(balance * prices.usdt)} USDT`)
    $('#price').text(formatSun(price))
    $('#price-usdt').html(`${approxStr} ${formatSun(price * prices.usdt)} USDT`)
    $('#yield').text(numeral((annual / balance) * 100).format('0.000') + ' %')
    $('#total-mined').text(formatSun(mined))
    $('#total-mined-usdt').html(`${approxStr} ${formatSun(mined * prices.usdt)} USDT`)
    $('#difficulty').text(`${numeral(difficulty).format('0.000')} %`)
    $('#stage').text(Math.floor(mined / 1e12))

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
    setTimeout(showUserStats, refreshInterval)
}

function txError(error) {
    var msg = error.message
    $('#txErrorId').text(msg)
    $('#txErrorModal').modal()
    setTimeout(showUserStats, refreshInterval)
}

function showAlert(title, msg) {
    $('#alertTitle').text(title)
    $('#alertId').text(msg)
    $('#alertModal').modal()
}

function hideAlert() {
    $('#alertModal').modal('hide')
}

function showError(msg) {
    $('#errorId').text(msg)
    $('#errorModal').modal()
    setTimeout(showUserStats, refreshInterval)
}

function shortId(str, size) {
    return str.substr(0, size) + '...' + str.substr(str.length - size, str.length);
}

/************ Chain Functions *******************/

async function freeze(farmAddress) {

    hideDepositFarm()

    let asset = farms[farmAddress]
    let farm = asset.farm


    var amount = Number.parseFloat($('#stakeAmount').val().trim())
    if (amount <= 0 || !isFinite(amount) || amount === '') {
        $('#invalidAmountModal').modal()
    } else {
        let balance = await asset.token.balanceOf(currentAddress).call()
        amount = tronWeb.toBigNumber(amount * Math.pow(10, asset.decimals))

        //The solution to the decimals bug
        console.log(balance.toString(10), amount.toString(10), amount.gt(balance))
        amount = (amount.gt(balance)) ? balance : amount

        let amount_hex = `0x${tronWeb.toBigNumber(amount).toString(16)}`
        console.log('calctokens', amount, amount_hex)

        var referrer = await getReferrer()

        let available = await farm.baseAvailable(amount_hex).call()

        if (!available) {
            showAlert('Issue with BNKR', `Make sure BNKR is approved and you have a sufficient balance of ${formatSun(reqBnkr)} BNKR`)
            return
        }

        farm.freeze(referrer, amount_hex).send({ callValue: 0, feeLimit: feeLimit }).then(tx => {
            console.log('freeze', amount_hex, tx)
            refresh(tx)
        }).catch(e => {
            txError(e)
        })

    }

    return false;
}

async function unfreeze(farmAddress) {

    $('#unfreezeFarm').modal('hide')

    let asset = farms[farmAddress]
    let farm = asset.farm

    let balance = (await farm.balanceOf(currentAddress).call()).toNumber()

    if (!balance) {
        showAlert('NO BALANCE!!!', 'Slow down there buddy, you need to deposit first!')
        return
    }

    var referrer = await getReferrer()

    let tx
    try {
        tx = await farm.unfreeze(referrer).send({ callValue: 0, feeLimit: feeLimit })
        console.log('unfreeze', tx)
        await revokeFarm(farmAddress)
        refresh(tx)
    } catch (e) {
        txError(e)
    }

    return false

}


async function claim(farmAddress) {

    hideFarm()

    let asset = farms[farmAddress]
    let farm = asset.farm


    if (!((await farm.availableMint().call()).toNumber())) {
        showAlert('NO DIVS!!!', 'Slow down there buddy, you need to have some divs first!')
        return
    }

    var referrer = await getReferrer()
    farm.claim(referrer).send({ callValue: 0, feeLimit: feeLimit }).then(tx => {
        console.log('claim', tx)
        refresh(tx)
    }).catch(e => {
        txError(e)
    })

    return false;
}

async function claimAll() {


    let referrer = await getReferrer()
    let tx = null

    for (i = 0; i < assets.length; i++) {
        var asset = assets[i]
        let divsT = 0
        let complete = false
        let retries = 0

        //skip over retired contracts
        if (!isRetired && closed_assets.includes(asset.farmAddress)) {
            continue;
        }

        while (!complete && retries < 5) {
            try {
                retries++
                divsT = (await asset.farm.availableMint().call()).toNumber()
                if (divsT > 0) {
                    tx = await asset.farm.claim(referrer).send({ callValue: 0, feeLimit: feeLimit })
                    console.log('claim all', tx)
                }
                complete = true
            } catch (e) {
                console.warn('claim all error', asset.tokenAddress, e.toString())
            }
        }

        if (!complete) {
            showAlert('POOR CONNECTION!!!', 'We are having difficulty loading onchain info. Avoid using Trongrid and use a node like tronstack instead.')
            return
        }
    }

    if (tx != null) {
        refresh(tx)
    }



}

async function updateBuddy() {
    var address = cleanAddress($('#recipient').val())




    if (!tronWeb.isAddress(address) || address == currentAddress) {
        $('#invalidAddressModal').modal()
    } else {
        // withdrawals ha now been zerod out and it is safe to transfer
        buddy.updateBuddy(address).send({ callValue: 0, feeLimit: feeLimit }).then(tx => {
            console.log('updateBuddy', address, tx)
            refresh(tx)
        }).catch(e => {
            txError(e)
        })
    }
}

