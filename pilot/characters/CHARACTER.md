# Character bible — "Oli" (working name)

One original character, drawn in four game art styles so the creator can pick one.
Every style must follow this sheet so the comparison is fair. Do not copy any existing
franchise character (no Mario, Pokémon, Matrix etc. looks).

## Identity
- Everyperson protagonist of a "What if…?" choice channel. Curious, a bit nervous, brave when it counts.
- Gender-neutral, young adult, friendly. Reads clearly as a silhouette in 3 seconds.

## Proportions
- Total height H. Head is about 0.38 H tall (big-head, game-mascot proportions, not a baby).
- Head: wide soft oval, slightly wider than tall.
- Body: short torso, short legs (legs ≈ 0.28 H), arms reach mid-thigh.
- Hands: simple mittens (thumb + rounded block). No individual fingers.

## Silhouette signature
- Rounded dark-brown hair mop with ONE big curl/lock standing up on top that curls forward
  (like a question-mark hook). This curl is the brand silhouette — keep it big and readable.
- Oversized hoodie with the hood bunched behind the neck as a collar.

## Face
- Eyes: large vertical ovals, near-black, one small white highlight upper-right. No sclera.
- Brows: short thick rounded strokes, hair colour. They carry most of the emotion.
- Nose: none or a tiny dot. Cheeks: soft blush ovals.
- Mouth: separate swappable shapes (see expressions).

## Palette (hex)
| Role | Base | Shade |
|---|---|---|
| Outline / ink | #1E1B24 | — |
| Skin | #F2C9A8 | #D9A383 |
| Blush | #F28C7A (≈40% opacity) | — |
| Hair | #3B2A22 | #2A1D17 |
| Hoodie (mustard) | #F2B33D | #C98E25 |
| Drawstrings / highlights | #FFF4DC | — |
| Pants (navy) | #26305A | #1A2142 |
| Sneakers | #F7F3EA | #D8D2C4 |
| Sneaker sole stripe | #FF5D5D | — |
| Brand pin (Y-shaped fork symbol on hoodie, left chest) | #2EC4B6 | — |
| Option A colour | #2EC4B6 (teal) | — |
| Option B colour | #FF5D5D (coral) | — |
| Default background | #F4EAD5 (warm paper) | — |

## Costume details
- Hoodie: front kangaroo pocket, two cream drawstrings, sleeves to the wrist, small teal fork pin
  (a "Y" branching symbol: one stem splitting into two — the channel's choice symbol, no letters).
- Navy pants, slightly short. White sneakers with a coral sole stripe.

## Expressions (must exist as data, swap brows + eyes + mouth)
1. neutral — calm brows, closed small mouth line
2. happy — raised brows, eyes as upward arcs or with bigger highlight, open smile
3. surprised — high brows, slightly bigger eyes, small "O" mouth
4. scared — brows tilted up in the middle, wobbly wide mouth

## Rig (named parts, pivots) — animation-ready
Every style builds the character from separate named parts so it can be animated from code
later (frame = pure function of time t). Pivot in brackets.
- root [between feet, ground]
- hips [hip centre] → torso [hip centre] → head [neck]
  - head children: hair_back, face (eyeL, eyeR, browL, browR, mouth), hair_front, hair_curl [top of head, for secondary bounce]
- torso children: hood_collar, pin, pocket, strings
- armL_upper [shoulder] → armL_lower [elbow] → handL [wrist]; same for R
- legL_upper [hip] → legL_lower [knee] → footL [ankle]; same for R
- Blink = eye scaleY → 0.1. Mouth = swap shape by expression.

## Poses required on the sheet
1. idle — front, standing, arms relaxed.
2. point — three-quarter view, one arm raised pointing to the side (the "I choose this one" gesture),
   head tilted, weight on one leg.

## Sheet layout (1920×1080 PNG)
- Top-left: style name in small caps (code-drawn text is fine).
- Left: big idle full body (~620 px tall).
- Centre: point pose (~560 px tall).
- Right top: the 4 expression heads in a 2×2 grid, each labelled.
- Right bottom: "rig" exploded view — parts pulled slightly apart with small pivot dots.
- Background: the style's own background treatment, based on #F4EAD5.

## Rules
- Deterministic: no Math.random(); use a seeded hash/PRNG so every render is identical.
- No text inside the art other than the small sheet labels.
- Set `window.__READY = true` after the final render; render with `node pilot/tools/shoot.cjs`.
