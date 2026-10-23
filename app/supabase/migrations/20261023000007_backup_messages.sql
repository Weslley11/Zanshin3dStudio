-- Zanshin 3D Studio · mensagens prontas para o cliente e lembrete de backup

alter table public.settings
  -- textos editados pelo dono; chave ausente = texto padrão do app
  add column message_templates jsonb not null default '{}'::jsonb,
  -- último backup baixado (o app lembra quando faz tempo)
  add column last_backup_at timestamptz;
