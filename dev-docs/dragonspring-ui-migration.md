# Dragonspring UI migration checklist

Target branch: `test/official-4.6.4-sync` (local only).

This checklist records source-level migration evidence. Visual acceptance is intentionally left to the project owner.

| Area | Components and assets | 4.6.4 compatibility retained | Status |
| --- | --- | --- | --- |
| Title | `UI/Title/Title.tsx`, `title.module.scss`, five normal/hover image pairs | Uses the 4.6.4 `title` style key, config listener, official start/load/menu actions and appreciation availability check | Migrated |
| Text and name box | `Stage/TextBox/IMSSTextbox.tsx`, `textbox.module.scss`, textbox/namebox/Auto/cursor images, `characters.json` | Uses the 4.6.4 `textbox` style key; preserves `isRead`, `Line_height`, enhanced text, template style replacement and current Auto controller | Migrated |
| Backlog | `UI/Backlog/Backlog.tsx`, `backlog.module.scss`, backlog/name/button images | Uses current backlog state and jump API; stops Auto on open; template character JSON can override the bundled fallback | Migrated |
| Bottom controls | normal and Film control components and SCSS | Uses `useStageState`; keeps the 4.6.4 Flowchart entry when enabled; hides normal controls on title and Film controls during judgment | Migrated |
| Menu shell | menu and menu-panel SCSS; current 4.6.4 menu components | Keeps Flowchart, new menu state and official panel routing; restores the Dragonspring cancel sound and return-title dialog | Migrated |
| Save and load | Save/Load components and `SaveAndLoad.module.scss` | Uses current storage/load/save APIs; keeps the custom five-slot page layout and overwrite confirmation | Migrated |
| Options | options, button, option, slider and about styles | Keeps dynamic font options, language dropdown, skip policy, flowchart reset and current security attributes | Migrated |
| Global dialog | component and SCSS; alert/button images | Left/right actions remain optional for 4.6.4 callers; custom HTML emphasis and click/cancel sounds retained | Migrated |
| Appreciation | Extra SCSS and animation; current 4.6.4 components | Keeps grouped CG series, order handling and image/video support; restores custom shell styling and cancel sound | Migrated |
| Logo and language selection | logo and translation SCSS | Keeps 4.6.4 logo visibility lifecycle and responsive language layout; restores Dragonspring fonts | Migrated |
| Phone | `UI/Phone`, phone/icon assets | Mounted in `App.tsx`; save/load/backlog/options/title actions use current stores | Present and connected |
| Manopedia, item and evidence | Manopedia, update/show-item, item display, evidence confirmation and handbook button | Mounted in `App.tsx`; command/state/save compatibility is covered by the main migration manifest | Present and connected |
| Judgment, testimony and thinking | timer, testimony layer, thinking overlays/menu and judgment media | Mounted in `App.tsx`; runtime commands and label jumps are covered by parser tests | Present and connected |

## Deliberately not copied

- Old `.module.css` and `.module.min.css` files: generated from the SCSS sources by the current build.
- Old Flowchart components: the official 4.6.4 implementation is newer and remains in use.
- Old option, CG appreciation, logo and stage wrappers: their custom visual rules were merged without removing official state and data behavior.
- Old bundles and template output: they must be regenerated from this branch.

## Source-level verification

- `src/assets/dragonspring` has the same 81-file tree as `Dragonspring`.
- Custom UI roots are mounted in `App.tsx`.
- All parser tests pass (43 tests, including 14 custom-command cases).
- `yarn webgal:build` passes and emits the title, textbox, backlog, Phone, Manopedia, evidence, judgment and thinking assets.
- `git diff --check` and conflict-marker scans are required before each local commit.
