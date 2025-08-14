const fs = require( 'fs' )
const {Web3} = require('web3');

const web3 =
  new Web3(new Web3.providers.WebsocketProvider("ws://localhost:8545"));

// TEST ENVIRONMENT
const INVOICEBOTSCA = "0xe7f1725e7734ce288f8367e1bb143e90bb3f0512"

// PRODUCTION
// const INVOICEBOTSCA = "0x0000000000000000000000000000000000000000"

const INVOICEBOTABI =
[{"inputs":[],"stateMutability":"nonpayable","type":"constructor"},{"anonymous":false,"inputs":[{"indexed":true,"internalType":"bytes32","name":"id","type":"bytes32"},{"indexed":false,"internalType":"string","name":"bref","type":"string"}],"name":"NewInvoice","type":"event"},{"anonymous":false,"inputs":[{"indexed":true,"internalType":"bytes32","name":"id","type":"bytes32"}],"name":"PaidInFull","type":"event"},{"anonymous":false,"inputs":[{"indexed":true,"internalType":"bytes32","name":"id","type":"bytes32"},{"indexed":false,"internalType":"uint256","name":"amount","type":"uint256"}],"name":"Receipt","type":"event"},{"inputs":[{"internalType":"string","name":"_symbol","type":"string"},{"internalType":"address","name":"_erc20tokenaddress","type":"address"}],"name":"addToken","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"address payable","name":"newown","type":"address"}],"name":"chown","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"string","name":"","type":"string"}],"name":"currencies","outputs":[{"internalType":"address","name":"","type":"address"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"bytes32","name":"","type":"bytes32"}],"name":"invoices","outputs":[{"internalType":"bytes32","name":"id","type":"bytes32"},{"internalType":"string","name":"bref","type":"string"},{"internalType":"uint256","name":"owing","type":"uint256"},{"internalType":"string","name":"curr","type":"string"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"string","name":"_bref","type":"string"},{"internalType":"uint256","name":"_owing","type":"uint256"},{"internalType":"string","name":"_curr","type":"string"}],"name":"newInvoice","outputs":[{"internalType":"bytes32","name":"_id","type":"bytes32"}],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"bytes32","name":"_id","type":"bytes32"}],"name":"payEther","outputs":[{"internalType":"uint256","name":"newbal","type":"uint256"}],"stateMutability":"payable","type":"function"},{"inputs":[{"internalType":"bytes32","name":"_id","type":"bytes32"},{"internalType":"string","name":"_toksym","type":"string"},{"internalType":"uint256","name":"_amount","type":"uint256"},{"internalType":"address","name":"_approver","type":"address"}],"name":"payTokens","outputs":[{"internalType":"uint256","name":"newbalancetokens","type":"uint256"}],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"string","name":"_symbol","type":"string"}],"name":"removeToken","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"uint256","name":"_amount","type":"uint256"},{"internalType":"address payable","name":"_to","type":"address"}],"name":"sweep","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"string","name":"_symbol","type":"string"},{"internalType":"uint256","name":"_quantity","type":"uint256"},{"internalType":"address","name":"_to","type":"address"}],"name":"sweepTokens","outputs":[],"stateMutability":"nonpayable","type":"function"}]

