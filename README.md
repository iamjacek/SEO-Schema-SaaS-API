# SEO Schema SaaS API

A scalable, high-performance API for generating SEO metadata and structured JSON-LD schema using Cloudflare Workers and OpenAI.

## 🚀 Features

- **Multi-Type SEO Generation**: Supports `Article`, `Product`, `LocalBusiness`, and `Service` schema types.
- **AI-Powered Insights**: Generates meta titles, descriptions, OG/Twitter tags, and valid JSON-LD using OpenAI's GPT-4o-mini.
- **Usage Tracking & Limits**: Built-in usage monitoring with plan-based monthly limits (Free Trial, Starter, Pro, Agency).
- **Injection Protection**: Hardened system prompts and input sanitization to prevent prompt injection and ensure output safety.
- **Cloudflare Native**: Optimized for Cloudflare Workers with serverless Postgres (Neon) for low-latency database access.
- **Custom Image Support**: Supports user-provided image URLs or generates plausible placeholder URLs based on the site's domain.

## 🛠 Tech Stack

- **Backend**: Cloudflare Workers (TypeScript)
- **Database**: Serverless Postgres (Neon)
- **AI Engine**: OpenAI API (GPT-4o-mini)
- **Tooling**: Wrangler CLI, PowerShell for local testing

## 📦 Project Structure

```text
seo-schema-saas/
├─ workers/                  # Cloudflare Workers API
│  ├─ src/
│  │  ├─ index.ts            # Main API entry & routing
│  │  ├─ lib/
│  │  │  ├─ ai.ts            # OpenAI integration & prompts
│  │  │  ├─ db.ts            # Neon Postgres client
│  ├─ wrangler.jsonc         # Cloudflare Workers config
├─ db/
│  ├─ schema.sql             # Postgres database schema
└─ README.md                 # Project documentation
```

## ⚙️ Setup

### 1. Prerequisites

- [Cloudflare Account](https://dash.cloudflare.com/sign-up)
- [Neon Database](https://neon.tech/)
- [OpenAI API Key](https://platform.openai.com/api-keys)

### 2. Database Initialization

Run the SQL from `db/schema.sql` in your Neon console to create the necessary tables (`users`, `plans`, `user_usage`, `generations`, `projects`).

### 3. Worker Secrets

Set your API keys and connection strings as secrets:

```bash
wrangler secret put DATABASE_URL
wrangler secret put OPENAI_API_KEY
```

### 4. Development

Start the local development server with remote environment:

```bash
cd workers
wrangler dev --remote
```

## 🔌 API Endpoints

### `POST /generate`

Generates SEO metadata and schema.

**Payload:**

```json
{
  "contentType": "Product",
  "title": "Premium Coffee Maker Pro",
  "brief": "A smart espresso machine with WiFi connectivity.",
  "baseUrl": "https://expresso.com",
  "imageUrl": "https://expresso.com/images/coffee-pro.jpg"
}
```

**Response:**
Returns `metaTitle`, `metaDescription`, `slug`, `url`, `schemaJsonLd`, `ogTags`, and `twitterTags`.

## 📜 License & Usage

This repository is shared for **portfolio and educational purposes only** and is **not licensed for general use** in live products or commercial projects.

Source code may be browsed, studied, and used as reference, but you may **not**:

- Copy or reuse this code in your own projects or SaaS products.
- Redistribute, resell, or re‑license this code.

For any commercial or production‑use inquiries, please contact me at [@iamjacek](https://github.com/iamjacek).

Copyright © 2026 Jacek
