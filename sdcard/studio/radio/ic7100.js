// Blocks for the ICOM IC-7100, created by Icom.radio() (see radio/icom.js).
//
// The CI-V commands are described in the "IC-7100 full manual", section 20 (datasheets/radio-docs/IC-7100),
// the page numbers refer to it.
//
// Documentation of the blocks: documentation/radio/ic7100.md

Icom.radio({
  "prefix": "ic7100",
  "name": "IC-7100",
  "address": "88h",
  "reference": "IC-7100 full manual, section 20",

  // Frequency & Mode
  "frequency": {"page": "20-3"},
  "modes": {"page": "20-3", "options": [["LSB", "0x00"], ["USB", "0x01"], ["AM", "0x02"], ["CW", "0x03"], ["RTTY", "0x04"],
                                         ["FM", "0x05"], ["WFM", "0x06"], ["CW-R", "0x07"], ["RTTY-R", "0x08"], ["DV", "0x17"]]},
  "dataMode": {"page": "20-10"},
  "tuningSteps": {"page": "20-3", "options": [["OFF (10Hz or 1Hz)", "0x00"], ["100Hz", "0x01"], ["1kHz", "0x02"], ["5kHz", "0x03"],
                                              ["6.25kHz", "0x04"], ["9kHz", "0x05"], ["10kHz", "0x06"], ["12.5kHz", "0x07"],
                                              ["20kHz", "0x08"], ["25kHz", "0x09"], ["50kHz", "0x10"], ["100kHz", "0x11"], ["1MHz", "0x12"]]},
  "vfo": {"page": "20-3", "options": [["VFO A", "0x00"], ["VFO B", "0x01"]]},
  "equalize": {"page": "20-3", "code": "0xA0", "what": "VFO A and VFO B"},
  "exchange": {"page": "20-3", "code": "0xB0", "what": "VFO A and VFO B"},
  "split": {"page": "20-3", "options": [["Split on", "0x01"], ["Split off", "0x00"], ["Simplex", "0x10"], ["Duplex -", "0x11"],
                                        ["Duplex +", "0x12"]]},
  // 0100 ~ 0109 are the scan edges (1A ~ 3B) and the call channels
  "memory": {"page": "20-3", "min": 1, "max": 99},
  "rit": {"page": "20-10", "offsetPage": "20-17"},
  "scan": {"page": "20-3", "options": [["stop", "0x00"], ["programmed/memory", "0x01"], ["programmed", "0x02"], ["ΔF", "0x03"],
                                       ["fine programmed", "0x12"], ["fine ΔF", "0x13"], ["memory", "0x22"], ["select memory", "0x23"],
                                       ["mode select", "0x24"]]},

  // Receiver
  "afLevel": {"page": "20-3"},
  "rfGain": {"page": "20-3"},
  "squelchLevel": {"page": "20-3"},
  "preamp": {"page": "20-4", "options": [["OFF", "0x00"], ["P.AMP1", "0x01"], ["P.AMP2", "0x02"]],
             "tooltip": "Sets the preamplifier. On 144 and 430 MHz there is only one preamp (P.AMP1 = on)"},
  "attenuator": {"page": "20-3", "options": [["OFF", "0x00"], ["12 dB", "0x12"]]},
  "agc": {"page": "20-4", "options": [["FAST", "0x01"], ["MID", "0x02"], ["SLOW", "0x03"]]},
  "squelchStatus": {"page": "20-4"},
  "toneSquelchStatus": {"page": "20-4"},
  "choices": {"page": "20-4", "options": ["dsp_filter_type", "notch_width", "digital_squelch", "ssb_tx_bandwidth", "break_in"]},

  // Transmit
  "transmit": {"page": "20-10"},
  "rfPower": {"page": "20-3"},
  "micGain": {"page": "20-3"},
  "tone": {"page": "20-10"},
  "compLevel": {"page": "20-4"},
  "tsql": {"page": "20-10"},
  "dtcs": {"page": "20-10"},
  "csql": {"page": "20-10"},

  // Meters
  "sMeter": {"page": "20-4", "s9": 120, "plus60": 241},
  "swr": {"page": "20-4", "points": [[0, 1.0], [48, 1.5], [80, 2.0], [120, 3.0]]},
  "powerOutput": {"page": "20-4", "points": [[0, 0], [143, 50], [213, 100]]},
  "alc": {"page": "20-4", "points": [[0, 0], [120, 100]]},
  "voltage": {"page": "20-4", "points": [[0, 0], [13, 10], [241, 16]]},
  "current": {"page": "20-4", "points": [[0, 0], [97, 10], [146, 15], [241, 25]]},
  "compMeter": {"page": "20-4", "points": [[0, 0], [130, 15], [241, 30]]},

  // CW & Voice
  "cw": {"page": "20-4"},
  "keyingSpeed": {"page": "20-3"},
  "announce": {"page": "20-3"},
  "cwPitch": {"page": "20-3"},
  "breakInDelay": {"page": "20-4"},

  // GPS & Time
  "clock": {"page": "20-8", "date": "0x01, 0x20", "time": "0x01, 0x21"},

  // Settings
  "functions": {"page": "20-4", "options": [["Noise Blanker", "0x22"], ["Noise Reduction", "0x40"], ["Auto Notch", "0x41"],
                                            ["Manual Notch", "0x48"], ["Speech Compressor", "0x44"], ["Monitor", "0x45"], ["VOX", "0x46"],
                                            ["Repeater Tone", "0x42"], ["Tone Squelch", "0x43"], ["DTCS", "0x4B"], ["VSC", "0x4C"],
                                            ["Twin Peak Filter", "0x4F"], ["Dial Lock", "0x50"]]},
  "brightness": {"page": "20-4"},
  "power": {"page": "20-4"},
  "levels": {"page": "20-3", "options": ["nr", "nb", "pbt1", "pbt2", "notch", "monitor", "vox", "antivox"]},
  "menu": {"page": "20-5"}
});
