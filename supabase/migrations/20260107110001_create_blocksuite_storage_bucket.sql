-- BlockSuite Storage Bucket
-- Phase 4: Supabase Persistence (Yjs + Real-time)
--
-- Creates private storage bucket for Yjs binary state
-- Path format: {team_id}/{doc_id}.yjs
--
-- Security:
-- 1. Team members can only access files in their team's folder
-- 2. Path traversal attacks blocked (no '..' or special characters)
-- 3. Application layer uses getStoragePath() with sanitizeId() for additional protection
-- 4. Supabase Storage normalizes paths server-side before policy evaluation

-- Create storage bucket for BlockSuite Yjs documents
INSERT INTO storage.buckets (id, name, public)
VALUES ('blocksuite-yjs', 'blocksuite-yjs', false)
ON CONFLICT (id) DO NOTHING;

-- Storage policy: Team members can access their team's files
-- SECURITY: Explicit path traversal protection added
CREATE POLICY "blocksuite_storage_team_access" ON storage.objects
FOR ALL USING (
  bucket_id = 'blocksuite-yjs' AND
  -- SECURITY: Reject path traversal attempts (.. sequences, URL-encoded variants)
  name NOT LIKE '%..%' AND
  name NOT LIKE '%\..%' AND
  name ~ '^[a-zA-Z0-9_-]+/[a-zA-Z0-9_-]+\.yjs$' AND
  -- Extract team_id from path: {team_id}/{doc_id}.yjs
  (storage.foldername(name))[1] IN (
    SELECT team_id FROM team_members
    WHERE user_id = auth.uid()
  )
);

-- Note: Cannot add COMMENT on storage.objects policy (owned by Supabase)
-- Security documentation in file header comments above
