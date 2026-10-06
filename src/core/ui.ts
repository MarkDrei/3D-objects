import * as THREE from 'three';
import { infoOf, registry, type Category } from './registry';
import type { Stage } from './stage';

export const CATEGORY_STYLE: Record<Category, { color: string; icon: string }> = {
  Fahrzeug: { color: '#ff6b4a', icon: '🚗' },
  Luftfahrt: { color: '#4ab8ff', icon: '🎈' },
  Wasserfahrzeug: { color: '#2fd3c7', icon: '⛵' },
  Gebäude: { color: '#b48cff', icon: '🏢' },
  Attraktion: { color: '#ff4fa8', icon: '🎡' },
  Stadtmobiliar: { color: '#ffc23d', icon: '💡' },
  Verkehr: { color: '#ff9f1c', icon: '🚦' },
  Natur: { color: '#5ccf6a', icon: '🌳' },
  Lebewesen: { color: '#ff8fb1', icon: '🐄' },
  Gelände: { color: '#9aa7b8', icon: '🗺️' },
  Kurioses: { color: '#c6ff3d', icon: '🛸' },
};

const $ = <T extends HTMLElement>(sel: string) => document.querySelector(sel) as T;

/** DOM overlay: info card, floating label, catalog, buttons. */
export class UI {
  private card = $('#card');
  private label = $('#label');
  private catalog = $('#catalog');
  private cycle = new Map<string, number>();
  private v = new THREE.Vector3();

  constructor(private stage: Stage, private movingKeys: Set<string>) {
    stage.onSelect = (o) => this.show(o);
    stage.onFrame = () => this.updateLabel();

    $('#btn-night').addEventListener('click', () => {
      stage.env.toggle();
      $('#btn-night').textContent = stage.env.target > 0.5 ? '☀️' : '🌙';
    });
    $('#btn-home').addEventListener('click', () => stage.home());
    $('#btn-catalog').addEventListener('click', () => this.openCatalog());
    $('#catalog-close').addEventListener('click', () => this.catalog.classList.remove('open'));
    $('#card-close').addEventListener('click', () => stage.select(null));
    $('#card-focus').addEventListener('click', () => stage.highlighter.selected && stage.focus(stage.highlighter.selected));
    $('#card-follow').addEventListener('click', () => {
      const sel = stage.highlighter.selected;
      stage.follow(stage.following === sel ? null : sel);
      this.syncFollow();
    });
    $('#card-id').addEventListener('click', () => {
      const id = $('#card-id').textContent ?? '';
      navigator.clipboard?.writeText(id).then(() => this.toast(`ID ${id} kopiert`)).catch(() => {});
    });
    setTimeout(() => $('#hint').classList.add('hide'), 6000);
  }

  private show(obj: THREE.Object3D | null) {
    $('#hint').classList.add('hide');
    if (!obj) {
      this.card.classList.remove('open');
      this.label.classList.remove('show');
      return;
    }
    const info = infoOf(obj)!;
    const st = CATEGORY_STYLE[info.category];
    $('#card-icon').textContent = st.icon;
    $('#card-cat').textContent = info.category;
    $('#card-cat').style.background = st.color;
    $('#card-type').textContent = info.type;
    $('#card-variant').textContent = info.variant ?? '';
    $('#card-id').textContent = info.id;
    $('#card-source').textContent = info.source === 'gltf' ? `GLTF · ${info.model}` : `Prozedural · ${info.model ?? ''}`;
    let meshes = 0, tris = 0;
    obj.traverse((o) => {
      const m = o as THREE.Mesh;
      if (m.isMesh) {
        meshes++;
        const g = m.geometry;
        tris += (g.index ? g.index.count : g.attributes.position.count) / 3;
      }
    });
    $('#card-stats').textContent = `${meshes} Mesh${meshes === 1 ? '' : 'es'} · ${Math.round(tris).toLocaleString('de-DE')} Dreiecke`;
    $('#card-follow').style.display = this.movingKeys.has(info.key) ? '' : 'none';
    this.syncFollow();
    this.label.textContent = `${st.icon} ${info.type}`;
    this.label.style.setProperty('--c', st.color);
    this.label.classList.add('show');
    this.card.classList.add('open');
  }

  private syncFollow() {
    const on = !!this.stage.following;
    $('#card-follow').classList.toggle('on', on);
    $('#card-follow').textContent = on ? '⏹ Stopp' : '🎥 Folgen';
  }

  private updateLabel() {
    const sel = this.stage.highlighter.selected;
    if (!sel) return;
    const box = (sel.userData._box ??= new THREE.Box3()) as THREE.Box3;
    box.setFromObject(sel);
    this.v.set((box.min.x + box.max.x) / 2, box.max.y, (box.min.z + box.max.z) / 2);
    this.v.project(this.stage.camera);
    const vis = this.v.z < 1 && Math.abs(this.v.x) < 1.2 && Math.abs(this.v.y) < 1.2;
    this.label.style.opacity = vis ? '1' : '0';
    const x = (this.v.x * 0.5 + 0.5) * window.innerWidth;
    const y = (-this.v.y * 0.5 + 0.5) * window.innerHeight;
    this.label.style.transform = `translate(${x}px, ${y}px) translate(-50%, -130%)`;
  }

  private openCatalog() {
    const groups = new Map<Category, Map<string, { type: string; count: number; source: string }>>();
    for (const o of registry) {
      const i = infoOf(o)!;
      if (!groups.has(i.category)) groups.set(i.category, new Map());
      const g = groups.get(i.category)!;
      const e = g.get(i.key) ?? { type: i.type, count: 0, source: i.source };
      e.count++;
      g.set(i.key, e);
    }
    const list = $('#catalog-list');
    list.innerHTML = '';
    $('#catalog-total').textContent = `${registry.length} Objekte · ${[...groups.values()].reduce((a, g) => a + g.size, 0)} Typen`;
    const cats = [...groups.keys()].sort((a, b) => a.localeCompare(b, 'de'));
    for (const cat of cats) {
      const st = CATEGORY_STYLE[cat];
      const h = document.createElement('h3');
      h.innerHTML = `<span class="dot" style="background:${st.color}"></span>${st.icon} ${cat}`;
      list.appendChild(h);
      const entries = [...groups.get(cat)!.entries()].sort((a, b) => a[1].type.localeCompare(b[1].type, 'de'));
      for (const [key, e] of entries) {
        const b = document.createElement('button');
        b.className = 'cat-item';
        b.innerHTML = `<span>${e.type}</span><code>${key}</code><span class="src ${e.source}">${e.source === 'gltf' ? 'GLTF' : 'Proz.'}</span><b>${e.count}</b>`;
        b.addEventListener('click', () => this.jumpTo(key));
        list.appendChild(b);
      }
    }
    this.catalog.classList.add('open');
  }

  /** Select the next instance of a type and fly to it. */
  private jumpTo(key: string) {
    const all = registry.filter((o) => infoOf(o)!.key === key);
    const i = ((this.cycle.get(key) ?? -1) + 1) % all.length;
    this.cycle.set(key, i);
    this.catalog.classList.remove('open');
    this.stage.select(all[i]);
    this.stage.focus(all[i]);
    if (all.length > 1) this.toast(`${i + 1} / ${all.length} – nochmal im Katalog tippen für das nächste`);
  }

  toast(msg: string) {
    const t = $('#toast');
    t.textContent = msg;
    t.classList.add('show');
    clearTimeout((t as any)._h);
    (t as any)._h = setTimeout(() => t.classList.remove('show'), 2200);
  }
}
