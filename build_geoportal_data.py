import os
import glob
import json
import re
from osgeo import ogr, osr

base_dir = r"C:\Users\RAFAEL PC\Desktop\CADASTRO TECNICO IMOBILIÁRIO - 2023\Mapeamento - Mario Campos"
out_dir = r"C:\Users\RAFAEL PC\.gemini\antigravity\scratch\geoportal-mario-campos\data"
os.makedirs(out_dir, exist_ok=True)

target_srs = osr.SpatialReference()
target_srs.ImportFromEPSG(4326)
target_srs.SetAxisMappingStrategy(osr.OAMS_TRADITIONAL_GIS_ORDER)

def sanitize_string(s):
    if s is None:
        return None
    if not isinstance(s, str):
        s = str(s)
    try:
        b = s.encode('utf-8', 'surrogateescape')
        try:
            res = b.decode('cp1252')
        except Exception:
            res = b.decode('utf-8', errors='replace')
    except Exception:
        res = s.encode('utf-8', errors='ignore').decode('utf-8', errors='ignore')
    
    res = res.strip()
    replacements = {
        '': '',
        'Ã?': 'Á',
        'Ã‰': 'É',
        'Ã“': 'Ó',
        'Ãš': 'Ú',
        'Ãƒ': 'Ã',
        'Ã•': 'Õ',
        'Ã‡': 'Ç',
        'Â': ''
    }
    for k, rep in replacements.items():
        if k in res:
            res = res.replace(k, rep)
    return res if res else None

def get_geom_geojson(geom, tx):
    if geom is None or geom.IsEmpty():
        return None
    g = geom.Clone()
    if tx:
        g.Transform(tx)
    g.FlattenTo2D()
    gj = json.loads(g.ExportToJson())
    
    # Round coordinates to 6 decimal places (~0.1m precision)
    def round_coords(coords):
        if not coords:
            return coords
        if isinstance(coords[0], (int, float)):
            return [round(coords[0], 6), round(coords[1], 6)]
        return [round_coords(c) for c in coords]
    
    if "coordinates" in gj:
        gj["coordinates"] = round_coords(gj["coordinates"])
    return gj

def extract_features(shp_path, default_props=None, field_map=None):
    if not os.path.exists(shp_path):
        return []
    
    ds = ogr.Open(shp_path)
    if not ds:
        return []
    
    lyr = ds.GetLayer(0)
    src_srs = lyr.GetSpatialRef()
    tx = None
    if src_srs:
        tx = osr.CoordinateTransformation(src_srs, target_srs)
    
    defn = lyr.GetLayerDefn()
    fields = [defn.GetFieldDefn(i).GetName() for i in range(defn.GetFieldCount())]
    
    features = []
    for feat in lyr:
        geom = feat.GetGeometryRef()
        if not geom or geom.IsEmpty():
            continue
        geom_json = get_geom_geojson(geom, tx)
        if not geom_json:
            continue
        
        props = {}
        if default_props:
            for dk, dv in default_props.items():
                props[dk] = sanitize_string(dv)
            
        for f in fields:
            val = feat.GetField(f)
            target_key = field_map.get(f, f) if field_map else f
            if isinstance(val, (int, float)):
                props[target_key] = val
            else:
                props[target_key] = sanitize_string(val)
        
        features.append({
            "type": "Feature",
            "properties": props,
            "geometry": geom_json
        })
    ds = None
    return features

print("Processing 1. Limite Municipal...")
limite_feats = extract_features(
    os.path.join(base_dir, r"LIMITES MUNICIPIOS\MARIO CAMPOS.shp"),
    default_props={"tipo": "Limite Municipal", "municipio": "Mário Campos", "uf": "MG"}
)
with open(os.path.join(out_dir, "limite_mario_campos.geojson"), "w", encoding="utf-8") as f:
    json.dump({"type": "FeatureCollection", "features": limite_feats}, f, ensure_ascii=False)
print(f"  -> {len(limite_feats)} feições salvas.")

