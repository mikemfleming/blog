---
title: Making Web Performance a Team Priority
date: 2020-01-06
description: Make web performance a product team priority with Lighthouse scores, ongoing discussions, and a performance budget.
tags: [performance, lighthouse, user-experience]
draft: false
---

A fast website feels like a team that respects your time. Getting there takes more than asking a developer to make the bundle smaller at the end of a sprint.

I've been learning how to make performance part of the product conversation: something we consider when choosing a design, adding a dependency, or deciding what to ship. The useful question is, “What will this decision cost the person using it?”

## Learn from results, without borrowing someone else's promise

[Pinterest's engineering team reported](https://medium.com/pinterest-engineering/driving-user-growth-with-performance-improvements-cfc50dafadd7) a 40% reduction in wait time alongside a 15% increase in search traffic and a 15% increase in signup conversion rate after rebuilding pages for performance.

That's a compelling reason to investigate our own experience. It's also a case study, not a formula: cutting our load time by 40% doesn't guarantee the same business result. Audience, devices, network conditions, and the changes themselves all matter.

Perceived speed deserves attention too. Useful content appearing early can make a page feel more responsive, even while other work continues. A loading indicator can explain a wait, but it can't make an expensive request finish sooner. I want us to understand both the actual delay and the experience around it.

## Start with a repeatable baseline

[Lighthouse](https://developer.chrome.com/docs/lighthouse/overview/) gives us automated audits and a useful starting point for investigation. I like using it to turn “this feels slow” into a more specific conversation about loading, main-thread work, or a large resource.

Run comparisons under consistent conditions: the same page, device profile, and tool version, with multiple runs. A score from a fast laptop on a quiet network isn't interchangeable with one from a busy CI runner.

I also separate lab results from field measurements. Lighthouse gives us a controlled test; real-user data tells us what people actually experience across their devices and connections. Neither replaces the other.

A score is a diagnostic aid, not a search-ranking guarantee or a complete accessibility assessment. Google's [page experience guidance](https://developers.google.com/search/docs/appearance/page-experience) makes that broader context clear. Chasing a green circle is fun; shipping an improvement people can feel is better.

## Give the team a decision to make

Performance findings are more useful when they have context, an owner, and a next step. For example:

- Which user journey is affected?
- What does the trace suggest is causing the delay?
- What's the smallest change that could test that explanation?
- How will we know whether the change helped?

Design can question a heavy animation. Product can prioritize a slow checkout. Engineering can measure competing implementations. This works best when we make the tradeoff visible before the release crunch.

## Set a budget we can use

A performance budget puts a constraint around a decision. It might limit JavaScript transferred on an important route or set a target for a loading metric under an agreed test profile.

Pick a budget that matches the experience we're trying to protect, record how it's measured, and decide what happens when we exceed it. A warning with no owner is very easy to become accustomed to.

I like starting with an achievable baseline and tightening it as the team learns. The goal is to make performance a normal part of delivering a feature, with enough room to experiment and enough feedback to notice when an experiment gets expensive.
