// Blocks for the ICOM IC-9700, created by Icom.radio() (see radio/icom.js).
//
// The CI-V commands are described in the "IC-9700 CI-V reference guide" (datasheets/radio-docs/IC-9700),
// the page numbers refer to it.
//
// Documentation of the blocks: documentation/blocks/radio/ic9700.md

Icom.radio({
  "prefix": "ic9700",
  "name": "IC-9700",
  "address": "A2h",
  "reference": "IC-9700 CI-V reference guide",

  // Frequency & Mode
  "frequency": {"page": 13},
  "modes": {"page": 13, "options": [["LSB", "0x00"], ["USB", "0x01"], ["AM", "0x02"], ["CW", "0x03"], ["RTTY", "0x04"],
                                    ["FM", "0x05"], ["CW-R", "0x07"], ["RTTY-R", "0x08"], ["DV", "0x17"], ["DD", "0x22"]]},
  "dataMode": {"page": 11},
  "tuningSteps": {"page": 4, "options": [["OFF (10Hz or 1Hz)", "0x00"], ["100Hz", "0x01"], ["500Hz", "0x02"], ["1kHz", "0x03"],
                                         ["5kHz", "0x04"], ["6.25kHz", "0x05"], ["10kHz", "0x06"], ["12.5kHz", "0x07"],
                                         ["20kHz", "0x08"], ["25kHz", "0x09"], ["50kHz", "0x10"], ["100kHz", "0x11"]]},
  "vfo": {"page": 4, "options": [["VFO A", "0x00"], ["VFO B", "0x01"], ["Main band", "0xD0"], ["Sub band", "0xD1"]]},
  "equalize": {"page": 4, "code": "0xA0", "what": "VFO A and VFO B"},
  "exchange": {"page": 4, "code": "0xB0", "what": "main and sub band"},
  "split": {"page": 4, "options": [["Split on", "0x01"], ["Split off", "0x00"], ["Simplex", "0x10"], ["Duplex -", "0x11"],
                                   ["Duplex +", "0x12"]]},
  "memory": {"page": 4, "min": 1, "max": 99},
  "rit": {"page": 11, "offsetPage": 24},
  "scan": {"page": 4, "options": [["stop", "0x00"], ["programmed/memory", "0x01"], ["programmed", "0x02"], ["ΔF", "0x03"],
                                  ["fine programmed", "0x12"], ["fine ΔF", "0x13"], ["memory", "0x22"], ["select memory", "0x23"],
                                  ["mode select", "0x24"]]},

  // Receiver
  "afLevel": {"page": 4},
  "rfGain": {"page": 4},
  "squelchLevel": {"page": 4},
  "preamp": {"page": 5, "options": [["OFF", "0x00"], ["P.AMP", "0x01"], ["EXT-P.AMP", "0x02"], ["P.AMP and EXT-P.AMP", "0x03"]]},
  "attenuator": {"page": 4, "options": [["OFF", "0x00"], ["10 dB", "0x10"]]},
  "agc": {"page": 5, "options": [["FAST", "0x01"], ["MID", "0x02"], ["SLOW", "0x03"]]},
  "squelchStatus": {"page": 4},

  // Transmit
  "transmit": {"page": 11},
  "rfPower": {"page": 4},
  "micGain": {"page": 4},
  "tone": {"page": 11},

  // Meters
  "sMeter": {"page": 4, "s9": 120, "plus60": 241},
  "swr": {"page": 5, "points": [[0, 1.0], [48, 1.5], [80, 2.0], [120, 3.0]]},
  "powerOutput": {"page": 4, "points": [[0, 0], [143, 50], [213, 100]]},
  "alc": {"page": 5, "points": [[0, 0], [120, 100]]},
  "voltage": {"page": 5, "points": [[0, 0], [13, 10], [241, 16]]},
  "current": {"page": 5, "points": [[0, 0], [121, 10], [241, 20]]},

  // CW & Voice
  "cw": {"page": 5},
  "keyingSpeed": {"page": 4},
  "voiceMemory": {"page": 12},
  "announce": {"page": 4},

  // GPS & Time
  "position": {"page": 24, "text": "Reads the position of the external GPS receiver, or the manually entered position"},
  "clock": {"page": 8, "date": "0x01, 0x79", "time": "0x01, 0x80"},

  // Settings
  "functions": {"page": 5, "options": [["Noise Blanker", "0x22"], ["Noise Reduction", "0x40"], ["Auto Notch", "0x41"],
                                       ["Manual Notch", "0x48"], ["Speech Compressor", "0x44"], ["Monitor", "0x45"], ["VOX", "0x46"],
                                       ["Repeater Tone", "0x42"], ["Tone Squelch", "0x43"], ["AFC", "0x4A"], ["Dualwatch", "0x59"],
                                       ["Satellite Mode", "0x5A"], ["IP Plus", "0x65"], ["Dial Lock", "0x50"]]},
  "brightness": {"page": 4},
  "power": {"page": 5}
});
