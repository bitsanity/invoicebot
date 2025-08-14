var MODEL = (function() {

  async function doCGI( url ) {
    let cgi = await fetch( url )
    if (!cgi || !cgi.ok) throw 'cgi call failed: ' + url
    let jsn = await cgi.json()
    return jsn.result
  }

  async function gasPrice() {
    return await doCGI( '/cgi-bin/gasPrice' )
  }

  async function getBalance( curr ) {
    return await doCGI( '/cgi-bin/getBalance?curr=' + curr )
  }

  async function getInvoice( invoiceid ) {
    return await doCGI( '/cgi-bin/getInvoice?id=' + invoiceid )
  }

  async function allInvoices() {
    return await doCGI( '/cgi-bin/allInvoices' )
  }

  async function getEvents( invoiceid ) {
    return await doCGI( '/cgi-bin/getEvents?id=' + invoiceid )
  }

  async function getNonce( address ) {
    return await doCGI( '/cgi-bin/getNonce?address=' + address )
  }

  async function newInvoiceTxo( bref, amount, curr ) {
    return await doCGI( '/cgi-bin/newInvoiceTxo?' +
      'bref=' + bref + '&amount=' + amount + '&curr=' + curr )
  }

  async function payEtherTxo( iid, amt ) {
    return await doCGI(
      '/cgi-bin/payEtherTxo?' + 'id=' + iid + '&amount=' + amt )
  }

  async function approveTokensTxo( amt, cur ) {
    return await doCGI(
      '/cgi-bin/approveTokensTxo?amount=' + amt + '&curr=' + cur )
  }

  async function payTokensTxo( iid, amt, cur, approver ) {
    return await doCGI(
      '/cgi-bin/payTokensTxo?' + 'id=' + iid + '&amount=' + amt +
      '&curr=' + cur + '&approver=' + approver )
  }

  async function sweepTxo( amt, toaddr ) {
    return await doCGI(
      '/cgi-bin/sweepTxo?&amount=' + amt + '&toaddr=' + toaddr )
  }

  async function sweepTokensTxo( curr, amt, toaddr ) {
    return await doCGI(
      '/cgi-bin/sweepTokensTxo?curr=' + curr +
      '&amount=' + amt +
      '&toaddr=' + toaddr )
  }

  async function sendRawTx( rawtxhex ) {
    return await doCGI( '/cgi-bin/sendRawTx?' + 'raw=' + rawtxhex )
  }

  return {
    gasPrice:gasPrice,
    getBalance:getBalance,
    getInvoice:getInvoice,
    getEvents:getEvents,
    allInvoices:allInvoices,
    getNonce:getNonce,
    newInvoiceTxo:newInvoiceTxo,
    payEtherTxo:payEtherTxo,
    approveTokensTxo:approveTokensTxo,
    payTokensTxo:payTokensTxo,
    sweepTxo:sweepTxo,
    sweepTokensTxo:sweepTokensTxo,
    sendRawTx:sendRawTx
  }

})()

