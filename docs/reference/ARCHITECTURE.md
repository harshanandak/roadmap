# 🏗️ SYSTEM ARCHITECTURE

**Last Updated**: 2025-11-14
**Project**: Product Lifecycle Management Platform
**Tech Stack**: Next.js 15 + TypeScript + Supabase + Vercel

---

## 📋 TABLE OF CONTENTS

1. [High-Level Architecture](#high-level-architecture)
2. [Multi-Tenant Architecture](#multi-tenant-architecture)
3. [Database Schema](#database-schema)
4. [Authentication Flow](#authentication-flow)
5. [Data Flow - Key Features](#data-flow---key-features)
6. [API Architecture](#api-architecture)
7. [Real-time Collaboration](#real-time-collaboration)
8. [Deployment Architecture](#deployment-architecture)
9. [Technology Stack Details](#technology-stack-details)

---

## 🏛️ HIGH-LEVEL ARCHITECTURE

```mermaid
graph TB
    subgraph "Client Layer"
        Browser[Web Browser]
        Mobile[Mobile Browser]
    end

    subgraph "Frontend - Next.js 15"
        Pages[Pages<br/>App Router]
        Components[React Components<br/>shadcn/ui]
        State[State Management<br/>React Query + Zustand]
        RealTime[Real-time Client<br/>Supabase Realtime]
    end

    subgraph "API Layer - Next.js API Routes"
        Auth[Auth APIs<br/>/api/auth/*]
        Features[Feature APIs<br/>/api/features/*]
        MindMaps[Mind Map APIs<br/>/api/mind-maps/*]
        Dependencies[Dependency APIs<br/>/api/dependencies/*]
        AI[AI APIs<br/>/api/ai/*]
        Webhooks[Webhooks<br/>/api/webhooks/*]
    end

    subgraph "Backend Services"
        Supabase[Supabase<br/>PostgreSQL + Auth + Real-time]
        OpenRouter[OpenRouter<br/>AI Models]
        Stripe[Stripe<br/>Payments]
        Resend[Resend<br/>Email]
    end

    Browser --> Pages
    Mobile --> Pages
    Pages --> Components
    Components --> State
    State --> Auth
    State --> Features
    State --> MindMaps
    State --> Dependencies
    State --> AI

    Auth --> Supabase
    Features --> Supabase
    MindMaps --> Supabase
    Dependencies --> Supabase
    AI --> OpenRouter
    AI --> Supabase
    Webhooks --> Stripe
    Webhooks --> Supabase

    Supabase --> RealTime
    RealTime --> State

    Auth -.Email.-> Resend

    style Supabase fill:#3ecf8e
    style OpenRouter fill:#6366f1
    style Stripe fill:#635bff
    style Pages fill:#0070f3
```

---

## 🏢 MULTI-TENANT ARCHITECTURE

### Isolation Strategy

```mermaid
graph LR
    subgraph "User Authentication"
        User[User]
        SupabaseAuth[Supabase Auth<br/>JWT Tokens]
    end

    subgraph "Team Membership"
        TeamMembers[team_members<br/>user_id + team_id + role]
    end

    subgraph "Team Isolation"
        Team1[Team 1 Data<br/>team_id = 'team_1']
        Team2[Team 2 Data<br/>team_id = 'team_2']
        Team3[Team 3 Data<br/>team_id = 'team_3']
    end

    subgraph "Row-Level Security"
        RLS[RLS Policies<br/>Enforce team_id filtering]
    end

    User --> SupabaseAuth
    SupabaseAuth --> TeamMembers
    TeamMembers -.Check Membership.-> RLS
    RLS --> Team1
    RLS --> Team2
    RLS --> Team3

    style RLS fill:#ef4444
    style TeamMembers fill:#f59e0b
    style SupabaseAuth fill:#3ecf8e
```

### Data Isolation Model

**Key Principles:**
- Every table has `team_id` column
- Row-Level Security (RLS) enforces team boundaries
- JWT token contains user ID, RLS policies check team membership
- No shared data between teams (zero data leakage)

**RLS Policy Pattern:**
```sql
-- Read access: User must be member of the team
CREATE POLICY "team_members_can_read"
ON features FOR SELECT
USING (
  team_id IN (
    SELECT team_id FROM team_members
    WHERE user_id = auth.uid()
  )
);

-- Write access: Same constraint
CREATE POLICY "team_members_can_insert"
ON features FOR INSERT
WITH CHECK (
  team_id IN (
    SELECT team_id FROM team_members
    WHERE user_id = auth.uid()
  )
);
```

---

## 🗄️ DATABASE SCHEMA

### Entity Relationship Diagram

```mermaid
erDiagram
    USERS ||--o{ TEAM_MEMBERS : "belongs to"
    TEAMS ||--o{ TEAM_MEMBERS : "has"
    TEAMS ||--o{ WORKSPACES : "owns"
    TEAMS ||--o{ SUBSCRIPTIONS : "has"
    WORKSPACES ||--o{ FEATURES : "contains"
    WORKSPACES ||--o{ MIND_MAPS : "contains"
    FEATURES ||--o{ TIMELINE_ITEMS : "has"
    FEATURES ||--o{ LINKED_ITEMS : "links to"
    FEATURES ||--o{ FEATURE_CONNECTIONS : "depends on"
    MIND_MAPS ||--o{ MIND_MAP_NODES : "contains"
    MIND_MAPS ||--o{ MIND_MAP_EDGES : "contains"
    MIND_MAP_NODES ||--o{ MIND_MAP_EDGES : "connects"
    WORKSPACES ||--o{ REVIEW_LINKS : "generates"
    REVIEW_LINKS ||--o{ FEEDBACK : "receives"

    USERS {
        uuid id PK
        text email UK
        text name
        text avatar_url
        timestamptz created_at
    }

    TEAMS {
        text id PK
        text name
        uuid owner_id FK
        text plan
        int member_count
        text stripe_customer_id UK
        timestamptz created_at
    }

    TEAM_MEMBERS {
        text id PK
        text team_id FK
        uuid user_id FK
        text role
        timestamptz joined_at
    }

    SUBSCRIPTIONS {
        text id PK
        text team_id FK
        text stripe_subscription_id UK
        text status
        text plan_id
        timestamptz current_period_start
        timestamptz current_period_end
    }

    WORKSPACES {
        text id PK
        text team_id FK
        text name
        text description
        text phase
        jsonb enabled_modules
        timestamptz created_at
    }

    FEATURES {
        text id PK
        text team_id FK
        text workspace_id FK
        text name
        text purpose
        text type
        timestamptz created_at
    }

    TIMELINE_ITEMS {
        text id PK
        text team_id FK
        text feature_id FK
        text timeline
        text difficulty
        text usp
        text integration_type
        timestamptz created_at
    }

    LINKED_ITEMS {
        text id PK
        text team_id FK
        text source_id FK
        text target_id FK
        text link_type
        timestamptz created_at
    }

    FEATURE_CONNECTIONS {
        text id PK
        text team_id FK
        text workspace_id FK
        text source_feature_id FK
        text target_feature_id FK
        text connection_type
        timestamptz created_at
    }

    MIND_MAPS {
        text id PK
        text team_id FK
        text workspace_id FK
        text name
        jsonb canvas_data
        timestamptz created_at
    }

    MIND_MAP_NODES {
        text id PK
        text mind_map_id FK
        text type
        text label
        jsonb position
        jsonb data
        text converted_to_feature_id
        timestamptz created_at
    }

    MIND_MAP_EDGES {
        text id PK
        text mind_map_id FK
        text source_node_id FK
        text target_node_id FK
        text type
        text label
        timestamptz created_at
    }

    REVIEW_LINKS {
        text id PK
        text workspace_id FK
        text token UK
        text type
        timestamptz expires_at
        timestamptz created_at
    }

    FEEDBACK {
        text id PK
        text review_link_id FK
        text feature_id FK
        text reviewer_email
        int rating
        text comment
        text status
        timestamptz created_at
    }
```

### Table Categories

**Core Tables (Multi-Tenancy):**
- `users` - User accounts (Supabase Auth)
- `teams` - Organizations
- `team_members` - Team membership with roles
- `subscriptions` - Stripe billing
- `workspaces` - Projects

**Feature Tables:**
- `features` - Top-level roadmap items
- `timeline_items` - MVP/SHORT/LONG breakdown
- `linked_items` - Feature relationships
- `feature_connections` - Dependency graph

**Mind Mapping Tables:**
- `mind_maps` - Canvas data
- `mind_map_nodes` - Individual nodes (5 types)
- `mind_map_edges` - Connections

**Review & Feedback Tables:**
- `review_links` - Public/invite/iframe links
- `feedback` - Reviewer submissions

---

## 🔐 AUTHENTICATION FLOW

```mermaid
sequenceDiagram
    participant User
    participant Browser
    participant NextJS as Next.js Frontend
    participant API as Next.js API Routes
    participant Supabase as Supabase Auth

    User->>Browser: Visit /login
    Browser->>NextJS: Load login page
    NextJS->>Browser: Show login form

    User->>Browser: Enter email/password
    Browser->>API: POST /api/auth/login
    API->>Supabase: signInWithPassword()
    Supabase-->>API: JWT Token + Session
    API-->>Browser: Set auth cookie
    Browser->>NextJS: Redirect to /dashboard

    NextJS->>API: Fetch user data
    API->>Supabase: Get user + team memberships
    Supabase-->>API: User + Teams
    API-->>NextJS: User data
    NextJS->>Browser: Render dashboard

    Note over Browser,Supabase: Subsequent Requests
    Browser->>API: Request with auth cookie
    API->>Supabase: Verify JWT
    Supabase-->>API: Valid token
    API->>Supabase: Query with RLS
    Supabase-->>API: Filtered data (team-scoped)
    API-->>Browser: Response
```

### Auth Middleware

**Route Protection:**
```typescript
// middleware.ts
export async function middleware(req: NextRequest) {
  const supabase = createMiddlewareClient({ req, res });
  const { data: { session } } = await supabase.auth.getSession();

  // Protected routes
  if (!session && req.nextUrl.pathname.startsWith('/dashboard')) {
    return NextResponse.redirect(new URL('/login', req.url));
  }

  // Auth routes (redirect if logged in)
  if (session && ['/login', '/signup'].includes(req.nextUrl.pathname)) {
    return NextResponse.redirect(new URL('/dashboard', req.url));
  }

  return NextResponse.next();
}
```

---

## 🔄 DATA FLOW - KEY FEATURES

### Mind Map to Features Conversion

```mermaid
graph TD
    A[User creates Mind Map] --> B[Add nodes on canvas]
    B --> C[Connect nodes with edges]
    C --> D{Select nodes to convert}

    D --> E[Map node properties]
    E --> F[Node type → Feature type]
    E --> G[Node label → Feature name]
    E --> H[Node data → Feature details]

    F --> I[Create Features in bulk]
    G --> I
    H --> I

    I --> J[Maintain relationships]
    J --> K[Edge → Dependency link]

    K --> L[Update mind_map_nodes]
    L --> M[Set converted_to_feature_id]

    M --> N[Features appear in dashboard]

    style D fill:#f59e0b
    style I fill:#3ecf8e
    style N fill:#0070f3
```

### Dependency Graph Analysis

```mermaid
graph LR
    A[User creates features] --> B[Add dependency links]
    B --> C[feature_connections table]

    C --> D[Critical Path Algorithm]
    D --> E[Traverse graph]
    E --> F[Find longest path]

    F --> G[Highlight bottlenecks]
    G --> H[Show on dependency graph]

    C --> I[Detect circular dependencies]
    I --> J{Cycle found?}
    J -->|Yes| K[Show warning]
    J -->|No| L[Valid graph]

    style D fill:#ef4444
    style G fill:#f59e0b
    style K fill:#ef4444
```

### Real-time Collaboration Flow

```mermaid
sequenceDiagram
    participant User1 as User 1
    participant Browser1 as Browser 1
    participant Supabase as Supabase Realtime
    participant Browser2 as Browser 2
    participant User2 as User 2

    User1->>Browser1: Edit feature name
    Browser1->>Supabase: UPDATE features
    Supabase-->>Browser1: Confirm update

    Supabase->>Browser2: Broadcast change
    Browser2->>User2: Update UI (live)

    Note over Browser1,Browser2: Both users see same data

    User2->>Browser2: Move timeline item
    Browser2->>Supabase: UPDATE timeline_items
    Supabase-->>Browser2: Confirm update

    Supabase->>Browser1: Broadcast change
    Browser1->>User1: Update UI (live)
```

---

## 🌐 API ARCHITECTURE

### API Routes Structure

```
next-app/app/api/
├── auth/
│   ├── login/route.ts
│   ├── signup/route.ts
│   ├── logout/route.ts
│   └── session/route.ts
├── teams/
│   ├── route.ts (GET, POST)
│   ├── [id]/route.ts (GET, PATCH, DELETE)
│   └── [id]/members/route.ts
├── workspaces/
│   ├── route.ts (GET, POST)
│   └── [id]/route.ts (GET, PATCH, DELETE)
├── features/
│   ├── route.ts (GET, POST)
│   ├── [id]/route.ts (GET, PATCH, DELETE)
│   └── [id]/timeline-items/route.ts
├── mind-maps/
│   ├── route.ts (GET, POST)
│   ├── [id]/route.ts (GET, PATCH, DELETE)
│   ├── [id]/nodes/route.ts
│   └── [id]/convert-to-features/route.ts
├── dependencies/
│   ├── route.ts (GET, POST)
│   ├── [id]/route.ts (DELETE)
│   └── analyze/route.ts (GET - critical path)
├── ai/
│   ├── chat/route.ts (POST - streaming)
│   ├── suggest/route.ts (POST - suggestions)
│   └── tools/route.ts (POST - agentic mode)
└── webhooks/
    ├── stripe/route.ts
    └── resend/route.ts
```

### API Response Pattern

```typescript
// Success Response
{
  success: true,
  data: { ... },
  message: "Operation successful"
}

// Error Response
{
  success: false,
  error: {
    code: "VALIDATION_ERROR",
    message: "Invalid input data",
    details: { ... }
  }
}
```

### API Middleware Stack

```mermaid
graph TD
    Request[Incoming Request] --> Auth[Auth Middleware]
    Auth --> Team[Team Context]
    Team --> Validation[Input Validation]
    Validation --> RateLimit[Rate Limiting]
    RateLimit --> Handler[Route Handler]
    Handler --> Response[Response]

    Auth -.Unauthenticated.-> Error401[401 Unauthorized]
    Team -.No Team.-> Error403[403 Forbidden]
    Validation -.Invalid.-> Error400[400 Bad Request]
    RateLimit -.Too Many.-> Error429[429 Too Many Requests]
    Handler -.Server Error.-> Error500[500 Internal Server Error]

    style Auth fill:#3ecf8e
    style Validation fill:#f59e0b
    style RateLimit fill:#ef4444
```

---

## 🔄 REAL-TIME COLLABORATION

### Supabase Realtime Architecture

```mermaid
graph TB
    subgraph "Client 1"
        C1[React Component]
        Sub1[Supabase Client<br/>Real-time Subscription]
    end

    subgraph "Client 2"
        C2[React Component]
        Sub2[Supabase Client<br/>Real-time Subscription]
    end

    subgraph "Supabase"
        PG[(PostgreSQL<br/>Database)]
        RT[Realtime Server<br/>WebSocket]
        WAL[Write-Ahead Log<br/>Change Detection]
    end

    C1 -->|Update| PG
    PG -->|Trigger| WAL
    WAL -->|Broadcast| RT
    RT -->|Push| Sub1
    RT -->|Push| Sub2
    Sub2 -->|Update State| C2

    style PG fill:#3ecf8e
    style RT fill:#f59e0b
    style WAL fill:#ef4444
```

### Subscription Pattern

```typescript
// Subscribe to workspace changes
useEffect(() => {
  const channel = supabase
    .channel(`workspace_${workspaceId}`)
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'features',
        filter: `workspace_id=eq.${workspaceId}`
      },
      (payload) => {
        // Handle INSERT, UPDATE, DELETE
        queryClient.invalidateQueries(['features', workspaceId]);
      }
    )
    .subscribe();

  return () => {
    channel.unsubscribe();
  };
}, [workspaceId]);
```

---

## ☁️ DEPLOYMENT ARCHITECTURE

### Vercel Deployment

```mermaid
graph TB
    subgraph "Client"
        Browser[Web Browser]
    end

    subgraph "Vercel Edge Network"
        CDN[CDN<br/>Static Assets]
        Edge[Edge Functions<br/>Middleware]
    end

    subgraph "Vercel Serverless"
        SSR[Next.js SSR<br/>Server Components]
        API[API Routes<br/>Serverless Functions]
    end

    subgraph "External Services"
        Supabase[(Supabase<br/>PostgreSQL)]
        OpenRouter[OpenRouter<br/>AI]
        Stripe[Stripe<br/>Payments]
    end

    Browser -->|Request| CDN
    CDN -->|Static| Browser
    CDN -->|Dynamic| Edge
    Edge -->|Auth Check| SSR
    SSR -->|Data| API
    API -->|Query| Supabase
    API -->|AI| OpenRouter
    API -->|Billing| Stripe

    style CDN fill:#0070f3
    style Edge fill:#f59e0b
    style Supabase fill:#3ecf8e
```

### Environment Configuration

```bash
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=xxx
SUPABASE_SERVICE_ROLE_KEY=xxx

# OpenRouter (AI)
OPENROUTER_API_KEY=xxx

# Stripe (Payments)
STRIPE_SECRET_KEY=sk_live_xxx
STRIPE_WEBHOOK_SECRET=whsec_xxx
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_xxx

# Resend (Email)
RESEND_API_KEY=re_xxx

# App Config
NEXT_PUBLIC_APP_URL=https://platform-test-cyan.vercel.app
```

---

## 🛠️ TECHNOLOGY STACK DETAILS

### Frontend Stack

```mermaid
graph LR
    subgraph "Framework"
        NextJS[Next.js 15<br/>App Router + RSC]
    end

    subgraph "Language"
        TS[TypeScript 5.x<br/>Strict Mode]
    end

    subgraph "UI Library"
        shadcn[shadcn/ui<br/>Radix UI]
        Tailwind[Tailwind CSS 3.x]
        Lucide[Lucide React<br/>Icons]
    end

    subgraph "State Management"
        ReactQuery[React Query<br/>Server State]
        Zustand[Zustand<br/>Client State]
    end

    subgraph "Specialized"
        ReactFlow[ReactFlow<br/>Mind Mapping]
        Recharts[Recharts<br/>Analytics]
    end

    NextJS --> TS
    TS --> shadcn
    TS --> ReactQuery
    TS --> ReactFlow
    shadcn --> Tailwind
    shadcn --> Lucide
    ReactQuery --> Zustand
    ReactFlow --> Recharts

    style NextJS fill:#0070f3
    style TS fill:#3178c6
    style shadcn fill:#18181b
```

### Backend Stack

```mermaid
graph LR
    subgraph "Database"
        Supabase[Supabase<br/>PostgreSQL 15]
        RLS[Row-Level Security]
        Realtime[Realtime Subscriptions]
    end

    subgraph "Authentication"
        SupabaseAuth[Supabase Auth<br/>JWT]
    end

    subgraph "Payments"
        Stripe[Stripe<br/>Checkout + Webhooks]
    end

    subgraph "Email"
        Resend[Resend<br/>Transactional Email]
    end

    subgraph "AI"
        OpenRouter[OpenRouter<br/>Multi-model API]
        Claude[Claude Haiku]
        Perplexity[Perplexity]
        Grok[Grok]
    end

    Supabase --> RLS
    Supabase --> Realtime
    Supabase --> SupabaseAuth
    OpenRouter --> Claude
    OpenRouter --> Perplexity
    OpenRouter --> Grok

    style Supabase fill:#3ecf8e
    style Stripe fill:#635bff
    style OpenRouter fill:#6366f1
```

### Testing Stack

```mermaid
graph LR
    subgraph "E2E Testing"
        Playwright[Playwright<br/>Browser Automation]
    end

    subgraph "Unit Testing"
        Jest[Jest<br/>Test Runner]
        RTL[React Testing Library]
    end

    subgraph "Type Safety"
        TSC[TypeScript Compiler]
        Zod[Zod<br/>Runtime Validation]
    end

    Playwright --> Jest
    Jest --> RTL
    RTL --> TSC
    TSC --> Zod

    style Playwright fill:#2ecc40
    style Jest fill:#c21325
    style TSC fill:#3178c6
```

---

## 📊 PERFORMANCE CONSIDERATIONS

### Data Loading Strategy

**1. Server Components (RSC)**
- Fetch data on server
- No client-side loading states
- Automatic code splitting

**2. React Query (Client State)**
- Cache server data
- Background refetching
- Optimistic updates

**3. Streaming SSR**
- Progressive page rendering
- Suspense boundaries
- Priority-based loading

### Caching Strategy

```mermaid
graph TD
    Request[User Request] --> Cache{Check Cache}
    Cache -->|Hit| Return[Return Cached]
    Cache -->|Miss| Fetch[Fetch from Supabase]
    Fetch --> Store[Store in Cache]
    Store --> Return

    Realtime[Realtime Update] --> Invalidate[Invalidate Cache]
    Invalidate --> Refetch[Background Refetch]
    Refetch --> Update[Update UI]

    style Cache fill:#f59e0b
    style Return fill:#3ecf8e
    style Invalidate fill:#ef4444
```

---

## 🔒 SECURITY ARCHITECTURE

### Security Layers

```mermaid
graph TD
    User[User] --> HTTPS[HTTPS/TLS<br/>Encrypted Transport]
    HTTPS --> Vercel[Vercel Edge<br/>DDoS Protection]
    Vercel --> Auth[Authentication<br/>JWT Validation]
    Auth --> RLS[Row-Level Security<br/>Database Isolation]
    RLS --> Validation[Input Validation<br/>Zod Schemas]
    Validation --> API[API Logic]

    style HTTPS fill:#3ecf8e
    style Auth fill:#f59e0b
    style RLS fill:#ef4444
```

### Threat Mitigation

| Threat | Mitigation |
|--------|------------|
| **SQL Injection** | Supabase prepared statements, Zod validation |
| **XSS** | React auto-escaping, Content Security Policy |
| **CSRF** | SameSite cookies, CORS configuration |
| **Data Leakage** | RLS policies, team_id filtering |
| **Rate Limiting** | Vercel Edge, API middleware |
| **DDoS** | Vercel Edge Network, CDN |

---

## 📚 REFERENCES

- **Next.js Documentation**: [https://nextjs.org/docs](https://nextjs.org/docs)
- **Supabase Documentation**: [https://supabase.com/docs](https://supabase.com/docs)
- **ReactFlow Documentation**: [https://reactflow.dev](https://reactflow.dev)
- **Stripe Documentation**: [https://stripe.com/docs](https://stripe.com/docs)

---

## 🔗 RELATED DOCUMENTATION

- [Implementation Plan](../implementation/README.md) - Detailed implementation timeline
- [API Reference](API_REFERENCE.md) - API endpoints documentation
- [Project Guidelines](../../CLAUDE.md) - Project guidelines and coding standards
- [README](../../README.md) - Project overview and quick start

---

**Last Updated**: 2025-11-14
**Version**: 1.0
**Status**: Living Document (update as architecture evolves)
