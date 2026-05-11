-- Content calendar entries per project
CREATE TYPE public.calendar_entry_status AS ENUM ('idea', 'scheduled', 'published');

CREATE TABLE public.content_calendar_entries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid NOT NULL,
  scheduled_date date NOT NULL,
  title text NOT NULL,
  notes text,
  platform text,
  status public.calendar_entry_status NOT NULL DEFAULT 'idea',
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_cce_project_date ON public.content_calendar_entries(project_id, scheduled_date);

ALTER TABLE public.content_calendar_entries ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Project participants view calendar"
  ON public.content_calendar_entries FOR SELECT
  USING (public.has_role(auth.uid(), 'admin') OR public.is_project_client(auth.uid(), project_id));

CREATE POLICY "Project participants insert calendar"
  ON public.content_calendar_entries FOR INSERT
  WITH CHECK ((created_by = auth.uid()) AND (public.has_role(auth.uid(), 'admin') OR public.is_project_client(auth.uid(), project_id)));

CREATE POLICY "Project participants update calendar"
  ON public.content_calendar_entries FOR UPDATE
  USING (public.has_role(auth.uid(), 'admin') OR public.is_project_client(auth.uid(), project_id))
  WITH CHECK (public.has_role(auth.uid(), 'admin') OR public.is_project_client(auth.uid(), project_id));

CREATE POLICY "Project participants delete calendar"
  ON public.content_calendar_entries FOR DELETE
  USING (public.has_role(auth.uid(), 'admin') OR public.is_project_client(auth.uid(), project_id));

CREATE TRIGGER cce_updated_at
  BEFORE UPDATE ON public.content_calendar_entries
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();