// German texts of the studio. Loaded after msg/en.js, see there.

// ----------------------------------------------- index.html: the standard blockly categories
Blockly.Msg.STUDIO_CATEGORY_LOGIC = "Logik";
Blockly.Msg.STUDIO_CATEGORY_CONTROL = "Steuerung";
Blockly.Msg.STUDIO_CATEGORY_MATH = "Mathematik";
Blockly.Msg.STUDIO_CATEGORY_LISTS = "Listen";
Blockly.Msg.STUDIO_CATEGORY_TEXT = "Text";
Blockly.Msg.STUDIO_CATEGORY_VARIABLES = "Variablen";
Blockly.Msg.STUDIO_CATEGORY_FUNCTIONS = "Funktionen";

// ----------------------------------------------- studio.js
Blockly.Msg.STUDIO_EVENTS = "Ereignisse";
Blockly.Msg.STUDIO_ACTIONS = "Aktionen";
Blockly.Msg.STUDIO_PROPERTIES = "Eigenschaften";
Blockly.Msg.STUDIO_HELPERS = "Hilfsmittel";
Blockly.Msg.STUDIO_DUPLICATE_EVENT = "Dieser Block ist %1 mal im Programm,\naber nur einer davon wird ausgeführt.\nVerschiebe alle Blöcke in einen davon\nund lösche die anderen.";

// ----------------------------------------------- base.js: groups
Blockly.Msg.ICP_GROUP_PROGRAM = "Programm";
Blockly.Msg.ICP_GROUP_RADIO = "Funkgerät";
Blockly.Msg.ICP_GROUP_PINS = "Pins";
Blockly.Msg.ICP_GROUP_SERIAL = "Seriell";
Blockly.Msg.ICP_GROUP_STORAGE = "Speicher";
Blockly.Msg.ICP_GROUP_HELPERS = "Hilfsmittel";

// ----------------------------------------------- base.js: program
Blockly.Msg.ICP_ONSTARTUP = "Beim Start";
Blockly.Msg.ICP_ONSTARTUP_TOOLTIP = "Wird beim Start des Geräts ausgeführt";
Blockly.Msg.ICP_PERIODICALLY = "Periodisch";
Blockly.Msg.ICP_PERIODICALLY_TOOLTIP = "Wird regelmäßig ausgeführt, solange das Funkgerät eingeschaltet ist. Sonst wird die Funktion nicht aufgerufen";
Blockly.Msg.ICP_ONRADIOCONNECTED = "Wenn Funkgerät verbunden";
Blockly.Msg.ICP_ONRADIOCONNECTED_TOOLTIP = "Wird ausgeführt, wenn das Funkgerät zu antworten beginnt: nach dem Start von iCOMpadre oder wenn das Funkgerät eingeschaltet wird";
Blockly.Msg.ICP_ONRADIODISCONNECTED = "Wenn Funkgerät getrennt";
Blockly.Msg.ICP_ONRADIODISCONNECTED_TOOLTIP = "Wird ausgeführt, wenn das Funkgerät nicht mehr antwortet, z.B. wenn es ausgeschaltet wird";
Blockly.Msg.ICP_ONCHANGEOF = "Bei Änderung von";
Blockly.Msg.ICP_ONCHANGEOF_TOOLTIP = "Führt die Blöcke aus, wenn sich der beobachtete Wert ändert";
Blockly.Msg.ICP_WAIT = "Warte %1 %2 ms";
Blockly.Msg.ICP_WAIT_TOOLTIP = "Wartet x Millisekunden";
Blockly.Msg.ICP_EXECUTELUACHUNK = "Lua-Code ausführen";
Blockly.Msg.ICP_EXECUTELUACHUNK_TOOLTIP = "Führt den angegebenen Lua-Code aus";
Blockly.Msg.ICP_MILLIS = "Millisekunden seit Start";
Blockly.Msg.ICP_MILLIS_TOOLTIP = "Liefert die Millisekunden seit dem Start des Geräts. Beginnt nach ca. 49 Tagen wieder bei 0";

// ----------------------------------------------- base.js: radio
Blockly.Msg.ICP_CABLE = "Kabel (%1 Baud)";
Blockly.Msg.ICP_CONNECT_RADIO = "Verbinde mit %1 über %2";
Blockly.Msg.ICP_CONNECT_RADIO_TOOLTIP = "Wählt das Funkgerät, mit dem iCOMpadre spricht, mit der Standard-CI-V-Adresse des Funkgeräts. Gehört in \"Beim Start\". Ohne diesen Block spricht iCOMpadre über Bluetooth mit einem IC-705";
Blockly.Msg.ICP_CONNECT_ADDRESS = "Verbinde mit CI-V-Adresse %1 h über %2";
Blockly.Msg.ICP_CONNECT_ADDRESS_TOOLTIP = "Wählt das Funkgerät, mit dem iCOMpadre spricht, über seine CI-V-Adresse in Hex (01 ~ DF), wie sie im Menü des Funkgeräts eingestellt ist. Gehört in \"Beim Start\"";
Blockly.Msg.ICP_SENDCOMMAND = "Befehl an Funkgerät senden";
Blockly.Msg.ICP_SENDCOMMAND_COMMAND = "Befehl";
Blockly.Msg.ICP_SENDCOMMAND_DATA = "Daten";
Blockly.Msg.ICP_SENDCOMMAND_TOOLTIP = "Sendet den angegebenen Befehl an das Funkgerät";
Blockly.Msg.ICP_READDATA = "Daten vom Funkgerät lesen";
Blockly.Msg.ICP_READDATA_TOOLTIP = "Liefert die unveränderten Antwortbytes des angegebenen Befehls als Liste";
Blockly.Msg.ICP_BCDASNUMBER = "BCD-Werte als Zahl";
Blockly.Msg.ICP_BCDASNUMBER_TOOLTIP = "Wandelt BCD-Hex-Werte in die entsprechende Zahl um";
Blockly.Msg.ICP_PRETTYSTRING = "als Hex-Text";
Blockly.Msg.ICP_PRETTYSTRING_TOOLTIP = "Wandelt eine Liste in einen Text mit Hex-Werten um";

