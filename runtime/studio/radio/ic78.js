// Blocks for the ICOM IC-78, created by Icom.radio() (see radio/icom.js).
//
// The CI-V commands are listed in chapter 8 "Control command" of the "IC-78 instruction manual"
// (datasheets/radio-docs/IC-78), the page numbers refer to it. The manual lists the commands without
// their data, so the values used by all Icom radios are used: modes, 20 dB attenuator (20), preamp (00/01),
// levels 0000 ~ 0255 and the S-meter scale (0000 = S0, 0120 = S9, 0241 = S9+60 dB).
// The IC-78 has no CI-V commands for the VFO, split, transmitting or the RF power.
//
// Documentation of the blocks: documentation/radio/ic78.md

Icom.radio({
  "prefix": "ic78",
  "name": "IC-78",
  "address": "62h",
  "reference": "IC-78 instruction manual, chapter 8",
  "note": "The manual lists the CI-V commands of the IC-78 without their data. The blocks use the values of the other Icom radios " +
          "(e.g. the 20 dB attenuator, the S-meter scale), they have not been tested with an IC-78 yet.",

  // Frequency & Mode
  "frequency": {"page": 41},
  "modes": {"page": 41, "options": [["LSB", "0x00"], ["USB", "0x01"], ["AM", "0x02"], ["CW", "0x03"], ["RTTY", "0x04"],
                                    ["CW-R", "0x07"], ["RTTY-R", "0x08"]]},
  "memory": {"page": 41, "min": 1, "max": 99},
  "scan": {"page": 41, "options": [["stop", "0x00"], ["memory", "0x01"]]},

  // Receiver
  "afLevel": {"page": 41},
  "rfGain": {"page": 41},
  "squelchLevel": {"page": 41},
  "preamp": {"page": 41, "options": [["OFF", "0x00"], ["ON", "0x01"]]},
  "attenuator": {"page": 41, "options": [["OFF", "0x00"], ["20 dB", "0x20"]]},
  "squelchStatus": {"page": 41},

  // Meters
  "sMeter": {"page": 41, "s9": 120, "plus60": 241},

  // Settings
  "functions": {"page": 41, "options": [["Noise Blanker", "0x22"], ["Speech Compressor", "0x44"]]}
});
