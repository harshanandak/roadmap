# 📘 API REFERENCE

**Last Updated:** 2025-11-14
**Version:** 1.0
**Base URL (Production):** `https://platform-test-cyan.vercel.app`
**Base URL (Development):** `http://localhost:3000`

---

## 🔐 AUTHENTICATION

All API routes require authentication unless explicitly marked as **[PUBLIC]**.

**Authentication Method:** Supabase Auth (session-based)
- Client-side: Automatic via `@supabase/auth-helpers-nextjs`
- Server-side: Extract session from request headers

**Headers Required:**
```http
Cookie: sb-access-token=<token>; sb-refresh-token=<refresh-token>
```

---

## 📋 TABLE OF CONTENTS

1. [Auth API](#auth-api)
2. [Teams API](#teams-api)
3. [Workspaces API](#workspaces-api)
4. [Features API](#features-api)
5. [Mind Maps API](#mind-maps-api)
6. [Dependencies API](#dependencies-api)
7. [Review & Feedback API](#review-feedback-api)
8. [AI Assistant API](#ai-assistant-api)
9. [Analytics API](#analytics-api)
10. [Webhooks](#webhooks)

---

## 🔐 AUTH API

### POST `/api/auth/signup`
**[PUBLIC]** Create a new user account

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "securePassword123",
  "name": "John Doe"
}
```

**Response (201 Created):**
```json
{
  "user": {
    "id": "uuid",
    "email": "user@example.com",
    "name": "John Doe",
    "created_at": "2025-01-14T12:00:00Z"
  },
  "session": {
    "access_token": "...",
    "refresh_token": "..."
  }
}
```

---

### POST `/api/auth/login`
**[PUBLIC]** Sign in existing user

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "securePassword123"
}
```

**Response (200 OK):**
```json
{
  "user": { /* user object */ },
  "session": { /* session object */ }
}
```

---

### POST `/api/auth/logout`
Sign out current user

**Response (200 OK):**
```json
{
  "message": "Logged out successfully"
}
```

---

### GET `/api/auth/session`
Get current user session

**Response (200 OK):**
```json
{
  "user": {
    "id": "uuid",
    "email": "user@example.com",
    "name": "John Doe"
  },
  "session": {
    "expires_at": "2025-01-15T12:00:00Z"
  }
}
```

---

## 👥 TEAMS API

### POST `/api/teams`
Create a new team

**Request Body:**
```json
{
  "name": "Acme Corp",
  "plan": "free"
}
```

**Response (201 Created):**
```json
{
  "team": {
    "id": "1736857200000",
    "name": "Acme Corp",
    "owner_id": "uuid",
    "plan": "free",
    "member_count": 1,
    "created_at": "2025-01-14T12:00:00Z"
  }
}
```

---

### GET `/api/teams`
List all teams for current user

**Response (200 OK):**
```json
{
  "teams": [
    {
      "id": "1736857200000",
      "name": "Acme Corp",
      "role": "owner",
      "member_count": 5,
      "plan": "pro"
    }
  ]
}
```

---

### GET `/api/teams/:teamId`
Get team details

**Response (200 OK):**
```json
{
  "team": {
    "id": "1736857200000",
    "name": "Acme Corp",
    "owner_id": "uuid",
    "plan": "pro",
    "member_count": 5,
    "stripe_customer_id": "cus_xxx",
    "created_at": "2025-01-14T12:00:00Z"
  },
  "members": [
    {
      "user_id": "uuid",
      "name": "John Doe",
      "email": "john@example.com",
      "role": "owner",
      "joined_at": "2025-01-14T12:00:00Z"
    }
  ]
}
```

---

### PATCH `/api/teams/:teamId`
Update team details

**Request Body:**
```json
{
  "name": "Acme Corporation"
}
```

**Response (200 OK):**
```json
{
  "team": { /* updated team object */ }
}
```

---

### DELETE `/api/teams/:teamId`
Delete team (owner only)

**Response (204 No Content)**

---

### POST `/api/teams/:teamId/members`
Invite team member

**Request Body:**
```json
{
  "email": "newmember@example.com",
  "role": "member"
}
```

**Response (201 Created):**
```json
{
  "invitation": {
    "id": "1736857200001",
    "email": "newmember@example.com",
    "expires_at": "2025-01-21T12:00:00Z"
  },
  "message": "Invitation sent via email"
}
```

---

### DELETE `/api/teams/:teamId/members/:userId`
Remove team member

**Response (204 No Content)**

---

## 🏢 WORKSPACES API

### POST `/api/workspaces`
Create workspace

**Request Body:**
```json
{
  "team_id": "1736857200000",
  "name": "Mobile App Project",
  "description": "Building a fitness tracking app",
  "phase": "research",
  "enabled_modules": ["research", "mind_map", "features"]
}
```

**Response (201 Created):**
```json
{
  "workspace": {
    "id": "1736857200002",
    "team_id": "1736857200000",
    "name": "Mobile App Project",
    "phase": "research",
    "enabled_modules": ["research", "mind_map", "features"],
    "created_at": "2025-01-14T12:00:00Z"
  }
}
```

---

### GET `/api/workspaces`
List all workspaces for team

**Query Parameters:**
- `team_id` (required): Team ID

**Response (200 OK):**
```json
{
  "workspaces": [
    {
      "id": "1736857200002",
      "name": "Mobile App Project",
      "phase": "execution",
      "feature_count": 25
    }
  ]
}
```

---

### GET `/api/workspaces/:workspaceId`
Get workspace details

**Response (200 OK):**
```json
{
  "workspace": {
    "id": "1736857200002",
    "team_id": "1736857200000",
    "name": "Mobile App Project",
    "phase": "execution",
    "enabled_modules": ["features", "timeline", "execution"],
    "created_at": "2025-01-14T12:00:00Z"
  }
}
```

---

### PATCH `/api/workspaces/:workspaceId`
Update workspace

**Request Body:**
```json
{
  "phase": "review",
  "enabled_modules": ["features", "timeline", "review"]
}
```

**Response (200 OK):**
```json
{
  "workspace": { /* updated workspace */ }
}
```

---

### DELETE `/api/workspaces/:workspaceId`
Delete workspace

**Response (204 No Content)**

---

## 📋 FEATURES API

### POST `/api/features`
Create feature

**Request Body:**
```json
{
  "team_id": "1736857200000",
  "workspace_id": "1736857200002",
  "name": "User Authentication",
  "type": "Feature",
  "purpose": "Secure login system with email/password and social OAuth",
  "timeline_items": [
    {
      "timeline": "MVP",
      "usp": "Basic email/password login",
      "difficulty": "Medium",
      "integration_type": "Backend"
    }
  ]
}
```

**Response (201 Created):**
```json
{
  "feature": {
    "id": "1736857200003",
    "name": "User Authentication",
    "type": "Feature",
    "purpose": "Secure login system...",
    "timeline_items": [ /* timeline items */ ],
    "created_at": "2025-01-14T12:00:00Z"
  }
}
```

---

### GET `/api/features`
List features

**Query Parameters:**
- `workspace_id` (required): Workspace ID
- `timeline` (optional): Filter by timeline (MVP, SHORT, LONG)
- `status` (optional): Filter by status

**Response (200 OK):**
```json
{
  "features": [
    {
      "id": "1736857200003",
      "name": "User Authentication",
      "timeline_items": [ /* items */ ],
      "dependencies_count": 3
    }
  ],
  "total": 25
}
```

---

### GET `/api/features/:featureId`
Get feature details

**Response (200 OK):**
```json
{
  "feature": {
    "id": "1736857200003",
    "name": "User Authentication",
    "type": "Feature",
    "purpose": "Secure login system...",
    "timeline_items": [ /* timeline items */ ],
    "dependencies": [ /* linked items */ ],
    "created_at": "2025-01-14T12:00:00Z",
    "updated_at": "2025-01-14T12:00:00Z"
  }
}
```

---

### PATCH `/api/features/:featureId`
Update feature

**Request Body:**
```json
{
  "purpose": "Updated description",
  "timeline_items": [ /* updated items */ ]
}
```

**Response (200 OK):**
```json
{
  "feature": { /* updated feature */ }
}
```

---

### DELETE `/api/features/:featureId`
Delete feature

**Response (204 No Content)**

---

## 🧠 MIND MAPS API

### POST `/api/mind-maps`
Create mind map

**Request Body:**
```json
{
  "workspace_id": "1736857200002",
  "name": "Product Brainstorm",
  "canvas_data": {
    "nodes": [],
    "edges": []
  }
}
```

**Response (201 Created):**
```json
{
  "mind_map": {
    "id": "1736857200004",
    "name": "Product Brainstorm",
    "canvas_data": { /* ReactFlow data */ },
    "created_at": "2025-01-14T12:00:00Z"
  }
}
```

---

### GET `/api/mind-maps/:mindMapId`
Get mind map

**Response (200 OK):**
```json
{
  "mind_map": {
    "id": "1736857200004",
    "name": "Product Brainstorm",
    "canvas_data": {
      "nodes": [
        {
          "id": "node_1",
          "type": "idea",
          "label": "Social Features",
          "position": { "x": 100, "y": 100 }
        }
      ],
      "edges": []
    }
  }
}
```

---

### PATCH `/api/mind-maps/:mindMapId`
Update mind map canvas

**Request Body:**
```json
{
  "canvas_data": {
    "nodes": [ /* updated nodes */ ],
    "edges": [ /* updated edges */ ]
  }
}
```

**Response (200 OK):**
```json
{
  "mind_map": { /* updated mind map */ }
}
```

---

### POST `/api/mind-maps/:mindMapId/convert-to-features`
Convert mind map nodes to features

**Request Body:**
```json
{
  "node_ids": ["node_1", "node_2", "node_3"]
}
```

**Response (200 OK):**
```json
{
  "features": [
    {
      "id": "1736857200005",
      "name": "Social Features",
      "source_node_id": "node_1"
    }
  ],
  "message": "Successfully converted 3 nodes to features"
}
```

---

## 🔗 DEPENDENCIES API

### POST `/api/dependencies`
Create dependency link

**Request Body:**
```json
{
  "workspace_id": "1736857200002",
  "from_feature_id": "1736857200003",
  "to_feature_id": "1736857200005",
  "type": "dependency",
  "reason": "Authentication required before social features"
}
```

**Response (201 Created):**
```json
{
  "dependency": {
    "id": "1736857200006",
    "from_feature_id": "1736857200003",
    "to_feature_id": "1736857200005",
    "type": "dependency",
    "created_at": "2025-01-14T12:00:00Z"
  }
}
```

---

### GET `/api/dependencies`
Get dependency graph

**Query Parameters:**
- `workspace_id` (required): Workspace ID

**Response (200 OK):**
```json
{
  "nodes": [
    {
      "id": "1736857200003",
      "name": "User Authentication",
      "type": "Feature"
    }
  ],
  "edges": [
    {
      "id": "1736857200006",
      "source": "1736857200003",
      "target": "1736857200005",
      "type": "dependency"
    }
  ]
}
```

---

### POST `/api/dependencies/analyze`
Analyze critical path and bottlenecks

**Request Body:**
```json
{
  "workspace_id": "1736857200002"
}
```

**Response (200 OK):**
```json
{
  "critical_path": [
    { "id": "1736857200003", "name": "User Authentication" },
    { "id": "1736857200005", "name": "Social Features" }
  ],
  "critical_path_duration": 45,
  "bottlenecks": [
    {
      "feature_id": "1736857200003",
      "blocking_count": 5,
      "message": "Blocks 5 other features"
    }
  ],
  "circular_dependencies": []
}
```

---

## 👥 REVIEW & FEEDBACK API

### POST `/api/review-links`
Create review link

**Request Body:**
```json
{
  "workspace_id": "1736857200002",
  "type": "public",
  "feature_ids": ["1736857200003", "1736857200005"],
  "settings": {
    "allow_comments": true,
    "allow_voting": true,
    "require_email": false
  },
  "expires_at": "2025-01-21T12:00:00Z"
}
```

**Response (201 Created):**
```json
{
  "review_link": {
    "id": "1736857200007",
    "token": "abc123xyz",
    "type": "public",
    "url": "https://platform.com/public/review/abc123xyz",
    "expires_at": "2025-01-21T12:00:00Z"
  }
}
```

---

### GET `/public/review/:token` **[PUBLIC]**
Get review page data

**Response (200 OK):**
```json
{
  "workspace": {
    "name": "Mobile App Project"
  },
  "features": [
    {
      "id": "1736857200003",
      "name": "User Authentication",
      "purpose": "Secure login system..."
    }
  ],
  "settings": {
    "allow_comments": true,
    "allow_voting": true
  }
}
```

---

### POST `/api/feedback` **[PUBLIC]**
Submit feedback

**Request Body:**
```json
{
  "review_link_token": "abc123xyz",
  "feature_id": "1736857200003",
  "rating": 5,
  "comment": "Great feature!",
  "reviewer_email": "reviewer@example.com"
}
```

**Response (201 Created):**
```json
{
  "feedback": {
    "id": "1736857200008",
    "feature_id": "1736857200003",
    "rating": 5,
    "status": "new",
    "created_at": "2025-01-14T12:00:00Z"
  },
  "message": "Thank you for your feedback!"
}
```

---

### GET `/api/feedback`
List all feedback

**Query Parameters:**
- `workspace_id` (required): Workspace ID
- `feature_id` (optional): Filter by feature
- `status` (optional): Filter by status (new, reviewed, implemented, rejected)

**Response (200 OK):**
```json
{
  "feedback": [
    {
      "id": "1736857200008",
      "feature_id": "1736857200003",
      "rating": 5,
      "comment": "Great feature!",
      "status": "new",
      "created_at": "2025-01-14T12:00:00Z"
    }
  ],
  "total": 15
}
```

---

## 🤖 AI ASSISTANT API

### POST `/api/ai/chat`
Send chat message (streaming response)

**Request Body:**
```json
{
  "message": "What are the best authentication methods for SaaS apps?",
  "model": "claude-haiku",
  "workspace_id": "1736857200002"
}
```

**Response (Server-Sent Events):**
```
data: {"type":"start"}

data: {"type":"chunk","text":"Based on current research..."}

data: {"type":"chunk","text":" OAuth 2.0 with PKCE is recommended..."}

data: {"type":"done"}
```

---

### POST `/api/ai/suggest`
Get AI suggestions

**Request Body:**
```json
{
  "type": "dependencies",
  "feature_id": "1736857200003",
  "workspace_id": "1736857200002"
}
```

**Response (200 OK):**
```json
{
  "suggestions": [
    {
      "type": "dependency",
      "from_feature_id": "1736857200003",
      "to_feature_id": "1736857200009",
      "reason": "Authentication needed before user profiles",
      "confidence": 0.92
    }
  ]
}
```

---

### POST `/api/ai/tools/:toolName`
Execute AI tool (agentic mode)

**Request Body:**
```json
{
  "workspace_id": "1736857200002",
  "params": {
    "name": "Payment Integration",
    "purpose": "Stripe checkout flow",
    "timeline": "SHORT"
  }
}
```

**Response (200 OK):**
```json
{
  "result": {
    "feature_id": "1736857200010",
    "message": "Feature created successfully"
  },
  "action_log": {
    "tool": "create_feature",
    "timestamp": "2025-01-14T12:00:00Z"
  }
}
```

---

## 📊 ANALYTICS API

### GET `/api/analytics/overview`
Get workspace analytics overview

**Query Parameters:**
- `workspace_id` (required): Workspace ID

**Response (200 OK):**
```json
{
  "feature_count": 25,
  "completed_count": 12,
  "in_progress_count": 8,
  "not_started_count": 5,
  "completion_rate": 0.48,
  "by_timeline": {
    "MVP": 15,
    "SHORT": 7,
    "LONG": 3
  }
}
```

---

### POST `/api/analytics/dashboards`
Create custom dashboard

**Request Body:**
```json
{
  "workspace_id": "1736857200002",
  "name": "Team Performance",
  "layout": {
    "widgets": [
      {
        "type": "bar_chart",
        "data_source": "team_performance",
        "position": { "x": 0, "y": 0, "w": 6, "h": 4 }
      }
    ]
  }
}
```

**Response (201 Created):**
```json
{
  "dashboard": {
    "id": "1736857200011",
    "name": "Team Performance",
    "layout": { /* widget configuration */ }
  }
}
```

---

## 🔔 WEBHOOKS

### POST `/api/webhooks/stripe`
Stripe webhook handler

**[PUBLIC - Verified with Stripe signature]**

**Events Handled:**
- `customer.subscription.created`
- `customer.subscription.updated`
- `customer.subscription.deleted`
- `invoice.payment_failed`

**Request Headers:**
```http
Stripe-Signature: t=1234567890,v1=abc123...
```

**Request Body:** (Stripe event object)

**Response (200 OK):**
```json
{
  "received": true
}
```

---

### POST `/api/webhooks/resend`
Email webhook handler (delivery status)

**[PUBLIC - Verified with Resend signature]**

**Events Handled:**
- `email.delivered`
- `email.bounced`
- `email.opened`

**Response (200 OK):**
```json
{
  "received": true
}
```

---

## 📐 COMMON PATTERNS

### Error Responses

All error responses follow this format:

```json
{
  "error": {
    "code": "UNAUTHORIZED",
    "message": "You must be authenticated to access this resource",
    "details": {
      /* optional additional context */
    }
  }
}
```

**Common Error Codes:**
- `400` - Bad Request (invalid input)
- `401` - Unauthorized (not authenticated)
- `403` - Forbidden (not authorized for this action)
- `404` - Not Found
- `409` - Conflict (duplicate resource)
- `422` - Unprocessable Entity (validation failed)
- `429` - Too Many Requests (rate limit exceeded)
- `500` - Internal Server Error

---

### Pagination

List endpoints support pagination:

**Query Parameters:**
- `page` (default: 1): Page number
- `limit` (default: 20, max: 100): Items per page

**Response:**
```json
{
  "data": [ /* items */ ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 150,
    "total_pages": 8
  }
}
```

---

### Rate Limiting

**Free Tier:**
- 100 requests/minute per user
- 50 AI messages/month per team

**Pro Tier:**
- 500 requests/minute per user
- 1,000 AI messages/user/month

**Rate Limit Headers:**
```http
X-RateLimit-Limit: 500
X-RateLimit-Remaining: 487
X-RateLimit-Reset: 1736857260
```

---

## 🔧 SDK & Client Libraries

### JavaScript/TypeScript
```bash
npm install @platform/api-client
```

**Usage:**
```typescript
import { PlatformClient } from '@platform/api-client';

const client = new PlatformClient({
  apiKey: process.env.PLATFORM_API_KEY
});

const features = await client.features.list({
  workspace_id: 'workspace_id'
});
```

### Python (Coming Soon)
```bash
pip install platform-api
```

### Ruby (Coming Soon)
```bash
gem install platform-api
```

---

## 📚 ADDITIONAL RESOURCES

- **[ARCHITECTURE.md](ARCHITECTURE.md)** - System architecture and data flows
- **[DATABASE_SCHEMA.md](docs/implementation/database-schema.md)** - Complete database schema
- **[CLAUDE.md](CLAUDE.md)** - Project guidelines and coding standards
- **[Postman Collection](https://www.postman.com/platform-api)** - Import and test all endpoints

---

**API Version:** 1.0
**Last Updated:** 2025-11-14
**Changelog:** See [CHANGELOG.md](CHANGELOG.md)
