// Blocks for the ICOM IC-A120E (airband), created by Icom.radio() (see radio/icom.js).
//
// The CI-V commands are described in chapter 10 "CI-V-Informationen" of the German "IC-A120E Bedienungsanleitung"
// (datasheets/radio-docs/IC-A120E_IM_D_full_20170920.pdf), the page numbers refer to it.
//
// Documentation of the blocks: documentation/blocks/radio/ica120e.md

Icom.radio({
  "prefix": "ica120e",
  "name": "IC-A120E",
  "address": "92h",
  "reference": "IC-A120E Bedienungsanleitung (German), chapter 10",

  // Frequency & Mode
  "frequency": {"page": "10-3"},
  "modes": {"page": "10-3", "options": [["AM", "0x02, 0x01"], ["AM-N", "0x02, 0x02"]]},

  // Receiver
  "afLevel": {"page": "10-3"},
  "squelchLevel": {"page": "10-4"},
  // 15 01 is listed as "write", the squelch status is read with 15 05
  "squelchStatus": {"page": "10-3", "sub": "0x05"},

  // Transmit
  "transmit": {"page": "10-3"},

  // Settings
  "power": {"page": "10-3"}
});
