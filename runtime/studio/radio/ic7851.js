// Blocks for the ICOM IC-7850 / IC-7851, created by Icom.radio() (see radio/icom.js).
//
// The CI-V commands are described in chapter 18 "Control command" of the "IC-7850/IC-7851 instruction manual"
// (datasheets/radio-docs/IC-7851), the page numbers refer to it.
//
// Documentation of the blocks: documentation/blocks/radio/ic7851.md

Icom.radio({
  "prefix": "ic7851",
  "name": "IC-7851",
  "address": "8Eh",
  "reference": "IC-7850/IC-7851 instruction manual, chapter 18",

  // Frequency & Mode
  "frequency": {"page": "18-11"},
  "modes": {"page": "18-11", "options": [["LSB", "0x00"], ["USB", "0x01"], ["AM", "0x02"], ["CW", "0x03"], ["RTTY", "0x04"],
                                         ["FM", "0x05"], ["CW-R", "0x07"], ["RTTY-R", "0x08"], ["PSK", "0x12"], ["PSK-R", "0x13"]]},
  "dataMode": {"page": "18-9"},
  "tuningSteps": {"page": "18-3", "options": [["OFF (10Hz or 1Hz)", "0x00"], ["100Hz", "0x01"], ["1kHz", "0x02"], ["5kHz", "0x03"],
                                              ["9kHz", "0x04"], ["10kHz", "0x05"], ["12.5kHz", "0x06"], ["20kHz", "0x07"], ["25kHz", "0x08"]]},
  "vfo": {"page": "18-3", "options": [["Main band", "0xD0"], ["Sub band", "0xD1"]]},
  "equalize": {"page": "18-3", "code": "0xB1", "what": "main and sub band"},
  "exchange": {"page": "18-3", "code": "0xB0", "what": "main and sub band"},
  "dualwatch": {"page": "18-3"},
  "split": {"page": "18-3", "options": [["Split on", "0x01"], ["Split off", "0x00"]]},
  "memory": {"page": "18-3", "min": 1, "max": 99},
  "rit": {"page": "18-10", "offsetPage": "18-13"},
  "scan": {"page": "18-3", "options": [["stop", "0x00"], ["programmed/memory", "0x01"], ["programmed", "0x02"], ["ΔF", "0x03"],
                                       ["fine programmed", "0x12"], ["fine ΔF", "0x13"], ["memory", "0x22"], ["select memory", "0x23"]]},

  // Receiver
  "afLevel": {"page": "18-3"},
  "rfGain": {"page": "18-3"},
  "squelchLevel": {"page": "18-3"},
  "preamp": {"page": "18-4", "options": [["OFF", "0x00"], ["P.AMP1", "0x01"], ["P.AMP2", "0x02"]]},
  "attenuator": {"page": "18-3", "options": [["OFF", "0x00"], ["3 dB", "0x03"], ["6 dB", "0x06"], ["9 dB", "0x09"], ["12 dB", "0x12"],
                                             ["15 dB", "0x15"], ["18 dB", "0x18"], ["21 dB", "0x21"]]},
  "agc": {"page": "18-4", "options": [["OFF", "0x00"], ["FAST", "0x01"], ["MID", "0x02"], ["SLOW", "0x03"]]},
  "squelchStatus": {"page": "18-4"},
  "toneSquelchStatus": {"page": "18-4"},
  "choices": {"page": "18-4", "options": ["dsp_filter_type", "notch_width", "ssb_tx_bandwidth", "break_in"]},

  // Transmit
  "transmit": {"page": "18-10"},
  "rfPower": {"page": "18-3"},
  "micGain": {"page": "18-3"},
  "tone": {"page": "18-10"},
  "compLevel": {"page": "18-3"},

  // Meters
  "sMeter": {"page": "18-4", "s9": 120, "plus60": 241},
  "swr": {"page": "18-4", "points": [[0, 1.0], [48, 1.5], [80, 2.0], [120, 3.0]]},
  "powerOutput": {"page": "18-4", "unit": "W", "points": [[0, 0], [143, 100], [213, 200]]},
  "alc": {"page": "18-4", "points": [[0, 0], [120, 100]]},
  "voltage": {"page": "18-4", "points": [[151, 44], [180, 48], [211, 52]]},
  "current": {"page": "18-4", "points": [[0, 0], [165, 10], [241, 15]]},
  "compMeter": {"page": "18-4", "points": [[0, 0], [130, 15], [241, 30]]},

  // CW & Voice
  "cw": {"page": "18-4"},
  "keyingSpeed": {"page": "18-3"},
  "voiceMemory": {"page": "18-10"},
  "announce": {"page": "18-3"},
  "cwPitch": {"page": "18-3"},
  "breakInDelay": {"page": "18-3"},

  // GPS & Time
  "clock": {"page": "18-6", "date": "0x00, 0x95", "time": "0x00, 0x96"},

  // Settings
  "functions": {"page": "18-4", "options": [["Noise Blanker", "0x22"], ["Noise Reduction", "0x40"], ["Auto Notch", "0x41"],
                                            ["Manual Notch", "0x48"], ["Speech Compressor", "0x44"], ["Monitor", "0x45"], ["VOX", "0x46"],
                                            ["Repeater Tone", "0x42"], ["Tone Squelch", "0x43"], ["VSC", "0x4C"], ["DIGI-SEL", "0x4E"],
                                            ["Twin Peak Filter", "0x4F"], ["Dial Lock", "0x50"]]},
  "brightness": {"page": "18-3"},
  "power": {"page": "18-4"},
  "levels": {"page": "18-3", "options": ["nr", "nb", "pbt1", "pbt2", "notch", "monitor", "vox", "antivox"]},
  "menu": {"page": "18-5"}
});
