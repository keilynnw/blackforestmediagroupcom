ALTER TABLE public.projects ADD COLUMN IF NOT EXISTS calendar_token text UNIQUE;
UPDATE public.projects SET calendar_token = replace(gen_random_uuid()::text, '-', '') WHERE calendar_token IS NULL;
ALTER TABLE public.projects ALTER COLUMN calendar_token SET NOT NULL;
ALTER TABLE public.projects ALTER COLUMN calendar_token SET DEFAULT replace(gen_random_uuid()::text, '-', '');