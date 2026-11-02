// Blocks for the ICOM IC-7300MK2, created by Icom.radio() (see radio/icom.js).
//
// The CI-V commands are described in the "IC-7300MK2 CI-V reference guide" (datasheets/radio-docs/IC-7300MK2),
// the page numbers refer to it. The commands are the same as for the IC-7300, except for the default address,
// the menu settings (e.g. date and time) and the scale of the COMP meter.
//
// Documentation of the blocks: documentation/radio/ic7300mk2.md

Icom.radio({
  "prefix": "ic7300mk2",
  "name": "IC-7300MK2",
  "address": "B6h",
  "reference": "IC-7300MK2 CI-V reference guide",

  // Frequency & Mode
  "frequency": {"page": 4},
  "modes": {"page": 4, "options": [["LSB", "0x00"], ["USB", "0x01"], ["AM", "0x02"], ["CW", "0x03"], ["RTTY", "0x04"],
                                   ["FM", "0x05"], ["CW-R", "0x07"], ["RTTY-R", "0x08"]]},
  "dataMode": {"page": 14},
  "tuningSteps": {"page": 4, "options": [["OFF (10Hz or 1Hz)", "0x00"], ["100Hz", "0x01"], ["1kHz", "0x02"], ["5kHz", "0x03"],
                                         ["9kHz", "0x04"], ["10kHz", "0x05"], ["12.5kHz", "0x06"], ["20kHz", "0x07"], ["25kHz", "0x08"]]},
  "vfo": {"page": 4, "options": [["VFO A", "0x00"], ["VFO B", "0x01"]]},
  "equalize": {"page": 4, "code": "0xA0", "what": "VFO A and VFO B"},
  "exchange": {"page": 4, "code": "0xB0", "what": "VFO A and VFO B"},
  "split": {"page": 4, "options": [["Split on", "0x01"], ["Split off", "0x00"]]},
  "memory": {"page": 4, "min": 1, "max": 99},
  "rit": {"page": 15, "offsetPage": 23},
  "scan": {"page": 4, "options": [["stop", "0x00"], ["programmed/memory", "0x01"], ["programmed", "0x02"], ["ΔF", "0x03"],
                                  ["fine programmed", "0x12"], ["fine ΔF", "0x13"], ["memory", "0x22"], ["select memory", "0x23"]]},

  // Receiver
  "afLevel": {"page": 5},
  "rfGain": {"page": 5},
  "squelchLevel": {"page": 5},
  "preamp": {"page": 6, "options": [["OFF", "0x00"], ["P.AMP1", "0x01"], ["P.AMP2", "0x02"]]},
  "attenuator": {"page": 4, "options": [["OFF", "0x00"], ["20 dB", "0x20"]]},
  "agc": {"page": 6, "options": [["FAST", "0x01"], ["MID", "0x02"], ["SLOW", "0x03"]]},
  "squelchStatus": {"page": 5},
  "toneSquelchStatus": {"page": 5},
  "choices": {"page": 6, "options": ["dsp_filter_type", "notch_width", "ssb_tx_bandwidth", "break_in"]},

  // Transmit
  "transmit": {"page": 14},
  "rfPower": {"page": 5},
  "micGain": {"page": 5},
  "tone": {"page": 14},
  "compLevel": {"page": 5},
  "tsql": {"page": 14},

  // Meters
  "sMeter": {"page": 5, "s9": 120, "plus60": 241},
  "swr": {"page": 5, "points": [[0, 1.0], [48, 1.5], [80, 2.0], [120, 3.0]]},
  "powerOutput": {"page": 5, "points": [[0, 0], [143, 50], [213, 100]]},
  "alc": {"page": 5, "points": [[0, 0], [120, 100]]},
  "voltage": {"page": 5, "points": [[0, 0], [13, 10], [241, 16]]},
  "current": {"page": 5, "points": [[0, 0], [97, 10], [146, 15], [241, 25]]},
  "overflow": {"page": 5},
  "compMeter": {"page": 5, "points": [[0, 0], [130, 15], [210, 30]]},

  // CW & Voice
  "cw": {"page": 6},
  "keyingSpeed": {"page": 5},
  "voiceMemory": {"page": 15},
  "announce": {"page": 5},
  "cwPitch": {"page": 5},
  "breakInDelay": {"page": 5},

  // GPS & Time
  "clock": {"page": 11, "date": "0x01, 0x32", "time": "0x01, 0x33"},

  // Settings
  "functions": {"page": 6, "options": [["Noise Blanker", "0x22"], ["Noise Reduction", "0x40"], ["Auto Notch", "0x41"],
                                       ["Manual Notch", "0x48"], ["Speech Compressor", "0x44"], ["Monitor", "0x45"], ["VOX", "0x46"],
                                       ["Repeater Tone", "0x42"], ["Tone Squelch", "0x43"], ["Twin Peak Filter", "0x4F"],
                                       ["IP Plus", "0x65"], ["Dial Lock", "0x50"]]},
  "brightness": {"page": 5},
  "power": {"page": 6},
  "levels": {"page": 5, "options": ["nr", "nb", "pbt1", "pbt2", "notch", "monitor", "vox", "antivox"]},
  "menu": {"page": 7}
});
