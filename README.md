# Mr Day's Maths Tools

Interactive classroom maths activities, hosted as a static GitHub Pages website.

## Tools
- **Dice Lab** (`docs/dice-lab/`): 1–6 dice with 4, 6, 8, 10, 12 or 20 faces; sums or individual results; grouped tables and charts; theoretical comparison.
- **Coin Lab** (`docs/coin-lab/`): 1–100 coins; heads, tails, both, or each coin separately; automatically scaled coin visuals; grouped tables and charts; theoretical comparison.

Both tools include silent animations, batch experiments, optional tally marks, undo/reset and CSV export. Results remain in browser memory until reset or reload. No accounts, analytics, database or API keys are used by these applications.

## Hosting
GitHub Pages serves **main → /docs**. Every commit to the published source is automatically redeployed by GitHub Pages. No build command or dependencies are required.

The public homepage is `https://valkanyz.github.io/mr-days-maths-tools/` once Pages is enabled and its deployment succeeds.

## Update a tool
Edit its HTML, CSS or JavaScript files within `docs/`, then commit to `main`. Each tool is independent and uses relative asset paths, so project-subdirectory hosting works.

## Add another activity
Create `docs/<activity-name>/index.html` and its assets. Add a card and, if appropriate, a new subject section to `docs/index.html`. Use relative URLs. Keep student personal data out of the source and application.

## Local validation
Run with a modern Node.js version:

```
node tests/dice-lab.cjs
node tests/coin-lab.cjs
```

Open `docs/index.html` in a browser or serve `docs/` with any static web server for local preview.

The original ChatGPT-hosted sites remain separate. Changes to this repository deploy to GitHub Pages; they do not automatically update the original copies.
