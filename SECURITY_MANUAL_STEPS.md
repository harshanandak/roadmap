# Security Manual Configuration Steps

**Last Updated**: 2025-01-15
**Priority**: HIGH
**Status**: Action Required

---

## Overview

This document contains security configurations that cannot be automated via SQL migrations and must be configured manually through the Supabase Dashboard.

---

## Phase 5: Enable Leaked Password Protection

### What is Leaked Password Protection?

Supabase Auth can prevent users from setting passwords that have been compromised in data breaches by checking against the [HaveIBeenPwned.org](https://haveibeenpwned.com/) database.

**Why this matters:**
- 🔒 Prevents users from setting commonly compromised passwords
- 🛡️ Reduces risk of account takeovers via credential stuffing
- ✅ Industry best practice for password security
- 📊 HaveIBeenPwned tracks 11+ billion compromised passwords

---

## Step-by-Step Instructions

### 1. Access Supabase Dashboard

Navigate to your Supabase project dashboard:

```
https://supabase.com/dashboard/project/xobyeusefijdvsqkzxvm
```

### 2. Navigate to Auth Settings

1. Click **"Authentication"** in the left sidebar
2. Click **"Policies"** or **"Settings"** (depending on dashboard version)
3. Look for **"Password Security"** or **"Auth Security"** section

### 3. Enable Leaked Password Protection

1. Find the toggle/checkbox for **"Leaked Password Protection"**
2. **Enable** the setting
3. Click **"Save"** to apply changes

### 4. Verify Configuration

After enabling, new user signups and password changes will be checked against the HaveIBeenPwned database.

**Test it:**
- Try signing up with a known compromised password (e.g., "password123")
- You should receive an error: "Password has been compromised in a data breach"

---

## Additional Recommended Auth Settings

While you're in the Auth settings, consider enabling these security features:

### Password Strength Requirements
- ✅ **Minimum Length**: 12+ characters recommended
- ✅ **Require Uppercase & Lowercase**: Enabled
- ✅ **Require Numbers**: Enabled
- ✅ **Require Special Characters**: Enabled

### Account Security
- ✅ **Email Verification**: Required for signup (prevents fake accounts)
- ✅ **Rate Limiting**: Enabled for signup/login (prevents brute force)
- ✅ **Session Management**: Configure session timeout (default: 7 days)

### Two-Factor Authentication (2FA)
- ✅ **Enable TOTP 2FA**: Allow users to enable 2FA (Pro plan feature)
- ✅ **SMS 2FA**: Consider enabling SMS-based 2FA (requires Twilio integration)

---

## Verification Checklist

After completing the manual steps, verify all security measures are in place:

- [ ] Leaked Password Protection: **Enabled** ✅
- [ ] Password Strength: Configured with strong requirements
- [ ] Email Verification: Required
- [ ] Rate Limiting: Enabled
- [ ] RLS Enabled: All 8 public tables (automated via migrations)
- [ ] RLS Policies: 36+ policies created (automated via migrations)
- [ ] Function Security: 36 functions with `search_path = ''` (automated via migrations)

---

## Documentation Links

- [Supabase Password Security Guide](https://supabase.com/docs/guides/auth/password-security#password-strength-and-leaked-password-protection)
- [HaveIBeenPwned API](https://haveibeenpwned.com/API/v3)
- [OWASP Password Guidelines](https://cheatsheetseries.owasp.org/cheatsheets/Authentication_Cheat_Sheet.html)
- [Supabase Auth Best Practices](https://supabase.com/docs/guides/auth)

---

## Migration Summary

For reference, here are the automated security fixes applied via migrations:

### Phase 1: Critical RLS Enablement
- ✅ Enabled RLS on `work_items` (23 rows protected)
- ✅ Enabled RLS on `timeline_items` (31 rows protected)
- ✅ Enabled RLS on `linked_items` (17 rows protected)
- **Migration**: `20250115143000_enable_rls_critical_tables.sql`

### Phase 2: Additional RLS Tables
- ✅ Enabled RLS + policies on `user_settings` (4 policies)
- ✅ Enabled RLS + policies on `feature_connections` (4 policies)
- ✅ Enabled RLS + policies on `feature_importance_scores` (4 policies)
- ✅ Enabled RLS + policies on `feature_correlations` (4 policies)
- ✅ Enabled RLS + policies on `connection_insights` (4 policies)
- **Migration**: `20250115143100_enable_rls_public_tables.sql`

### Phase 3: Subscriptions Security
- ✅ Added 4 RLS policies to `subscriptions` table (billing data protection)
- **Migration**: `20250115143200_add_subscriptions_rls_policies.sql`

### Phase 4: Function Security
- ✅ Fixed `search_path` on 36 database functions
- ✅ Prevents SQL injection via schema manipulation
- **Migration**: `20250115143300_fix_function_search_path.sql`

### Phase 5: Auth Configuration (Manual)
- ⏳ Enable leaked password protection (this document)

---

## Status: Waiting for Manual Action

**Action Required**: Please complete Phase 5 by enabling Leaked Password Protection in the Supabase Dashboard.

Once complete, all critical security issues identified by the Supabase MCP advisor will be resolved! 🎉

---

**Contact**: If you need assistance with these configurations, refer to the [Supabase Support](https://supabase.com/docs/support).
