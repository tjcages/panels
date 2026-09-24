#!/usr/bin/env sh
# Final loudness pass on the editor export: linear gain to -14 LUFS plus a
# -1.5 dBFS limiter. The picture stream is copied untouched.
set -e
IN=${1:-mixed.mp4}
OUT=${2:-panels-launch.mp4}
I=$(ffmpeg -i "$IN" -af ebur128 -f null - 2>&1 | grep -A3 Summary | grep "I:" | awk '{print $2}')
G=$(python3 -c "print(round(-14 - ($I), 2))")
DUR=$(ffprobe -v error -select_streams v:0 -show_entries stream=duration -of csv=p=0 "$IN")
ffmpeg -loglevel error -y -i "$IN" -c:v copy -af "volume=${G}dB,alimiter=limit=0.84:level=false" \
  -t "$DUR" -c:a aac -b:a 192k -movflags +faststart "$OUT"
echo "$OUT: ${G} dB gain from ${I} LUFS"