// ----------------------------------------------- base.js: pins
Blockly.Msg.ICP_SETANALOGOUTPUT = "Setze";
Blockly.Msg.ICP_SETANALOGOUTPUT_TO = "auf Spannung";
Blockly.Msg.ICP_SETANALOGOUTPUT_TOOLTIP = "Setzt den angegebenen Pin auf die gewählte Spannung";
Blockly.Msg.ICP_SETDIGITALOUTPUT = "Setze";
Blockly.Msg.ICP_SETDIGITALOUTPUT_TO = "auf Wert";
Blockly.Msg.ICP_SETDIGITALOUTPUT_TOOLTIP = "Setzt den digitalen Ausgang auf high (wahr) oder low (falsch)";
Blockly.Msg.ICP_READANALOGINPUT = "Spannung an";
Blockly.Msg.ICP_READANALOGINPUT_TOOLTIP = "Liest die Spannung am angegebenen Eingang in V";
Blockly.Msg.ICP_READDIGITALINPUT = "Zustand von";
Blockly.Msg.ICP_READDIGITALINPUT_TOOLTIP = "Liest den Zustand des angegebenen Eingangs";
Blockly.Msg.ICP_TOUCHVALUE = "Touch-Wert von %1";
Blockly.Msg.ICP_TOUCHVALUE_TOOLTIP = "Liest den Touch-Wert eines Pins";
Blockly.Msg.ICP_ISTOUCHED = "Ist %1 %2 ?";
Blockly.Msg.ICP_ISTOUCHED_TOUCHED = "berührt";
Blockly.Msg.ICP_ISTOUCHED_RELEASED = "losgelassen";
Blockly.Msg.ICP_ISTOUCHED_TOOLTIP = "Liefert wahr, wenn der Pin berührt wird";
Blockly.Msg.ICP_VOLTAGEVALUE_TOOLTIP = "Eine Spannung mit Einheit";

// ----------------------------------------------- base.js: serial
Blockly.Msg.ICP_ONSERIALLINE = "Bei serieller Zeile";
Blockly.Msg.ICP_ONSERIALLINE_TOOLTIP = "Wird ausgelöst, wenn über die serielle Schnittstelle eine Zeile eingegeben wird. Der Inhalt der Zeile steht in der Variable line";
Blockly.Msg.ICP_ONSERIALBYTE = "Bei seriellem Byte";
Blockly.Msg.ICP_ONSERIALBYTE_TOOLTIP = "Wird bei jedem Byte ausgelöst, das über die serielle Schnittstelle ankommt. Der Wert des Bytes steht als Zahl in der Variable byte";
Blockly.Msg.ICP_CONFIGSERIAL = "Setze serielle Geschwindigkeit auf %1,8,N,1";
Blockly.Msg.ICP_CONFIGSERIAL_TOOLTIP = "Setzt die Geschwindigkeit der seriellen Schnittstelle";

// ----------------------------------------------- base.js: storage
Blockly.Msg.ICP_STORAGE_REMEMBER = "Merke %1 als %2";
Blockly.Msg.ICP_STORAGE_REMEMBER_TOOLTIP = "Merkt sich einen Wert (Zahl, Text, wahr/falsch oder Liste) unter einem Namen. Er bleibt auf der SD-Karte erhalten, auch wenn iCOMpadre ausgeschaltet wird";
Blockly.Msg.ICP_STORAGE_FORGET = "Vergiss %1";
Blockly.Msg.ICP_STORAGE_FORGET_TOOLTIP = "Vergisst den Wert, der unter dem Namen gemerkt ist";
Blockly.Msg.ICP_STORAGE_APPEND_LINE = "Hänge Zeile %1 an Datei %2 an";
Blockly.Msg.ICP_STORAGE_APPEND_LINE_TOOLTIP = "Hängt den Text als neue Zeile an das Ende der Datei an. Die Datei wird angelegt, wenn es sie noch nicht gibt";
Blockly.Msg.ICP_STORAGE_APPEND_CSV = "Hänge Werte %1 an CSV-Datei %2 an";
Blockly.Msg.ICP_STORAGE_APPEND_CSV_TOOLTIP = "Hängt die Werte der Liste als neue Zeile an eine CSV-Datei an, die man in einer Tabellenkalkulation öffnen kann";
Blockly.Msg.ICP_STORAGE_WRITE_FILE = "Schreibe Text %1 in Datei %2";
Blockly.Msg.ICP_STORAGE_WRITE_FILE_TOOLTIP = "Schreibt den Text in die Datei. Der alte Inhalt der Datei wird ersetzt";
Blockly.Msg.ICP_STORAGE_DELETE_FILE = "Lösche Datei %1";
Blockly.Msg.ICP_STORAGE_DELETE_FILE_TOOLTIP = "Löscht die Datei";
Blockly.Msg.ICP_STORAGE_RECALL = "Gemerkter Wert %1 sonst %2";
Blockly.Msg.ICP_STORAGE_RECALL_TOOLTIP = "Liefert den Wert, der unter dem Namen gemerkt ist. Wurde noch nichts gemerkt, wird der Wert nach 'sonst' geliefert";
Blockly.Msg.ICP_STORAGE_FILE_LINES = "Zeilen der Datei %1";
Blockly.Msg.ICP_STORAGE_FILE_LINES_TOOLTIP = "Liefert die Zeilen der Datei als Liste. Die Liste ist leer, wenn es die Datei nicht gibt";
Blockly.Msg.ICP_STORAGE_READ_FILE = "Text der Datei %1";
Blockly.Msg.ICP_STORAGE_READ_FILE_TOOLTIP = "Liefert den Inhalt der Datei als Text. Der Text ist leer, wenn es die Datei nicht gibt";
Blockly.Msg.ICP_STORAGE_FILE_EXISTS = "Datei %1 vorhanden?";
Blockly.Msg.ICP_STORAGE_FILE_EXISTS_TOOLTIP = "Wahr, wenn es die Datei gibt";

