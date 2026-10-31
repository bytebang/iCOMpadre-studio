// Blocks for the ICOM IC-2730, created by Icom.radio() (see radio/icom.js).
//
// The CI-V commands are described in "IC-2730A/E EXMENU items and CI-V information"
// (datasheets/radio-docs/IC-2730_Web_ENG_0.pdf), the page numbers refer to it.
// The IC-2730 has no CI-V commands for the memory channels or the scan.
//
// Documentation of the blocks: documentation/blocks/radio/ic2730.md

Icom.radio({
  "prefix": "ic2730",
  "name": "IC-2730",
  "address": "90h",
  "reference": "IC-2730A/E EXMENU items and CI-V information",

  // Frequency & Mode
  "frequency": {"page": 26},
  "modes": {"page": 26, "options": [["FM", "0x05, 0x01"], ["FM-N", "0x05, 0x02"], ["AM", "0x02, 0x01"], ["AM-N", "0x02, 0x02"]]},
  "vfo": {"page": 25, "options": [["A band", "0xD0"], ["B band", "0xD1"]]},
  "split": {"page": 25, "options": [["Simplex", "0x10"], ["Duplex -", "0x11"], ["Duplex +", "0x12"]]},

  // Receiver
  "afLevel": {"page": 25},
  "squelchLevel": {"page": 25},
  "squelchStatus": {"page": 25},

  // Transmit
  "transmit": {"page": 25},
  // [name, value to set, highest value of the step]
  "rfPowerSteps": {"page": 26, "options": [["LOW", 42, 84], ["MID", 128, 170], ["HIGH", 213, 255]]},
  "tone": {"page": 26},

  // Meters
  "sMeter": {"page": 25, "s9": 170},

  // Settings
  "functions": {"page": 25, "options": [["Repeater Tone", "0x42"], ["Tone Squelch", "0x43"], ["DTCS", "0x4B"], ["VOX", "0x46"]]}
});
