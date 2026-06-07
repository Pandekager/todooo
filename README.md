# Todooo

En simpel, selv-hostet checkliste — én liste, ingen konti. Tilgå den samme liste fra både PC og telefon på dit hjemmenetværk.

Bygget med Nuxt 4, Bun, SQLite og UnoCSS. Kører i Docker på din hjemmeserver.

## Funktioner

- Hurtig tilføjelse af punkter ("Tilføj...")
- Check/uncheck med ét klik
- Omarrangér aktive punkter via træk-og-slip eller Cmd+↑/↓
- Redigér tekst inline
- Arkivering af checkede punkter (sorteret nyest først)
- Lys/mørk/system-tema
- Spil glatte animationer ved check, uncheck og omarrangering

## Kom i gang (udvikling)

### Forudsætninger

- [Bun](https://bun.sh) v1.3+

### Installation

```bash
bun install
```

### Udviklingsserver

```bash
bun run dev
```

Åbn http://localhost:3000 i din browser.

### Tests

```bash
bun run test
```

### Typekontrol

```bash
bun run typecheck
```

## Docker

### Forudsætninger

- [Docker](https://docker.com)

### Byg image

```bash
docker build -t todooo .
```

### Kør containeren

Opret en Docker volume til at gemme databasen permanent:

```bash
docker volume create todooo-data
```

Start containeren:

```bash
docker run -d \
  --name todooo \
  -p 3000:3000 \
  -v todooo-data:/data \
  todooo
```

Alternativt kan du bind-mounte en lokal mappe:

```bash
mkdir -p ./data
docker run -d \
  --name todooo \
  -p 3000:3000 \
  -v "$(pwd)/data:/data" \
  todooo
```

### Adgang fra andre enheder på netværket

1. Find din servers lokale IP-adresse:
   - **Linux/macOS**: `ip addr show` eller `ifconfig`
   - **Windows**: `ipconfig`
2. Åbn `http://<SERVER_IP>:3000` på din telefon eller PC.

Sørg for at port 3000 ikke er blokeret af din firewall.

### Stop containeren

```bash
docker stop todooo
```

### Oprydning

```bash
docker rm todooo
docker volume rm todooo-data
```

## Projektstruktur

```
app/              # Vue-komponenter (app.vue)
server/           # API routes og database (Nitro + libsql)
  api/            # REST endpoints
  utils/          # database.ts (SQLite singleton)
tests/            # Integrationstests (Vitest)
  api/
public/           # Statiske filer
data/             # Lokal SQLite database (ikke i Git)
```

## Licens

Privat — til personlig brug på hjemmenetværket.
