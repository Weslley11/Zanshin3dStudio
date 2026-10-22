// Junta as migrations num arquivo só, para colar no SQL Editor do Supabase
// sem precisar de Docker nem da CLI. Rode depois de criar uma migration nova:
//   npm run db:bundle
import { readdirSync, readFileSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'

const dir = 'supabase/migrations'
const files = readdirSync(dir).filter((f) => f.endsWith('.sql')).sort()
const header = `-- =====================================================================
--  INSTALAÇÃO COMPLETA DO BANCO · Zanshin 3D Studio
-- ---------------------------------------------------------------------
--  Gerado por scripts/bundle-sql.mjs a partir de supabase/migrations
--  (não edite à mão). Para usar num projeto NOVO e vazio do Supabase:
--  SQL Editor → New query → cole este arquivo inteiro → Run.
--  Rodar duas vezes no mesmo projeto dá erro de "já existe".
-- =====================================================================
`
const body = files.map((f) => `\n-- ---------------------------------------------------------------- ${f}\n\n${readFileSync(join(dir, f), 'utf8').trim()}\n`).join('')
writeFileSync('supabase/instalar-tudo.sql', header + body)
console.log(`supabase/instalar-tudo.sql: ${files.length} migrations`)
