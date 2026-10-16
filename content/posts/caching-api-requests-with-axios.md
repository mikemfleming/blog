---
title: Caching API Requests with Axios
date: 2019-05-13
description: A practical introduction to caching API requests with axios-cache-adapter, including time to live, stale data, and failure considerations.
tags: [javascript, caching, axios]
draft: false
---

Caching is one of those changes that can look tiny in a pull request and have a noticeable effect on an application. Avoid repeating expensive work, and suddenly a busy endpoint has some breathing room. Lovely.

The useful engineering question is what makes two requests equivalent, and how long we're comfortable reusing the answer.

## Start with a small cache

A cache associates a key with a previously computed value. Hash-based stores can make lookups efficient, but the full operation still includes work such as building the key, checking expiry, and sometimes accessing a remote store. “Fast lookup” isn't the same as “free.”

Function memoization, such as Lodash's `memoize`, applies the idea to function results. An HTTP response cache has extra decisions: method, URL, query parameters, authentication, and freshness can all affect whether reuse is correct.

My original example used [axios-cache-adapter](https://github.com/lisaogren/axios-cache-adapter). That repository is now archived, so treat the package choice as historical rather than a recommendation for a new application. The underlying experiment is still useful: give a successful GET response a short time to live and watch what happens.

```js
const { setup } = require('axios-cache-adapter');

const httpClient = setup({
    baseURL: 'http://127.0.0.1:3001',
    cache: { maxAge: 3 * 1000 } // Three seconds, in milliseconds.
});
```

The adapter caches GET responses by default. Requests that match its cache rules can reuse a fresh entry; a miss or expired entry sends the request to the server. This is application-level caching, separate from the browser's HTTP cache.

## Make the behavior observable

Comparing response timestamps is tempting, but unchanged data doesn't prove that a response came from a cache. A better experiment is to inspect the adapter's cache indicator and count actual server requests.

For the historical adapter setup above, this small local server keeps the experiment independent of an external clock API:

```js
const http = require('http');
let serverRequests = 0;

const server = http.createServer((request, response) => {
    response.setHeader('Content-Type', 'application/json');
    response.end(JSON.stringify({ serverRequests: ++serverRequests }));
});

const wait = ms => new Promise(resolve => setTimeout(resolve, ms));

server.listen(3001, '127.0.0.1', async () => {
    try {
        for (const delay of [0, 1000, 1000, 1500]) {
            await wait(delay);
            const response = await httpClient.get('/time');
            console.log({
                fromCache: Boolean(response.request.fromCache),
                serverRequests: response.data.serverRequests
            });
        }
    } catch (error) {
        console.error(error);
        process.exitCode = 1;
    } finally {
        server.close();
    }
});
```

There are four client calls, normally producing two requests to the local server: the initial miss and a fresh request after expiry. The middle calls reuse the cached value. The final delay puts us beyond the TTL instead of relying on hitting an exact three-second boundary. Timing and configuration still matter, so inspect the output rather than treating an attempt number as proof.

## Decide what we're allowed to reuse

Before putting a cache in front of a real API, I want the team to answer a few questions:

- **How stale can the data be?** A three-second-old clock is a nice demonstration and a questionable clock.
- **What belongs in the key?** Data for one user must not become a cache hit for another. Check the library's rules instead of assuming headers and query parameters are included.
- **What happens after a write?** Waiting for TTL expiry isn't always sufficient invalidation.
- **What happens on failure?** Decide which responses are cacheable and whether serving stale data is acceptable. Don't accidentally preserve an outage as a cached success-shaped response.
- **What happens when many entries expire together?** Warm-up, request coalescing, and staggered expiry can help avoid a burst of work at the origin, depending on the system.

A circuit breaker can stop repeated calls to a failing dependency. It doesn't decide which responses get cached or invalidate them; those are separate policies.

That's what makes caching interesting to me. The code that stores a value can be small. The real design work is making the rules explicit, measuring hits and misses, and making sure a faster answer is still an acceptable answer.
