"""Robotic Turkish TTS for tests (espeak-ng) + lip-sync envelope.
Usage: python3 -I pilot/tools/tts.py <lines.json> <outDir>
lines.json: [{"id": "n1", "start": 0.4, "text": "...", "who": "narrator"|"oli"}, ...]
Writes <outDir>/<id>.wav, <outDir>/voice.wav (all lines placed at their start times) and
<outDir>/voice.json: [{id, who, text, start, dur, env:[0..1 per 1/30 s]}] for mouth animation.
Later the real voice (ElevenLabs / Voice Studio) replaces the wavs; voice.json keeps the same shape."""
import json, subprocess, sys, wave, struct, math, os

lines = json.load(open(sys.argv[1], encoding="utf-8"))
out = sys.argv[2]; os.makedirs(out, exist_ok=True)
FPS, RATE = 30, 22050
meta, inputs, filters = [], [], []
for i, ln in enumerate(lines):
    wav = os.path.join(out, ln["id"] + ".wav")
    voice = "tr" if ln.get("who") == "narrator" else "tr+m3"
    subprocess.run(["espeak-ng", "-v", voice, "-s", str(ln.get("speed", 150)), "-p", str(ln.get("pitch", 50)),
                    "-w", wav, ln["text"]], check=True)
    with wave.open(wav) as w:
        n, sr, sw = w.getnframes(), w.getframerate(), w.getsampwidth()
        data = struct.unpack("<%dh" % n, w.readframes(n))
    hop = sr // FPS
    env = []
    for f in range(0, n, hop):
        chunk = data[f:f + hop]
        rms = math.sqrt(sum(s * s for s in chunk) / max(1, len(chunk))) / 32768
        env.append(round(min(1.0, rms * 6), 3))
    meta.append({"id": ln["id"], "who": ln.get("who", "oli"), "text": ln["text"], "start": ln["start"],
                 "dur": round(n / sr, 3), "env": env})
    inputs += ["-i", wav]
    filters.append(f"[{i}]adelay={int(ln['start'] * 1000)}|{int(ln['start'] * 1000)},aresample={RATE}[a{i}]")
mix = ";".join(filters) + ";" + "".join(f"[a{i}]" for i in range(len(lines))) + \
      f"amix=inputs={len(lines)}:normalize=0,volume=1.6[out]"
subprocess.run(["ffmpeg", "-y", "-loglevel", "error", *inputs, "-filter_complex", mix, "-map", "[out]",
                os.path.join(out, "voice.wav")], check=True)
json.dump(meta, open(os.path.join(out, "voice.json"), "w", encoding="utf-8"), ensure_ascii=False)
for m in meta:
    print(f'{m["id"]:4} {m["start"]:6.2f}s +{m["dur"]:.2f}s  {m["who"]:8} {m["text"]}')
