---
name: commit
description: Create well-structured Git commits following Menu Planner project conventions. Use when preparing to commit code changes. Enforces Italian messages, 72-char limit, and project-specific rules for migrations and multi-layer changes.
disable-model-invocation: false
---

# Convenzioni Commit - Menu Planner

Questa skill definisce le convenzioni per i messaggi di commit del progetto Menu Planner.

## Separazione delle modifiche
Un commit deve contenere solo modifiche correlate e coerenti tra loro.
Se i file modificati comprendono modifiche attinenti diversi contesti logici
usa più commit invece di un singolo commit.
Ignora file non aggiunti o non modificati da te.

**Regole specifiche del progetto:**
- **Database migrations**: Sempre commit separato, includere `types/supabase.ts` se generato con `npm run gen:types`
- **Schema changes**: Un commit per migration + types, separato da modifiche applicative
- **Features cross-layer**: Se modifichi server actions + UI + types, considera commit separati per layer

## Formato messaggi di commit
I messaggi di commit devono essere scritti in italiano e devono sempre spiegare in modo esaustivo lo scopo del commit.
Se si tratta di modifiche semplici scrivi dei messaggi corti che stanno su una riga.
Se richiedono spiegazioni lunghe devono comprendere un subject e un body strutturati nel seguente modo:
```
<subject>
<riga vuota>
<body su più righe>
```

## Regole di formattazione
- Le righe di subject e body non devono mai superare i 72 caratteri
- Usa i backtick per delimitare termini tecnici (es.: `$variabile`, `NomeClasse`, `nomeFunzione()`)
- Includi riferimenti a file o funzioni chiave quando rilevante (es.: `menu-actions.ts:generateMenuAction`)

## Prefissi consigliati (opzionali)
Anche se il progetto non richiede prefissi obbligatori, considera questi pattern:
- **Aggiunta/Aggiungi**: Nuove feature o funzionalità
- **Modifica/Migliora**: Enhancement a feature esistenti
- **Correggi/Fix**: Bug fix
- **Refactoring**: Ristrutturazione codice senza cambio funzionalità
- **Database**: Modifiche schema o migrations
- **Docs**: Solo documentazione

## Esempi specifici del progetto

### Commit semplici (una riga)
```
Aggiunta validazione stagionalità in `RecipeFormModal`
```
```
Correggi calcolo copertura nutrizionale per pasti senza contorno
```
```
Migliora performance query ricette in `menu-actions.ts`
```

### Commit con migration database
```
Database: aggiunta colonna `dietary_preferences` a ricette

- Migration: `20240212_add_dietary_preferences.sql`
- Types regenerati: `types/supabase.ts`
- Nota: i form UI verranno aggiornati in commit successivo
```

### Commit feature complessa
```
Aggiunta prioritizzazione ricette stagionali nel planner

Questo commit introduce il rilevamento automatico della stagione
corrente e modifica la logica di generazione menu per dare priorità
alle ricette di stagione.

Modifiche principali:
- Rilevamento stagione in `menu-actions.ts:getCurrentSeason()`
- Filtro Supabase con `.or()` per ricette stagionali/neutre
- Aggiornamento prompt LLM con istruzione stagionalità
- UI badge stagione in `RecipeCard.tsx`
```

### Commit refactoring
```
Refactoring validazione copertura nutrizionale

Estrae la logica di validazione da `menu-actions.ts` in utility
riutilizzabile `planner-utils.ts:validateNutritionalCoverage()`.
Migliora leggibilità e permette testing isolato.
```

### Commit documentazione
```
Docs: aggiunta sezione architettura a CLAUDE.md

Documenta il flusso completo di generazione menu per facilitare
onboarding e manutenzione futura del codice LLM.
```

## Checklist pre-commit

Prima di creare il commit, verifica:
- [ ] `npm run lint` passa senza errori
- [ ] Se modificato schema DB: `npm run gen:types` eseguito e `types/supabase.ts` incluso
- [ ] Nessun file di debug/temporaneo incluso (`.log`, `test.ts`, ecc.)
- [ ] Il messaggio spiega il "perché", non solo il "cosa"
- [ ] File non correlati esclusi dal commit

## Istruzioni per Claude Code

Quando crei messaggi di commit per questo progetto:

1. **Analizza prima il contesto**:
   - Esamina `git status` e `git diff` per capire le modifiche
   - Verifica se ci sono migration files o `types/supabase.ts` modificati
   - Identifica il layer toccato (database, server actions, UI, types)

2. **Determina la strategia di commit**:
   - Migration + types = commit separato
   - Feature cross-layer = valuta split per layer
   - Bug fix isolato = singolo commit
   - Refactoring = commit dedicato

3. **Scrivi il messaggio**:
   - Sempre in italiano
   - Max 72 caratteri per riga
   - Subject chiaro e conciso
   - Body (se necessario) che spiega il "perché"
   - Usa backtick per termini tecnici
   - Includi riferimenti file:linea quando utile

4. **Esegui la checklist** prima di committare

5. **Aggiungi sempre** al termine del messaggio:
   ```
   Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>
   ```