print("Processing 2. Sistema Viário (Vias)...")
vias_feats = extract_features(
    os.path.join(base_dir, "VIAS.shp"),
    default_props={"tipo": "Via Urbana"}
)
with open(os.path.join(out_dir, "vias.geojson"), "w", encoding="utf-8") as f:
    json.dump({"type": "FeatureCollection", "features": vias_feats}, f, ensure_ascii=False)
print(f"  -> {len(vias_feats)} vias salvas.")

print("Processing 3. Recursos Hídricos...")
hidro_feats = extract_features(
    os.path.join(base_dir, r"CROQUIS\RECURSOS HIDRICOS\Recursos Hidricos.shp"),
    default_props={"tipo": "Recurso Hídrico"}
)
with open(os.path.join(out_dir, "hidrografia.geojson"), "w", encoding="utf-8") as f:
    json.dump({"type": "FeatureCollection", "features": hidro_feats}, f, ensure_ascii=False)
print(f"  -> {len(hidro_feats)} recursos hídricos salvos.")

print("Processing 4. Faixas de Servidão (Petrobras e Copasa)...")
petro_feats = []
petro_shps = [
    (r"SERVIDAO_PETROBRAS\OLEODUTO-FAIXA DE SERVIDÃO-PETROBRAS.shp", "Faixa de Servidão Oleoduto"),
    (r"SERVIDAO_PETROBRAS\EXTENSAO_OLEODUTO.shp", "Extensão do Oleoduto"),
    (r"SERVIDAO_PETROBRAS\FAIXA_SERVIDÃO_PETROBRAS.shp", "Faixa de Servidão"),
]
for p_shp, p_desc in petro_shps:
    petro_feats.extend(extract_features(os.path.join(base_dir, p_shp), default_props={"tipo": "Petrobras", "descricao": p_desc}))

with open(os.path.join(out_dir, "servidao_petrobras.geojson"), "w", encoding="utf-8") as f:
    json.dump({"type": "FeatureCollection", "features": petro_feats}, f, ensure_ascii=False)
print(f"  -> {len(petro_feats)} feições de servidão Petrobras salvas.")

copasa_feats = []
copasa_shps = [
    (r"SERVIDÃO_COPASA\ÁREA_ADUTORA.shp", "Área da Adutora"),
    (r"SERVIDÃO_COPASA\COPASA.shp", "Rede COPASA"),
    (r"SERVIDÃO_COPASA\EXTENSAO_ADUTORA.shp", "Extensão Adutora")
]
for c_shp, c_desc in copasa_shps:
    copasa_feats.extend(extract_features(os.path.join(base_dir, c_shp), default_props={"tipo": "COPASA", "descricao": c_desc}))

with open(os.path.join(out_dir, "servidao_copasa.geojson"), "w", encoding="utf-8") as f:
    json.dump({"type": "FeatureCollection", "features": copasa_feats}, f, ensure_ascii=False)
print(f"  -> {len(copasa_feats)} feições de servidão COPASA salvas.")

print("Processing 5. Projetos Especiais...")
especiais_feats = []
esp_shps = [
    ("LOTES VAGOS RETA.shp", "Lotes Vagos - Reta do Jacaré"),
    ("REURB - BOM JARDIM.shp", "REURB - Bom Jardim"),
    ("MAPA FECHO DO FUNIL.shp", "Mapeamento - Fecho do Funil"),
    ("Usucapiao -  Jose Reinaldo e Outro.shp", "Usucapião - José Reinaldo e Outro"),
    ("Usucapiao ELIAS MARIANO e OUTROS.shp", "Usucapião - Elias Mariano e Outros"),
    ("TERRENO_CAPAO.shp", "Terreno Capão"),
    ("Gedeon-capao.shp", "Gedeon Capão")
]
for es_shp, es_desc in esp_shps:
    p = os.path.join(base_dir, es_shp)
    if os.path.exists(p):
        especiais_feats.extend(extract_features(p, default_props={"categoria": "Projeto Especial", "projeto": es_desc}))

with open(os.path.join(out_dir, "projetos_especiais.geojson"), "w", encoding="utf-8") as f:
    json.dump({"type": "FeatureCollection", "features": especiais_feats}, f, ensure_ascii=False)
print(f"  -> {len(especiais_feats)} feições de projetos especiais salvas.")

