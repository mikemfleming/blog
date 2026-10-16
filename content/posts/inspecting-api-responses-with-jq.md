---
title: Inspecting API Responses with jq
date: 2019-11-28
description: Use curl, json_pp, and jq to prettify API responses and filter JSON down to the fields you need.
tags: [api, json, command-line, jq]
draft: false
---

When I'm working with an API, I want to inspect its response before building assumptions into the application. The terminal is a great place for that conversation. No UI to build, no temporary logging to clean up, just a request and some evidence.

I usually start with `curl`. Here's a request for a release from the Discogs API:

```sh
curl -fsS 'https://api.discogs.com/releases/807151'
```

`-f` makes HTTP error responses fail the command, while `-sS` hides the progress meter but keeps error messages. A real integration also needs to follow the API's authentication and rate-limit requirements; this example focuses on inspecting a successful JSON response.

## Make the response readable

A compact JSON response is great for transport and less delightful for eyeballs. If `json_pp` is available on your machine, it can pretty-print the response:

```sh
curl -fsS 'https://api.discogs.com/releases/807151' | json_pp
```

Tool availability varies between machines, so I don't assume every macOS installation has the same utilities. For repeated exploration, I reach for [jq](https://jqlang.org/manual/).

```sh
# Install jq with Homebrew if you use it.
brew install jq

curl -fsS 'https://api.discogs.com/releases/807151' | jq '.'
```

The `.` filter returns the input unchanged, but jq formats it for reading. It normally adds color when writing to a terminal. A small improvement, and my eyes are already happier.

## Ask a smaller question

The real payoff comes when the payload is large and I only care about one part of it.

```sh
# Show the videos field.
curl -fsS 'https://api.discogs.com/releases/807151' | jq '.videos'

# Return an array containing only each video's title and URI.
curl -fsS 'https://api.discogs.com/releases/807151' \
  | jq '[.videos[]? | {title, uri}]'
```

Here's how the second filter fits together:

- `.videos` selects a field from the input object.
- `[]?` iterates its values when possible without failing on a missing or null field.
- `{title, uri}` constructs a smaller object for each result.
- The surrounding brackets collect those results into an array.

Without the optional `?`, trying to iterate a missing or null field would produce an error. Whether to tolerate that depends on the job: convenient exploration and strict contract validation have different goals.

## Keep failures visible in scripts

An interactive command is one thing; a CI check needs a little more care. In Bash, the exit status of a pipeline normally comes from its last command. Use `pipefail` when you need a failed request to fail the overall pipeline too:

```bash
set -o pipefail
curl -fsS 'https://api.discogs.com/releases/807151' | jq '.videos'
```

jq can do much more, including mapping and reducing. The part I like most is how quickly it lets me test an assumption about an API response. A tiny filter can turn a wall of JSON into the exact answer I needed. Happy jq'ing!
