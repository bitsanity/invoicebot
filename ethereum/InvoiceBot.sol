// SPDX-License-Identifier: MIT
pragma solidity ^0.8.30;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import 'Ownable.sol';

// ---------------------------------------------------------------------------
// Smart Contract to issue invoices and receive payments.
//
// - Underpayment is supported so payers can pay via multiple payments.
// - Overpayment to establish a credit balance is not supported.
// - In addition to Ether, supports any ERC20 token (e.g. USDT, USDC, ... )
// - Invoice must be paid in same currency
// ---------------------------------------------------------------------------

contract InvoiceBot is Ownable {

  event NewInvoice( bytes32 indexed id, string bref );
  event Receipt( bytes32 indexed id, uint256 amount );
  event PaidInFull( bytes32 indexed id );

  struct Invoice {
    bytes32 id;    // a guaranteed unique identifier for the invoice
    string bref;   // business-side reference, keep short as possible
    uint256 owing; // amount still owing in wei or smallest token unit
    string curr;   // "ETH" or symbol with an entry in our currencies mapping
  }

  uint256 counter; // used to create unique id
  mapping( string => address ) public currencies; // symbol => token address
  mapping( bytes32 => Invoice ) public invoices; // Invoice.id => Invoice

  function newInvoice(
      string calldata _bref, uint256 _owing, string calldata _curr )
  external isOwner returns (bytes32 _id) {
    require( currencies[_curr] != address(0), "invalid currency specified" );

    _id = keccak256(abi.encodePacked(_bref, block.timestamp, counter++));

    invoices[_id] = Invoice(
      { id: _id, bref: _bref, owing: _owing, curr: _curr }
    );

    emit NewInvoice( _id, _bref );
  }

  function payEther( bytes32 _id ) external payable returns (uint256 newbal) {
    require( currencies[invoices[_id].curr] == address(1),
             "invoice must expect ETH" );
    require( invoices[_id].owing >= msg.value, "overpayment not supported" );

    invoices[_id].owing -= msg.value;
    newbal = invoices[_id].owing;

    emit Receipt( _id, msg.value );
    if (invoices[_id].owing == 0) {
      emit PaidInFull(_id);
    }
  }

  function payTokens(
    bytes32 _id, string calldata _toksym, uint256 _amount, address _approver )
  external returns (uint256 newbalancetokens) {
    require( currencies[_toksym] > address(1), "invalid token specified" );
    require( _amount <= invoices[_id].owing, "overpayment not supported" );

    IERC20 tok = IERC20( currencies[_toksym] );

    require( tok.allowance(_approver, address(this)) >= _amount,
             "insufficient allowance" );

    require( tok.transferFrom( _approver, address(this), _amount ),
             "transferFrom failed" );

    invoices[_id].owing -= _amount;
    newbalancetokens = invoices[_id].owing;

    emit Receipt( _id, _amount );
    if (0 == invoices[_id].owing) {
      emit PaidInFull(_id);
    }
  }

  constructor() {
    currencies["ETH"] = address(1);
  }

  function addToken( string calldata _symbol, address _erc20tokenaddress )
  external isOwner {
    IERC20 tok = IERC20(_erc20tokenaddress);
    require( tok.totalSupply() > 0, "invalid token address" );
    currencies[_symbol] = _erc20tokenaddress;
  }

  function removeToken( string calldata _symbol ) external isOwner {
    currencies[_symbol] = address(0);
  }

  function sweep( uint256 _amount, address payable _to ) external isOwner {
    _to.transfer( _amount ); // throws on error
  }

  function sweepTokens(
    string calldata _symbol, uint256 _quantity, address _to )
  external isOwner {
    IERC20 tok = IERC20( currencies[_symbol] );
    tok.transfer( _to, _quantity );
  }
}