print("Processing 6. Bairros: Lotes, Edificações e Quadras...")

bairro_folders = sorted([d for d in os.listdir(base_dir) if os.path.isdir(os.path.join(base_dir, d)) and d[:2].isdigit()])

all_lotes = []
all_edificacoes = []
all_quadras = []
bairros_meta = []

# Field name standardizer for Lotes
field_map_lotes = {
    'INSC. IMOB': 'insc_imob',
    'INSC_IMOB': 'insc_imob',
    'INSC_IMO': 'insc_imob',
    'INSCRICAO': 'insc_imob',
    'DISTRITO': 'distrito',
    'BAIRRO': 'bairro_cod',
    'COD_BAIRRO': 'bairro_cod',
    'QUADRA': 'quadra',
    'LOTE': 'lote',
    'UNIDADE': 'unidade',
    'ÁREA': 'area_m2',
    'AREA': 'area_m2',
    'AREAM2': 'area_m2',
    'AREA_M2': 'area_m2',
    'TITULAR': 'titular',
    'PROPRIETARIO': 'titular',
    'ZONEAMENTO': 'zoneamento',
    'MATRICULA': 'matricula',
    'MATRÍCULA': 'matricula',
    'ID BAIRRO': 'nome_bairro',
    'NOME_BAIRRO': 'nome_bairro',
    'Nº': 'numero_predial',
    'N°': 'numero_predial',
    'Nº PREDIA': 'numero_predial',
    'NUMERO': 'numero_predial',
    'SITUACAO': 'situacao'
}

# Matrículas do Bairro Centro (desmembramento da Matrícula 27.028)
centro_matriculas = {
    ('000001', '000001'): '77.717',
    ('000001', '000002'): '77.718',
    ('000001', '000003'): '77.723',
    ('000001', '000004'): '77.724',
    ('000001', '000005'): '77.713',
    ('000001', '000006'): '77.719',
    ('000001', '000007'): '77.720',
    ('000001', '000008'): '77.721',
    ('000001', '000009'): '77.722',
}

# Carregar imóveis vagos do Canarinho (Balneário)
canarinho_vagos = set()
canarinho_shp = os.path.join(base_dir, r"31_BALNEARIO_ESTANCIAS_DO_BOM_JARDIM\IMOVEIS CANARINHO.shp")
if os.path.exists(canarinho_shp):
    c_ds = ogr.Open(canarinho_shp)
    if c_ds:
        for f in c_ds.GetLayer():
            insc = f.GetField('INSC. IMOB')
            if insc:
                canarinho_vagos.add(re.sub(r'\.{2,}', '.', str(insc).strip()))

def select_best_lote_shp(bdir, folder):
    shps = glob.glob(os.path.join(bdir, "*.shp"))
    lote_shps = [s for s in shps if any(k in os.path.basename(s).upper() for k in ['LOTE', 'SERRA'])]
    scored = []
    for s in lote_shps:
        ds = ogr.Open(s)
        if not ds: continue
        lyr = ds.GetLayer()
        total = lyr.GetFeatureCount()
        valid = 0
        fields = [fld.GetName().upper() for fld in lyr.schema]
        has_cad = 0
        if any('INSC' in f for f in fields): has_cad += 10
        if any('QUADRA' in f for f in fields): has_cad += 5
        if any('LOTE' in f for f in fields): has_cad += 5
        if any('TITULAR' in f for f in fields): has_cad += 3
        if any('MATRICULA' in f for f in fields): has_cad += 2
        for feat in lyr:
            if feat.GetGeometryRef(): valid += 1
        mtime = os.path.getmtime(s)
        scored.append((has_cad, valid, mtime, s))
    scored.sort(reverse=True)
    return scored[0][3] if scored else None

cad_junk_keys = {'block', 'color', 'color24', 'etype', 'ext', 'fid', 'handle', 'layer', 'linetype', 'linewidth', 'ltscale', 'lweight', 'ocolor', 'olinetype', 'space', 'thickness', 'transparen', 'visible', 'width'}

