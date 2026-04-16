-- Mini CRM for SDRs - Database Schema
-- Tables: leads, campaigns, generated_messages

-- Create leads table
CREATE TABLE IF NOT EXISTS public.leads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  company TEXT,
  job_title TEXT,
  email TEXT,
  phone TEXT,
  linkedin_url TEXT,
  stage TEXT NOT NULL DEFAULT 'Base' CHECK (stage IN ('Base', 'Lead Mapeado', 'Tentando Contato', 'Conexão Iniciada', 'Qualificado')),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create campaigns table
CREATE TABLE IF NOT EXISTS public.campaigns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  context_description TEXT,
  prompt_instructions TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create generated_messages table
CREATE TABLE IF NOT EXISTS public.generated_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  lead_id UUID NOT NULL REFERENCES public.leads(id) ON DELETE CASCADE,
  campaign_id UUID NOT NULL REFERENCES public.campaigns(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'sent', 'replied')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE public.leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.generated_messages ENABLE ROW LEVEL SECURITY;

-- RLS Policies for leads
CREATE POLICY "leads_select_own" ON public.leads FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "leads_insert_own" ON public.leads FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "leads_update_own" ON public.leads FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "leads_delete_own" ON public.leads FOR DELETE USING (auth.uid() = user_id);

-- RLS Policies for campaigns
CREATE POLICY "campaigns_select_own" ON public.campaigns FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "campaigns_insert_own" ON public.campaigns FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "campaigns_update_own" ON public.campaigns FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "campaigns_delete_own" ON public.campaigns FOR DELETE USING (auth.uid() = user_id);

-- RLS Policies for generated_messages
CREATE POLICY "messages_select_own" ON public.generated_messages FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "messages_insert_own" ON public.generated_messages FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "messages_update_own" ON public.generated_messages FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "messages_delete_own" ON public.generated_messages FOR DELETE USING (auth.uid() = user_id);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_leads_user_id ON public.leads(user_id);
CREATE INDEX IF NOT EXISTS idx_leads_stage ON public.leads(stage);
CREATE INDEX IF NOT EXISTS idx_campaigns_user_id ON public.campaigns(user_id);
CREATE INDEX IF NOT EXISTS idx_messages_lead_id ON public.generated_messages(lead_id);
CREATE INDEX IF NOT EXISTS idx_messages_campaign_id ON public.generated_messages(campaign_id);

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply updated_at triggers
DROP TRIGGER IF EXISTS leads_updated_at ON public.leads;
CREATE TRIGGER leads_updated_at
  BEFORE UPDATE ON public.leads
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

DROP TRIGGER IF EXISTS campaigns_updated_at ON public.campaigns;
CREATE TRIGGER campaigns_updated_at
  BEFORE UPDATE ON public.campaigns
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();
