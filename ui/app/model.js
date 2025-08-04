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

  async function getInvoice( invoiceid ) {
    return await doCGI( '/cgi-bin/getInvoice?id=' + invoiceid )
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

  async function payTokensTxo( iid, amt, cur, ethaddr ) {
    return await doCGI(
      '/cgi-bin/payTokensTxo?' + 'id=' + iid + '&amount=' + amt +
      '&curr=' + cur + '&approver=' + ethaddr )
  }

  async function sendRawTx( rawtxhex ) {
    return await doCGI( '/cgi-bin/sendRawTx?' + 'raw=' + rawtxhex )
  }

  return {
    gasPrice:gasPrice,
    getInvoice:getInvoice,
    getEvents:getEvents,
    getNonce:getNonce,
    newInvoiceTxo:newInvoiceTxo,
    payEtherTxo:payEtherTxo,
    approveTokensTxo:approveTokensTxo,
    payTokensTxo:payTokensTxo,
    sendRawTx:sendRawTx
  }

})()

