# Menu Planner — Documento di Progetto App Android

**Versione**: 1.0
**Data**: 2026-02-21
**Stato**: Bozza di riferimento per lo sviluppo

---

## 1. Obiettivo

Sviluppare un'app Android nativa che consenta di:

1. **Visualizzare l'ultimo piano settimanale** generato e salvato sul backend
2. **Visualizzare la lista della spesa** associata a quel piano
3. **Depennare gli articoli già acquistati** dalla lista, con persistenza dello stato sul server

L'app è in sola lettura per il menu (la generazione rimane sul web), ma ha scrittura per lo stato di spunta della lista della spesa.

---

## 2. Architettura del Backend Esistente

### 2.1 Tecnologie

| Componente | Tecnologia |
|---|---|
| Framework web | Next.js 15 App Router (TypeScript) |
| Database | Supabase (PostgreSQL locale via Docker) |
| API | **Solo Server Actions** — nessuna route `/api` REST esposta |
| Schema JSONB | Zod per validazione output LLM |

### 2.2 Tabella `weekly_plans`

La tabella principale per l'app Android. Schema attuale:

```sql
weekly_plans (
  id                       uuid PRIMARY KEY,
  created_at               timestamptz NOT NULL DEFAULT now(),
  menu_data                jsonb NOT NULL,   -- struttura DayMenu[]
  shopping_list            jsonb NOT NULL,   -- struttura ShoppingItem[]
  family_profile_text      text NULL,
  model_name               text NULL,
  generation_prompt_version text NULL
)
```

### 2.3 Struttura `menu_data` (JSONB)

```
DayMenu[] — array di 7 giorni

DayMenu {
  day:     "Lunedì" | "Martedì" | ... | "Domenica"
  lunch:   MealPlan
  dinner:  MealPlan
}

MealPlan {
  recipes:                      MealRecipeItem[]
  notes:                        string | null      -- es. "Pasto fuori casa"
  ingredients_used_from_pantry: string[]
}

MealRecipeItem {
  recipe_id:          string          -- UUID in DB o "new"
  name:               string
  meal_role:          "main" | "side"
  nutritional_classes: ("veg" | "carbs" | "protein")[]
  source:             "user" | "ai"
  ai_creation_data:   { ingredients: string[], tags: string[] } | null
}
```

### 2.4 Struttura `shopping_list` (JSONB)

```
ShoppingItem[] — array piatto

ShoppingItem {
  item:       string    -- nome ingrediente
  quantity:   string    -- es. "q.b.", "500g"
  recipe_ids: string[]  -- UUID delle ricette che usano questo ingrediente
}
```

### 2.5 Accesso dati

Supabase espone automaticamente un'API REST (PostgREST) su:

```
http://<host>:54321/rest/v1/
```

Le RLS policy sono attualmente permissive (dev): qualsiasi client con la `anon key` può leggere e scrivere tutte le tabelle. L'app Android utilizzerà direttamente questa API tramite l'**SDK Android di Supabase**.

---

## 3. Modifica al Database Necessaria

Per persistere lo stato di spunta della lista della spesa è necessaria una modifica allo schema.

### 3.1 Strategia

Aggiungere la colonna `shopping_list_checked` alla tabella `weekly_plans`:

- **Tipo**: `text[]` (array di nomi articoli già spuntati)
- **Default**: `'{}'` (array vuoto)
- Quando l'utente spunta un articolo, l'app aggiorna questo array via PATCH alla riga del piano corrente
- La chiave è il campo `item` di `ShoppingItem` (stringa normalizzata)

**Alternativa scartata** — tabella separata `shopping_list_checks`: più flessibile per multi-utente, ma sovradimensionata per l'uso corrente (singolo utente, RLS non abilitata).

### 3.2 Migrazione SQL

File: `supabase/migrations/20260221000000_add_shopping_list_checked.sql`

```sql
ALTER TABLE public.weekly_plans
ADD COLUMN IF NOT EXISTS shopping_list_checked text[] NOT NULL DEFAULT '{}';
```

Dopo la migrazione eseguire:

```bash
npm run gen:types
```

e committare `types/supabase.ts` aggiornato insieme alla migrazione.

---

## 4. Strategia di Connettività

### 4.1 SDK consigliato

**Supabase Android SDK** (`io.github.jan-tennert.supabase:postgrest-kt`)

