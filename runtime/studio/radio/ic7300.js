// Blocks for the ICOM IC-7300, created by Icom.radio() (see radio/icom.js).
//
// The CI-V commands are described in the "IC-7300 full manual", section 19 (datasheets/radio-docs/IC-7300),
// the page numbers refer to it.
//
// Documentation of the blocks: documentation/radio/ic7300.md

Icom.radio({
  "prefix": "ic7300",
  "name": "IC-7300",
  "address": "94h",
  "reference": "IC-7300 full manual, section 19",

  // Frequency & Mode
  "frequency": {"page": "19-3"},
  "modes": {"page": "19-3", "options": [["LSB", "0x00"], ["USB", "0x01"], ["AM", "0x02"], ["CW", "0x03"], ["RTTY", "0x04"],
                                         ["FM", "0x05"], ["CW-R", "0x07"], ["RTTY-R", "0x08"]]},
  "dataMode": {"page": "19-7"},
  "tuningSteps": {"page": "19-3", "options": [["OFF (10Hz or 1Hz)", "0x00"], ["100Hz", "0x01"], ["1kHz", "0x02"], ["5kHz", "0x03"],
                                              ["9kHz", "0x04"], ["10kHz", "0x05"], ["12.5kHz", "0x06"], ["20kHz", "0x07"], ["25kHz", "0x08"]]},
  "vfo": {"page": "19-3", "options": [["VFO A", "0x00"], ["VFO B", "0x01"]]},
  "equalize": {"page": "19-3", "code": "0xA0", "what": "VFO A and VFO B"},
  "exchange": {"page": "19-3", "code": "0xB0", "what": "VFO A and VFO B"},
  "split": {"page": "19-3", "options": [["Split on", "0x01"], ["Split off", "0x00"]]},
  "memory": {"page": "19-3", "min": 1, "max": 99},
  "rit": {"page": "19-7", "offsetPage": "19-13"},
  "scan": {"page": "19-3", "options": [["stop", "0x00"], ["programmed/memory", "0x01"], ["programmed", "0x02"], ["ΔF", "0x03"],
                                       ["fine programmed", "0x12"], ["fine ΔF", "0x13"], ["memory", "0x22"], ["select memory", "0x23"]]},

  // Receiver
  "afLevel": {"page": "19-3"},
  "rfGain": {"page": "19-3"},
  "squelchLevel": {"page": "19-3"},
  "preamp": {"page": "19-3", "options": [["OFF", "0x00"], ["P.AMP1", "0x01"], ["P.AMP2", "0x02"]]},
  "attenuator": {"page": "19-3", "options": [["OFF", "0x00"], ["20 dB", "0x20"]]},
  "agc": {"page": "19-3", "options": [["FAST", "0x01"], ["MID", "0x02"], ["SLOW", "0x03"]]},
  "squelchStatus": {"page": "19-3"},
  "toneSquelchStatus": {"page": "19-3"},
  "choices": {"page": "19-4", "options": ["dsp_filter_type", "notch_width", "ssb_tx_bandwidth", "break_in"]},

  // Transmit
  "transmit": {"page": "19-7"},
  "rfPower": {"page": "19-3"},
  "micGain": {"page": "19-3"},
  "tone": {"page": "19-7"},
  "compLevel": {"page": "19-3"},
  "tsql": {"page": "19-7"},

  // Meters
  "sMeter": {"page": "19-3", "s9": 120, "plus60": 241},
  "swr": {"page": "19-3", "points": [[0, 1.0], [48, 1.5], [80, 2.0], [120, 3.0]]},
  "powerOutput": {"page": "19-3", "points": [[0, 0], [143, 50], [213, 100]]},
  "alc": {"page": "19-3", "points": [[0, 0], [120, 100]]},
  "voltage": {"page": "19-3", "points": [[0, 0], [13, 10], [241, 16]]},
  "current": {"page": "19-3", "points": [[0, 0], [97, 10], [146, 15], [241, 25]]},
  "overflow": {"page": "19-3"},
  "compMeter": {"page": "19-3", "points": [[0, 0], [130, 15], [241, 30]]},

  // CW & Voice
  "cw": {"page": "19-4"},
  "keyingSpeed": {"page": "19-3"},
  "voiceMemory": {"page": "19-8"},
  "announce": {"page": "19-3"},
  "cwPitch": {"page": "19-3"},
  "breakInDelay": {"page": "19-3"},

  // GPS & Time
  "clock": {"page": "19-5", "date": "0x00, 0x94", "time": "0x00, 0x95"},

  // Settings
  "functions": {"page": "19-3", "options": [["Noise Blanker", "0x22"], ["Noise Reduction", "0x40"], ["Auto Notch", "0x41"],
                                            ["Manual Notch", "0x48"], ["Speech Compressor", "0x44"], ["Monitor", "0x45"], ["VOX", "0x46"],
                                            ["Repeater Tone", "0x42"], ["Tone Squelch", "0x43"], ["Twin Peak Filter", "0x4F"],
                                            ["IP Plus", "0x65"], ["Dial Lock", "0x50"]]},
  "brightness": {"page": "19-3"},
  "power": {"page": "19-4"},
  "levels": {"page": "19-3", "options": ["nr", "nb", "pbt1", "pbt2", "notch", "monitor", "vox", "antivox"]},
  "menu": {"page": "19-4"}
});
