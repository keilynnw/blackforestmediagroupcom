
-- ===== Enums =====
CREATE TYPE public.app_role AS ENUM ('admin', 'client');
CREATE TYPE public.project_status AS ENUM ('active', 'paused', 'completed');

-- ===== Updated_at helper =====
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END;
$$ LANGUAGE plpgsql SET search_path = public;

-- ===== profiles =====
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name TEXT,
  company TEXT,
  avatar_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE TRIGGER profiles_updated BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ===== user_roles =====
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role public.app_role NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role public.app_role)
RETURNS BOOLEAN
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role)
$$;

-- ===== invitations =====
CREATE TABLE public.invitations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT NOT NULL,
  token TEXT NOT NULL UNIQUE,
  role public.app_role NOT NULL DEFAULT 'client',
  invited_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  expires_at TIMESTAMPTZ NOT NULL DEFAULT (now() + INTERVAL '7 days'),
  used_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.invitations ENABLE ROW LEVEL SECURITY;
CREATE INDEX idx_invitations_token ON public.invitations(token);

-- ===== projects =====
CREATE TABLE public.projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  status public.project_status NOT NULL DEFAULT 'active',
  client_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;
CREATE TRIGGER projects_updated BEFORE UPDATE ON public.projects
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE INDEX idx_projects_client ON public.projects(client_id);

-- ===== project_assets =====
CREATE TABLE public.project_assets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  uploaded_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  storage_path TEXT NOT NULL,
  label TEXT,
  file_type TEXT,
  file_size BIGINT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.project_assets ENABLE ROW LEVEL SECURITY;
CREATE INDEX idx_assets_project ON public.project_assets(project_id);

-- ===== messages =====
CREATE TABLE public.messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  sender_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  body TEXT NOT NULL,
  read_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
CREATE INDEX idx_messages_project ON public.messages(project_id, created_at);

-- ===== Helper: is project participant =====
CREATE OR REPLACE FUNCTION public.is_project_client(_user_id UUID, _project_id UUID)
RETURNS BOOLEAN
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT EXISTS (SELECT 1 FROM public.projects WHERE id = _project_id AND client_id = _user_id)
$$;

-- ===== RLS POLICIES =====

-- profiles
CREATE POLICY "Users view own profile" ON public.profiles
  FOR SELECT USING (auth.uid() = id OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Users update own profile" ON public.profiles
  FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Users insert own profile" ON public.profiles
  FOR INSERT WITH CHECK (auth.uid() = id);
CREATE POLICY "Admins manage profiles" ON public.profiles
  FOR ALL USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- user_roles
CREATE POLICY "Users see own roles" ON public.user_roles
  FOR SELECT USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins manage roles" ON public.user_roles
  FOR ALL USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- invitations
CREATE POLICY "Admins manage invitations" ON public.invitations
  FOR ALL USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));
-- Token lookup happens via service role in server fn; no public read needed.

-- projects
CREATE POLICY "Clients view own projects" ON public.projects
  FOR SELECT USING (client_id = auth.uid() OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins manage projects" ON public.projects
  FOR ALL USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- project_assets
CREATE POLICY "Project participants view assets" ON public.project_assets
  FOR SELECT USING (public.has_role(auth.uid(), 'admin') OR public.is_project_client(auth.uid(), project_id));
CREATE POLICY "Project participants upload assets" ON public.project_assets
  FOR INSERT WITH CHECK (
    uploaded_by = auth.uid()
    AND (public.has_role(auth.uid(), 'admin') OR public.is_project_client(auth.uid(), project_id))
  );
CREATE POLICY "Admins delete assets" ON public.project_assets
  FOR DELETE USING (public.has_role(auth.uid(), 'admin'));

-- messages
CREATE POLICY "Project participants view messages" ON public.messages
  FOR SELECT USING (public.has_role(auth.uid(), 'admin') OR public.is_project_client(auth.uid(), project_id));
CREATE POLICY "Project participants send messages" ON public.messages
  FOR INSERT WITH CHECK (
    sender_id = auth.uid()
    AND (public.has_role(auth.uid(), 'admin') OR public.is_project_client(auth.uid(), project_id))
  );
CREATE POLICY "Senders mark read" ON public.messages
  FOR UPDATE USING (public.has_role(auth.uid(), 'admin') OR public.is_project_client(auth.uid(), project_id));

-- ===== Storage bucket =====
INSERT INTO storage.buckets (id, name, public) VALUES ('client-files', 'client-files', false)
  ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Project members read files" ON storage.objects
  FOR SELECT USING (
    bucket_id = 'client-files'
    AND (
      public.has_role(auth.uid(), 'admin')
      OR public.is_project_client(auth.uid(), ((storage.foldername(name))[1])::uuid)
    )
  );
CREATE POLICY "Project members upload files" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'client-files'
    AND (
      public.has_role(auth.uid(), 'admin')
      OR public.is_project_client(auth.uid(), ((storage.foldername(name))[1])::uuid)
    )
  );
CREATE POLICY "Admins delete files" ON storage.objects
  FOR DELETE USING (bucket_id = 'client-files' AND public.has_role(auth.uid(), 'admin'));

-- ===== Auto-create profile on signup =====
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.profiles (id, display_name)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'display_name', NEW.email))
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
