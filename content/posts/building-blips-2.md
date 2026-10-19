---
title: Building Blips 2
date: 2026-10-19
description: What rebuilding Blips taught me about prompting, testing, and refining software with AI.
tags: [javascript, ai]
draft: false
---

I built the [original Blips](https://mikemfleming.github.io/blips/#/) in 2018, without AI. It makes music from Conway's Game of Life. Columns are steps, rows are notes, and live cells play as the sequencer passes.

For [Blips 2](https://mikemfleming.github.io/blips2/#/), I asked Codex to stack past generations beneath the grid, creating a growing sculpture. That started a development loop: ask for a change, try it, notice what felt wrong, and refine the request.

**Building a way to ask better questions**

The most useful experiment started when I asked which note each cube played. The expanded grid repeated the original mapping, with a three-octave jump halfway through.

I asked for more harmonious neighbors. Codex suggested new arrangements, but I didn't know which would sound best. Nearby pitches might make a smooth melody or a crowded chord.

So I asked for a tool to explore the question. Codex built Note lab, where I could change scales, rearrange pitches, edit rows, and limit simultaneous notes.

Using it shaped my next prompts. I requested note labels on the axis, then moved them onto the sounding cubes. I added arrow-key stepping to stop and hear individual columns. Best-fit chord names helped explain what I heard. Import and export let me revisit experiments.

Each change made the next decision easier. I was learning what to build by using what we'd just built.

**Working code was the starting point**

The sculpture needed the same loop. Dragging initially rotated it; I wanted dragging on cells to draw notes. The organism picker covered the workspace and closed after each drop. I asked for a movable panel, repeated placement, and rotation during dragging.

A larger grid also exposed the SVG renderer's cost. I asked Codex to explain the slowdown. It found repeated geometry work and thousands of DOM elements. We replaced that approach with WebGL instancing and batched updates.

Sharing tested another assumption. Codex proposed short names backed by stored compositions. I restated the stateless requirement. We moved to compressed data in the URL, including musical settings needed to reproduce the sound.

Some corrections were simpler: “delay” meant echo, not slower playback. Added features crowded the toolbar, so I asked to consolidate controls.

AI made these experiments quick to implement. My work was to use them, question the results, and keep the constraints clear. Note lab took that loop further: it gave me better feedback, which helped me write better prompts.