// ----------------------------------------------- base.js: helpers
Blockly.Msg.ICP_COMMENT = "Kommentar: %1";
Blockly.Msg.ICP_COMMENT_TOOLTIP = "Macht nichts, dient nur als Kommentar";
Blockly.Msg.ICP_MAPNUMBER = "skaliere";
Blockly.Msg.ICP_MAPNUMBER_FROM = "von Bereich";
Blockly.Msg.ICP_MAPNUMBER_TO = "auf Bereich";
Blockly.Msg.ICP_MAPNUMBER_TOOLTIP = "Bildet eine Zahl linear von einem Bereich auf einen anderen ab (Inter-/Extrapolation).";
Blockly.Msg.ICP_ASCHAR = "Zeichen von";
Blockly.Msg.ICP_ASCHAR_TOOLTIP = "Wandelt die Zahl in ein Zeichen um";
Blockly.Msg.ICP_ASBYTE = "Byte von Zeichen %1";
Blockly.Msg.ICP_ASBYTE_TOOLTIP = "Wandelt das erste Zeichen des Textes in einen Byte-Wert um";
Blockly.Msg.ICP_RINGBUFFER_ADD = "füge %1 zu Ringpuffer %2 hinzu, behalte die letzten %3";
Blockly.Msg.ICP_RINGBUFFER_ADD_TOOLTIP = "Hängt einen Wert an eine Liste an und entfernt die ältesten Werte, sodass die Liste immer die letzten Werte enthält";
Blockly.Msg.ICP_RINGBUFFER_CLEAR = "leere Ringpuffer %1";
Blockly.Msg.ICP_RINGBUFFER_CLEAR_TOOLTIP = "Entfernt alle Werte aus dem Ringpuffer";
Blockly.Msg.ICP_RINGBUFFER_GET = "%1 von Ringpuffer %2";
Blockly.Msg.ICP_RINGBUFFER_GET_TOOLTIP = "Berechnet einen Wert aus den Zahlen im Ringpuffer. Solange der Puffer leer ist, ist er 0";
Blockly.Msg.ICP_RINGBUFFER_AVERAGE = "Mittelwert";
Blockly.Msg.ICP_RINGBUFFER_MIN = "Minimum";
Blockly.Msg.ICP_RINGBUFFER_MAX = "Maximum";
Blockly.Msg.ICP_RINGBUFFER_RANGE = "Spannweite (Max - Min)";
Blockly.Msg.ICP_RINGBUFFER_MEDIAN = "Median";
Blockly.Msg.ICP_RINGBUFFER_STDDEV = "Standardabweichung";
Blockly.Msg.ICP_RINGBUFFER_SUM = "Summe";
Blockly.Msg.ICP_RINGBUFFER_NEWEST = "neuester Wert";
Blockly.Msg.ICP_RINGBUFFER_OLDEST = "ältester Wert";
Blockly.Msg.ICP_RINGBUFFER_CHANGE = "Änderung (neuester - ältester)";
Blockly.Msg.ICP_RINGBUFFER_COUNT = "Anzahl der Werte";

// ----------------------------------------------- radio/icom.js: groups, words used everywhere
Blockly.Msg.ICOM_GROUP_FREQUENCY_MODE = "Frequenz & Betriebsart";
Blockly.Msg.ICOM_GROUP_RECEIVER = "Empfänger";
Blockly.Msg.ICOM_GROUP_TRANSMIT = "Senden";
Blockly.Msg.ICOM_GROUP_METERS = "Messwerte";
Blockly.Msg.ICOM_GROUP_CW_VOICE = "CW & Sprache";
Blockly.Msg.ICOM_GROUP_GPS_TIME = "GPS & Zeit";
Blockly.Msg.ICOM_GROUP_SETTINGS = "Einstellungen";
Blockly.Msg.ICOM_ON = "ein";
Blockly.Msg.ICOM_OFF = "aus";
Blockly.Msg.ICOM_OR = "{list} oder {last}";

// ----------------------------------------------- radio/icom.js: settings of command 16 with more than on/off (CHOICES)
Blockly.Msg.ICOM_DSP_FILTER_TYPE = "DSP-Filterform";
Blockly.Msg.ICOM_DSP_FILTER_TYPE_TOOLTIP = "Stellt die Form des DSP-ZF-Filters im aktuellen Band ein";
Blockly.Msg.ICOM_NOTCH_WIDTH = "Breite des manuellen Notch";
Blockly.Msg.ICOM_NOTCH_WIDTH_TOOLTIP = "Stellt die Breite des manuellen Notch-Filters ein";
Blockly.Msg.ICOM_DIGITAL_SQUELCH = "Digital-Squelch";
Blockly.Msg.ICOM_DIGITAL_SQUELCH_TOOLTIP = "Stellt den digitalen Rufzeichen-Squelch (DSQL) oder den digitalen Code-Squelch (CSQL) ein. Nur in DV";
Blockly.Msg.ICOM_TONE_FUNCTION = "Ton-Funktion";
Blockly.Msg.ICOM_TONE_FUNCTION_TOOLTIP = "Wählt Repeater-Ton, Ton-Squelch oder DTCS (FM)";
Blockly.Msg.ICOM_SSB_TX_BANDWIDTH = "SSB-Sendebandbreite";
Blockly.Msg.ICOM_SSB_TX_BANDWIDTH_TOOLTIP = "Wählt die Sendebandbreite in SSB";
Blockly.Msg.ICOM_BREAK_IN = "Break-In";
Blockly.Msg.ICOM_BREAK_IN_TOOLTIP = "Stellt die CW-Break-In-Funktion ein: aus, Semi- oder Voll-Break-In";
Blockly.Msg.ICOM_GPS_TX_MODE = "GPS-Sendemodus";
Blockly.Msg.ICOM_GPS_TX_MODE_TOOLTIP = "Wählt, welche Positionsdaten in DV gesendet werden";

