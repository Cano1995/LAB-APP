"""Arma docs/inventario/*.md a partir de raw/*.json (exe) y db/catalogo/*.json (base).

Uso: python tools/build-inventory.py
"""
import datetime
import glob
import hashlib
import json
import os
import re

ROOT = os.path.join(os.path.dirname(__file__), '..')
RAW = os.path.join(ROOT, 'docs', 'inventario', 'raw')
OUT = os.path.join(ROOT, 'docs', 'inventario')

catalog = {}
for f in glob.glob(os.path.join(ROOT, 'db', 'catalogo', '*.json')):
    owner = os.path.basename(f)[:-5]
    for t, info in json.load(open(f, encoding='utf-8')).items():
        catalog.setdefault(t, []).append((owner, info.get('rows')))

KIND_ES = {'form': 'Formularios', 'report': 'Reportes (ActiveReports)', 'module': 'Módulos', 'class': 'Clases'}

exes = {}
for f in sorted(glob.glob(os.path.join(RAW, '*.json'))):
    j = json.load(open(f, encoding='utf-8'))
    if not j.get('objects'):
        continue
    exes[os.path.basename(f)[:-5]] = j


def table_line(t, n):
    where = catalog.get(t)
    if not where:
        return f'| `{t}` | {n} | — | (no existe en DESA / temporal / otra base) |'
    return f'| `{t}` | {n} | ' + ', '.join(o for o, _ in where) + ' | ' + \
        ', '.join(f'{r:,}' if r is not None else '?' for _, r in where) + ' |'


summary = ['# Inventario del sistema GATEC (VB6)', '',
           'Generado por `tools/build-inventory.py` desde los ejecutables de `C:\\Gatec\\Gatec` '
           'y el catálogo de DESA. Detalle por ejecutable en los archivos enlazados.', '',
           '| Ejecutable | Proyecto VB | Compilación | Forms | Reportes | Módulos/Clases | Controles | SQL | Tablas |',
           '|---|---|---|---|---|---|---|---|---|']
all_tables = {}
for name, j in exes.items():
    objs = j['objects']
    cnt = {k: sum(o['kind'] == k for o in objs) for k in KIND_ES}
    summary.append(f"| [{name}]({name}.md) | {j['project']} | {j['compiled']} | {cnt['form']} | {cnt['report']} | "
                   f"{cnt['module'] + cnt['class']} | {sum(len(o['controls']) for o in objs)} | "
                   f"{len(j['sql_fragments'])} | {len(j['tables'])} |")
    for t in j['tables']:
        all_tables.setdefault(t, set()).add(name)

    md = [f"# {name} — proyecto `{j['project']}`", '',
          f"Compilado en **{j['compiled']}**. {len(objs)} objetos.", '']
    for kind, title in KIND_ES.items():
        group = [o for o in objs if o['kind'] == kind]
        if not group:
            continue
        md += [f'## {title} ({len(group)})', '', '| Objeto | Métodos | Controles |', '|---|---|---|']
        for o in sorted(group, key=lambda o: o['name'].lower()):
            md.append(f"| `{o['name']}` | {', '.join(o['methods']) or '—'} | "
                      f"{len(o['controls'])}: {', '.join(o['controls'][:40])}{' …' if len(o['controls']) > 40 else ''} |")
        md.append('')
    md += [f"## Tablas referenciadas en el SQL ({len(j['tables'])})", '',
           '| Tabla | Menciones | Esquema | Filas (stats) |', '|---|---|---|---|']
    md += [table_line(t, n) for t, n in j['tables'].items()]
    md += ['', f"El SQL incrustado completo ({len(j['sql_fragments'])} fragmentos) está en `raw/{name}.json` → `sql_fragments`."]
    open(os.path.join(OUT, f'{name}.md'), 'w', encoding='utf-8').write('\n'.join(md) + '\n')

# Tablas de la base que ningún exe menciona (pueden usarse vía PL/SQL o SQL armado dinámicamente)
used = set(all_tables)
orphans = sorted((t, o, r) for t, lst in catalog.items() for o, r in lst if t not in used and (r or 0) > 0)
summary += ['', f'## Tablas usadas por más de un ejecutable', '',
            '| Tabla | Ejecutables |', '|---|---|']
summary += [f"| `{t}` | {', '.join(sorted(e))} |" for t, e in sorted(all_tables.items()) if len(e) > 1]
summary += ['', f'## Tablas con datos que ningún ejecutable menciona literalmente ({len(orphans)})', '',
            'Pueden usarse vía PL/SQL, SQL armado dinámicamente (nombres concatenados) o por los '
            'ejecutables ASPack aún no analizados.', '', '| Tabla | Esquema | Filas |', '|---|---|---|']
summary += [f'| `{t}` | {o} | {r:,} |' for t, o, r in orphans]
# Versión (según GA_AGR_ATU) y huella de cada exe analizado. Los exe se buscan en GATEC_DIR (por defecto C:\Gatec\Gatec).
GATEC_DIR = os.environ.get('GATEC_DIR', r'C:\Gatec\Gatec')
vers = json.load(open(os.path.join(RAW, 'versiones.json'), encoding='utf-8'))
summary += ['', '## Versiones y huella de los ejecutables analizados', '',
            vers['_nota'], '',
            '| Ejecutable | Módulo | Versión | Fecha de la versión | Tamaño | Modificado | SHA-256 |', '|---|---|---|---|---|---|---|']
for exe in sorted(vers.keys() - {'_nota'}, key=str.lower):
    v = vers[exe]
    path = next((p for p in glob.glob(os.path.join(GATEC_DIR, exe + '.*')) if p.lower().endswith('.exe')), None)
    if path:
        data = open(path, 'rb').read()
        tam = f'{len(data):,}'
        mod = datetime.datetime.fromtimestamp(os.path.getmtime(path)).strftime('%Y-%m-%d %H:%M')
        sha = '`' + hashlib.sha256(data).hexdigest() + '`'
    else:
        tam = mod = sha = '—'
    ver = (v['version'] or 'sin registro') + (' (verificada en pantalla)' if v['verificado_en_pantalla'] else '')
    summary.append(f"| {exe} | {v['modulo'] or '—'} | {ver} | {v['fecha'] or '—'} | {tam} | {mod} | {sha} |")
summary += ['', 'El número que muestra cada programa sale de `GA_AGR_ATU`, no del recurso de versión del exe (en GAtec_Lab dice `1.00`). '
            '`GI_LAB_CONTROLE_VERSAO` (5.40.45.0411) y `GAM_LOG_ATUALIZABD` (5.40.46.0411) corresponden al módulo de proceso industrial (GPI).']
open(os.path.join(OUT, 'INVENTARIO.md'), 'w', encoding='utf-8').write('\n'.join(summary) + '\n')
print('ok', len(exes), 'exes,', len(used), 'tablas usadas,', len(orphans), 'huérfanas con datos')
