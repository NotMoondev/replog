# RepLog

RepLog ist eine progressive Web-App zum Erfassen und Auswerten von Trainingseinheiten. Alle Daten werden lokal im Browser gespeichert - kein Account, kein Server, keine Cloud.

## Features

**Workout-Verwaltung**
- Workouts erstellen, benennen und loeschen
- Kraftuebungen mit Sets, Wiederholungen und optionalem Gewicht
- Cardio-Uebungen mit Dauer und optionalem Metrikwert (Intensitaet oder Geschwindigkeit)
- Uebungen innerhalb eines Workouts hinzufuegen und entfernen

**Trainingsplaene**
- Woechentliche Trainingplaene mit Zuordnung von Workouts zu Wochentagen
- Ruhetage explizit festlegbar
- Mehrere Plaene verwaltbar, einer davon aktiv
- Plaene umbenennen und loeschen

**Session-Tracking**
- Trainingseinheiten ausfuehren und die tatsaechlich geleisteten Werte protokollieren
- Beim Starten einer Session werden die zuletzt protokollierten Werte als Vorgabe geladen
- Abgeschlossene Sessions dauerhaft gespeichert

**Dashboard**
- Startseite zeigt das heutige Workout gemaess aktivem Trainingsplan
- Direktzugriff auf laufende oder geplante Sessions

**Statistiken**
- Fortschrittsgraphen pro Uebung ueber alle Sessions hinweg
- Kraftuebungen: Maximalgewicht, Wiederholungen und Volumen (Gewicht x Wiederholungen)
- Cardio-Uebungen: Dauer und Metrikwert
- Darstellung als Liniendiagramm mit Chart.js

**Datensicherung**
- Vollstaendiger Export aller Daten (Workouts, Plaene, Sessions) als JSON-Datei
- Import aus einer zuvor exportierten JSON-Datei
- Nuetzlich fuer Backups oder Geraetewechsel

**PWA**
- Installierbar als native App auf Desktop und Mobilgeraeten
- Vollstaendig offline nutzbar
- Kein Backend erforderlich - alle Daten liegen in IndexedDB des Browsers

## Tech Stack

- [Nuxt 4](https://nuxt.com) (SPA-Modus, SSR deaktiviert)
- [Vue 3](https://vuejs.org) + TypeScript
- [Tailwind CSS v4](https://tailwindcss.com)
- [Pinia](https://pinia.vuejs.org) fuer State Management
- [Dexie](https://dexie.org) als IndexedDB-Wrapper
- [Chart.js](https://www.chartjs.org) + [vue-chartjs](https://vue-chartjs.org)
- [@vite-pwa/nuxt](https://vite-pwa-org.netlify.app/frameworks/nuxt) fuer PWA-Unterstuetzung
- [Lucide Icons](https://lucide.dev)

## Entwicklung

Abhaengigkeiten installieren:

```bash
bun install
```

Entwicklungsserver starten (http://localhost:3000):

```bash
bun run dev
```

Statische Site generieren (fuer Deployment):

```bash
bun run generate
```

Produktions-Build lokal vorschauen:

```bash
bun run preview
```

## Deployment

Das Projekt wird automatisch auf GitHub Pages deployed, sobald ein Tag mit dem Praefix `v` gepusht wird (z.B. `v1.2.0`). Die GitHub Actions Workflow-Datei liegt unter [.github/workflows/deploy.yml](.github/workflows/deploy.yml).

```bash
git tag v1.0.0
git push origin v1.0.0
```

## Contributing

Beitraege sind willkommen. Bitte halte dich an folgende Punkte:

**Vorbedingungen**
- Node.js >= 20 oder Bun >= 1.x
- Grundkenntnisse in Vue 3 Composition API und TypeScript

**Workflow**
1. Das Repository forken
2. Einen Feature-Branch erstellen (`git checkout -b feature/mein-feature`)
3. Aenderungen committen - Commit-Messages auf Englisch, praegnant und im Imperativ (`Add exercise reorder functionality`)
4. Den Branch pushen und einen Pull Request gegen `main` eroeffnen
5. Im PR beschreiben, was geaendert wurde und warum

**Hinweise zur Codebasis**
- Neue Seiten kommen nach `app/pages/`, neue Komponenten nach `app/components/`
- Datenbankzugriffe laufen ausschliesslich ueber die Stores in `app/stores/`; Komponenten greifen nicht direkt auf `db` zu
- Typen gehoeren nach `app/types/`
- Die Datenbank-Schemaversionierung in `app/utils/db.ts` beachten - bei Schemaänderungen eine neue Version anlegen, keine bestehende veraendern
- SSR ist deaktiviert; browser-spezifische APIs (IndexedDB, `crypto.randomUUID`) koennen direkt verwendet werden

**Bugs und Feature-Requests**
Bitte als GitHub Issue einreichen und dabei beschreiben, welches Verhalten erwartet wird und welches tatsaechlich auftritt.

Mit dem Einreichen von Beiträgen erklärst du dich damit einverstanden, dass dein Code unter der GPL v3.0 Lizenz veröffentlicht wird.

## License

Dieses Projekt steht unter der GNU General Public License v3.0 (GPLv3).