// ----------------------------------------------- radio/icom.js: levels of command 14 in the block Set Level (LEVELS)
Blockly.Msg.ICOM_LEVEL_NR = "NR-Pegel";
Blockly.Msg.ICOM_LEVEL_NB = "NB-Pegel";
Blockly.Msg.ICOM_LEVEL_PBT1 = "inneres PBT (PBT1)";
Blockly.Msg.ICOM_LEVEL_PBT2 = "äußeres PBT (PBT2)";
Blockly.Msg.ICOM_LEVEL_NOTCH = "Position des manuellen Notch";
Blockly.Msg.ICOM_LEVEL_MONITOR = "Monitor-Pegel";
Blockly.Msg.ICOM_LEVEL_VOX = "VOX-Verstärkung";
Blockly.Msg.ICOM_LEVEL_ANTIVOX = "Anti-VOX-Verstärkung";

// ----------------------------------------------- radio/icom.js: frequency & mode
Blockly.Msg.ICOM_SET_FREQUENCY = "Setze Frequenz auf %1 %2";
Blockly.Msg.ICOM_SET_FREQUENCY_TOOLTIP = "Stellt die Frequenz des Funkgeräts ein";
Blockly.Msg.ICOM_SET_OPERATING_MODE = "Setze Betriebsart auf %1";
Blockly.Msg.ICOM_SET_OPERATING_MODE_TOOLTIP = "Stellt die Betriebsart des Funkgeräts ein";
Blockly.Msg.ICOM_SET_DATA_MODE = "Datenmodus %1";
Blockly.Msg.ICOM_SET_DATA_MODE_TOOLTIP = "Schaltet den Datenmodus (z.B. USB-D für digitale Betriebsarten wie FT8) ein oder aus";
Blockly.Msg.ICOM_SET_TUNING_STEP = "Setze Abstimmschritt auf %1";
Blockly.Msg.ICOM_SET_TUNING_STEP_TOOLTIP = "Stellt den Abstimmschritt des Funkgeräts ein";
Blockly.Msg.ICOM_SELECT_VFO = "Wähle {vfo}";
Blockly.Msg.ICOM_SELECT_VFO_TOOLTIP = "Wählt {vfo}";
Blockly.Msg.ICOM_SELECT = "Wähle %1";
Blockly.Msg.ICOM_SELECT_TOOLTIP = "Wählt {options}";
Blockly.Msg.ICOM_EQUALIZE = "Gleiche {what} an";
Blockly.Msg.ICOM_EQUALIZE_TOOLTIP = "Kopiert Frequenz und Betriebsart des gewählten auf das andere ({what})";
Blockly.Msg.ICOM_EXCHANGE = "Tausche {what}";
Blockly.Msg.ICOM_EXCHANGE_TOOLTIP = "Tauscht Frequenz und Betriebsart von {what}";
Blockly.Msg.ICOM_SET_DUALWATCH = "Dualwatch %1";
Blockly.Msg.ICOM_SET_DUALWATCH_TOOLTIP = "Schaltet Dualwatch (Empfang auf Haupt- und Nebenband) ein oder aus";
Blockly.Msg.ICOM_SET_SPLIT = "Setze %1";
Blockly.Msg.ICOM_SELECT_MEMORY = "Wähle Speicherkanal %1";
Blockly.Msg.ICOM_SELECT_MEMORY_TOOLTIP = "Schaltet in den Speicherbetrieb und wählt den Speicherkanal ({min} ~ {max})";
Blockly.Msg.ICOM_MEMORY_RANGE = "Der Speicherkanal muss zwischen {min} und {max} liegen";
Blockly.Msg.ICOM_SET_RIT = "RIT %1";
Blockly.Msg.ICOM_SET_RIT_TOOLTIP = "Schaltet RIT (Empfänger-Feinverstimmung) ein oder aus";
Blockly.Msg.ICOM_SET_RIT_OFFSET = "Setze RIT-Ablage auf %1 Hz";
Blockly.Msg.ICOM_SET_RIT_OFFSET_TOOLTIP = "Stellt die RIT-Ablage ein (-9999 ~ +9999 Hz)";
Blockly.Msg.ICOM_RIT_OFFSET_RANGE = "Die RIT-Ablage muss zwischen -9999 und +9999 Hz liegen";
Blockly.Msg.ICOM_SCAN = "Suchlauf %1";
Blockly.Msg.ICOM_SCAN_TOOLTIP = "Startet einen Suchlauf der gewählten Art oder stoppt ihn";
Blockly.Msg.ICOM_GET_OPERATING_FREQUENCY = "Betriebsfrequenz in %1";
Blockly.Msg.ICOM_GET_OPERATING_FREQUENCY_TOOLTIP = "Liest die aktuelle Frequenz des Funkgeräts";
Blockly.Msg.ICOM_GET_OPERATING_MODE = "Betriebsart";
Blockly.Msg.ICOM_GET_OPERATING_MODE_TOOLTIP = "Liest die aktuelle Betriebsart des Funkgeräts ({options}). Der Text ist in jeder Sprache gleich";
Blockly.Msg.ICOM_IS_DATA_MODE = "Ist Datenmodus ein?";
Blockly.Msg.ICOM_IS_DATA_MODE_TOOLTIP = "Wahr, wenn der Datenmodus (z.B. USB-D) eingeschaltet ist";
Blockly.Msg.ICOM_IS_DUALWATCH = "Ist Dualwatch ein?";
Blockly.Msg.ICOM_IS_DUALWATCH_TOOLTIP = "Wahr, wenn Dualwatch eingeschaltet ist";
Blockly.Msg.ICOM_IS_SPLIT = "Ist Split ein?";
Blockly.Msg.ICOM_IS_SPLIT_TOOLTIP = "Wahr, wenn die Split-Funktion eingeschaltet ist";