// include the IERC20Metadata functions in the abi
const IERC20ABI =
[{"inputs":[{"internalType":"uint256","name":"initialSupply","type":"uint256"},{"internalType":"string","name":"tokenName","type":"string"},{"internalType":"uint8","name":"decimalUnits","type":"uint8"},{"internalType":"string","name":"tokenSymbol","type":"string"}],"stateMutability":"nonpayable","type":"constructor"},{"anonymous":false,"inputs":[{"indexed":false,"internalType":"address","name":"to","type":"address"},{"indexed":false,"internalType":"uint256","name":"amt","type":"uint256"}],"name":"Transfer","type":"event"},{"inputs":[{"internalType":"address","name":"owner","type":"address"},{"internalType":"address","name":"delegate","type":"address"}],"name":"allowance","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"address","name":"spender","type":"address"},{"internalType":"uint256","name":"amount","type":"uint256"}],"name":"approve","outputs":[{"internalType":"bool","name":"","type":"bool"}],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"address","name":"account","type":"address"}],"name":"balanceOf","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"address","name":"","type":"address"}],"name":"balances","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"decimals","outputs":[{"internalType":"uint8","name":"","type":"uint8"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"name","outputs":[{"internalType":"string","name":"","type":"string"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"address","name":"_acct","type":"address"},{"internalType":"uint256","name":"_units","type":"uint256"}],"name":"setBalance","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[],"name":"symbol","outputs":[{"internalType":"string","name":"","type":"string"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"totalSupply","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"address","name":"recipient","type":"address"},{"internalType":"uint256","name":"amount","type":"uint256"}],"name":"transfer","outputs":[{"internalType":"bool","name":"","type":"bool"}],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"address","name":"owner","type":"address"},{"internalType":"address","name":"buyer","type":"address"},{"internalType":"uint256","name":"amount","type":"uint256"}],"name":"transferFrom","outputs":[{"internalType":"bool","name":"","type":"bool"}],"stateMutability":"nonpayable","type":"function"}]

BigInt.prototype.toJSON = function () {
  return Number(this);
};

var INVOICEBOT = new web3.eth.Contract( INVOICEBOTABI, INVOICEBOTSCA )
var LOG = fs.createWriteStream( './log.txt', {flags:'a'} )

function log( msg ) {
  LOG.write( '' + Date.now() + ' ' + msg + '\n' )
}

function error( _code, _message ) {
  let rspobj = {
    jsonrpc: "2.0",
    error: {
      code: _code,
      message: _message
    },
    id: 0
  }

  console.log( "Content-Type: application/json\r\n\r\n" )
  console.log( JSON.stringify(rspobj) )
  process.exit( 0 )
}

function answer( response ) {

  let rspobj = {
    jsonrpc: "2.0",
    result: response,
    id: 0
  }

  console.log( "Content-Type: application/json\r\n\r\n" )
  console.log( JSON.stringify(rspobj) )
  process.exit( 0 )
}

async function respondTo( meth, reqobj ) {
  log( 'request: ' + meth + ' ' + JSON.stringify(reqobj,null,2) )

  let gpx = await web3.eth.getGasPrice()

  if (meth === 'gasPrice') {
    answer( gpx )
  }

  if (meth === 'getNonce') {
    answer( await web3.eth.getTransactionCount(reqobj.address) )
  }

  if (meth === 'getBalance') {
    if (reqobj.curr === 'ETH') {
      let it = await web3.eth.getBalance( INVOICEBOTSCA )
      answer( await web3.utils.fromWei(it, 'ether') )
    } else {
      let toksca = await INVOICEBOT.methods.currencies(reqobj.curr).call()
      let tokCon = new web3.eth.Contract( IERC20ABI, toksca )
      let dec = parseInt( await tokCon.methods.decimals().call() )
      let it =   BigInt(await tokCon.methods.balanceOf(INVOICEBOTSCA).call())
               / BigInt(Math.pow(10, dec))
      answer( it )
    }
  }

  if (meth === 'getInvoice') {
    let invx = await INVOICEBOT.methods.invoices('' + reqobj.id).call()
    if (invx.curr === 'ETH') {
      invx.owing = web3.utils.fromWei( invx.owing, 'ether' )
    }
    else {
      let toksca = await INVOICEBOT.methods.currencies(invx.curr).call()
      let tokCon = new web3.eth.Contract( IERC20ABI, toksca )
      let dec = parseInt( await tokCon.methods.decimals().call() )
      invx.owing = invx.owing / BigInt(Math.pow(10, dec))
    }

    answer( invx )
  }

  if (meth === 'allInvoices') {
    let invxEvts = await INVOICEBOT.getPastEvents( 'allEvents', {
      fromBlock: 0,
      toBlock: 'latest',
    } )

    let invoices = {}
    for( let ii = 0; ii < invxEvts.length; ii++ ) {
      let evtname = invxEvts[ii].event
      let evt = invxEvts[ii].returnValues
      let invx = await INVOICEBOT.methods.invoices('' + evt.id).call()

      if (evtname === 'NewInvoice') {
        if (!invoices[invx.id]) invoices[invx.id] = {}

        invoices[invx.id].created =
          (await web3.eth.getBlock(invxEvts[ii].blockNumber)).timestamp

        if ( invx.curr === 'ETH' ) {
          invoices[invx.id].owing = web3.utils.fromWei( invx.owing, 'ether' )
        }
        else {
          let toksca =
            await INVOICEBOT.methods.currencies( invx.curr ).call()
          let tokCon = new web3.eth.Contract( IERC20ABI, toksca )
          let dec = parseInt( await tokCon.methods.decimals().call() )
          invoices[invx.id].owing = invx.owing / BigInt(Math.pow(10, dec))
        }

        invoices[invx.id].bref = invx.bref
        invoices[invx.id].curr = invx.curr
      }
    }

    answer( invoices )
  }

  if (meth === 'getEvents') {
    let invxs = await INVOICEBOT.getPastEvents( 'allEvents', {
      fromBlock: 0,
      toBlock: 'latest',
      filter: { id: '' + reqobj.id } } )

    if (null == invxs) invxs = []

    for (let ii = 0; ii < invxs.length; ii++) {
      invxs[ii].tstamp =
        (await web3.eth.getBlock(invxs[ii].blockNumber)).timestamp
    }

    answer( invxs )
  }

  if (meth === 'sendRawTx') {
    let ans = await web3.eth.sendSignedTransaction(reqobj.raw)
    if (!ans) {
      error( 500, 'failed to send raw transaction' )
    }

    answer( ans )
  }

  if (meth === 'newInvoiceTxo') {
    let amt

    if (reqobj.curr === 'ETH') {
      amt = '' + reqobj.amount * Math.pow( 10, 18 )
    }
    else {
      let tokensca = await INVOICEBOT.methods.currencies( reqobj.curr ).call()
      let tokenContract = new web3.eth.Contract( IERC20ABI, tokensca )
      let decimals = parseInt( await tokenContract.methods.decimals().call() )
      amt = reqobj.amount * Math.pow( 10, decimals )
    }

    let calldata = INVOICEBOT.methods.newInvoice(
      reqobj.bref, amt, reqobj.curr ).encodeABI()

    answer( {
      to: INVOICEBOTSCA,
      value: 0,
      gas: 200000,
      gasPrice: gpx,
      data: calldata
    } )
  }

  if (meth === 'payEtherTxo') {
    let wei = await web3.utils.toWei( reqobj.amount, 'ether' )
    let calldata = INVOICEBOT.methods.payEther( reqobj.id ).encodeABI()
    answer( {
      to: INVOICEBOTSCA,
      value: wei,
      gas: 200000,
      gasPrice: gpx,
      data: calldata
    } )
  }

  if (meth === 'sweepTxo') {
    let wei = await web3.utils.toWei( reqobj.amount, 'ether' )
    let calldata =
      INVOICEBOT.methods.sweep( wei, reqobj.toaddr ).encodeABI()
    answer( {
      to: INVOICEBOTSCA,
      value: 0,
      gas: 50000,
      gasPrice: gpx,
      data: calldata
    } )
  }

  // if we haven't returned by this point, we have a curr parameter and will
  // need the token contract to ask it how many decimals it has

  let tokensca = await INVOICEBOT.methods.currencies( reqobj.curr ).call()
  let tokenContract = new web3.eth.Contract( IERC20ABI, tokensca )
  let decimals = parseInt( await tokenContract.methods.decimals().call() )
  let tokenunits = reqobj.amount * Math.pow( 10, decimals )

  if (meth === 'approveTokensTxo') {
    // The caller will be the approver, InvoiceBot will be the spender
    let calldata =
      tokenContract.methods.approve( INVOICEBOTSCA, tokenunits ).encodeABI()

    answer( {
      to: tokensca,
      value: 0,
      gas: 100000,
      gasPrice: gpx,
      data: calldata
    } )
  }

  if (meth === 'payTokensTxo') {
    let calldata = INVOICEBOT.methods.payTokens(
      '' + reqobj.id, reqobj.curr, tokenunits, reqobj.approver ).encodeABI()

    answer( {
      to: INVOICEBOTSCA,
      value: 0,
      gas: 200000,
      gasPrice: gpx,
      data: calldata
    } )
  }

  if (meth === 'sweepTokensTxo') {
    let calldata = INVOICEBOT.methods.sweepTokens(
      reqobj.curr, tokenunits, reqobj.toaddr ).encodeABI()

    answer( {
      to: INVOICEBOTSCA,
      value: 0,
      gas: 70000,
      gasPrice: gpx,
      data: calldata
    } )
  }
}

function handlePost() {
  process.stdin.on( 'data', data => {
    let body = JSON.parse( data.toString() )
    respondTo( meth, body )
  } )
}

module.exports.doCGI = function( cgimeth ) {

  try {
    if (process.env.REQUEST_METHOD === 'GET') {
      let reqobj = {}
      let query = process.env.QUERY_STRING

      if (query) {
        let args = query.split('&')

        for ( var ii = 0; ii < args.length; ii++ ) {
          let arg = args[ii].split('=')
          let argname = arg[0], argval = arg[1]
          reqobj[ argname ] = argval
        }
      }

      respondTo( cgimeth, reqobj )
    }
    else if (process.env.REQUEST_METHOD === 'POST') {
      handlePost( cgimeth )
    }
    else
      throw "unrecognized REQUEST_METHOD: " + process.env.REQUEST_METHOD
  }
  catch( ex ) {
    error( 500, ex.toString() )
  }

}
