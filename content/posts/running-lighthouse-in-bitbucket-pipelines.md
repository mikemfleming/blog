---
title: Running Lighthouse in Bitbucket Pipelines
date: 2020-02-04
description: Set up Lighthouse CI in a Docker container and schedule daily performance and accessibility checks with Bitbucket Pipelines.
tags: [lighthouse, bitbucket, ci, performance]
draft: false
---

I've been using [Lighthouse](https://developer.chrome.com/docs/lighthouse/overview/) to make performance discussions more concrete. It gives us repeatable lab audits for performance, accessibility, best practices, and SEO, along with details we can investigate.

I introduced scheduled checks in Bitbucket Pipelines and sent results to our SignalFx dashboard. The useful part was the trend: we could see a regression, connect it to a change, and measure whether our next attempt helped.

The script below stops at collecting reports and evaluating assertions. Sending metrics to a dashboard is a separate integration, and it's worth keeping those responsibilities visible.

## Decide what the check tells us

A Lighthouse score describes a particular test run. It isn't a direct measure of every user's experience, a complete accessibility audit, or a promise of better search rankings.

CI runners also vary in available CPU and network conditions. I want consistent tooling, multiple runs, and enough context to tell a real regression from a noisy measurement. An unexplained red build is a quick way to teach a team to ignore red builds.

This article began with a 2020 setup. I've revised the example to avoid presenting Node 10 and the old `apt-key` installation procedure as current instructions. The structure stays the same: prepare a runner, collect, assert, and retain reports.

## Configure collection and assertions

Install Lighthouse CI as an exact development dependency in the project, then commit the updated manifest and lockfile:

```sh
npm install --save-dev --save-exact @lhci/cli
```

Create `.lighthouserc.json`:

```json
{
    "ci": {
        "collect": {
            "numberOfRuns": 3
        },
        "assert": {
            "assertions": {
                "categories:performance": ["warn", { "minScore": 0.8 }],
                "categories:accessibility": ["warn", { "minScore": 0.8 }],
                "categories:best-practices": ["warn", { "minScore": 0.8 }],
                "categories:seo": ["warn", { "minScore": 0.8 }]
            }
        }
    }
}
```

Here `0.8` is the threshold on Lighthouse's zero-to-one category scale. It isn't a claim that the site is “80% accessible.” Warnings make a reasonable starting point while the team learns the baseline; use `error` for assertions intended to fail CI. The [configuration reference](https://github.com/GoogleChrome/lighthouse-ci/blob/main/docs/configuration.md) covers the available controls.

## Prepare the runner separately

The runner needs a compatible Node.js runtime, Chrome or Chromium, its system dependencies, and the project dependencies installed with `npm ci`. If browser discovery needs help, configure `CHROME_PATH` for the actual executable in that image.

Build and publish an image with those prerequisites for your CI environment, then pin it by version or digest. That makes the browser version an intentional input instead of a surprise package upgrade in the middle of a measurement. Lighthouse CI's [Docker client recipe](https://github.com/GoogleChrome/lighthouse-ci/blob/main/docs/recipes/docker-client/README.md) discusses the container-specific tradeoffs.

My original setup used `--no-sandbox` to get Chrome running under container restrictions. That disables Chrome's sandbox; being inside a container does not make it harmless. Prefer a runner where sandboxing works. If the environment requires disabling it, assess that tradeoff explicitly and keep untrusted pages, credentials, and sensitive mounts out of that job.

## Keep the check script small

With the prerequisites in place, `lighthouse-checks` can focus on the work we actually want to measure:

```bash
#!/usr/bin/env bash
set -euo pipefail

url="${1:?Usage: bash lighthouse-checks https://example.com}"

./node_modules/.bin/lhci healthcheck
./node_modules/.bin/lhci collect --url="$url"
./node_modules/.bin/lhci assert
```

This uses the project's installed CLI instead of downloading a new global version on every run. `set -e` also prevents the script from drifting on to assertions after a failed collection.

Try it in the prepared local environment before connecting the scheduler:

```bash
bash lighthouse-checks 'https://example.com'
```

The target must be reachable from the runner. If it requires authentication, configure that deliberately rather than accidentally measuring the login screen. A very fast login screen is still the wrong test.

## Add the scheduled pipeline

The following is a template: replace `YOUR_REGISTRY/lhci-runner:PINNED_VERSION` with the prepared image described above, and configure `LIGHTHOUSE_URL` as a pipeline variable.

```yaml
image: YOUR_REGISTRY/lhci-runner:PINNED_VERSION

pipelines:
    custom:
        lighthouse-checks:
            - step:
                name: Lighthouse Daily Check
                script:
                    - npm ci
                    - bash lighthouse-checks "$LIGHTHOUSE_URL"
                artifacts:
                    - .lighthouseci/**
```

Schedule this custom pipeline in Bitbucket. Keeping the generated reports as artifacts gives the team something to inspect beyond the summary score. For dashboard reporting, parse the results and submit selected metrics in a separate step; [jq is useful for that](/blog/inspecting-api-responses-with-jq/).

The follow-through matters as much as the scheduler: agree who investigates regressions, keep the test profile stable, and revisit thresholds as the team learns. That's how a daily audit becomes useful feedback instead of one more robot sending messages.
