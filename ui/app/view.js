var VIEW = (function() {

  var invxid

  const MONTHS =
    ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']

  function formatEvent( evt ) {
    let ts = new Date( evt.tstamp )
    let mon = MONTHS[ts.getUTCMonth()]
    let day = ts.getUTCDate()
    if (day < 10) day = '0' + day
    let hr = ts.getUTCHours()
    if (hr < 10) hr = '0' + hr
    let min = ts.getUTCMinutes()
    if (min < 10) min = '0' + min

    return day + ' ' + mon + ' ' + ts.getUTCFullYear() + ' ' +
           hr + min + 'Z ' + evt.name + ' ' +
        ((evt.name === 'Receipt') ? evt.amount : "")
  }

  function setMainScreen() {
    $( "#accountdiv").hide()
    $( "#QRDialog" ).hide()
    $( "#CameraDialog" ).hide()

    $('#valuesdiv').show()

    if (invxid) {
      $('#eventsdiv').show()
    }
    else {
      $('#eventsdiv').hide()
    }
  }

  async function showInvoice( invoiceid ) {
    invxid = invoiceid

    let invx
    let evts
    let contents

    try {
      invx = await MODEL.getInvoice( invxid )
      $('#idhex').text( invx.id )
      $('#bizref').text( invx.bref )
      $('#amtowing').text( invx.owing )
      $('#currency').html( invx.curr )

      evts = await MODEL.getEvents( invxid )
      contents = ''
      evts.forEach( evt => {
        contents += VIEW.formatEvent( evt ) + '\n'
      } )
      $('#eventsarea').val( contents )
      if (parseInt(invx.owing) > 0) {
        $('#paylabel').html( 'Amount to Pay Now:' )
        $('#payamount').html(
          '<input id=payamtinput type=text value="0.0" />' )

        $('#submitbtn').html( '<button type=button ' +
          'onclick="PubSub.publish(\'PayInvoice\')">' +
          '<img src="/img/' +
          ((invx.curr === 'ETH') ? 'eth.svg' : 'usdt.svg') +
          '" style="vertical-align:middle" height=25 />' +
          '&nbsp;PAY</button>' )
      }
    } catch (err) {
      alert( err.toString() )
      return
    }
  }

  function initNewInvoice( bref, amt, curr ) {
    $('#idhex').text('-new-')
    $('#bizref').html(
      '<input type=text id=bizreftxt value="' + ((bref) ? bref : '') + '" />')
    $('#amtowing').html(
      '<input type=text id=amtowingtxt value="' + ((amt) ? amt : '') + '" />')
    $('#currency').html(
      '<select id=currsel><option>ETH</option><option>USDT</option></select>')
    if (curr) {
      $('#currsel').val( curr ).change()
    }
    $('#submitbtn').html( '<button type=button ' +
      'onclick="PubSub.publish(\'CommitNewInvoice\')">COMMIT</button>' )
  }

  function showAccountsDialog() {
    $('#valuesdiv').hide()
    $( "#accountdiv").show()
  }

  PubSub.subscribe( 'MainScreen', () => { setMainScreen() } )

  PubSub.subscribe( 'ShowInvoice', (invxId) => {
    showInvoice( invxId )
  } )

  PubSub.subscribe( 'NewInvoice', (o) => {
    initNewInvoice( o.bref, o.amount, o.curr )
  } )

  PubSub.subscribe( 'AddressRequired', () => { showAccountsDialog() } )

  PubSub.subscribe( 'TransactionSent', hash => {
    alert( 'Transaction Sent.\n\ntxid: ' + hash )
  } )

  return {
    formatEvent:formatEvent,
  }

})()
