---
title: Nexus - Internal Tooling
description: Self-hosted Appsmith platform for building internal tools with a low-code approach.
tech:
  - MongoDB
  - Redis
  - Appsmith
  - Kubernetes
  - Cloudflare
  - S3
logo: https://nbg1.your-objectstorage.com/nexus-public-statics/images/appsmith-logo.png
images:
  - https://nbg1.your-objectstorage.com/nexus-public-statics/images/cloudflare-tunnel-1.png
  - https://nbg1.your-objectstorage.com/nexus-public-statics/images/cloudflare-tunnel-2.png
  - https://nbg1.your-objectstorage.com/nexus-public-statics/images/s3-statics-client-1.png
codeSourceUrl: /code-source/nexus
features:
  - Easy platform to build internal tools with a low-code approach
  - Recurrent backups of the mongoDB database
  - SSO for the platform
  - Possibility to create custom components with react/vue.js and custom datasources (like a cloudflare api integration)
  - 'Application 1: Self-service Cloudflare tunnel creation - engineers can create their own locally-managed tunnels, allowing them to share development environments with teammates'
  - 'Application 2: S3 static asset management - upload public static assets for portfolio and other applications'
---

The goal of this project is to provide a platform to build internal tools with a low-code approach.
It enables engineers for quick experimentation with 3rd party services like MongoDB, Redis, S3, custom APIs, etc.It also allows all departments to build their own tools to improve their daily workflow with pre-created components and datasources.The balance of javascript usage and low-code approach really widen the possibilities of what can be built with the platform.

<br>

Appsmith is self-hosted on a kubernetes cluster, the components are a mongoDB database as main storage, redis for caching and the main appsmith backend. Recurrent backups are ran on the mongoDB database and the overall platform is SSO.