- Kotlin-first, coroutine-native
- Gestisce automaticamente headers di autenticazione (anon key)
- Supporta query builder (`.select()`, `.update()`, `.order()`, `.limit()`)
- Non richiede la creazione di endpoint API custom lato Next.js

### 4.2 Configurazione client

```kotlin
val supabase = createSupabaseClient(
    supabaseUrl = BuildConfig.SUPABASE_URL,      // es. http://192.168.x.x:54321
    supabaseKey = BuildConfig.SUPABASE_ANON_KEY
) {
    install(Postgrest)
}
```

Le credenziali vengono iniettate via `local.properties` → `BuildConfig` (non hardcoded).

### 4.3 Query principali

**Ultimo piano settimanale:**
```kotlin
supabase.from("weekly_plans")
    .select()
    .order("created_at", ascending = false)
    .limit(1)
    .decodeSingle<WeeklyPlan>()
```

**Aggiornare articoli spuntati:**
```kotlin
supabase.from("weekly_plans")
    .update({ set("shopping_list_checked", checkedItems) })
    .eq("id", planId)
```

---

## 5. Architettura Android

### 5.1 Stack tecnologico

| Layer | Tecnologia |
|---|---|
| Linguaggio | Kotlin |
| UI | Jetpack Compose + Material Design 3 |
| Architettura | MVVM (ViewModel + StateFlow) |
| Navigazione | Navigation Compose |
| Networking | Supabase Android SDK (Ktor internamente) |
| Serializzazione | `kotlinx.serialization` |
| Caching locale | `DataStore` (Preferences) — per ultimo stato offline |
| DI | Hilt |
| Build | Gradle (Kotlin DSL) |
| Min SDK | 26 (Android 8.0) |
| Target SDK | 35 (Android 15) |

### 5.2 Struttura package

```
com.menuplannerapp/
├── data/
│   ├── model/          # Data class Kotlin (WeeklyPlan, DayMenu, MealPlan, ...)
│   ├── remote/         # SupabaseDataSource — query al DB
│   └── repository/     # WeeklyPlanRepository — orchestrazione data/cache
├── ui/
│   ├── menu/           # Schermata piano settimanale
│   │   ├── MenuScreen.kt
│   │   └── MenuViewModel.kt
│   ├── shopping/       # Schermata lista della spesa
│   │   ├── ShoppingScreen.kt
│   │   └── ShoppingViewModel.kt
│   └── components/     # Composable riutilizzabili (DayCard, MealSection, ...)
├── di/                 # Hilt modules
└── MainActivity.kt
```

### 5.3 Navigazione

```
BottomNavigationBar
├── Tab "Menu"         → MenuScreen
└── Tab "Lista Spesa" → ShoppingScreen
```

Nessuna navigazione annidata necessaria per le feature richieste.

---

## 6. Specifiche Feature

### 6.1 Feature A — Piano Settimanale

**Schermata**: `MenuScreen`

**Comportamento:**
- Al lancio carica l'ultimo `weekly_plan` (query Supabase)
- Mostra indicatore di caricamento (CircularProgressIndicator) durante il fetch
- In caso di errore mostra messaggio con pulsante "Riprova"
- Nessun piano disponibile → messaggio "Nessun piano generato ancora"

**Layout UI:**

```
┌──────────────────────────────────────┐
│  Piano Settimanale                   │
│  Generato il: gg/mm/aaaa             │
├──────────────────────────────────────┤
│  ┌─ Lunedì ──────────────────────┐   │
│  │  🍽 Pranzo                     │   │
│  │    • Pasta al pomodoro [main]  │   │
│  │    • Insalata mista [side]     │   │
│  │  🌙 Cena                       │   │
│  │    • Pollo arrosto [main]      │   │
│  │    • Patate al forno [side]    │   │
│  └────────────────────────────────┘   │
│  ┌─ Martedì ──────────────────────┐   │
│  │  ...                           │   │
│  └────────────────────────────────┘   │
│  ... (7 card totali, scrollabile)     │
└──────────────────────────────────────┘
```

**Dettagli di rendering:**
- Ogni giorno è una card espandibile (collapsed by default da Mercoledì in poi)
- Se `meal.recipes` è vuoto e `meal.notes` contiene "fuori casa": mostra chip "Pasto fuori casa"
- Badge colorati per `meal_role`: arancione = main, verde = side
- `notes` non null e non vuoto: mostrato in corsivo sotto le ricette

