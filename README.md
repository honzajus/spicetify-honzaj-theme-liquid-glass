# now-playing-glow

A [Spicetify](https://spicetify.app/) extension that tints Spotify's now-playing bar with a live gradient sampled from the current track's cover art.

It samples two points from the cover art (left half / right half) and exposes them as CSS custom properties, so the whole bar stays visibly tinted instead of fading into the background. Colors update automatically on every track change.

## Preview

The bar's background is a horizontal gradient built from `--cover-r1/g1/b1` (left) and `--cover-r2/g2/b2` (right), plus rounded corners, a subtle border, and a backdrop blur.

## Files

- [`now-playing-glow.js`](./now-playing-glow.js) — the extension. It samples the cover colors, sets the CSS variables, and injects the stylesheet below on its own. This is the only file you need for the install steps.
- [`now-playing-glow.css`](./now-playing-glow.css) — the same stylesheet as a standalone file, for reference or if you'd rather paste it into a Spicetify Marketplace custom CSS snippet instead of using the extension's auto-injection.

## Requirements

- [Spicetify CLI](https://spicetify.app/docs/getting-started) installed and working (`spicetify -v`)

## Installation

1. Download [`now-playing-glow.js`](./now-playing-glow.js).
2. Copy it into your Spicetify Extensions folder:
   - macOS/Linux: `~/.config/spicetify/Extensions/`
   - Windows: `%appdata%\spicetify\Extensions\`
3. Register and apply it:
   ```bash
   spicetify config extensions now-playing-glow.js
   spicetify apply
   ```
4. Restart Spotify.

## How it works

- On every `songchange`, it first tries Spotify's own color API (`Spicetify.colorExtractor`).
- If that's unavailable, it falls back to sampling the cover art directly via `<canvas>`.
- The resulting colors are written to `--cover-r1`, `--cover-g1`, `--cover-b1`, `--cover-r2`, `--cover-g2`, `--cover-b2` on `<html>`, and used by an injected stylesheet that styles `.Root__now-playing-bar`.
- The stylesheet is kept as the last element in `<body>` via a `MutationObserver`, so it reliably wins over other installed Spicetify Marketplace CSS snippets that target the same selectors.

## Customizing

Feel free to edit the CSS template string inside `now-playing-glow.js` — it references `--cover-r1/g1/b1` and `--cover-r2/g2/b2` for the sampled colors.

## License

MIT
