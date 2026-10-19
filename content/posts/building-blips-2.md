---
title: Building Blips 2
date: 2026-10-19
description: Rebuilding Blips with AI, making musical behavior observable, and learning where working code still needs design judgment.
tags: [javascript, ai]
draft: false
---

I built the [original Blips](https://mikemfleming.github.io/blips/#/) in 2018, without AI. It's a browser instrument built around Conway's Game of Life: columns represent steps, rows represent notes, and live cells play as the sequencer crosses the grid. Each generation changes the pattern and the music.

[Blips 2](https://mikemfleming.github.io/blips2/#/) began with an idea: accumulate previous generations beneath the current grid, turning a composition into a sculpture. Building it with Codex also let me explore how AI could help me develop the project. Looking back through my prompts, the most useful outcome was a better way to investigate the music itself.

**Building something to learn with**

After expanding the grid to 32 × 32, I asked which note each cube represented. The rows repeated the original 16-note mapping twice, jumping from C3 back to C6 between rows 16 and 17.

Spatial relationships influence the sound: neighboring cells interact under the Game of Life rules, while live cells in one column sound together. I asked whether a different arrangement could make neighboring notes more harmonious.

Codex suggested a continuous pentatonic range, adjacent chord tones, or a descending and ascending wave. But “harmonious” needed unpacking. Nearby pitches can produce smooth melodic movement and dense simultaneous clusters. A pentatonic scale constrains the palette without settling the voicing.

I didn't know which mapping I wanted. So I asked for an interface to experiment with it.

The resulting Note lab offered scale and chord palettes, root and octave controls, row arrangements, individual overrides, and a simultaneous-note limit. I could hold the composition constant while changing its musical interpretation, then restore the original mapping.

The next refinements made those experiments understandable. I initially requested labels along the y axis, then moved them directly onto the currently sounding cubes. That's where my attention was while listening; tracing rows back to an axis on a rotated sculpture was unnecessary work.

Arrow-key stepping let me pause, sound one column, and leave its cubes highlighted and labeled. Crossing an edge moved between generations. I could inspect a combination instead of trying to catch it during playback. Best-fit chord names added another way to interpret the sounding notes without implying that every combination had one definitive name.

The lab eventually needed simplification too. Advanced settings moved out of the primary view. I removed a redundant Listen control and requested import to complement export, so I could return to earlier experiments.

I haven't established one best note arrangement. I gained a way to edit, hear, inspect, and revisit alternatives. That's the lesson I most want to remember: when I can't specify the right behavior yet, AI can help me build a tool for discovering it.

**Making the sculpture usable**

The sculpture needed a similar feedback loop. I preserved the original rainbow playback animation, removed axis labels and the surrounding border, and expanded the workspace to fill the browser. Moving the gray grid between the current cubes and their history made the layers easier to distinguish. The explainer became a scrollable modal focused on the technical ideas.

Interactions took several passes. Dragging cells initially rotated the sculpture; I wanted it to draw notes, with background dragging reserved for rotation. The organism picker worked, but covered the grid, obscured its own placement preview, and closed after every drop. I requested a movable panel, a clear preview, repeated placement, and R/Shift+R rotation during dragging.

Mobile needed touch targets, bounded panels, pinch zoom, and two-finger rotation without accidental edits. Using each feature revealed requirements that its initial implementation hadn't captured.

**Understanding the rendering cost**

Doubling both grid dimensions quadrupled the possible cells per layer and exposed problems in Codex's SVG renderer. I asked for an explanation before requesting a fix.

Code inspection showed that playback, drawing, and rotation repeatedly projected vertices, sorted faces, and recreated React elements. Even playback highlighting rebuilt unchanged history. A fully occupied layer could generate 12,288 DOM elements.

The replacement used WebGL instancing, reused history buffers, batched drawing updates, and changed playback colors without rebuilding geometry. Passing build checks hadn't established that the design would scale. Asking where the work happened helped identify an architectural improvement.

**Keeping the constraints visible**

Sharing began with a hex representation: 1,024 grid bits plus a major/minor bit. When I asked about memorable names like what3words, Codex suggested storing compositions behind short names. I had to restate that the application should be stateless.

That redirected us toward packed binary, compression, and URL-safe encoding. Sparse patterns could produce short links; arbitrary grids couldn't be guaranteed the same compression. A seed button replaced the visible hex string, and URL loading restored the composition. Tempo and effects later joined the seed because reproducing the grid alone didn't reproduce the sound.

Other corrections exposed smaller assumptions. My request for a “.05 second delay” slowed the sequencer; I meant an echo. Deployment guidance followed the current `pages` branch until I specified `master` and a separate repository. Plausible interpretations still needed correction.

Adding spatial audio, delays, filters, and modulation also crowded the toolbar. I asked to consolidate sound settings, just as I'd simplified Note lab. Generating features was fast enough that deciding what deserved interface space became recurring work.

Rebuilding Blips let me explore further, but I kept supplying the judgment about what belonged. Note lab made that collaboration especially useful: each implementation improved my ability to hear the consequences, ask a more precise question, and try again.
