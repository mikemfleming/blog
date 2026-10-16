---
title: Avoiding Render-Blocking Scripts
date: 2019-09-27
description: How script placement, async, and defer affect page rendering, with a reminder about DOMContentLoaded event timing.
tags: [javascript, performance, lighthouse]
draft: false
---

I've been using [Lighthouse](https://developer.chrome.com/docs/lighthouse/overview/) to investigate page performance, and one warning keeps inviting me down a useful rabbit hole: resources that delay rendering.

A small script tag can have a surprisingly large effect on how quickly a page becomes usable. The interesting part is understanding what the browser is waiting for.

## What a script tag asks the browser to do

Consider an external, classic JavaScript script in the document head:

```html
<html>
    <head>
        <script src="/my_script.js"></script>
    </head>
    <body>
        <h1>Hello, eventually.</h1>
    </body>
</html>
```

When the HTML parser reaches this script, it pauses while the script is fetched and executed. Browsers can discover other resources ahead of the parser, but parsing the rest of the document still has to wait. Stylesheets can add dependencies too.

That distinction matters: a classic script is **parser-blocking** by default. Putting it in the head can delay the content that follows it, even if the script has nothing to do with displaying that content. Our greeting shouldn't have to wait for analytics to finish its paperwork.

## Choose when the script should run

### Put it near the end of the body

This is a useful old-school option. The parser reaches most of the page's markup before encountering the script.

It doesn't mean the browser has finished painting the page, and the script can still occupy the main thread. It also delays discovery of that script compared with placing a deferred script in the head.

### Use `defer` for scripts that need the document

```html
<script defer src="/my_script.js"></script>
```

For external classic scripts, `defer` allows downloading alongside HTML parsing. Execution happens after parsing finishes and before `DOMContentLoaded`. Deferred scripts execute in document order, which is handy when one depends on another.

There isn't a `domInteractive` event that triggers them. `interactive` is a value of `document.readyState`; the distinction saves a fair amount of head scratching when debugging event timing.

### Use `async` for independent scripts

```html
<script async src="/analytics.js"></script>
```

An async script also downloads without holding up the parser, but executes as soon as it is ready. Its execution can interrupt parsing, and multiple async scripts don't have a guaranteed execution order.

I use this when a script is independent of the document structure and other scripts. Adding both `async` and `defer` doesn't combine their benefits: browsers that support both use async behavior.

These rules describe classic scripts. Module scripts have their own behavior, including deferred execution by default. The [script element documentation](https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Elements/script) is a good reference when mixing the two.

## Check initialization before changing the tags

A script loaded after `DOMContentLoaded` won't receive an event that has already happened. If the same initialization code might run at different points in the page lifecycle, check readiness first:

```js
function initialize() {
    // Find elements and attach the application's event handlers.
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initialize, { once: true });
} else {
    initialize();
}
```

My takeaway: choose loading behavior based on dependencies, then measure the result. Moving a script can remove an unnecessary wait; reducing the work inside it helps with the next bottleneck.
