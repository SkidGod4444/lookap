# lookap design system

One canvas, one metal, one voice. Everything below is a rule, not a suggestion. If a screen breaks a rule, fix the screen.

## 1. Idea

lookap is a registry of measured interfaces. The UI is the tray the work sits on: dark, quiet, precise. Colour belongs to the content (posters, clips). The chrome is black, white and silver only. Buttons are the only convex objects on the page; everything else is flat or recessed.

## 2. Tokens (`src/app/globals.css`)

| Token | Value | Use |
|---|---|---|
| gutter | #0a0a0a | page background |
| canvas | #111111 | the main surface |
| card | #181818 | panels, inputs |
| foreground | #f5f5f5 | primary text |
| silver | #c9c9c9 | secondary text on panels, mono values |
| silver-bright | #e8e8e8 | emphasis, active chip, primary button body |
| subtle | #8a8a8a | captions, labels, helper text |
| line | 8% white | hairlines between things |
| line-strong | 14% white | hairlines around things |

No other colours in chrome. Green, red and blue appear only inside content (posters, demo clips, status in a recipe).

## 3. Type

Inter for everything. JetBrains Mono for values, code and tool names only.

| Role | Size / leading | Weight | Tracking |
|---|---|---|---|
| Display (home hero only) | 52 / 1.05 | 500 | -0.03em |
| Page title | 28 / 1.15 | 500 | -0.02em |
| Section title | 20 / 1.2 | 500 | -0.02em |
| Card title | 15 / 1.3 | 500 | 0 |
| Body | 14 / 1.55 | 400 | 0 |
| Caption, labels | 12 / 1.4 | 400 | 0 (uppercase labels: 11, +0.06em) |
| Mono value | 12 | 400 | 0 |

One display size, one page-title size. Pricing, MCP, Clone and Tools all use the page title, not their own number.

## 4. Layout

- Shell: canvas inset in the gutter with a 1 px line, max 1680. Side gutter 16 on phone.
- Text pages (Pricing, MCP, Tools): `max-w-[880px]`, `py-10`, sections separated by `gap-10`. The same width everywhere.
- Feed pages: full width grid, 4 / 3 / 2 / 1 columns, gap 8 px. Cards keep the aspect ratio of their media.
- Project page: stage left, panel 280 wide on the right at `lg` and up. Under `lg` the panel stacks below the stage at full width. Never a fixed side panel on a phone.
- Vertical rhythm: 8 px base. Section padding 40, between related blocks 24, inside a card 20.

## 5. Components

**Buttons.** Machined metal, `button("silver")` and `button("outline")` only. Rules: one silver button per view (the single most important action); outline for the second action; anything third is a text link, not a button. Height 36 in content, 32 in headers and cards. Pill in the hero and header, radius 8 inside panels.

**Badges and chips.** Pressed slot, `badge(...)`. Labels, not actions. Active chip is the light insert. Avatar bubbles use the dark slot at 20 px. Never give a badge a hover state unless it is a link.

**Cards.** Media fills the card at its own ratio; no text inside the media except the poster placeholder's title. Avatar bubble bottom-left, one optional tag bottom-right. No card has more than one hover affordance.

**Inputs.** `bg-card`, `ring-1 ring-line`, focus `ring-ring`. The submit button sits inside the field on the right. Placeholder is an example value, not instructions.

**Panels.** `bg-card ring-1 ring-line rounded-2xl p-5`. Dividers inside a panel are `divide-line`. No shadows on panels; shadows belong to buttons and to media in the project stage.

## 6. Motion

- Only buttons and the mascot animate in the chrome. Content animates as its clip does.
- Press: 2 px seat, 150 ms. Hover: colour or ring only, 150 ms. No sheens, no sweeps.
- Cards: no transform on hover. Ring brightens.
- Respect `prefers-reduced-motion` everywhere (the recipes already do).

## 7. Copy

- Second person, present tense, one idea per sentence. "Browse free. Connect your agent with a key."
- Name what exists. No "moodboards", "clone from video" or "analyse" until the feature ships.
- Numbers only when measured. "13 colours sampled" is fine; "3 minutes to a build" is not.
- Empty states say what is missing and what to do: "No bento entries yet. Browse the feed." Never fake a full grid.

## 8. Page templates

- **Home:** hero (title, one line, two buttons, live demo) and one feed section. Nothing else.
- **Feed / section:** filter rail, grid. The grid's first cell is a title cell only on the top-level feed.
- **Project:** stage, panel (attribution, link out, category, types, "In the registry" note). No actions we cannot perform.
- **Text pages:** title, one line, then sections with uppercase labels.

## 9. Checks before shipping a screen

1. One silver button on screen? 2. Every chip a label, every action a button or link? 3. Phone width has no horizontal scroll and no fixed side panel? 4. Headline uses the scale, not a one-off size? 5. Copy names only features that exist?
