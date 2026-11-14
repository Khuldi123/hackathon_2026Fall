CAREBEYOND + PULSEGUARD AI
Windows PowerShell, in this extracted folder:
  py -m pip install -r requirements.txt
  $env:GEMINI_API_KEY = "YOUR_NEW_KEY"
  py app.py
Open http://127.0.0.1:5000 in Chrome or Edge. Select Health Monitoring.
The model retrains at startup using the original dataset URL (or a local heart.csv).
Gemini is optional; without a key or if unavailable, a built-in explanation appears.
This is a local Python version of the Colab code, not a connection to a running Colab session or its exact trained weights.
Optional hardware: close Arduino Serial Monitor, connect ESP32 via USB, select Connect demo ESP32. Firmware must read newline-delimited GREEN_LIGHT, YELLOW_LIGHT, RED_LIGHT at 9600 baud. No firmware changes included. A single-color matrix cannot show actual green/yellow colors; use patterns or RGB LEDs.
Use fictional data only. Matching uses the original unscaled nearest-neighbor method and the full dataset; labels are heuristic and scores are not calibrated or validated for medical use. No clinical triage or recovery prediction. Do not expose this local demo server publicly.
Revoke the previously exposed Gemini key. Never place the new key in JS or share it.
