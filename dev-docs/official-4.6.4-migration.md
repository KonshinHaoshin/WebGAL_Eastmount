# Official 4.6.4 migration manifest

Frozen upstream: `OpenWebGAL/WebGAL@60ad94f4b21288783cb9964dc70f82535ba2e2b1`.

This branch rebuilds the Dragonspring customization layer on the official tree. It intentionally does not copy old upstream code or build output.

| Area | Migration result |
| --- | --- |
| Parser contracts | Custom command enum, script config and parsing tests ported. |
| Manopedia and inventory | State, GUI, item display, evidence presentation and save/reset compatibility ported. |
| Judgment workflow | Judgment, timer/timeout, testimony, thinking, refute and clear-testimony runtime ported. |
| Visual extensions | `webgal_mano`, pose compatibility, figure/background LUT and Pixi integration ported. |
| Transitions | `blindsIn` ported; legacy `-type=blinds` maps to the new animation without changing old scripts. |
| Preview | Official editor-preview protocol retained; its set-effect command supersedes the old private `SET_EFFECT` message. |
| Official overlap | Official jumpLabel, Steam, Spine and lip-sync implementations retained. |
| Saves | Missing new fields use official defaults; legacy stage fields are merged over those defaults. |

Custom commands covered by the parser suite: `manopedia`, `pediaUpdate`, `addItem`, `showItem`, `clearItem`, `presentTheEvidence`, `judgment`, `refute`, `thinking`, `testimony`, and `clearTestimony`.

Verification commands:

```text
cd packages/parser && yarn vitest run
yarn webgal:build
```

Manual browser regression remains the release gate for timed judgment interaction, evidence UI, Mano rendering, LUT appearance, Steam-unavailable fallback and save loading.