for folder in bairro_folders:
    bdir = os.path.join(base_dir, folder)
    clean_bname = " ".join(folder[3:].split("_")).title()
    shps = glob.glob(os.path.join(bdir, "*.shp"))
    
    # 1. LOTES: Seleção Inteligente do melhor e mais atualizado shapefile
    lote_shp = select_best_lote_shp(bdir, folder)
            
    bairro_lote_count = 0
    bairro_total_area = 0.0
    
    if lote_shp and os.path.exists(lote_shp):
        feats = extract_features(lote_shp, field_map=field_map_lotes)
        for ft in feats:
            p = ft["properties"]
            p["bairro_pasta"] = folder
            if not p.get("nome_bairro"):
                p["nome_bairro"] = clean_bname
            for k in ['quadra', 'lote', 'distrito', 'bairro_cod', 'unidade', 'numero_predial']:
                if isinstance(p.get(k), str):
                    p[k] = re.sub(r'\.+$', '', p[k].strip())
            if isinstance(p.get('insc_imob'), str):
                p['insc_imob'] = re.sub(r'\.{2,}', '.', p['insc_imob'].strip())
            
            # Enriquecer Centro com matrículas cartoriais conhecidas
            if folder == "02_CENTRO":
                q_key = p.get('quadra')
                l_key = p.get('lote')
                if (q_key, l_key) in centro_matriculas and not p.get('matricula'):
                    p['matricula'] = centro_matriculas[(q_key, l_key)]
                    
            # Enriquecer Balneário com situação do imóvel (vago)
            if folder == "31_BALNEARIO_ESTANCIAS_DO_BOM_JARDIM":
                insc = p.get('insc_imob')
                if insc and insc in canarinho_vagos and not p.get('situacao'):
                    p['situacao'] = 'Vago'

            area_val = p.get("area_m2")
            if area_val is not None:
                try:
                    area_float = float(str(area_val).replace(',', '.'))
                    p["area_m2"] = round(area_float, 2)
                    bairro_total_area += area_float
                except:
                    pass
            all_lotes.append(ft)
        bairro_lote_count = len(feats)
        
    if folder == "12_CHACARAS_MARIA_ANTONIETA":
        l2 = os.path.join(bdir, "LOTES_MARIA_ANTONIETA_2.shp")
        if os.path.exists(l2):
            f2 = extract_features(l2, field_map=field_map_lotes)
            for ft in f2:
                p = ft["properties"]
                p["bairro_pasta"] = folder
                p["nome_bairro"] = clean_bname + " (Gleba 2)"
                for k in cad_junk_keys:
                    p.pop(k, None)
                for k in ['quadra', 'lote', 'distrito', 'bairro_cod', 'unidade', 'numero_predial']:
                    if isinstance(p.get(k), str):
                        p[k] = re.sub(r'\.+$', '', p[k].strip())
                if isinstance(p.get('insc_imob'), str):
                    p['insc_imob'] = re.sub(r'\.{2,}', '.', p['insc_imob'].strip())
                all_lotes.append(ft)
            bairro_lote_count += len(f2)

    # 2. EDIFICACOES
    edif_shps = [s for s in shps if "EDIFIC" in os.path.basename(s).upper()]
    bairro_edif_count = 0
    for e_shp in edif_shps:
        e_feats = extract_features(e_shp, default_props={"bairro": clean_bname, "pasta": folder, "tipo": "Edificação"})
        all_edificacoes.extend(e_feats)
        bairro_edif_count += len(e_feats)
        
    # 3. QUADRAS
    quad_shps = [s for s in shps if any(k in os.path.basename(s).upper() for k in ["QUADRA", "QUDRAS"])]
    bairro_quad_count = 0
    for q_shp in quad_shps:
        q_feats = extract_features(q_shp, default_props={"bairro": clean_bname, "pasta": folder, "tipo": "Quadra"})
        all_quadras.extend(q_feats)
        bairro_quad_count += len(q_feats)

    bairros_meta.append({
        "codigo": folder[:2],
        "pasta": folder,
        "nome": clean_bname,
        "lotes": bairro_lote_count,
        "edificacoes": bairro_edif_count,
        "quadras": bairro_quad_count,
        "area_cadastrada_m2": round(bairro_total_area, 2)
    })
    print(f"  [{folder[:2]}] {clean_bname}: {bairro_lote_count} lotes, {bairro_edif_count} edif, {bairro_quad_count} quadras")

