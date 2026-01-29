# Gestione Database (Supabase)

Questo progetto usa Supabase in locale tramite Supabase CLI + Docker.
Lo schema del database è versionato tramite **migrazioni SQL** in `supabase/migrations/`.
I tipi TypeScript di Supabase sono versionati in `types/supabase.ts`.

## Prerequisiti
- Docker attivo
- Node.js + npm
- Supabase CLI via `npx` (non serve installazione globale)

## Avvio Supabase locale
```
bash
npx supabase start
```
URL utili (di solito):
- Studio: http://127.0.0.1:54323
- API: http://127.0.0.1:54321

## Workflow consigliato per modifiche allo schema

### 1) Crea una nuova migration
```
bash
npx supabase migration new <nome_breve>
```
Esempio:
```
bash
npx supabase migration new add_profiles_table
```
Scrivi le modifiche SQL nel file creato in `supabase/migrations/`.

### 2) Applica le migrazioni al DB locale
In sviluppo locale, il modo più pulito per riallineare tutto:
```
bash
npx supabase db reset
```
Questo ricrea il DB locale e riapplica **tutte** le migrazioni in ordine.

### 3) Rigenera i types di Supabase (versionati)
Dopo ogni modifica allo schema, rigenera i tipi:
```
bash
npm run gen:types
```
Se lo script non esiste, usa:
```
bash
npx supabase gen types typescript --local > types/supabase.ts
```
### 4) Verifica e commit
Prima di committare:
- controlla in Studio che le tabelle/colonne siano corrette
- assicurati che TypeScript compili

File da committare normalmente:
- `supabase/migrations/**`
- `supabase/config.toml`
- `types/supabase.ts`

## Cosa NON va versionato
Non committare mai:
- `supabase/.temp/**`
- `supabase/.branches/**`
- `.env.local` o qualsiasi file con segreti/chiavi

Queste directory sono già ignorate da `supabase/.gitignore`.

## Note su RLS / Policy
Se una tabella ha RLS abilitata e mancano policy, le query dal client possono fallire con errori di permessi.
In sviluppo locale si può:
- aggiungere policy permissive in migration (solo dev), oppure
- gestire policy più strette in modo esplicito.

## Troubleshooting rapido

### Non vedo le tabelle in Studio
- Assicurati di aver eseguito:
```
bash
npx supabase db reset
```
- Verifica che le migrazioni esistano in `supabase/migrations/`.

### I types non corrispondono allo schema
- Rigenera:
```
bash
npm run gen:types
```
- Se cambia `types/supabase.ts`, committa il file aggiornato insieme alle migrazioni.