// ----------------------------------------------- radio/icom.js: levels 0 ~ 100 % (level), settings with a dropdown (setting) and scaled levels (scaled)
Blockly.Msg.ICOM_SET_LEVEL = "Setze {label} auf %1 %%";
Blockly.Msg.ICOM_SET_LEVEL_TOOLTIP = "Stellt {text} ein (in %)";
Blockly.Msg.ICOM_GET_LEVEL_TOOLTIP = "Liest {text} (in %)";
Blockly.Msg.ICOM_LEVEL_RANGE = "{label} muss zwischen 0 und 100% liegen";
Blockly.Msg.ICOM_SET_SETTING = "Setze {label} auf %1";
Blockly.Msg.ICOM_SET_SETTING_TOOLTIP = "Stellt {text} ein: {options}";
Blockly.Msg.ICOM_GET_SETTING_TOOLTIP = "Liest {text}: {options}. Der Text ist in jeder Sprache gleich";
Blockly.Msg.ICOM_IS_SETTING_ON = "Ist {label} ein?";
Blockly.Msg.ICOM_IS_SETTING_ON_TOOLTIP = "Wahr, wenn {label} eingeschaltet ist";
Blockly.Msg.ICOM_SET_SCALED = "Setze {label} auf %1{unit}";
Blockly.Msg.ICOM_SET_SCALED_TOOLTIP = "Stellt {text} ein ({min} ~ {max}{unit})";
Blockly.Msg.ICOM_GET_SCALED_TOOLTIP = "Liest {text} ({min} ~ {max})";
Blockly.Msg.ICOM_GET_SCALED_UNIT_TOOLTIP = "Liest {text} (in {unitName})";
Blockly.Msg.ICOM_SCALED_RANGE = "{label} muss zwischen {min} und {max}{unit} liegen";
Blockly.Msg.ICOM_AF_LEVEL = "NF-Lautstärke";
Blockly.Msg.ICOM_AF_LEVEL_TEXT = "die NF-Lautstärke";
Blockly.Msg.ICOM_RF_GAIN = "HF-Verstärkung";
Blockly.Msg.ICOM_RF_GAIN_TEXT = "die HF-Verstärkung";
Blockly.Msg.ICOM_SQUELCH_LEVEL = "Squelch-Pegel";
Blockly.Msg.ICOM_SQUELCH_LEVEL_TEXT = "den Squelch-Pegel";
Blockly.Msg.ICOM_RF_POWER = "Sendeleistung";
Blockly.Msg.ICOM_RF_POWER_TEXT = "die Sendeleistung in % des Maximums";
Blockly.Msg.ICOM_MIC_GAIN = "Mikrofonverstärkung";
Blockly.Msg.ICOM_MIC_GAIN_TEXT = "die Mikrofonverstärkung";
Blockly.Msg.ICOM_LCD_BRIGHTNESS = "LCD-Helligkeit";
Blockly.Msg.ICOM_LCD_BRIGHTNESS_TEXT = "die LCD-Helligkeit";
Blockly.Msg.ICOM_PREAMP = "Vorverstärker";
Blockly.Msg.ICOM_PREAMP_TEXT = "den Vorverstärker";
Blockly.Msg.ICOM_ATTENUATOR = "Abschwächer";
Blockly.Msg.ICOM_ATTENUATOR_TEXT = "den Abschwächer";
Blockly.Msg.ICOM_AGC = "AGC";
Blockly.Msg.ICOM_AGC_TEXT = "die AGC-Zeitkonstante";
Blockly.Msg.ICOM_COMP_LEVEL = "Kompressor-Pegel";
Blockly.Msg.ICOM_COMP_LEVEL_TEXT = "den Pegel des Sprachkompressors";
Blockly.Msg.ICOM_CW_PITCH = "CW-Tonhöhe";
Blockly.Msg.ICOM_CW_PITCH_TEXT = "die CW-Tonhöhe";
Blockly.Msg.ICOM_BREAK_IN_DELAY = "Break-In-Verzögerung";
Blockly.Msg.ICOM_BREAK_IN_DELAY_TEXT = "die Verzögerung des Semi-Break-In";
Blockly.Msg.ICOM_DOTS = "Punkte";

// ----------------------------------------------- radio/icom.js: receiver
Blockly.Msg.ICOM_IS_SQUELCH_OPEN = "Ist Squelch offen?";
Blockly.Msg.ICOM_IS_SQUELCH_OPEN_TOOLTIP = "Wahr, wenn der Squelch offen ist, also ein Signal empfangen wird";
Blockly.Msg.ICOM_IS_TONE_SQUELCH_OPEN = "Ist Ton-Squelch offen?";
Blockly.Msg.ICOM_IS_TONE_SQUELCH_OPEN_TOOLTIP = "Wahr, wenn der Ton-Squelch (oder DTCS, DSQL, CSQL) offen ist, also ein passendes Signal empfangen wird";

