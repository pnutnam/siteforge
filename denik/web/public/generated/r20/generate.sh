#!/bin/bash
AIRBNB_BELO='<path fill="#FFFFFF" d="M30,15 Q25,20 30,30 Q35,40 30,50 Q25,40 20,30 Q15,20 30,15 M20,35 L40,35 M15,45 L45,45 M20,55 L40,55"/>'

for style in HERO_CENTER SPLIT_VERTICAL GRADIENT_FADE NIGHT_REVERSE; do
  filename="r20_${style,,}.svg"
  curl -s -X POST http://localhost:3001/api/designs/generate \
    -H "Content-Type: application/json" \
    -d "{\"brandName\": \"Airbnb\", \"logoSvg\": \"$AIRBNB_BELO\", \"primaryColor\": \"#FF5A5F\", \"style\": \"$style\"}" \
    --max-time 15 | jq -r '.designs[0].front' > "$filename"
  echo "Generated $filename: $(wc -c < "$filename") bytes"
done
