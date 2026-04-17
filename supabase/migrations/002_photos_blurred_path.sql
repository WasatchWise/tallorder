-- B1 fix: pre-rendered blurred photo variants.
-- New upload pipeline writes a sharp-blurred variant to blurred/{userId}/{id}.jpg
-- and records the path here. Browse/profile pages serve blurred_path for
-- unconnected users; raw storage_path only after an accepted reveal.
ALTER TABLE photos ADD COLUMN IF NOT EXISTS blurred_path text;