// ----------------------------------------------- radio/icom.js: transmit
Blockly.Msg.ICOM_SET_TRANSMIT = "Senden %1";
Blockly.Msg.ICOM_TRANSMIT_ON = "ein (TX)";
Blockly.Msg.ICOM_TRANSMIT_OFF = "aus (RX)";
Blockly.Msg.ICOM_SET_TRANSMIT_TOOLTIP = "Schaltet den Sender ein (wie die PTT-Taste) oder zurück auf Empfang. Achte darauf, dass dein Programm ihn wieder ausschaltet!";
Blockly.Msg.ICOM_SET_RF_POWER_STEP = "Setze Sendeleistung auf %1";
Blockly.Msg.ICOM_SET_RF_POWER_STEP_TOOLTIP = "Stellt die Sendeleistung ein: {options}";
Blockly.Msg.ICOM_GET_RF_POWER_STEP_TOOLTIP = "Liest die Einstellung der Sendeleistung: {options}. Der Text ist in jeder Sprache gleich";
Blockly.Msg.ICOM_SET_TONE = "Setze Repeater-Ton auf %1 Hz";
Blockly.Msg.ICOM_SET_TONE_TOOLTIP = "Stellt die Frequenz des Repeater-Tons (CTCSS) ein, z.B. 88.5 Hz";
Blockly.Msg.ICOM_TONE_RANGE = "Der Repeater-Ton muss zwischen 67.0 und 254.1 Hz liegen";
Blockly.Msg.ICOM_IS_TRANSMITTING = "Sendet?";
Blockly.Msg.ICOM_IS_TRANSMITTING_TOOLTIP = "Wahr, solange das Funkgerät sendet";
Blockly.Msg.ICOM_SET_TSQL = "Setze Ton-Squelch auf %1 Hz";
Blockly.Msg.ICOM_SET_TSQL_TOOLTIP = "Stellt die Frequenz des Ton-Squelch (CTCSS) ein, z.B. 88.5 Hz";
Blockly.Msg.ICOM_TSQL_RANGE = "Die Ton-Squelch-Frequenz muss zwischen 67.0 und 254.1 Hz liegen";
Blockly.Msg.ICOM_SET_DTCS = "Setze DTCS-Code auf %1 Polarität %2";
Blockly.Msg.ICOM_DTCS_NORMAL = "normal";
Blockly.Msg.ICOM_DTCS_TX_REVERSE = "TX invertiert";
Blockly.Msg.ICOM_DTCS_RX_REVERSE = "RX invertiert";
Blockly.Msg.ICOM_DTCS_BOTH_REVERSE = "TX und RX invertiert";
Blockly.Msg.ICOM_SET_DTCS_TOOLTIP = "Stellt den DTCS-Code (z.B. 23 für Code 023, Ziffern 0 ~ 7) und seine Polarität ein";
Blockly.Msg.ICOM_DTCS_INVALID = "Ein DTCS-Code hat bis zu 3 Ziffern von 0 bis 7, z.B. 23";
Blockly.Msg.ICOM_GET_DTCS = "DTCS-Code";
Blockly.Msg.ICOM_GET_DTCS_TOOLTIP = "Liest den DTCS-Code, z.B. 23 für Code 023";
Blockly.Msg.ICOM_SET_CSQL = "Setze digitalen Code-Squelch auf %1";
Blockly.Msg.ICOM_SET_CSQL_TOOLTIP = "Stellt den Code des digitalen Code-Squelch (CSQL) in DV ein (0 ~ 99)";
Blockly.Msg.ICOM_CSQL_RANGE = "Der Code muss zwischen 0 und 99 liegen";

// ----------------------------------------------- radio/icom.js: meters
Blockly.Msg.ICOM_S_METER = "S-Meter in %1";
Blockly.Msg.ICOM_S_UNITS = "S-Stufen";
Blockly.Msg.ICOM_DB_OVER_S9 = "dB über S9";
Blockly.Msg.ICOM_S_METER_DB_TOOLTIP = "Liest das S-Meter: in S-Stufen (0 ~ 9) oder in dB über S9 (negativ unter S9, 6 dB pro S-Stufe)";
Blockly.Msg.ICOM_S_METER_TOOLTIP = "Liest das S-Meter in S-Stufen (0 ~ 9)";
Blockly.Msg.ICOM_SWR = "SWR";
Blockly.Msg.ICOM_SWR_TOOLTIP = "Liest das SWR beim Senden, z.B. 1.5";
Blockly.Msg.ICOM_POWER_OUTPUT = "Ausgangsleistung";
Blockly.Msg.ICOM_POWER_OUTPUT_W_TOOLTIP = "Liest die Ausgangsleistung beim Senden (in W)";
Blockly.Msg.ICOM_POWER_OUTPUT_PERCENT_TOOLTIP = "Liest die Anzeige der Ausgangsleistung beim Senden (in % des Maximums)";
Blockly.Msg.ICOM_ALC = "ALC";
Blockly.Msg.ICOM_ALC_TOOLTIP = "Liest die ALC-Anzeige beim Senden (in %, 100 = Ende des ALC-Bereichs)";
Blockly.Msg.ICOM_SUPPLY_VOLTAGE = "Versorgungsspannung";
Blockly.Msg.ICOM_SUPPLY_VOLTAGE_TOOLTIP = "Liest die Versorgungsspannung der Endstufe (in V)";
Blockly.Msg.ICOM_SUPPLY_CURRENT = "Versorgungsstrom";
Blockly.Msg.ICOM_SUPPLY_CURRENT_TOOLTIP = "Liest den Strom, den die Endstufe aufnimmt (in A)";
Blockly.Msg.ICOM_IS_ON_BATTERY = "Läuft mit Akku?";
Blockly.Msg.ICOM_IS_ON_BATTERY_TOOLTIP = "Wahr, wenn das Funkgerät mit seinem Akku läuft, falsch mit externer Stromversorgung";
Blockly.Msg.ICOM_IS_OVERFLOW = "Ist übersteuert?";
Blockly.Msg.ICOM_IS_OVERFLOW_TOOLTIP = "Wahr, wenn die OVF-Anzeige leuchtet, also der Empfänger durch ein starkes Signal übersteuert ist";
Blockly.Msg.ICOM_COMPRESSION = "Kompression";
Blockly.Msg.ICOM_COMPRESSION_TOOLTIP = "Liest die COMP-Anzeige beim Senden mit Sprachkompressor (in dB)";

