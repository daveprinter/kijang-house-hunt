CREATE TABLE public.admin_emails (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text NOT NULL UNIQUE,
  resend_api_key text,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT ALL ON public.admin_emails TO service_role;
ALTER TABLE public.admin_emails ENABLE ROW LEVEL SECURITY;

CREATE TABLE public.admin_access_codes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text NOT NULL,
  code_hash text NOT NULL,
  expires_at timestamptz NOT NULL,
  used boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT ALL ON public.admin_access_codes TO service_role;
ALTER TABLE public.admin_access_codes ENABLE ROW LEVEL SECURITY;

INSERT INTO public.admin_emails (email) VALUES ('kuladavid177@gmail.com');