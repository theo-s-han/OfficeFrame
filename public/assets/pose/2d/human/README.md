# 2D Human Assets

This folder stores local 2D human character assets for the pose maker.

## Rules

1. Codex does not auto-download external assets into this folder by default. Downloads are allowed only when the user explicitly requests them and the official source/license has been verified.
2. Add only same-origin assets under `/public/assets/...` so PNG export can render them safely.
3. You must verify the license before bundling any external asset.
4. Recommended sources:
   - Open Peeps: [https://openpeeps.com/](https://openpeeps.com/) — CC0
   - Humaaans: [https://www.humaaans.com/](https://www.humaaans.com/) — CC0
   - Kenney Toon Characters: [https://kenney.nl/assets/toon-characters](https://kenney.nl/assets/toon-characters) — CC0
   - OpenGameArt: [https://opengameart.org/](https://opengameart.org/) — license varies
   - SVG Repo: [https://www.svgrepo.com/](https://www.svgrepo.com/) — license varies
5. Production assets must record:
   - asset name
   - source URL
   - license
   - author
   - whether attribution is required
   - whether the asset was modified
6. Figma/Sketch/SVG illustration assets are not automatically rigged for free posing.
7. To support pose editing, separate parts such as `head`, `hair`, `torso`, `upper-arm`, `lower-arm`, `hand`, `upper-leg`, `lower-leg`, and `foot`.
8. Files under `reference/` are official sample downloads kept for style/reference only. They are not rigged pose assets and should not be wired into the live 2D pose renderer without part separation.

## Included Placeholder

`basic-cartoon` is a project-generated placeholder asset for functional verification only.
Replace it with a production-ready asset before shipping if visual quality matters.

## Current Default Packs

- `studio-office`
- `studio-casual`
- `studio-hero`
- `studio-neutral`

These are project-shipped segmented SVG paper-doll packs used as the current default 2D pose characters.
They support the existing skin / cloth / hair / accent color controls through SVG token replacement at load time.

## Current References

- `reference/open-peeps/*`: official sample SVG downloads from Open Peeps CDN, licensed CC0.
- `reference/humaaans/*`: official sample SVG downloads from Humaaans CDN, licensed CC0.
- Full design libraries for Open Peeps and Humaaans are still distributed through their official Gumroad/Blush flows, so automated bulk onboarding is not assumed.

## Current Rig Packs

- `studio-office`: default high-quality office character pack
- `studio-casual`: default high-quality casual character pack
- `studio-hero`: default high-quality hero/presenter character pack
- `studio-neutral`: default high-quality neutral character pack
- `basic-cartoon`: internal placeholder segmented pack
- `open-peeps-lite`: experimental external-style segmented pack, adapted in-project from Open Peeps reference study
