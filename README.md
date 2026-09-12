# Changa Pow

A Ludo/Pachisi-style cross-track board game for 4 players, played with 4
wooden sticks instead of a die.

Open `index.html` in a browser to play — no build step, no dependencies.

## Rules

- Each player (Violet, Teal, Amber, Rose) has 4 tokens starting in their yard.
- On your turn, toss the sticks. Each of the 4 sticks lands flat-side-up or
  round-side-up (50/50), and the score is:

  | Sticks flat | Score |
  |---|---|
  | 0 (all round) | **8** (bonus: roll again) |
  | 1 | 1 |
  | 2 | 2 |
  | 3 | 3 |
  | 4 (all flat) | 4 |

- Any roll can bring a token out of the yard.
- Tokens travel clockwise around the shared cross-track, then peel off into
  their own colored home lane, then finish at the center hub. An exact score
  is needed to finish.
- Landing on an opponent's token sends it back to the yard, unless that cell
  is marked safe (grey dot) or is a player's own start square.
- First player to bring all 4 tokens home wins.

## Files

- `index.html` — page shell
- `style.css` — board and UI styling
- `game.js` — board geometry, game state, and rendering

The board layout is based on a design handoff (`design_handoff_changa_pow_board/`
in the original brief): a 15x15 cross-track grid with 4 player yards and a
pinwheel center hub.
