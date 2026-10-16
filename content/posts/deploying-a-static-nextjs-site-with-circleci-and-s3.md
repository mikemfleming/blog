---
title: Deploying a Static Next.js Site with CircleCI and S3
date: 2019-06-06
description: Automate a static Next.js build and deploy it to Amazon S3 using CircleCI workflows.
tags: [nextjs, circleci, aws, deployment]
draft: false
---

Static sites move useful work out of the request path. Generate the HTML once, publish the files, and let the host serve them without running the application server for every visitor.

The browser still has plenty to do: parse HTML, load resources, calculate layout, paint, and run JavaScript. Static generation gives us a good starting point, not an automatic performance trophy.

I've enjoyed using Next.js because it gets a project moving quickly. For this experiment, I wanted to understand the deployment plumbing as well: how does a commit become the files someone can visit?

## The pipeline we're building

The sequence is small enough to fit on a whiteboard:

1. Check out the source.
2. Install the locked dependencies.
3. Generate the static site.
4. Pass the generated files to a deployment job.
5. Upload them to an S3 bucket.

This post describes my 2019 setup. The Node 10 image and `next build && next export` command below are historical. For a new project, select supported runtime and build-tool versions; this isn't a current Next.js installation guide. S3 storage, requests, and CI usage can also incur charges, so I wouldn't describe this as unconditionally free.

## Give each system a specific responsibility

Configure an S3 bucket for static website hosting, including the appropriate index document and access policy. AWS explains the options in its [static website documentation](https://docs.aws.amazon.com/AmazonS3/latest/userguide/WebsiteHosting.html).

One detail worth making explicit: S3 website endpoints don't support HTTPS. Use an appropriate fronting service, such as CloudFront, when visitors need HTTPS. A private S3 REST origin behind CloudFront is a different configuration from a public website endpoint. The [endpoint documentation](https://docs.aws.amazon.com/AmazonS3/latest/userguide/WebsiteEndpoints.html) helps keep those choices straight.

Next, connect the repository to CircleCI and give the deployment job permission to upload to the intended bucket. Keep credentials in the CI provider's supported credential mechanism rather than in the repository, and scope permissions to the required operations. Modern setups can use short-lived credentials where supported.

Before writing the workflow, get the export command working locally. A pipeline is much easier to debug when the build itself is already understood.

## Build once, deploy that artifact

For the historical setup, `npm run export` runs `next build && next export`, producing an `out` directory. Here's a simplified `.circleci/config.yml`:

```yaml
version: 2

jobs:
  build:
    docker:
      - image: circleci/node:10.13 # Historical image; choose a supported runtime today.
    working_directory: ~/app
    steps:
      - checkout
      - run: npm ci
      - run: npm run export
      - persist_to_workspace:
          root: ~/app
          paths:
            - out

  deploy_dev:
    docker:
      - image: cibuilds/aws # Historical AWS CLI image.
    steps:
      - attach_workspace:
          at: ~/app
      - run: aws s3 sync ~/app/out s3://MY-PROJECT --region YOUR-REGION

workflows:
  version: 2
  build_and_deploy_dev:
    jobs:
      - build
      - deploy_dev:
          requires:
            - build
          filters:
            branches:
              only:
                - develop
```

Replace the bucket and region placeholders, and ensure the deployment job receives its AWS credentials. `npm ci` assumes a committed, compatible lockfile. This snippet also assumes the historical images provide the tools its commands need.

The workspace is the handoff: `persist_to_workspace` stores `out`, and `attach_workspace` makes it available to the deployment job. We deploy the artifact from the build that passed, rather than rebuilding and hoping for the same result.

The [`requires` dependency](https://circleci.com/docs/reference/configuration-reference/) matters because workflow jobs can run concurrently. It prevents deployment from starting before the build succeeds. The branch filter applies to the deployment job; the build can still run on other branches.

## Check what “sync” actually promises

This command copies new or changed files. It doesn't delete destination files that disappeared locally unless you explicitly request deletion. That can leave old pages around, while adding deletion without considering cached assets can create a different problem.

Uploading files is also not an atomic release. Visitors may see a mixture of versions while an upload is in progress. Cache headers, asset naming, and any CDN invalidation belong in the deployment design.

For a small development site, this workflow can be a useful starting point. Before calling it production-ready, I'd verify the public URL, HTTPS, nested routes, cache behavior, and a failed build's effect on deployment.

What I like about learning this setup is how concrete it makes CI/CD: source goes in, a versioned artifact comes out, and one explicit job publishes it. Once those boundaries are clear, improving the process gets much less mysterious.
