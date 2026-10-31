// Blocks for the ICOM IC-705, created by Icom.radio() (see radio/icom.js).
//
// The CI-V commands are described in the "IC-705 CI-V reference guide" (datasheets/radio-docs/IC-705),
// the page numbers refer to it.
//
// The block types, their fields and inputs are the same as before the IC-705 was described with Icom.radio(),
// so sketches keep working: e.g. "input" and "field" keep the old names, the VFOs are separate blocks
// and the attenuator is switched on or off.
//
// Documentation of the blocks: documentation/radio/ic705.md

Icom.radio({
  "prefix": "ic705",
  "name": "IC-705",
  "address": "A4h",
  "reference": "IC-705 CI-V reference guide",

  // Frequency & Mode
  "frequency": {"page": 16},
  "modes": {"page": 16, "options": [["LSB", "0x00"], ["USB", "0x01"], ["AM", "0x02"], ["CW", "0x03"], ["RTTY", "0x04"],
                                    ["FM", "0x05"], ["WFM", "0x06"], ["CW-R", "0x07"], ["RTTY-R", "0x08"], ["DV", "0x17"]]},
  "dataMode": {"page": 21},
  "tuningSteps": {"page": 3, "options": [["OFF (10Hz or 1Hz)", "0x00"], ["100Hz", "0x01"], ["500Hz", "0x02"], ["1kHz", "0x03"],
                                         ["5kHz", "0x04"], ["6.25kHz", "0x05"], ["8.33kHz", "0x06"], ["9kHz", "0x07"], ["10kHz", "0x08"],
                                         ["12.5kHz", "0x09"], ["20kHz", "0x10"], ["25kHz", "0x11"], ["50kHz", "0x12"], ["100kHz", "0x13"]]},
  "vfo": {"page": 3, "separate": true, "options": [["VFO A", "0x00", "a"], ["VFO B", "0x01", "b"]]},
  "equalize": {"page": 3, "code": "0xA0", "what": "VFO A and VFO B"},
  "exchange": {"page": 3, "code": "0xB0", "what": "VFO A and VFO B"},
  "split": {"page": 3, "options": [["Split on", "0x01"], ["Split off", "0x00"], ["Simplex", "0x10"], ["Duplex -", "0x11"],
                                   ["Duplex +", "0x12"]]},
  "memory": {"page": 3, "min": 0, "max": 99},
  "rit": {"page": 14, "offsetPage": 25},
  "scan": {"page": 3, "options": [["stop", "0x00"], ["programmed/memory", "0x01"], ["programmed", "0x02"], ["ΔF", "0x03"],
                                  ["fine programmed", "0x12"], ["fine ΔF", "0x13"], ["memory", "0x22"],
                                  ["select memory", "0x23"], ["mode select", "0x24"]]},

  // Receiver
  "afLevel": {"page": 3, "input": "level"},
  "rfGain": {"page": 3, "input": "gain"},
  "squelchLevel": {"page": 3, "input": "level"},
  "preamp": {"page": 4, "field": "PREAMP", "default": "OFF", "options": [["OFF", "0x00"], ["P.AMP1", "0x01"], ["P.AMP2", "0x02"]],
             "tooltip": "Sets the preamplifier. On 144 and 430 MHz there is only one preamp (P.AMP1 = on)"},
  "attenuator": {"page": 3, "field": "STATE", "message": "Attenuator %1", "options": [["on", "0x20"], ["off", "0x00"]], "onValue": "0x20",
                 "tooltip": "Switches the 20 dB attenuator on or off (HF and 50 MHz bands only)"},
  "agc": {"page": 4, "field": "AGC", "options": [["FAST", "0x01"], ["MID", "0x02"], ["SLOW", "0x03"]]},
  "squelchStatus": {"page": 4},
  "toneSquelchStatus": {"page": 4},

  // Settings of command 16 with more than on/off (see CHOICES in icom.js), each one in the group where it belongs
  "choices": {"page": 4, "options": ["dsp_filter_type", "notch_width", "digital_squelch", "tone_function", "ssb_tx_bandwidth",
                                     "break_in", "gps_tx_mode"]},

  // Transmit
  "transmit": {"page": 14},
  "rfPower": {"page": 4, "input": "POWER"},
  "micGain": {"page": 4},
  "tone": {"page": 21},
  "compLevel": {"page": 4},
  "tsql": {"page": 14},
  "dtcs": {"page": 14},
  "csql": {"page": 14},

  // Meters
  "sMeter": {"page": 4, "s9": 120, "plus60": 241},
  "swr": {"page": 4, "points": [[0, 1.0], [48, 1.5], [80, 2.0], [120, 3.0]]},
  "powerOutput": {"page": 4, "points": [[0, 0], [143, 50], [213, 100]]},
  "alc": {"page": 4, "points": [[0, 0], [120, 100]]},
  "voltage": {"page": 4, "points": [[0, 0], [75, 5], [241, 16]]},
  "current": {"page": 4, "points": [[0, 0], [121, 2], [241, 4]]},
  "battery": {"page": 14},
  "overflow": {"page": 4},
  "compMeter": {"page": 4, "points": [[0, 0], [130, 15], [210, 25.5]]},

  // CW & Voice
  "cw": {"page": 16},
  "keyingSpeed": {"page": 4},
  "voiceMemory": {"page": 15},
  "announce": {"page": 3},
  "cwPitch": {"page": 4},
  "breakInDelay": {"page": 4},

  // GPS & Time
  "position": {"page": 21, "label": "GPS", "text": "Reads the position of the internal GPS"},
  "clock": {"page": 9, "date": "0x01, 0x65", "time": "0x01, 0x66"},

  // Settings
  "functions": {"page": 4, "options": [["Noise Blanker", "0x22"], ["Noise Reduction", "0x40"], ["Auto Notch", "0x41"],
                                       ["Manual Notch", "0x48"], ["Speech Compressor", "0x44"], ["Monitor", "0x45"], ["VOX", "0x46"],
                                       ["Repeater Tone", "0x42"], ["Tone Squelch", "0x43"], ["DTCS", "0x4B"], ["Twin Peak Filter", "0x4F"],
                                       ["Dial Lock", "0x50"]]},
  "brightness": {"page": 4},
  "power": {"page": 4},
  "levels": {"page": 3, "options": ["nr", "nb", "pbt1", "pbt2", "notch", "monitor", "vox", "antivox"]},
  "menu": {"page": 5}
});
