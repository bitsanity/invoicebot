var SWEEPVIEW = (function() {

  async function updateBalance() {
    let bal = await MODEL.getBalance( $('#currsel :selected').text() )
    $( '#balance' ).html( bal )
  }

  function setMainScreen() {
    $( "#accountdiv").hide()
    $( "#QRDialog" ).hide()
    $( "#CameraDialog" ).hide()
    $( '#maindiv' ).show()

    updateBalance()
  }

  function showAccountsDialog() {
    $('#maindiv').hide()
    $( "#accountdiv").show()
  }

  PubSub.subscribe( 'CurrSelected', () => { updateBalance() } )
  PubSub.subscribe( 'MainScreen', () => { setMainScreen() } )
  PubSub.subscribe( 'AddressRequired', () => { showAccountsDialog() } )
  PubSub.subscribe( 'TransactionSent', hash => {
    alert( 'Transaction Sent.\n\ntxid: ' + hash )
  } )

  return {
  }

})()


var SWEEPCONTROLLER = (function() {

  const CHAINID = 1 // PROD

  var challB64
  var ethaddr
  var previoustxsent
  var pendingTxnQueue = []

  async function sweep() {
    if (!ethaddr) {
      PubSub.publish( 'AddressRequired' )
      return
    }

    let curr = $('#currsel :selected').text()

    let amt = $('#amount').val()
    if (!amt || amt === '0.0') {
      alert( 'amount must be a number' )
      return
    }

    let toaddr = $('#toaddr').val()
    if (!toaddr) {
      alert( 'A to address is required' )
      return
    }

    let txo, descrip

    if (curr === 'ETH') {
      txo = await MODEL.sweepTxo( amt, toaddr )
      descrip = 'InvoiceBot.sweep( ' + amt + ' eth, ' + toaddr + ' )'
    }
    else {
      txo = await MODEL.sweepTokensTxo( curr, amt, toaddr )
      descrip =
        'InvoiceBot.sweepTokens(' + curr + ', ' + amt + ', ' + toaddr + ' )'
    }

    rollTransaction( txo, descrip )
  }

  function getSignature( hash, descrip ) {
    $( "#accountdiv").hide()
    $( "#maindiv" ).hide();
    QRDIALOG.showQR( false, hash, descrip );
  }

  function respond() {
    $( "#QRDialog" ).hide();
    $( "#CameraDialog" ).show();
    global.startQRScanner();
  }

  function cancelResponse() {
    global.pauseQRScanner();
    PubSub.publish( 'MainScreen' )
  }

  async function qrScanned( rsp ) {
    global.pauseQRScanner();

    let isHex = rsp.startsWith('0x') || /^([0-9a-fA-F]+)$/.test(rsp)

    if (!isHex /* isB64 */ ) {
      // treat as ADILOS Ident response
      let pubkeybytes = ADILOS.validateResponse(rsp, challB64)
      if (!pubkeybytes) {
        alert( 'invalid Ident response' )
        return
      }

      // remove leading 0x04 byte from uncompressed pubkey
      let uncomp = SECP256K1.publicKeyConvert(pubkeybytes, false)
      let hashed = SHA3.keccak256( uncomp.slice(1) )
      ethaddr = '0x' + hashed.slice( -40 )
      $('#ethaddr').val( ethaddr )
      $('#toaddr').val( ethaddr )
    }
    else {
      // treat as an ADILOS sign response, a digital signature to attach to the
      // transaction currently rolling out

      let lc = rsp.toLowerCase();
      if (lc.startsWith('0x')) lc = lc.substring(2)
      let msgarray = UTILS.hexToBytes( lc );
      let recovid = msgarray.pop();
      let dersig = Uint8Array.from( msgarray );
      let sigobj = SECP256K1.signatureImport( dersig );
      let sigR = sigobj.subarray( 0, 32 );
      let sigS = sigobj.subarray( 32, 64 );

      // https://ethereum.stackexchange.com/questions/42455/
      //   during-ecdsa-signing-how-do-i-generate-the-recovery-id
      let sigV = CHAINID * 2 + 35 + recovid;

      let thobj = pendingTxnQueue[0]

      let hextx = {
        nonce: thobj.nonce,
        gasPrice: thobj.gasPrice,
        gasLimit: thobj.gasLimit,
        to: thobj.to,
        value: thobj.value,
        data: thobj.data,
        v: sigV,
        r: sigR,
        s: sigS
      }

      pendingTxnQueue[0] = hextx
    }

    PubSub.publish( 'MainScreen' )
    setTimeout( processQueue, 1000 )
  }

  async function processQueue() {

    if (!ethaddr) {
      PubSub.publish( 'AddressRequired' )
      return
    }

    if (pendingTxnQueue.length == 0) {
      PubSub.publish( 'MainScreen' )
      return
    }

    let thobj = pendingTxnQueue[0]

    if (!thobj.nonce) {
      let nonce = await MODEL.getNonce( ethaddr )
      thobj.nonce = UTILS.toHex(nonce)
    }

    let descrip = thobj.description

    if (thobj.r && thobj.s && thobj.v) {
      let signedtx = ETHJS.Transaction.fromTxData( thobj );
      let serializedtx = '0x' + signedtx.serialize().toString('hex')

      if (serializedtx === previoustxsent) return // prevent repetition
      let txresult = await MODEL.sendRawTx( serializedtx )
      previoustxsent = serializedtx

      pendingTxnQueue.shift() // removes first element
      PubSub.publish( 'TransactionSent', txresult.transactionHash )
      setTimeout( processQueue, 1000 )
      return
    }

    // needs user's sig
    let tx = ETHJS.Transaction.fromTxData( thobj );
    let hashToSign = UTILS.bytesToHex( tx.getMessageToSign() );
    getSignature( hashToSign, descrip )
  }

  async function rollTransaction( txobj, descrip ) {

    let hxo = {
      gasPrice: UTILS.toHex(txobj.gasPrice),
      gasLimit: UTILS.toHex(txobj.gas),
      to: txobj.to,
      value: UTILS.toHex(txobj.value),
      data: txobj.data
    }

    hxo.description = descrip
    pendingTxnQueue.push( hxo )
    processQueue()
  }

  PubSub.subscribe( 'EthereumAddressSpecified', async () => {
    let addr = $('#ethaddr').val()

    if (! /^0x[a-fA-F0-9]{40}$/.test(addr)) {
      alert( 'Invalid Ethereum address' )
      $('#ethaddr').val( "0x..." )
      ethaddr = null
      return
    }

    ethaddr = addr
    processQueue()
  } )

  PubSub.subscribe( 'ADILOSIdent', () => {
    $( "#accountdiv").hide()

    let randSessKey = new Uint8Array(32)
    window.crypto.getRandomValues( randSessKey )

    challB64 = ADILOS.makeChallenge( randSessKey )
    QRDIALOG.showQR(
      true, // isIdent
      challB64,
      'Respond to the challenge below using any ADILOS-compatible ' +
      'smartphone app.' )
  } )

  PubSub.subscribe( 'Sweep', () => { sweep() } )
  PubSub.subscribe( 'ScanResponse', () => { respond() } )
  PubSub.subscribe( 'QRScanned', (scan) => { qrScanned(scan) } )
  PubSub.subscribe( 'CancelResponse', () => { cancelResponse() } )

  return {
  }

})()

