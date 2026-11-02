"""Extrae inventario de un ejecutable VB6 compilado (nativo o P-Code).

Uso: python vb6_inventory.py <exe_o_memdump> <salida.json>

Acepta un PE normal (offsets de archivo) o un volcado de memoria (.memdump,
offsets = RVA) como el que deja unipacker al desempacar ASPack.
Saca: proyecto, objetos (forms/modulos/clases/reportes), metodos publicos,
controles de cada form, strings UTF-16 con SQL y tablas referenciadas.
"""
import json
import re
import struct
import sys


class Image:
    def __init__(self, path):
        self.d = open(path, 'rb').read()
        self.memdump = path.endswith('.memdump')
        d = self.d
        pe = struct.unpack_from('<I', d, 0x3c)[0]
        nsec = struct.unpack_from('<H', d, pe + 6)[0]
        optsz = struct.unpack_from('<H', d, pe + 20)[0]
        self.base = struct.unpack_from('<I', d, pe + 24 + 28)[0]
        self.secs = []
        so = pe + 24 + optsz
        for _ in range(nsec):
            vs, va, rs, ro = struct.unpack_from('<IIII', d, so + 8)
            self.secs.append((va, vs, ro, rs))
            so += 40

    def off(self, v):
        r = v - self.base
        if self.memdump:
            return r if 0 <= r < len(self.d) else None
        for va, vs, ro, rs in self.secs:
            if va <= r < va + max(vs, rs):
                return ro + r - va
        return None

    def u32(self, v, add=0):
        o = self.off(v)
        return struct.unpack_from('<I', self.d, o + add)[0]

    def cstr(self, v):
        o = self.off(v) if v else None
        if o is None:
            return None
        return self.d[o:o + 256].split(b'\0')[0].decode('latin-1')


def kind_of(name, flags):
    n = name.lower()
    if n.startswith('act'):
        return 'report'
    if n.startswith(('frm', 'mdi')) or flags & 0x80:
        return 'form'
    if n.startswith('cls') or flags & 0x02:
        return 'class'
    return 'module'


def parse_vb(img):
    d = img.d
    h = d.find(b'VB5!')
    if h < 0:
        return None
    hv = h  # offset del header
    proj_name = d[hv + struct.unpack_from('<I', d, hv + 0x64)[0]:][:128].split(b'\0')[0].decode('latin-1')
    exe_name = d[hv + struct.unpack_from('<I', d, hv + 0x5c)[0]:][:128].split(b'\0')[0].decode('latin-1')
    lp_proj = struct.unpack_from('<I', d, hv + 0x30)[0]
    native = img.u32(lp_proj, 0x20) != 0
    objtab = img.u32(lp_proj, 0x04)
    ot = img.off(objtab)
    nobj = struct.unpack_from('<H', d, ot + 0x2a)[0]
    arr = img.off(struct.unpack_from('<I', d, ot + 0x30)[0])
    objects = []
    for k in range(nobj):
        e = arr + k * 0x30
        lp_info, _, _, _, _, _, lp_name, n_meth, lp_meth, _, flags = struct.unpack_from('<11I', d, e)
        name = img.cstr(lp_name) or f'obj{k}'
        methods = []
        if lp_meth and n_meth < 5000:
            mo = img.off(lp_meth)
            if mo is not None:
                for i in range(n_meth):
                    p = struct.unpack_from('<I', d, mo + i * 4)[0]
                    s = img.cstr(p) if p else None
                    if s and re.fullmatch(r'[A-Za-z_][\w]*', s):
                        methods.append(s)
        controls = []
        if flags & 0x80 and lp_info:
            try:
                io = img.off(lp_info)
                opt = io + 0x38
                ccount = struct.unpack_from('<I', d, opt + 0x20)[0]
                lp_ctl = struct.unpack_from('<I', d, opt + 0x24)[0]
                co = img.off(lp_ctl) if lp_ctl else None
                if co is not None and ccount < 3000:
                    for i in range(ccount):
                        c = co + i * 0x28
                        cname = img.cstr(struct.unpack_from('<I', d, c + 0x20)[0])
                        idx = struct.unpack_from('<H', d, c + 0x10)[0]
                        if cname and cname != name:
                            controls.append(cname if idx in (0, 0xffff) else f'{cname}({idx})')
            except Exception:
                pass
        objects.append({
            'name': name,
            'kind': kind_of(name, flags),
            'flags': hex(flags),
            'methods': methods,
            'controls': sorted(set(controls)),
        })
    return {'project': proj_name, 'exe_name': exe_name,
            'compiled': 'native' if native else 'p-code', 'objects': objects}


SQL_RE = re.compile(r'\b(select|insert\s+into|update|delete\s+from|from|where|join|begin|exec)\b', re.I)
TABLE_RE = re.compile(r'\b(?:from|join|into|update|table)\s+([A-Z][A-Z0-9_$#.]{2,})', re.I)


def strings_utf16(d):
    for m in re.finditer(rb'(?:[\x09\x0a\x0d\x20-\x7e\xa0-\xff]\x00){4,}', d):
        yield m.group().decode('utf-16le')


def main(src, dst):
    img = Image(src)
    vb = parse_vb(img) or {}
    strs = list(strings_utf16(img.d))
    sql = [s.strip() for s in strs if SQL_RE.search(s)]
    tables = {}
    for s in sql:
        for t in TABLE_RE.findall(s):
            t = t.upper().split('.')[-1]
            if t not in ('DUAL', 'SELECT', 'WHERE', 'SET'):
                tables[t] = tables.get(t, 0) + 1
    vb['sql_fragments'] = sql
    vb['tables'] = dict(sorted(tables.items()))
    vb['ui_strings'] = sorted({s.strip() for s in strs
                               if not SQL_RE.search(s) and re.search(r'[A-Za-zÀ-ÿ]{3}', s) and len(s.strip()) > 3})
    json.dump(vb, open(dst, 'w', encoding='utf-8'), ensure_ascii=False, indent=1)
    objs = vb.get('objects', [])
    print(f"{src}: {vb.get('project')} {vb.get('compiled')} objs={len(objs)} "
          f"forms={sum(o['kind'] == 'form' for o in objs)} "
          f"ctrls={sum(len(o['controls']) for o in objs)} sql={len(sql)} tablas={len(tables)}")


if __name__ == '__main__':
    main(sys.argv[1], sys.argv[2])
