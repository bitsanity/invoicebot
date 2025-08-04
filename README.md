invoicebot is a component to be included in some website, enabling users to create invoices, view them and pay them.

Syntax:

`/invoice.html` loads the page assuming the user wants to create a new, blank invoice.

`/invoice.html?bref=<reference>&amount=<float>&curr=<symbol>` new invoice, with fields preloaded by the parameters.

`bref` is a reference to the CRM, accounting or some other external business sytem.

`amount` is specified in ether or tokens, not wei and micro-cents. That conversion is done by the cgi scripts.

`curr` is ETH or the symbol for any stablecoin (e.g. USDT, USDC) supported by the invoicebot.

`/invoice.html?id=<invoiceid>`

`id` will be a 32-byte hex string, a unique hash assigned by invoicebot when the invoice was created.

The bot supports **ether** and any **stablecoin** adhering to the **ERC20** standard. The stablecoin address(es) must be configured and can be added any time.

The invoices are stored in a **smart contract**. The contract owner may call the `newInvoice()` function to create a new invoice. Payments are made to that same contract by calling its `payEther()` and `payTokens()` functions.

Multiple payments supported. The smart contract does not depend on msg.sender so invoices can be paid from any address of the user's choice.
