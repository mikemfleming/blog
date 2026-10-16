---
title: Separating Next.js and an API with Nginx
date: 2022-02-18
description: Use Nginx and Docker Compose to route requests to separate Next.js frontend and API services without a custom Next.js server.
tags: [nextjs, nginx, docker, architecture]
draft: false
---

I like the convenience of a framework until an unrelated service starts depending on its internals. That's the boundary I'm working through here: a Next.js frontend and an API that should be able to evolve independently.

A reverse proxy gives us a straightforward way to keep one public entry point without putting both applications inside the same server process. A little routing can save a lot of architectural untangling later.

## Keep the framework's server doing its job

Next.js provides useful defaults, including [Automatic Static Optimization](https://nextjs.org/docs/pages/building-your-application/rendering/automatic-static-optimization) in the Pages Router. Its [custom server guidance](https://nextjs.org/docs/pages/guides/custom-server) warns that replacing the integrated server removes important optimizations.

That doesn't mean every backend needs a separate service. Next.js has its own server-side capabilities, and those may be enough. In this setup, I specifically want a dedicated API, built with [NestJS](https://nestjs.com/), whose deployment and implementation aren't tied to Next.js.

Separation doesn't remove all coupling. We still share an API contract. It does give us a cleaner place to manage that contract and the option to replace one service without also replacing the other's server.

## One entry point, two destinations

[Nginx](https://nginx.org/en/docs/) receives requests first:

- `/api` and `/api/...` go to the API.
- Everything else goes to the frontend.

Both services can be reached by name on a Docker Compose network. Only Nginx needs a published host port for this example.

Here's the local orchestration, assuming each application's Dockerfile installs its dependencies and starts its server:

```yaml
# docker-compose.yml
version: '3.7'

services:
  my-reverse-proxy:
    image: nginx:alpine
    ports:
      - '8080:80'
    volumes:
      - ./my-reverse-proxy.conf:/etc/nginx/nginx.conf:ro
    networks:
      - my-network
    depends_on:
      - my-frontend
      - my-api

  my-frontend:
    build:
      context: .
      dockerfile: apps/my-frontend/Dockerfile
    networks:
      - my-network

  my-api:
    build:
      context: .
      dockerfile: apps/my-api/Dockerfile
    networks:
      - my-network

networks:
  my-network:
```

The frontend must listen on port 3000 and the API on 1337, both bound to `0.0.0.0` inside their containers. Binding only to localhost makes a service unreachable from the proxy container. `depends_on` provides startup ordering here, not a guarantee that the applications are ready to accept traffic.

The network connects the services; it isn't a complete security boundary or an isolated network by default. Modern Docker Compose also treats the top-level `version` field as obsolete; it remains in this example to reflect its 2022 origins.

## Be precise about paths

```nginx
# my-reverse-proxy.conf
events {
    worker_connections 1024;
}

http {
    server {
        listen 80;

        location = /api {
            proxy_pass http://my-api:1337;
        }

        location /api/ {
            proxy_pass http://my-api:1337;
        }

        location / {
            proxy_pass http://my-frontend:3000;
        }
    }
}
```

Using an exact match for `/api` and a prefix match for `/api/` avoids routing a frontend path such as `/apiary` to the API. Small detail, very satisfying bug to avoid.

The `proxy_pass` values intentionally have no URI component after the port. This preserves `/api` in the upstream request, so `/api/users` reaches the API as `/api/users`. The backend must define routes with that prefix.

If the API expects `/users` instead, the routing needs to strip the prefix deliberately. A trailing slash in `proxy_pass` changes URI replacement behavior; it isn't just formatting. The [Nginx proxy documentation](https://nginx.org/en/docs/http/ngx_http_proxy_module.html#proxy_pass) explains the distinction.

## Check the boundary before adding more

Run `docker compose up --build`, then test the frontend and a known API route through `http://localhost:8080`. Check upstream logs to confirm which service receives each request, including a path that starts with `api` but isn't under `/api/`.

This is a local routing example, not a finished production ingress. TLS, forwarded headers, WebSocket support, timeouts, and readiness checks depend on the deployment and the applications. Keeping frontend and API under one origin also doesn't replace authentication or CSRF protections.

What I like about this arrangement is that the responsibilities are easy to explain: Next.js serves the frontend, the API owns its behavior, and Nginx handles the routing. Each piece has a job we can test independently.