### 6.2 Feature B — Lista della Spesa

**Schermata**: `ShoppingScreen`

**Comportamento:**
- Mostra la `shopping_list` dell'ultimo piano settimanale
- Ogni articolo ha una checkbox
- Lo stato di spunta è persistito su Supabase (colonna `shopping_list_checked`)
- Spuntare/de-spuntare un articolo triggerà un PATCH ottimistico: aggiornamento UI immediato, poi sincronia con il DB
- Se il piano cambia (nuovo piano salvato dal web), al refresh gli articoli spuntati vengono azzerati (il nuovo piano ha `shopping_list_checked = '{}'`)

**Layout UI:**

```
┌──────────────────────────────────────┐
│  Lista della Spesa                   │
│  Piano del: gg/mm/aaaa               │
│  [3/12 acquistati]                   │
├──────────────────────────────────────┤
│  Da acquistare (9)                   │
│  ┌────────────────────────────────┐  │
│  │ ○  Pomodori          q.b.      │  │
│  │ ○  Pasta             500g      │  │
│  │ ○  Petto di pollo    q.b.      │  │
│  │ ...                            │  │
│  └────────────────────────────────┘  │
│                                      │
│  Già acquistati (3)                  │
│  ┌────────────────────────────────┐  │
│  │ ✓  Patate            q.b.  ~~  │  │
│  │ ✓  Olio EVO          q.b.  ~~  │  │
│  │ ...                            │  │
│  └────────────────────────────────┘  │
│                                      │
│  [  Azzera tutto  ]                  │
└──────────────────────────────────────┘
```

**Dettagli di rendering:**
- Articoli separati in due sezioni: "Da acquistare" / "Già acquistati"
- Gli articoli spuntati appaiono con testo barrato e colore attenuato
- Pulsante "Azzera tutto" de-spunta tutti gli articoli (con dialog di conferma)
- Contatore progressivo in cima: `X/Y acquistati`

### 6.3 Aggiornamento dati

