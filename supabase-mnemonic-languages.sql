alter table public.questions
  add column if not exists mnemonic_ar text,
  add column if not exists mnemonic_ku text,
  add column if not exists mnemonic_en text,
  add column if not exists mnemonic_tr text,
  add column if not exists mnemonic_uk text,
  add column if not exists mnemonic_ru text;
