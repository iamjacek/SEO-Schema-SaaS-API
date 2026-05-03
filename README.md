# SEO Schema SaaS API

A scalable, high-performance API for generating SEO metadata and structured JSON-LD schema using Cloudflare Workers and OpenAI.

**Live API:** https://workers-api.jake47s.workers.dev/

## 🚀 Features

- **Multi-Type SEO Generation**: Supports `Article`, `Product`, `LocalBusiness`, and `Service` schema types
- **AI-Powered Metadata**: Generates meta titles, descriptions, OG/Twitter tags, and valid JSON-LD using OpenAI's GPT-4o-mini with Structured Outputs
- **Bearer Token Authentication**: Secure API access with token-based auth and 365-day expiration
- **Usage Tracking & Limits**: Built-in monthly limits (Free: 30 generations/month)
- **Injection Protection**: Hardened system prompts and input sanitization to prevent prompt injection
- **Generation History**: Dashboard to view all generations and token usage
- **Admin Token Management**: Create, revoke, and rotate API tokens
- **Cloudflare Native**: Optimized for Cloudflare Workers with serverless Postgres (Neon)

## 🛠 Tech Stack

- **Backend**: Cloudflare Workers (TypeScript)
- **Database**: Neon Serverless Postgres
- **AI Engine**: OpenAI API (GPT-4o-mini)
- **Frontend**: HTML Dashboard (React planned for v2)
- **Deployment**: Wrangler CLI

## 📦 Project Structure

seo-schema-saas/
├── migrations/
│ └── 2026-04-12-set-token-expiration.sql
├── workers/
│ ├── src/
│ │ ├── index.ts # Router & main entry point
│ │ ├── lib/
│ │ │ ├── db.ts # Neon Postgres client
│ │ │ ├── auth.ts # Bearer token authentication
│ │ │ ├── ai.ts # OpenAI GPT-4o-mini integration
│ │ │ ├── admin.ts # Admin token utilities
│ │ │ ├── dashboard.ts # Dashboard HTML
│ │ │ ├── validator.ts # Response validation
│ │ │ ├── storage.ts # Database operations
│ │ │ └── response.ts # Response formatting
│ │ └── handlers/ # Route handlers
│ │ ├── generate.ts # POST /generate
│ │ ├── generations.ts # GET /api/generations
│ │ ├── admin.ts # Admin endpoints
│ │ └── dashboard.ts # GET /dashboard
│ ├── test/
│ │ └── test-api.ps1 # PowerShell test suite
│ ├── wrangler.jsonc # Cloudflare Workers config
│ └── package.json
├── db/
│ └── schema.sql # Database schema
└── README.md

## ⚙️ Setup

### 1. Prerequisites

