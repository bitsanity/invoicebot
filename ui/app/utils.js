var UTILS = (function() {

  function hexToBytes(hex) {
    let bytes = [];
    for (let c = 0; c < hex.length; c += 2)
      bytes.push(parseInt(hex.substr(c, 2), 16));
    return bytes;
  }

  function bytesToHex(bytes) {
    let hex = [];
    for (let i = 0; i < bytes.length; i++) {
      let current = bytes[i] < 0 ? bytes[i] + 256 : bytes[i];
      hex.push((current >>> 4).toString(16));
      hex.push((current & 0xF).toString(16));
    }
    return hex.join("");
  }

  function toHex( any ) {
    let result = null

    if (typeof any === "number")
      result = any.toString(16)
    else if (typeof any === "string") {
      let bi = BigInt(any)
      result = bi.toString(16)
    }
    else if (typeof any === "bigint") {
      result = any.toString(16)
    }
    else if (typeof any === "boolean") {
      result = (any) ? "0x01" : "0x00"
    }
    else if (typeof any === "object") {
      if (any instanceof Uint8Array) {
        result = Array.prototype.map.call(any, function(abyte) {
          return ('0' + (abyte & 0xFF).toString(16)).slice(-2);
        }).join('');
      }
    }
    else throw 'no idea how to hex: ' + any

    return '0x' + result
  }

  return {
    hexToBytes:hexToBytes,
    bytesToHex:bytesToHex,
    toHex:toHex
  };

})();

