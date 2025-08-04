var QRDIALOG = (function() {

  function showQR( isIdent, qrtxt, descrip ) {
    $( '#ChallengeArea' ).empty()

    if (isIdent)
      $( "#ChallengeLabel" ).html( "<b>ADILOS Identify</b>" );
    else
      $( "#ChallengeLabel" ).html( "<b>ADILOS Sign</b>" );

    if (descrip) $( "#TxnDescription" ).html( descrip )

    $( "#QRDialog" ).show();

    let qrcode = new QRCode( "ChallengeArea", {
      text: qrtxt,
      width: 420,
      height: 420,
      colorDark: isIdent ? "#000000" : "#990000",
      colorLight: "#ffffff",
      correctLevel: QRCode.CorrectLevel.H
    } );
  }

  return {
    showQR:showQR
  };

})();
