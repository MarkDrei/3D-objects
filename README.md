# Polyhafen – 3D-Objektwelt

Eine verspielte Low-Poly-Stadt mit three.js + TypeScript (Vite), mobile first.
Jedes Objekt ist anklickbar: es wird als **komplettes Objekt** hervorgehoben (goldene Einfärbung,
gelbe Kontur, magenta Kontur für verdeckte Teile) und eine Karte zeigt **Typ** und **eindeutige ID**
(z. B. `Riesenrad · ferris_wheel_001`). Ziel: Objekte identifizieren, um sie später wiederzuverwenden.

## Bedienung

| Geste | Aktion |
|---|---|
| 1 Finger wischen | Kamera drehen |
| 2 Finger | zoomen + verschieben |
| Tippen | Objekt auswählen (Tippen ins Leere = abwählen) |
| 🔍 Fokus | Kamera fliegt zum Objekt |
| 🎥 Folgen | Kamera folgt fahrenden/fliegenden Objekten |
| 📚 | Objekt-Katalog: alle Typen mit Anzahl, Tippen springt zur nächsten Instanz |
| 🌙 / ☀️ | Tag / Nacht (Laternen, Neon, Bloom, Sterne) |
| 🧭 | zurück zur Startansicht |

Die ID auf der Karte ist antippbar und wird in die Zwischenablage kopiert.

## Entwicklung

```bash
npm install
npm run dev        # http://127.0.0.1:5199
npm run build      # tsc + vite build → dist/
```

URL-Parameter (praktisch zum Testen):

- `?view=all` – Galerie aller Objekt-Factories, `?view=ferrisWheel,ufo` – nur diese
- `?select=ferris_wheel` bzw. `?select=car_003` – Objekt direkt auswählen
- `?night=1` – Nachtmodus, `?cam=x,y,z,tx,ty,tz` – Kameraposition, `?nointro=1` – ohne Intro-Flug

## Architektur

```
src/
  core/        Stage (Renderer, OrbitControls, Post-Processing, Picking), Highlight, UI,
               Environment (Himmel, Licht, Tag/Nacht), Registry, Parts-Builder, GLTF-Assets
  objects/     Prozedurale Objekt-Factories (park*, sky*, city*), registriert in gallery.ts
  world/       Stadtlayout, Straßen, Verkehr, Viertel, Bewegungen
public/models  Kenney-GLTF-Modelle (CC0)
```

### Objekte identifizieren und wiederverwenden

Jedes anklickbare Objekt wird mit `selectable(obj, meta)` registriert (`src/core/registry.ts`).
Damit bekommt es `obj.userData.info`:

```ts
{ id: 'ferris_wheel_001', type: 'Riesenrad', key: 'ferris_wheel', category: 'Attraktion',
  source: 'prozedural', model: 'createFerrisWheel', variant?: '…' }
```

- **Prozedurale Objekte**: `model` ist der Name der Factory-Funktion, z. B.
  `import { createFerrisWheel } from './objects/park'` → `scene.add(createFerrisWheel())`.
  Ursprung = Bodenmitte, Vorderseite zeigt nach +Z, Maßstab in Metern.
- **GLTF-Objekte**: `model` ist die Datei unter `public/models/` (Kenney, CC0).

Beim Picking läuft der Raycast-Treffer die Hierarchie hoch bis zum äußersten Objekt mit
`userData.info` – deshalb wird immer das *komplette* Objekt markiert (Auto inkl. Räder,
Riesenrad inkl. Gondeln).

### Prozeduraler Builder

`Parts` (`src/core/parts.ts`) baut Objekte aus Grundformen mit Vertex-Farben und merged sie zu
**einem Mesh pro Material** – so bleibt die Szene mit hunderten Objekten auch auf dem Handy flüssig.
Bewegliche Teile (Rotoren, Gondeln) sind eigene Builder an Pivot-Gruppen.

### Performance

- Merged Geometrie pro Objekt, geteilte Materialien
- Schatten-Map nur jedes 2. Frame
- Kleine Objekte werden bei großer Kameradistanz ausgeblendet (`core/culling.ts`)
- Pixel-Ratio sinkt automatisch auf langsamen Geräten
- Bloom nur nachts

## Deployment

`Dockerfile` baut die statische Seite und serviert sie mit nginx auf Port 3000
(Konvention der ironstrike.de-Plattform). Push auf `main` = Live-Deploy.

## Credits

3D-Modelle: [Kenney](https://kenney.nl) – Car Kit, City Kit Commercial, City Kit Suburban,
Nature Kit (CC0, siehe `public/models/LICENSE-kenney.txt`). Alles andere ist prozedural im Code gebaut.
