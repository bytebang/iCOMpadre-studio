// Blocks for the ICOM IC-718, created by Icom.radio() (see radio/icom.js).
//
// The CI-V commands are listed in chapter 13 "Control command" of the "IC-718 instruction manual"
// (datasheets/radio-docs/IC-718), the page numbers refer to it. The manual lists the commands without
// their data, so the values used by all Icom radios are used: modes, 20 dB attenuator (20), preamp (00/01),
// levels 0000 ~ 0255 and the S-meter scale (0000 = S0, 0120 = S9, 0241 = S9+60 dB).
//
// Documentation of the blocks: documentation/radio/ic718.md

Icom.radio({
  "prefix": "ic718",
  "name": "IC-718",
  "address": "5Eh",
  "reference": "IC-718 instruction manual, chapter 13",
  "note": "The manual lists the CI-V commands of the IC-718 without their data. The blocks use the values of the other Icom radios " +
          "(e.g. the 20 dB attenuator, the S-meter scale), they have not been tested with an IC-718 yet.",

  // Frequency & Mode
  "frequency": {"page": 58},
  "modes": {"page": 58, "options": [["LSB", "0x00"], ["USB", "0x01"], ["AM", "0x02"], ["CW", "0x03"], ["RTTY", "0x04"],
                                    ["CW-R", "0x07"], ["RTTY-R", "0x08"]]},
  "vfo": {"page": 58, "options": [["VFO A", "0x00"], ["VFO B", "0x01"]]},
  "equalize": {"page": 58, "code": "0xA0", "what": "VFO A and VFO B"},
  "exchange": {"page": 58, "code": "0xB0", "what": "VFO A and VFO B"},
  "split": {"page": 58, "options": [["Split on", "0x01"], ["Split off", "0x00"]]},
  "memory": {"page": 58, "min": 1, "max": 99},
  "scan": {"page": 58, "options": [["stop", "0x00"], ["programmed/memory", "0x01"]]},

  // Receiver
  "afLevel": {"page": 58},
  "rfGain": {"page": 58},
  "squelchLevel": {"page": 58},
  "preamp": {"page": 58, "options": [["OFF", "0x00"], ["ON", "0x01"]]},
  "attenuator": {"page": 58, "options": [["OFF", "0x00"], ["20 dB", "0x20"]]},
  "squelchStatus": {"page": 58},

  // Transmit
  "rfPower": {"page": 58},
  "micGain": {"page": 58},

  // Meters
  "sMeter": {"page": 58, "s9": 120, "plus60": 241},

  // CW & Voice
  "keyingSpeed": {"page": 58},
  "cwPitch": {"page": 58},
  "breakInDelay": {"page": 58},

  // Settings
  "functions": {"page": 58, "options": [["Noise Blanker", "0x22"], ["Noise Reduction", "0x40"], ["Auto Notch", "0x41"],
                                        ["Speech Compressor", "0x44"], ["VOX", "0x46"]]},
  "levels": {"page": 58, "options": ["nr"]}
});
