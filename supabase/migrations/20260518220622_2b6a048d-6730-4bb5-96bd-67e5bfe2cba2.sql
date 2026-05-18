CREATE TABLE public.project_notes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id UUID NOT NULL,
  title TEXT NOT NULL,
  body TEXT,
  created_by UUID,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.project_notes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Project participants view notes"
ON public.project_notes FOR SELECT
USING (has_role(auth.uid(), 'admin'::app_role) OR is_project_client(auth.uid(), project_id));

CREATE POLICY "Project participants insert notes"
ON public.project_notes FOR INSERT
WITH CHECK ((created_by = auth.uid()) AND (has_role(auth.uid(), 'admin'::app_role) OR is_project_client(auth.uid(), project_id)));

CREATE POLICY "Project participants update notes"
ON public.project_notes FOR UPDATE
USING (has_role(auth.uid(), 'admin'::app_role) OR is_project_client(auth.uid(), project_id))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role) OR is_project_client(auth.uid(), project_id));

CREATE POLICY "Project participants delete notes"
ON public.project_notes FOR DELETE
USING (has_role(auth.uid(), 'admin'::app_role) OR is_project_client(auth.uid(), project_id));

CREATE TRIGGER update_project_notes_updated_at
BEFORE UPDATE ON public.project_notes
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE INDEX idx_project_notes_project_id ON public.project_notes(project_id);