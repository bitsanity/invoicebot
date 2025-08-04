const fs = require('fs');
const {Web3} = require('web3');
const web3 =
  new Web3(new Web3.providers.WebsocketProvider("ws://localhost:8545"));

//new Web3(new Web3.providers.WebsocketProvider("ws://10.0.0.113:8546"));

const MYGASPRICE = '' + 4 * 1e9;

BigInt.prototype.toJSON = function() {
  return this.toString();
};

function getABI() {
  return JSON.parse(
    fs.readFileSync('./build/InvoiceBot_sol_InvoiceBot.abi').toString() );
}

function getBinary() {
  var binary =
    fs.readFileSync('./build/InvoiceBot_sol_InvoiceBot.bin').toString();
  if (!binary.startsWith('0x')) binary = '0x' + binary;
  return binary;
}

function getContract(sca) {
  return new web3.eth.Contract( getABI(), sca );
}

function printEvent(evt) {
  console.log( evt.event + ': ' + JSON.stringify(evt.returnValues) + '\n' );
}

function usage() {
  console.log(
    '\nUsage:\n$ node cli.js <acctindex> <SCA> <command> [args]*\n',
    'Commands:\n',
    '\tdeploy\n',
    '\tevents\n',
    '\tbalance\n',
    '\tnewInvoice <bref> <owing> <curr>\n',
    '\tgetInvoice <idhex>\n',
    '\tpayEther <idhex> <amountwei>\n',
    '\tpayTokens <idhex> <symbol> <amount> <appvr>\n',
    '\taddToken <symbol> <tokaddr>\n',
    '\tremoveToken <symbol>\n',
    '\tsweep <wei>\n',
    '\tsweepTokens <symbol> <quant> <toaddr>\n'
  )
}

function deploy( eb ) {
  let con = new web3.eth.Contract( getABI() );
  con.deploy( {data:getBinary(), arguments: []} )
  .send({from: eb, gas: 1500000, gasPrice: MYGASPRICE}, (err, hash) => {
    if (err) {
      console.log( err.toString() )
      process.exit( 1 )
    }
  } )
  .then( (nin) => {
    sca = nin.options.address
    console.log( 'InvoiceBot: ' + sca )
  } )
  .catch( ex => {
    console.log( ex )
    process.exit(1)
  } )
}

async function doCommand( idx, sca, cmd ) {
  let accts = await web3.eth.getAccounts()
  let ebase = accts[idx]

  if (cmd == 'deploy') {
    deploy( ebase )
  }
  else { // begin huge else statement
    let scon = new web3.eth.Contract( getABI(), sca )

    if (cmd == 'events') {
      console.log( 'events:\n' )
      let events = await
        scon.getPastEvents( 'allEvents', {fromBlock:0, toBlock:'latest'} )

      events.forEach( evt => { printEvent(evt) } )
    }
    else if (cmd == 'balance') {
      console.log( '\nPoS Balance ' + await web3.eth.getBalance(sca) + ' wei' )
    }
    else if (cmd == 'newInvoice') {
      let bref = process.argv[5]
      let amnt = parseInt( process.argv[6] )
      let curr = process.argv[7]

      await scon.methods.newInvoice(bref, amnt, curr).send({
        from: ebase,
        gas: 2000000,
        gasPrice: MYGASPRICE
      })
    }
    else if (cmd == 'getInvoice') {
      let id = process.argv[5]
      let invx = await scon.methods.getInvoice(id).call()
      console.log( invx )
    }
    else if (cmd == 'payEther') {
      let id = process.argv[5]
      let wei = process.argv[6]
      await scon.methods.payEther(id).send( {
        from: ebase,
        gas: 2000000,
        gasPrice: MYGASPRICE,
        value: wei
      } )
    }
    else if (cmd == 'payTokens') {
      let id = process.argv[5]
      let curr = process.argv[6]
      let toks = process.argv[7]
      let appvr = process.argv[8]

      await scon.methods.payTokens(id, curr, toks, appvr).send( {
        from: ebase,
        gas: 2000000,
        gasPrice: MYGASPRICE
      } )
    }
    else if (cmd == 'addToken') {
      let curr = process.argv[5]
      let tokaddr = process.argv[6]
      await scon.methods.addToken( curr, tokaddr ).send( {
        from: ebase,
        gas: 2000000,
        gasPrice: MYGASPRICE
      } )
    }
    else if (cmd == 'removeToken') {
      let curr = process.argv[5]
      await scon.methods.removeToken( curr ).send( {
        from: ebase,
        gas: 2000000,
        gasPrice: MYGASPRICE
      } )
    }
    else if (cmd == 'sweep') {
      let amount = process.argv[5]
      let toaddr = process.argv[6]
      await scon.methods.sweep( amount, toaddr ).send( {
        from: ebase,
        gas: 2000000,
        gasPrice: MYGASPRICE
      } )
    }
    else if (cmd == 'sweepTokens') {
      let sym = process.argv[5]
      let quant = process.argv[6]
      let toaddr = process.argv[7]

      await scon.methods.sweepTokens( sym, quant, toaddr).send( {
        from: ebase,
        gas: 2000000,
        gasPrice: MYGASPRICE
      } )
    }
    else {
      usage()
    }
  } // end huge else statement
}

// ===========
// START HERE
// ===========

if (process.argv.length < 5) {
  usage()
  process.exit( 1 )
}

doCommand( parseInt(process.argv[2]), // index of account
           process.argv[3],  // sca
           process.argv[4] ) // command

setTimeout( () => { process.exit(0) }, 2000 )