- **Pull-to-refresh** su entrambe le schermate
- Nessun polling automatico (l'app è companion, non real-time)
- Al ritorno in foreground dell'app: refresh automatico (tramite `Lifecycle.repeatOnLifecycle`)

---

## 7. Modelli Dati Kotlin

```kotlin
// Corrisponde alla riga in weekly_plans
@Serializable
data class WeeklyPlan(
    val id: String,
    @SerialName("created_at") val createdAt: String,
    @SerialName("menu_data") val menuData: List<DayMenu>,
    @SerialName("shopping_list") val shoppingList: List<ShoppingItem>,
    @SerialName("shopping_list_checked") val checkedItems: List<String> = emptyList(),
    @SerialName("model_name") val modelName: String? = null
)

@Serializable
data class DayMenu(
    val day: String,
    val lunch: MealPlan,
    val dinner: MealPlan
)

@Serializable
data class MealPlan(
    val recipes: List<MealRecipeItem>,
    val notes: String? = null,
    @SerialName("ingredients_used_from_pantry") val pantryUsed: List<String> = emptyList()
)

@Serializable
data class MealRecipeItem(
    @SerialName("recipe_id") val recipeId: String,
    val name: String,
    @SerialName("meal_role") val mealRole: String,   // "main" | "side"
    @SerialName("nutritional_classes") val nutritionalClasses: List<String>
)

@Serializable
data class ShoppingItem(
    val item: String,
    val quantity: String,
    @SerialName("recipe_ids") val recipeIds: List<String> = emptyList()
)
```

---

## 8. Gestione Errori e Offline

| Scenario | Comportamento |
|---|---|
| Nessuna connessione al lancio | Mostra ultimo piano caricato da DataStore cache |
| Errore PATCH lista spesa | Rollback ottimistico + snackbar errore |
| Piano non disponibile | Schermata empty state con messaggio |
| Timeout Supabase | Retry automatico x2, poi errore con "Riprova" |

**Caching**: al caricamento riuscito, il `WeeklyPlan` viene serializzato e salvato in `DataStore` come fallback offline. La cache viene invalidata se `id` del piano cambia.

---

## 9. Configurazione Ambiente

### 9.1 `local.properties` (non versionato)

```properties
SUPABASE_URL=http://192.168.x.x:54321
SUPABASE_ANON_KEY=eyJ...
```

### 9.2 `build.gradle.kts` (app)

```kotlin
android {
    buildFeatures { buildConfig = true }
    defaultConfig {
        buildConfigField("String", "SUPABASE_URL",
            "\"${properties["SUPABASE_URL"]}\"")
        buildConfigField("String", "SUPABASE_ANON_KEY",
            "\"${properties["SUPABASE_ANON_KEY"]}\"")
    }
}

dependencies {
    val supabaseVersion = "3.1.0"
    implementation(platform("io.github.jan-tennert.supabase:bom:$supabaseVersion"))
    implementation("io.github.jan-tennert.supabase:postgrest-kt")
    implementation("io.ktor:ktor-client-android:3.1.0")
    implementation("org.jetbrains.kotlinx:kotlinx-serialization-json:1.7.3")

    // Jetpack Compose BOM
    implementation(platform("androidx.compose:compose-bom:2025.01.00"))
    implementation("androidx.compose.ui:ui")
    implementation("androidx.compose.material3:material3")
    implementation("androidx.navigation:navigation-compose:2.8.5")

    // Hilt
    implementation("com.google.dagger:hilt-android:2.54")
    kapt("com.google.dagger:hilt-compiler:2.54")
    implementation("androidx.hilt:hilt-navigation-compose:1.2.0")

    // DataStore
    implementation("androidx.datastore:datastore-preferences:1.1.1")

    // Lifecycle
    implementation("androidx.lifecycle:lifecycle-viewmodel-compose:2.8.7")
    implementation("androidx.lifecycle:lifecycle-runtime-compose:2.8.7")
}
```

### 9.3 Permessi `AndroidManifest.xml`

```xml
<uses-permission android:name="android.permission.INTERNET" />
<!-- Per connessione a Supabase locale in HTTP (non HTTPS) durante sviluppo -->
<application android:usesCleartextTraffic="true" ...>
```

**Nota**: `usesCleartextTraffic="true"` è accettabile in sviluppo (Supabase locale HTTP). In produzione Supabase usa HTTPS e questo flag va rimosso o limitato via `network_security_config.xml`.

---

## 10. Fasi di Sviluppo

### Fase 1 — Setup e connessione dati
- [ ] Inizializzare progetto Android (Kotlin + Compose)
- [ ] Configurare Supabase SDK e BuildConfig
- [ ] Implementare `SupabaseDataSource` con query lettura ultimo piano
- [ ] Verificare deserializzazione JSON (`menu_data`, `shopping_list`)
- [ ] Eseguire migrazione `add_shopping_list_checked` sul DB locale

### Fase 2 — Piano settimanale
- [ ] Implementare `MenuViewModel` con StateFlow
- [ ] Implementare `MenuScreen` con lista di `DayCard`
- [ ] Gestire stato loading / error / empty
- [ ] Pull-to-refresh

### Fase 3 — Lista della spesa
- [ ] Implementare `ShoppingViewModel` con aggiornamento ottimistico
- [ ] Implementare `ShoppingScreen` con sezioni e checkbox
- [ ] PATCH `shopping_list_checked` su Supabase
- [ ] Pulsante "Azzera tutto" con dialog di conferma

### Fase 4 — Rifinitura
- [ ] Bottom navigation bar
- [ ] Caching DataStore per offline fallback
- [ ] Refresh automatico al ritorno in foreground
- [ ] Gestione errori e snackbar
- [ ] Icona app e splash screen

---

## 11. Fuori Scope (v1)

I seguenti elementi sono esclusi dalla prima versione:

- Generazione menu dall'app (rimane su web)
- Modifica/aggiunta ricette o dispensa
- Autenticazione utente (RLS permissiva)
- Notifiche push
- Widget home screen
- Multi-profilo / multi-famiglia
- Supporto tablet / large screen layout

---

## 12. Dipendenze Backend da Creare

| Elemento | File | Stato |
|---|---|---|
| Migrazione `shopping_list_checked` | `supabase/migrations/20260221000000_add_shopping_list_checked.sql` | Da fare |
| Rigenerare `types/supabase.ts` | Dopo migrazione: `npm run gen:types` | Da fare |
| Nessuna route API aggiuntiva richiesta | — | ✓ |

Il backend Next.js non richiede modifiche al codice applicativo. Il PATCH all'array `shopping_list_checked` avviene direttamente dall'app Android tramite Supabase REST API, compatibile con le RLS policy esistenti.
