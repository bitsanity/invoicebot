var CONTROLLER = (function() {

  const CHAINID = 1 // PROD

  var challB64
  var ethaddr, nonce
  var previoustxsent
  var pendingTxnQueue = []

  async function commitNewInvoice() {
    let brf = $('#bizreftxt').val()
    let amt = parseFloat( $('#amtowingtxt').val() )
    let cur = $('#currsel :selected').text()

    if (!brf) {
      alert( 'A business reference is required' )
      return
    }
    if (!amt || amt == 0.0) {
      alert( 'amount must be a number' )
      return
    }

    let txo = await MODEL.newInvoiceTxo( brf, amt, cur )
    rollTransaction( txo,
      'InvoiceBot.newInvoice(' + brf + ', ' + amt + ', ' + cur + ')' )
    $('#bizreftxt').val( '' )
    $('#amtowingtxt').val( '' )
  }

  function getSignature( hash, descrip ) {
    $( "#accountdiv").hide()
    $( "#valuesdiv" ).hide();
    $( "#eventsdiv" ).hide();
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

  // rsp must be either:
  // - an ADILOS Ident response in B64, or
  // - an ADILOS Sign response in hexadecimal
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

      // Try to get the nonce for this address from blockchain
      try {
        nonce = await MODEL.getNonce( ethaddr )
      } catch (err) {
        alert( err.toString() )
        nonce = null
      }
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

    if (!ethaddr || null == nonce) {
      PubSub.publish( 'AddressRequired' )
      return
    }

    if (pendingTxnQueue.length == 0) {
      PubSub.publish( 'MainScreen' )
      return
    }

    let thobj = pendingTxnQueue[0]

    if (!thobj.nonce) thobj.nonce = UTILS.toHex(nonce)

    let descrip = thobj.description

    if (thobj.r && thobj.s && thobj.v) {
      let signedtx = ETHJS.Transaction.fromTxData( thobj );
      let serializedtx = '0x' + signedtx.serialize().toString('hex')

      if (serializedtx === previoustxsent) return // prevent repetition
      let txresult = await MODEL.sendRawTx( serializedtx )
      previoustxsent = serializedtx
      nonce++

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

  PubSub.subscribe( 'CommitNewInvoice', () => {
    commitNewInvoice()
  } )

  PubSub.subscribe( 'EthereumAddressSpecified', async () => {
    let addr = $('#ethaddr').val()

    try {
      if (! /^0x[a-fA-F0-9]{40}$/.test(addr)) throw 'Invalid Ethereum address'
      nonce = await MODEL.getNonce( $('#ethaddr').val() )
    }
    catch (err) {
      alert( err.toString() )
      $('#ethaddr').val( "0x..." )
      ethaddr = null
      return
    }

    ethaddr = addr
    processQueue()
  } )

  PubSub.subscribe( 'ADILOSIdent', () => {
    $( "#accountdiv").hide()
    $( "#eventsdiv").hide()

    let randSessKey = new Uint8Array(32)
    window.crypto.getRandomValues( randSessKey )

    challB64 = ADILOS.makeChallenge( randSessKey )
    QRDIALOG.showQR(
      true, // isIdent
      challB64,
      'Respond to the challenge below using any ADILOS-compatible ' +
      'smartphone app.' )
  } )

  PubSub.subscribe( 'PayInvoice', async () => {
    if (!ethaddr) {
      alert( 'Please identify your sending address first and try again.' )
      PubSub.publish( 'AddressRequired' )
      return
    }

    let iid = $('#idhex').html()
    let amt = $('#payamtinput').val()
    let invx = await MODEL.getInvoice( iid )
    let cur = invx.curr

    let amtnum = Number.parseFloat( amt )
    if (!amtnum || amtnum <= 0.0) {
      alert( 'Amount must be a positive number' )
      return
    }

    if (cur === 'ETH') {
      // Can't just send ether because the contract wouldn't know which invoice
      // its for. Include ether payment in the call to InvoiceBot.payEther()

      let txo = await MODEL.payEtherTxo( iid, amt )
      rollTransaction( txo, 'InvoiceBot.payEther( ' + amt + ' ether )' )
    }
    else {
      // Token - first we help the user do a token.approve() call then
      //         do a InvoiceBot.payTokens() call to tell the smart contract
      //         to do a token.transferFrom()

      let txo = await MODEL.approveTokensTxo( amt, cur )
      rollTransaction( txo,
        'ERC20Token(' + cur + ').approve( spender=InvoiceBot, amount= ' + amt +
        ' as units )' )

      let txo2 = await MODEL.payTokensTxo( iid, amt, cur, ethaddr )

      rollTransaction( txo2,
        'InvoiceBot.payTokens( amount: ' + amt + ' ' + cur +
        ', approver=' + ethaddr + '\n)' )
    }

    $('#payamtinput').val( '' )
    processQueue()
  } )

  PubSub.subscribe( 'ScanResponse', () => { respond() } )
  PubSub.subscribe( 'QRScanned', (scan) => { qrScanned(scan) } )
  PubSub.subscribe( 'CancelResponse', () => { cancelResponse() } )

  return {
    respond:respond,
    cancelResponse:cancelResponse,
    qrScanned:qrScanned,
    processQueue:processQueue,
    rollTransaction:rollTransaction
  };

})();