// ----------------------------------------------- radio/icom.js: CW & voice
Blockly.Msg.ICOM_SEND_CW = "Sende CW %1";
Blockly.Msg.ICOM_SEND_CW_TOOLTIP = "Sendet den Text (bis zu 30 Zeichen) als CW. Das Funkgerät muss in CW mit eingeschaltetem Break-In sein";
Blockly.Msg.ICOM_SET_KEYING_SPEED = "Setze CW-Tempo auf %1 WPM";
Blockly.Msg.ICOM_SET_KEYING_SPEED_TOOLTIP = "Stellt das Tempo des elektronischen Keyers ein (6 ~ 48 WPM)";
Blockly.Msg.ICOM_KEYING_SPEED_RANGE = "Das CW-Tempo muss zwischen 6 und 48 WPM liegen";
Blockly.Msg.ICOM_PLAY_VOICE_MEMORY = "Sende Sprachspeicher %1";
Blockly.Msg.ICOM_STOP = "Stopp";
Blockly.Msg.ICOM_PLAY_VOICE_MEMORY_TOOLTIP = "Sendet einen aufgenommenen Sprachspeicher (z.B. einen CQ-Ruf) oder stoppt ihn";
Blockly.Msg.ICOM_ANNOUNCE = "Ansage %1";
Blockly.Msg.ICOM_ANNOUNCE_ALL = "Frequenz, S-Meter und Betriebsart";
Blockly.Msg.ICOM_ANNOUNCE_FREQUENCY = "Frequenz und S-Meter";
Blockly.Msg.ICOM_ANNOUNCE_MODE = "Betriebsart";
Blockly.Msg.ICOM_ANNOUNCE_TOOLTIP = "Das Funkgerät sagt die gewählte Information mit seiner Sprachausgabe an";
Blockly.Msg.ICOM_GET_KEYING_SPEED = "CW-Tempo";
Blockly.Msg.ICOM_GET_KEYING_SPEED_TOOLTIP = "Liest das Tempo des elektronischen Keyers (in WPM)";

// ----------------------------------------------- radio/icom.js: GPS & time
Blockly.Msg.ICOM_POSITION = "Position";
Blockly.Msg.ICOM_GET_POSITION = "{label} %1";
Blockly.Msg.ICOM_GET_POSITION_TOOLTIP = "{text}. Breite und Länge in Grad (Nord und Ost positiv)";
Blockly.Msg.ICOM_LATITUDE = "Breite";
Blockly.Msg.ICOM_LONGITUDE = "Länge";
Blockly.Msg.ICOM_ALTITUDE = "Höhe (m)";
Blockly.Msg.ICOM_COURSE = "Kurs (°)";
Blockly.Msg.ICOM_SPEED = "Geschwindigkeit (km/h)";
Blockly.Msg.ICOM_GET_GPS_TIME = "GPS-Zeit (UTC) %1";
Blockly.Msg.ICOM_AS_TEXT = "als Text";
Blockly.Msg.ICOM_UNIX_TIME = "Unix-Zeit";
Blockly.Msg.ICOM_YEAR = "Jahr";
Blockly.Msg.ICOM_MONTH = "Monat";
Blockly.Msg.ICOM_DAY = "Tag";
Blockly.Msg.ICOM_HOUR = "Stunde";
Blockly.Msg.ICOM_MINUTE = "Minute";
Blockly.Msg.ICOM_SECOND = "Sekunde";
Blockly.Msg.ICOM_GET_GPS_TIME_TOOLTIP = "Liest Datum und Uhrzeit (UTC) des GPS. Die Unix-Zeit sind die Sekunden seit 1970-01-01";
Blockly.Msg.ICOM_GET_CLOCK = "Uhr des Funkgeräts %1";
Blockly.Msg.ICOM_TIME_AS_TEXT = "Uhrzeit als Text";
Blockly.Msg.ICOM_DATE_AS_TEXT = "Datum als Text";
Blockly.Msg.ICOM_GET_CLOCK_TOOLTIP = "Liest Datum und Uhrzeit der Uhr des Funkgeräts (Ortszeit)";
Blockly.Msg.ICOM_LOCATOR = "Locator von Breite %1 Länge %2";
Blockly.Msg.ICOM_LOCATOR_TOOLTIP = "Berechnet den Maidenhead-Locator (6 Zeichen, z.B. JN77rb) einer Position";