- [Cloudflare Account](https://dash.cloudflare.com/sign-up)
- [Neon Database](https://neon.tech/)
- [OpenAI API Key](https://platform.openai.com/api-keys)
- Node.js 18+ & npm

### 2. Database Initialization

Run the SQL from `db/schema.sql` in your Neon console:

```sql
-- Creates tables: users, plans, auth_tokens, user_usage, generations
```

### 3. Configure Secrets

```bash
cd workers
wrangler secret put DATABASE_URL      # postgresql://user:pass@host/db
wrangler secret put OPENAI_API_KEY    # sk-proj-xxxxx
wrangler secret put ADMIN_KEY         # admin-key-12345 (for admin endpoints)
```

### 4. Local Development

```bash
cd workers
wrangler dev --remote
```

Then test:

```powershell
.\test\test-api.ps1 -Token "demo-token-12345abcde"
```

### 5. Deploy to Production

```bash
wrangler deploy
```

Your API will be live at: `https://your-account.workers.dev/`

## 🔌 API Endpoints

### Public Endpoints

#### `POST /generate` - Generate SEO Metadata

**Authentication:** Required (Bearer token)

**Request:**

```bash
curl -X POST https://workers-api.jake47s.workers.dev/generate \
  -H "Authorization: Bearer your-token-here" \
  -H "Content-Type: application/json" \
  -d '{
    "contentType": "Product",
    "title": "Premium Coffee Maker Pro",
    "brief": "A smart espresso machine with WiFi connectivity",
    "language": "en",
    "tone": "professional",
    "targetKeyword": "premium coffee maker",
    "siteName": "Expresso Elite",
    "brandVoice": "luxury, professional",
    "baseUrl": "https://expresso.com",
    "imageUrl": "https://expresso.com/images/coffee-pro.jpg"
  }'
```

**Response:**

```json
{
  "ok": true,
  "data": {
    "generationId": "uuid",
    "userId": "user-id",
    "usage": { "used": 5, "limit": 30 },
    "tokens": { "input": 1047, "output": 324 },
    "result": {
      "metaTitle": "Premium Stainless Steel French Press Maker",
      "metaDescription": "Professional-grade coffee maker with advanced features",
      "slug": "premium-coffee-maker-pro",
      "url": "https://expresso.com/premium-coffee-maker-pro",
      "schemaJsonLd": { ... },
      "ogTags": { ... },
      "twitterTags": { ... }
    }
  }
}
```

#### `GET /dashboard` - View Generation History

**Authentication:** Required (Bearer token, via localStorage)

```bash
curl https://workers-api.jake47s.workers.dev/dashboard
```

Opens interactive dashboard showing:

- Monthly usage stats (X/30)
- Generation history with token breakdown
- Content type breakdown

#### `GET /api/generations` - Get User's Generations

**Authentication:** Required

```bash
curl -H "Authorization: Bearer your-token-here" \
  https://workers-api.jake47s.workers.dev/api/generations
```

**Response:**

```json
{
  "ok": true,
  "data": {
    "usage": 5,
    "limit": 30,
    "generations": [
      {
        "id": "uuid",
        "content_type": "Product",
        "input_title": "Premium Coffee Maker",
        "meta_title": "Premium Coffee Maker Pro",
        "tokens_input": 1047,
        "tokens_output": 324,
        "status": "success",
        "created_at": "2026-05-03T16:18:50Z"
      }
    ]
  }
}
```

### Admin Endpoints

**⚠️ Security Note:** Never expose your `ADMIN_KEY` in client code. Use environment variables or secure vaults only.

#### `POST /admin/tokens` - Create New Token

```bash
ADMIN_KEY="your-admin-key"

curl -X POST https://workers-api.jake47s.workers.dev/admin/tokens \
  -H "Authorization: Bearer $ADMIN_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "1cd8f548-1ec6-49cc-88f5-2d8191496631",
    "name": "Production Token v2"
  }'
```

**Response:**

```json
{
  "ok": true,
  "data": {
    "id": "token-uuid",
    "token": "abc123def456...",
    "message": "Token created. Save this token securely - it will not be shown again."
  }
}
```

#### `GET /admin/tokens` - List User's Tokens

```bash
curl -H "Authorization: Bearer $ADMIN_KEY" \
  "https://workers-api.jake47s.workers.dev/admin/tokens?userId=1cd8f548-1ec6-49cc-88f5-2d8191496631"
```

#### `DELETE /admin/tokens/{tokenId}` - Revoke Token

```bash
curl -X DELETE \
  "https://workers-api.jake47s.workers.dev/admin/tokens/token-id?userId=1cd8f548-1ec6-49cc-88f5-2d8191496631" \
  -H "Authorization: Bearer $ADMIN_KEY"
```

#### `POST /admin/tokens/{tokenId}/rotate` - Rotate Token

Revokes old token and creates a new one:

```bash
curl -X POST \
  "https://workers-api.jake47s.workers.dev/admin/tokens/token-id/rotate?userId=1cd8f548-1ec6-49cc-88f5-2d8191496631" \
  -H "Authorization: Bearer $ADMIN_KEY"
```

## 🔐 Authentication

### Bearer Token Format

All API requests (except admin) require a Bearer token:

```bash
curl -H "Authorization: Bearer your-token-here" https://workers-api.jake47s.workers.dev/generate
```

### Token Lifecycle

- **Created**: Via admin endpoint
- **Expiration**: 365 days from creation
- **Revocation**: Manual via admin endpoint
- **Rotation**: Automatic revoke + new token creation

## 📊 Usage & Billing

### Free Tier Limits

- **30 generations/month**
- **Token pooling**: Input + Output tokens tracked
- **Average cost**: ~$0.0018 per request (~5¢/month for free tier)

### Token Breakdown Example

Request: 1047 input tokens + 324 output tokens = 1371 total
Cost: (1047 × $0.00075) + (324 × $0.003) = $0.0018

## 🧪 Testing

### Prerequisites

- PowerShell 5.0+
- API Token (see below)

### Get Your API Token

**Option 1: Use Admin Endpoint to Create Token**

```bash
ADMIN_KEY="your-admin-key"
USER_ID="your-user-id"

curl -X POST https://workers-api.jake47s.workers.dev/admin/tokens \
  -H "Authorization: Bearer $ADMIN_KEY" \
  -H "Content-Type: application/json" \
  -d "{
    \"userId\": \"$USER_ID\",
    \"name\": \"Testing Token\"
  }"

# Response includes: "token": "your-token-here"
```

**Option 2: Contact the API Owner**

Request a demo token from [@iamjacek](https://github.com/iamjacek)

### Run Test Suite

1. **Get your token** (see above)

2. **Run tests against live API:**

```powershell
cd workers\test
.\test-api.ps1 -Token "your-token-here" -BaseUri "https://workers-api.jake47s.workers.dev/generate"
```

3. **Or test locally (development):**

```bash
cd workers
wrangler dev --remote
```

Then in PowerShell:

```powershell
.\test\test-api.ps1 -Token "your-token-here" -BaseUri "http://localhost:8787/generate"
```

### Test Output Example

TEST 1: Complex E-Commerce Product
✅ SUCCESS
Response time: 5984.1963ms
Tokens used - Input: 1047, Output: 324
Meta Title: Premium Stainless Steel French Press Maker

TEST 2: Local Business / Professional Services
✅ SUCCESS
Response time: 2788.0944ms
Tokens used - Input: 1026, Output: 280
Meta Title: Premium Dental Care Center - Manhattan

TEST 3: Blog Article / Content Marketing
✅ SUCCESS
Response time: 3713.7051ms
Tokens used - Input: 1089, Output: 301
Meta Title: Guide to Sustainable Coffee Sourcing 2026

🎉 ALL TESTS PASSED!

### Custom Endpoint

To test against a different endpoint:

```powershell
.\test-api.ps1 -Token "your-token-here" -BaseUri "https://your-custom-domain.com/generate"
```

### What Gets Tested

✅ **3 different content types** (Product, LocalBusiness, Article)  
✅ **Input validation** (all required fields)  
✅ **Token authentication** (Bearer token)  
✅ **OpenAI integration** (Structured Outputs)  
✅ **Response validation** (schema correctness)  
✅ **Token usage tracking** (input/output counts)  
✅ **Usage limits** (monthly quota enforcement)

### Token Management

All tokens are personal and unique to each user:

- **View your tokens**: `GET /admin/tokens?userId=YOUR_USER_ID`
- **Revoke a token**: `DELETE /admin/tokens/TOKEN_ID`
- **Rotate a token**: `POST /admin/tokens/TOKEN_ID/rotate`

**Never commit tokens to git.** Use environment variables:

```powershell
# Store token securely
$env:API_TOKEN = "your-token-here"

# Use in tests
.\test-api.ps1 -Token $env:API_TOKEN
```

Or in `.env` (git-ignored):
API_TOKEN=your-token-here

Then load it:

```powershell
$token = (Get-Content .env | Select-String "API_TOKEN" | Split-String "=")
.\test-api.ps1 -Token $token
```

## 🚀 Deployment

### Deploy to Cloudflare Workers

```bash
cd workers
wrangler deploy
```

Your API will be available at:
https://your-account.workers.dev/

### Environment Configuration

Update `wrangler.jsonc` with your Cloudflare settings:

```json
{
  "name": "seo-schema-api",
  "main": "src/index.ts",
  "compatibility_date": "2024-01-01",
  "env": {
    "production": {
      "route": "workers-api.jake47s.workers.dev/*"
    }
  }
}
```

## 📈 Roadmap

- [ ] React Dashboard (Cloudflare Pages)
- [ ] Multiple tier plans (Starter, Pro, Agency)
- [ ] Rate limiting & DDoS protection
- [ ] Webhook support for async generation
- [ ] API analytics & reporting
- [ ] Custom schema templates

## 🔍 Error Handling

All errors follow standard format:

```json
{
  "ok": false,
  "error": {
    "code": "ERROR_CODE",
    "message": "Human-readable message",
    "details": {}
  }
}
```

### Common Errors

| Code                  | Status | Meaning                             |
| --------------------- | ------ | ----------------------------------- |
| `MISSING_AUTH_HEADER` | 401    | No Authorization header provided    |
| `INVALID_AUTH_TOKEN`  | 401    | Token not found or invalid          |
| `TOKEN_EXPIRED`       | 401    | Token has expired (365 days)        |
| `QUOTA_EXCEEDED`      | 429    | Monthly generation limit reached    |
| `VALIDATION_FAILED`   | 500    | OpenAI response didn't match schema |
| `STORAGE_FAILED`      | 500    | Failed to save generation to DB     |

## 📝 License & Usage

This repository is shared for **portfolio and educational purposes only** and is **not licensed for general use** in live products or commercial projects.

Source code may be browsed, studied, and used as reference, but you may **not**:

- Copy or reuse this code in your own projects or SaaS products
- Redistribute, resell, or re-license this code

For commercial or production-use inquiries, please contact [@iamjacek](https://github.com/iamjacek).

## 💬 Contact & Links

- **GitHub**: [@iamjacek](https://github.com/iamjacek)
- **Portfolio**: [jacekwitucki.com](https://jacekwitucki.com)
- **Design**: [dribbble.com/jacekwitucki](https://dribbble.com/jacekwitucki)

---

**Copyright © 2026 Jacek Witucki** · All rights reserved
