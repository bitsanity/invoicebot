const {Web3} = require('web3');
const web3 =
  new Web3(new Web3.providers.WebsocketProvider("ws://10.0.0.113:8546"));

const INVOICEBOTSCA = '0x0000000000000000000000000000000000000000'
const INVOICEBOTABI = ''

function answer( response ) {
  let rspobj = exports.RESPONSE = {
    jsonrpc: "2.0",
    result: response,
    id: 0
  }

  console.log( "Content-Type: application/json\r\n\r\n" )
  console.log( JSON.stringify(rspobj) )
  process.exit( 0 )
}

async function respondTo( meth, reqobj ) {
  if (meth === 'gasPrice') {
    answer( "2000000000" )
    //answer( await web3.eth.getGasPrice() )
  }

  if (meth === 'getNonce') {
    answer( "5" )
    //answer( await web3.eth.getTransactionCount(reqobj.address) )
  }

  if (meth === 'getInvoice') {
    answer( {
      id: reqobj.id,
      bref:"SAP 123123",
      owing:"1000.00",
      curr:"USDT" }
    )
  }

  if (meth === 'getEvents') {

    let dt1 = Date.now() - 3 * 24 * 60 * 60 * 1000 // 3 days ago
    let dt2 = Date.now() - 1 * 24 * 60 * 60 * 1000 // 1 days ago
    let dt3 = Date.now() - 6 * 60 * 60 * 1000 // 6 hours ago

    let rspobj = [
      { name: 'NewInvoice', id: reqobj.id, bref: "SAP 123123", tstamp: dt1 },
      { name: 'Receipt', id: reqobj.id, amount: "1000000000", tstamp: dt2 },
      { name: 'PaidInFull', id: reqobj.id, tstamp: dt3 }
    ]

    answer( rspobj )
  }

  if (meth === 'newInvoiceTxo') {
    answer( {
      to: INVOICEBOTSCA,
      value: 0,
      gas: 200000,
      gasPrice: 2000000000,
      data:'0x0123456789abcdef'
    } )
  }

  if (meth === 'payEtherTxo') {
    answer( {
      to: INVOICEBOTSCA,
      value: 1000000000000000000,
      gas: 200000,
      gasPrice: 2000000000,
      data:'0x0123456789abcdef'
    } )
  }

  if (meth === 'approveTokensTxo') {
    answer( {
      to: INVOICEBOTSCA,
      value: 1000000000000000000,
      gas: 200000,
      gasPrice: 2000000000,
      data:'0x0123456789abcdef'
    } )
  }

  if (meth === 'payTokensTxo') {
    answer( {
      to: INVOICEBOTSCA,
      value: 1000000000000000000,
      gas: 200000,
      gasPrice: 2000000000,
      data:'0x0123456789abcdef'
    } )
  }

  if (meth === 'sendRawTx') {
    //reqobj.rawTxHex
    answer( "0xabcdefabcdef0123456789abcdef" )
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
    let errrsp = { error: { code: 500, message: ex.toString() } }
    answer( errrsp )
    process.exit( 1 )
  }

}