// ----------------------------------------------- radio/icom.js: settings
Blockly.Msg.ICOM_SWITCH_FUNCTION = "Schalte %1 %2";
Blockly.Msg.ICOM_SWITCH_FUNCTION_TOOLTIP = "Schaltet eine Funktion des Funkgeräts ein oder aus";
Blockly.Msg.ICOM_SET_POWER = "Schalte Funkgerät %1";
Blockly.Msg.ICOM_SET_POWER_TOOLTIP = "Schaltet das Funkgerät aus oder ein. Einschalten geht nur, wenn das Funkgerät im Standby ist";
Blockly.Msg.ICOM_IS_FUNCTION_ON = "Ist %1 ein?";
Blockly.Msg.ICOM_IS_FUNCTION_ON_TOOLTIP = "Wahr, wenn die Funktion des Funkgeräts eingeschaltet ist";
Blockly.Msg.ICOM_SET_LEVEL_OF = "Setze %1 auf %2 %%";
Blockly.Msg.ICOM_SET_LEVEL_OF_TOOLTIP = "Stellt einen Pegel in % ein. Bei PBT und der Notch-Position ist 50 % die Mitte";
Blockly.Msg.ICOM_LEVEL_OF_RANGE = "Der Pegel muss zwischen 0 und 100% liegen";
Blockly.Msg.ICOM_GET_LEVEL_OF_TOOLTIP = "Liest einen Pegel (in %)";
Blockly.Msg.ICOM_SET_MENU = "Setze Menüeinstellung %1 auf %2 %3";
Blockly.Msg.ICOM_MENU_1_BYTE = "als 00 ~ 99";
Blockly.Msg.ICOM_MENU_2_BYTES = "als 0000 ~ 9999";
Blockly.Msg.ICOM_SET_MENU_TOOLTIP = "Ändert eine Einstellung des Menüs (Befehl 1A 05). Die Nummer der Einstellung und das Format ihres Werts (00 ~ 99 oder 0000 ~ 9999) stehen in der CI-V-Referenz des Funkgeräts";
Blockly.Msg.ICOM_MENU_RANGE = "Die Nummer der Einstellung muss zwischen 1 und 9999 liegen";
Blockly.Msg.ICOM_GET_MENU = "Menüeinstellung %1";
Blockly.Msg.ICOM_GET_MENU_TOOLTIP = "Liest eine Einstellung des Menüs (Befehl 1A 05) als Zahl";

// ----------------------------------------------- radio/*.js: texts of the radio descriptions, looked up by their english text
Blockly.Msg.ICOM_TERM_OFF_10Hz_or_1Hz = "OFF (10Hz oder 1Hz)";
Blockly.Msg.ICOM_TERM_Main_band = "Hauptband";
Blockly.Msg.ICOM_TERM_Sub_band = "Nebenband";
Blockly.Msg.ICOM_TERM_A_band = "A-Band";
Blockly.Msg.ICOM_TERM_B_band = "B-Band";
Blockly.Msg.ICOM_TERM_VFO_A_and_VFO_B = "VFO A und VFO B";
Blockly.Msg.ICOM_TERM_main_and_sub_band = "Haupt- und Nebenband";
Blockly.Msg.ICOM_TERM_Split_on = "Split ein";
Blockly.Msg.ICOM_TERM_Split_off = "Split aus";
Blockly.Msg.ICOM_TERM_stop = "Stopp";
Blockly.Msg.ICOM_TERM_programmed_memory = "Programm/Speicher";
Blockly.Msg.ICOM_TERM_programmed = "Programm";
Blockly.Msg.ICOM_TERM_fine_programmed = "Programm fein";
Blockly.Msg.ICOM_TERM_fine_delta_F = "ΔF fein";
Blockly.Msg.ICOM_TERM_memory = "Speicher";
Blockly.Msg.ICOM_TERM_select_memory = "markierte Speicher";
Blockly.Msg.ICOM_TERM_mode_select = "Betriebsart";
Blockly.Msg.ICOM_TERM_P_AMP_and_EXT_P_AMP = "P.AMP und EXT-P.AMP";
Blockly.Msg.ICOM_TERM_on = "ein";
Blockly.Msg.ICOM_TERM_off = "aus";
Blockly.Msg.ICOM_TERM_semi = "Semi";
Blockly.Msg.ICOM_TERM_full = "Voll";
Blockly.Msg.ICOM_TERM_Attenuator_1 = "Abschwächer %1";
Blockly.Msg.ICOM_TERM_Switches_the_20_dB_attenuator_on_or_off_HF_and_50_MHz_bands_only = "Schaltet den 20-dB-Abschwächer ein oder aus (nur KW und 50 MHz)";
Blockly.Msg.ICOM_TERM_Sets_the_preamplifier_On_144_and_430_MHz_there_is_only_one_preamp_P_AMP1_on = "Stellt den Vorverstärker ein. Auf 144 und 430 MHz gibt es nur einen Vorverstärker (P.AMP1 = ein)";
Blockly.Msg.ICOM_TERM_Noise_Blanker = "Störaustaster";
Blockly.Msg.ICOM_TERM_Noise_Reduction = "Rauschminderung";
Blockly.Msg.ICOM_TERM_Auto_Notch = "Auto-Notch";
Blockly.Msg.ICOM_TERM_Manual_Notch = "Manueller Notch";
Blockly.Msg.ICOM_TERM_Speech_Compressor = "Sprachkompressor";
Blockly.Msg.ICOM_TERM_Repeater_Tone = "Repeater-Ton";
Blockly.Msg.ICOM_TERM_Tone_Squelch = "Ton-Squelch";
Blockly.Msg.ICOM_TERM_Twin_Peak_Filter = "Twin-Peak-Filter";
Blockly.Msg.ICOM_TERM_Satellite_Mode = "Satellitenbetrieb";
Blockly.Msg.ICOM_TERM_Dial_Lock = "Abstimmsperre";
Blockly.Msg.ICOM_TERM_Reads_the_position_of_the_internal_GPS = "Liest die Position des eingebauten GPS";
Blockly.Msg.ICOM_TERM_Reads_the_position_of_the_external_GPS_receiver_or_the_manually_entered_position = "Liest die Position des externen GPS-Empfängers oder die manuell eingegebene Position";
