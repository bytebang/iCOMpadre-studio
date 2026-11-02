// Blocks for the ICOM IC-7610, created by Icom.radio() (see radio/icom.js).
//
// The CI-V commands are described in the "IC-7610 CI-V reference guide" (datasheets/radio-docs/IC-7610),
// the page numbers refer to it.
//
// Documentation of the blocks: documentation/radio/ic7610.md

Icom.radio({
  "prefix": "ic7610",
  "name": "IC-7610",
  "address": "98h",
  "reference": "IC-7610 CI-V reference guide",
  "note": "The command table of the IC-7610 lists the voice memory command as 28 without the sub command 00. " +
          "The block uses 28 00 like the IC-705, IC-7851 and IC-9700. Please report if it doesn't work.",

  // Frequency & Mode
  "frequency": {"page": 10},
  "modes": {"page": 10, "options": [["LSB", "0x00"], ["USB", "0x01"], ["AM", "0x02"], ["CW", "0x03"], ["RTTY", "0x04"],
                                    ["FM", "0x05"], ["CW-R", "0x07"], ["RTTY-R", "0x08"], ["PSK", "0x12"], ["PSK-R", "0x13"]]},
  "dataMode": {"page": 12},
  "tuningSteps": {"page": 3, "options": [["OFF (10Hz or 1Hz)", "0x00"], ["100Hz", "0x01"], ["1kHz", "0x02"], ["5kHz", "0x03"],
                                         ["9kHz", "0x04"], ["10kHz", "0x05"], ["12.5kHz", "0x06"], ["20kHz", "0x07"], ["25kHz", "0x08"]]},
  "vfo": {"page": 3, "options": [["Main band", "0xD0"], ["Sub band", "0xD1"]]},
  "equalize": {"page": 3, "code": "0xB1", "what": "main and sub band"},
  "exchange": {"page": 3, "code": "0xB0", "what": "main and sub band"},
  "dualwatch": {"page": 3},
  "split": {"page": 3, "options": [["Split on", "0x01"], ["Split off", "0x00"]]},
  "memory": {"page": 3, "min": 1, "max": 99},
  "rit": {"page": 9, "offsetPage": 13},
  "scan": {"page": 3, "options": [["stop", "0x00"], ["programmed/memory", "0x01"], ["programmed", "0x02"], ["ΔF", "0x03"],
                                  ["fine programmed", "0x12"], ["fine ΔF", "0x13"], ["memory", "0x22"], ["select memory", "0x23"]]},

  // Receiver
  "afLevel": {"page": 3},
  "rfGain": {"page": 3},
  "squelchLevel": {"page": 3},
  "preamp": {"page": 4, "options": [["OFF", "0x00"], ["P.AMP1", "0x01"], ["P.AMP2", "0x02"]]},
  "attenuator": {"page": 3, "options": [["OFF", "0x00"], ["3 dB", "0x03"], ["6 dB", "0x06"], ["9 dB", "0x09"], ["12 dB", "0x12"],
                                        ["15 dB", "0x15"], ["18 dB", "0x18"], ["21 dB", "0x21"], ["24 dB", "0x24"], ["27 dB", "0x27"],
                                        ["30 dB", "0x30"], ["33 dB", "0x33"], ["36 dB", "0x36"], ["39 dB", "0x39"], ["42 dB", "0x42"],
                                        ["45 dB", "0x45"]]},
  "agc": {"page": 4, "options": [["FAST", "0x01"], ["MID", "0x02"], ["SLOW", "0x03"]]},
  "squelchStatus": {"page": 3},
  "toneSquelchStatus": {"page": 3},
  "choices": {"page": 4, "options": ["dsp_filter_type", "notch_width", "ssb_tx_bandwidth", "break_in"]},

  // Transmit
  "transmit": {"page": 9},
  "rfPower": {"page": 3},
  "micGain": {"page": 3},
  "tone": {"page": 13},
  "compLevel": {"page": 3},
  "tsql": {"page": 8},

  // Meters
  "sMeter": {"page": 3, "s9": 120, "plus60": 241},
  "swr": {"page": 4, "points": [[0, 1.0], [48, 1.5], [80, 2.0], [120, 3.0]]},
  "powerOutput": {"page": 4, "points": [[0, 0], [143, 50], [212, 100]]},
  "alc": {"page": 4, "points": [[0, 0], [120, 100]]},
  "voltage": {"page": 4, "points": [[0, 0], [151, 10], [211, 16]]},
  "current": {"page": 4, "points": [[0, 0], [77, 10], [165, 20], [241, 30]]},
  "overflow": {"page": 4},
  "compMeter": {"page": 4, "points": [[0, 0], [130, 15], [241, 30]]},

  // CW & Voice
  "cw": {"page": 10},
  "keyingSpeed": {"page": 3},
  // The command table lists 28 without the sub command 00, the IC-705, IC-7851 and IC-9700 use 28 00
  "voiceMemory": {"page": 9},
  "announce": {"page": 3},
  "cwPitch": {"page": 3},
  "breakInDelay": {"page": 3},

  // GPS & Time
  "clock": {"page": 7, "date": "0x01, 0x58", "time": "0x01, 0x59"},

  // Settings
  "functions": {"page": 4, "options": [["Noise Blanker", "0x22"], ["Noise Reduction", "0x40"], ["Auto Notch", "0x41"],
                                       ["Manual Notch", "0x48"], ["Speech Compressor", "0x44"], ["Monitor", "0x45"], ["VOX", "0x46"],
                                       ["Repeater Tone", "0x42"], ["Tone Squelch", "0x43"], ["DIGI-SEL", "0x4E"],
                                       ["Twin Peak Filter", "0x4F"], ["IP Plus", "0x65"], ["Dial Lock", "0x50"]]},
  "brightness": {"page": 3},
  "power": {"page": 4},
  "levels": {"page": 3, "options": ["nr", "nb", "pbt1", "pbt2", "notch", "monitor", "vox", "antivox"]},
  "menu": {"page": 4}
});
