invoicebot is a component to be included in an e-commerce website, enabling the site to create invoices, and anybody to view and pay them.

See the **demonstration** on [YouTube](https://youtu.be/h2BUB_4H_YY)

An invoicebot deployment includes:
- a smart contract, "InvoiceBot" deployed on Ethereum or EVM-compatible blockchain
- an html web page
- a css file so one can style the page according to the host site
- a javascript application running within the web page
- cgi-bin scripts that connect to an external web3 service provider

User interaction requires the free [SIMPLETH](https://github.com/bitsanity/simpleth) mobile app or any similar app that speaks the [ADILOS](https://github.com/bitsanity/ADILOS) protocol.

NOTE: The web server's `httpd.conf` file must include a MIME type definition `.js:text/javascript` to override the default `application/octet-stream`

NOTE: The web app requires use of the camera. Some browsers prompt the user to allow camera access, other browsers may behave differently.


**Syntax**:

`/invoice.html` loads the page assuming the user wants to create a new, blank invoice.

`/invoice.html?bref=<ref>&amount=<float>&curr=<symbol>` for a new invoice with preloaded fields.

parameters:
- **bref** is a reference to an external business sytem in order to tie this invoice to an entry in that system (what is this payment for).
- **amount** is floating-point in ether or tokens, not integer wei and microcents.
- **curr** is ETH or the symbol for any stablecoin (e.g. USDT, USDC) supported by the invoicebot.

`/invoice.html?id=<invoiceid>` to view the invoice and all associated events, and to pay the invoice.

parameters:
- id will be a 32-byte hex string, a unique hash assigned by invoicebot when the invoice was created.


**Use**:

The bot supports **ether** and **stablecoins** adhering to the **ERC20** standard. The stablecoin address(es) must be configured and can be added any time.

The invoices are stored in a **smart contract**. The contract owner may call the `newInvoice()` function to create a new invoice. Payments are made to that same contract by calling its `payEther()` and `payTokens()` functions.

Multiple payments supported, no interest calculated.

The smart contract does not depend on `msg.sender` so invoices can be paid from any address of the user's choice.
