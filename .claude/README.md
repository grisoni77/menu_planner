# Claude Code Skills per Menu Planner

Questa directory contiene skill personalizzate per Claude Code specifiche per il progetto Menu Planner.

## Skill Disponibili

### `/commit` - Convenzioni Git Commit

**Quando usare**: Prima di creare commit per assicurarti che seguano le convenzioni del progetto.

**Funzionalità**:
- Messaggi di commit in italiano
- Limit 72 caratteri per riga
- Gestione speciale per database migrations e changes cross-layer
- Esempi specifici del dominio Menu Planner
- Checklist pre-commit automatica

**Come usare**:
```
/commit
```

Claude caricherà automaticamente tutte le convenzioni e ti guiderà nella creazione di messaggi di commit ben strutturati.

**Esempio output**:
```
Aggiunta prioritizzazione ricette stagionali nel planner

Questo commit introduce il rilevamento automatico della stagione
corrente e modifica la logica di generazione menu per dare priorità
alle ricette di stagione.

Modifiche principali:
- Rilevamento stagione in `menu-actions.ts:getCurrentSeason()`
- Filtro Supabase con `.or()` per ricette stagionali/neutre
- Aggiornamento prompt LLM con istruzione stagionalità

Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>
```

## Struttura Directory

```
.claude/
├── README.md                    # Questo file
└── skills/
    └── commit/
        └── SKILL.md             # Convenzioni commit
```

## Come Aggiungere Nuove Skill

1. Crea una directory: `.claude/skills/<nome-skill>/`
2. Crea il file: `.claude/skills/<nome-skill>/SKILL.md`
3. Aggiungi frontmatter YAML:
   ```yaml
   ---
   name: nome-skill
   description: Breve descrizione (quando Claude dovrebbe usarla)
   disable-model-invocation: false  # true se solo tu puoi invocarla
   ---
   ```
4. Scrivi le istruzioni in markdown sotto il frontmatter
5. Usa la skill con `/<nome-skill>` in Claude Code

## Note

- Le skill sono **project-level**: disponibili solo in questo progetto
- Claude Code le carica automaticamente dalla directory `.claude/skills/`
- Puoi commitarle nel repository per condividerle con altri sviluppatori
- Consulta la [documentazione ufficiale](https://docs.anthropic.com/en/docs/agents/skills) per dettagli avanzati
