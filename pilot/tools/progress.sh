#!/bin/sh
# Shows % and time left for every running render (render.cjs / render-par.cjs workers).
for f in /tmp/render-progress-*.json; do
  [ -e "$f" ] || { echo "no running render"; exit 0; }
  pid=${f##*-}; pid=${pid%.json}
  kill -0 "$pid" 2>/dev/null || { rm -f "$f"; continue; }
  python3 -I -c "import json,sys;d=json.load(open(sys.argv[1]));p=d['frame']/d['frames'];e=d['elapsed'];r=e/p-e if p else 0;print(f\"{d['out']}: {p*100:5.1f}%  {d['frame']}/{d['frames']} kare  geçen {int(e//60)}:{int(e%60):02d}  kalan ~{int(r//60)}:{int(r%60):02d}\")" "$f"
done
