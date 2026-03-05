# Demo — Installazione e utilizzo

Questa cartella contiene il documento di demo del Menu Planner AI generato con
[Showboat](https://github.com/simonw/showboat) e
[Rodney](https://github.com/simonw/rodney).

## Prerequisiti

### 1. uv (package manager Python)

```bash
curl -LsSf https://astral.sh/uv/install.sh | sh

# Riapri il terminale, oppure:
export PATH=$HOME/.local/bin:$PATH
```

Su Manjaro/Arch:
```bash
sudo pacman -S uv
```

### 2. Showboat

Non richiede installazione permanente — si lancia con `uvx`:

```bash
uvx showboat --help
```

Oppure installa globalmente:
```bash
uv tool install showboat
```

### 3. Go

```bash
# Manjaro/Arch:
sudo pacman -S go

# Aggiungi al PATH in ~/.zshrc o ~/.bashrc:
export PATH=$PATH:~/go/bin
```

### 4. Rodney

```bash
go install github.com/simonw/rodney@latest
rodney --help
```

### 5. Chromium

```bash
# Manjaro/Arch:
sudo pacman -S chromium

# Se il binario non è nel PATH standard:
export ROD_BROWSER_BIN=$(which chromium)
```

---

## Utilizzo

### Leggere la demo

Apri `demo.md` in qualsiasi viewer Markdown (GitHub, VS Code, ecc.).

### Verificare che l'app funzioni

```bash
# Dalla root del progetto:
npm run dev &

cd docs/demo
uvx showboat verify demo.md
```

Showboat ri-esegue tutti i blocchi `bash` e segnala se l'output è cambiato.

### Rigenerare gli screenshot

```bash
# 1. Avvia l'app
npm run dev &

# 2. Avvia Chrome headless
chromium --headless --remote-debugging-port=9222 --no-sandbox --disable-gpu &

# 3. Connetti rodney alla sessione locale
cd docs/demo
rodney connect localhost:9222 --local

# 4. Cattura gli screenshot
rodney --local open http://localhost:3000 && sleep 2 && rodney --local waitstable && rodney --local screenshot homepage.png
rodney --local open http://localhost:3000/dashboard && sleep 2 && rodney --local waitstable && rodney --local screenshot dashboard.png
rodney --local open http://localhost:3000/planner && sleep 2 && rodney --local waitstable && rodney --local screenshot planner.png
rodney --local open http://localhost:3000/history && sleep 2 && rodney --local waitstable && rodney --local screenshot history.png
```

### Aggiungere contenuto alla demo

```bash
# Aggiungere un commento
uvx showboat note demo.md "Testo descrittivo"

# Eseguire un comando e catturarne l'output
uvx showboat exec demo.md bash "comando"

# Aggiungere uno screenshot già esistente
uvx showboat image demo.md file.png "Descrizione"
```