print("\n--- Saving Consolidated Files ---")
with open(os.path.join(out_dir, "lotes_cadastrais.geojson"), "w", encoding="utf-8") as f:
    json.dump({"type": "FeatureCollection", "features": all_lotes}, f, ensure_ascii=False)
print(f"Lotes salvos: {len(all_lotes)} feições -> {os.path.getsize(os.path.join(out_dir, 'lotes_cadastrais.geojson'))} bytes")

with open(os.path.join(out_dir, "edificacoes.geojson"), "w", encoding="utf-8") as f:
    json.dump({"type": "FeatureCollection", "features": all_edificacoes}, f, ensure_ascii=False)
print(f"Edificações salvas: {len(all_edificacoes)} feições -> {os.path.getsize(os.path.join(out_dir, 'edificacoes.geojson'))} bytes")

with open(os.path.join(out_dir, "quadras.geojson"), "w", encoding="utf-8") as f:
    json.dump({"type": "FeatureCollection", "features": all_quadras}, f, ensure_ascii=False)
print(f"Quadras salvas: {len(all_quadras)} feições -> {os.path.getsize(os.path.join(out_dir, 'quadras.geojson'))} bytes")

# 7. Generate Bairros Polygons (Convex Hulls / Envelopes of lotes in each bairro)
print("\nGenerating Bairros Boundaries & Statistics...")
bairros_geojson_feats = []
for b_meta in bairros_meta:
    folder = b_meta["pasta"]
    b_lotes = [ft for ft in all_lotes if ft["properties"].get("bairro_pasta") == folder]
    if not b_lotes:
        continue
    
    geom_coll = ogr.Geometry(ogr.wkbGeometryCollection)
    for ft in b_lotes:
        geom_dict = ft["geometry"]
        geom_ogr = ogr.CreateGeometryFromJson(json.dumps(geom_dict))
        if geom_ogr:
            geom_coll.AddGeometry(geom_ogr)
    
    b_hull = geom_coll.ConvexHull()
    if b_hull and not b_hull.IsEmpty():
        hull_json = json.loads(b_hull.ExportToJson())
        def round_coords(coords):
            if not coords:
                return coords
            if isinstance(coords[0], (int, float)):
                return [round(coords[0], 6), round(coords[1], 6)]
            return [round_coords(c) for c in coords]
        hull_json["coordinates"] = round_coords(hull_json["coordinates"])
        
        bairros_geojson_feats.append({
            "type": "Feature",
            "properties": b_meta,
            "geometry": hull_json
        })

with open(os.path.join(out_dir, "bairros_limites.geojson"), "w", encoding="utf-8") as f:
    json.dump({"type": "FeatureCollection", "features": bairros_geojson_feats}, f, ensure_ascii=False)
print(f"Limites de Bairros salvos: {len(bairros_geojson_feats)} bairros.")

# 8. Metadados e Estatísticas Gerais
metadata = {
    "titulo": "Geoportal Mário Campos - Cadastro Técnico Imobiliário 2023",
    "municipio": "Mário Campos",
    "estado": "Minas Gerais",
    "ano_base": "2023",
    "crs_nativo": "SIRGAS 2000 / UTM zone 23S (EPSG:31983)",
    "crs_web": "WGS 84 (EPSG:4326)",
    "total_bairros": len(bairros_meta),
    "total_lotes": len(all_lotes),
    "total_edificacoes": len(all_edificacoes),
    "total_quadras": len(all_quadras),
    "total_vias": len(vias_feats),
    "total_area_cadastrada_m2": round(sum(b["area_cadastrada_m2"] for b in bairros_meta), 2),
    "bairros": bairros_meta
}

with open(os.path.join(out_dir, "metadados.json"), "w", encoding="utf-8") as f:
    json.dump(metadata, f, ensure_ascii=False, indent=2)
print("Metadados salvos em data/metadados.json")
print("\n>>> PROCESSAMENTO CONCLUÍDO COM SUCESSO! <<<")
