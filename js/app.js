/**
 * GEOPORTAL MÁRIO CAMPOS - CADASTRO TÉCNICO IMOBILIÁRIO 2023
 * Motor WebGIS Interativo em JavaScript (Leaflet + Proj4js + Chart.js)
 */

// Definição do sistema de coordenadas UTM SIRGAS 2000 Zona 23S (EPSG:31983)
proj4.defs("EPSG:31983", "+proj=utm +zone=23 +south +ellps=GRS80 +towgs84=0,0,0,0,0,0,0 +units=m +no_defs");

// Paleta de 33 cores exclusivas e contrastantes para cada um dos 33 Bairros
const BairroCores = {
  "01_JARDIM_PRIMAVERA": "#1d4ed8",             // Azul Real
  "02_CENTRO": "#b91c1c",                       // Vermelho Granada
  "03_SAO_TARCISIO": "#15803d",                 // Verde Esmeralda
  "04_VILA_TANIA": "#d97706",                   // Âmbar Ocre
  "05_VILA_MARIO_CAMPOS": "#7e22ce",            // Roxo Ametista
  "06_VILA_PRIMAVERA": "#0e7490",               // Ciano Petróleo
  "07_VILA_ENY": "#ea580c",                     // Laranja Fogo
  "08_VILA_LOURDES": "#4338ca",                 // Índigo Real
  "09_VILA_ONDINA": "#047857",                  // Verde Floresta
  "10_RETA_DO_JACARE": "#a16207",               // Dourado Oliva
  "11_CAMPO_VERDE": "#4d7c0f",                  // Verde Oliva
  "12_CHACARAS_MARIA_ANTONIETA": "#a21caf",     // Fúcsia Intenso
  "13_ANEXO_MARIA_ANTONIETA": "#be185d",        // Rosa Framboesa
  "14_RESIDENCIAL_MARIA_ANTONIETA": "#e11d48",   // Carmesim
  "15_SERRA_DOS_BANDEIRANTES": "#0f766e",       // Verde Teal
  "16_SAO_RAFAEL": "#6d28d9",                   // Violeta
  "17_BOM_JARDIM": "#166534",                   // Verde Musgo Escuro
  "18_BELA VISTA": "#c2410c",                   // Castanho Terracota
  "19_CHACARAS_BOM_JARDIM": "#0284c7",          // Azul Céu Cerúleo
  "20_CHACARAS_JOAQUINA_MARIA": "#831843",      // Vinho Bordô Escuro
  "21_DAS_PALMEIRAS": "#3730a3",                // Azul Marinho Profundo
  "22_TANGARA": "#065f46",                      // Verde Pinho
  "23_CHACARAS_RECANTO_DO_BOM_JARDIM": "#991c1c", // Vermelho Carmim Escuro
  "24_ESTANCIAS_SERRA_VERDE": "#3f6212",        // Verde Abacate Escuro
  "25_AREAS_DO_PARAOPEBA": "#581c87",           // Roxo Berinjela
  "26_CHACARAS_RECANTO_DO_FUNIL": "#854d0e",    // Marrom Ocre
  "27_VILA_DAS_AMOREIRAS": "#9d174d",           // Rosa Rubi Escuro
  "28_FECHO_DO_FUNIL": "#115e59",               // Verde Malaquita
  "29_CAMPO_BELO": "#1e40af",                   // Azul Cobalto Escuro
  "30_BAMBUI": "#eab308",                       // Amarelo Dourado
  "31_BALNEARIO_ESTANCIAS_DO_BOM_JARDIM": "#2563eb", // Azul Safira
  "32_VILLA_DA_SERRA": "#65a30d",               // Verde Maçã
  "33_GARCIAS": "#f97316"                       // Laranja Tangerina
};

function getBairroColor(key) {
  if (!key) return '#3b82f6';
  if (BairroCores[key]) return BairroCores[key];

  // Busca aproximada por pasta ou código
  for (const [folder, color] of Object.entries(BairroCores)) {
    if (key.includes(folder) || folder.includes(key) || (key.length >= 2 && folder.startsWith(key.slice(0, 2)))) {
      return color;
    }
  }

  // Fallback determinístico por string
  let hash = 0;
  for (let i = 0; i < key.length; i++) hash = key.charCodeAt(i) + ((hash << 5) - hash);
  const hue = Math.abs(hash % 360);
  return `hsl(${hue}, 75%, 45%)`;
}

// Dicionário de Rótulos Amigáveis para TODOS os Atributos
const FieldLabels = {
  'insc_imob': 'Inscrição Imobiliária',
  'nome_bairro': 'Bairro',
  'bairro_pasta': 'Pasta / Código do Bairro',
  'bairro_cod': 'Código do Bairro',
  'distrito': 'Distrito',
  'quadra': 'Quadra',
  'lote': 'Lote',
  'unidade': 'Unidade',
  'area_m2': 'Área do Terreno (m²)',
  'zoneamento': 'Zoneamento Urbano',
  'titular': 'Titular / Proprietário',
  'matricula': 'Matrícula Cartorial',
  'numero_predial': 'Número Predial / Nº',
  'situacao': 'Situação do Imóvel',
  'tipo': 'Tipo de Feição',
  'categoria': 'Categoria',
  'projeto': 'Projeto / Denominação',
  'descricao': 'Descrição',
  'municipio': 'Município',
  'uf': 'UF',
  'cd_mun': 'Código IBGE do Município',
  'nm_mun': 'Nome do Município',
  'sigla_uf': 'Sigla do Estado',
  'area_km2': 'Área Territorial (km²)',
  'total_lotes': 'Total de Lotes Cadastrados',
  'total_edificacoes': 'Total de Edificações Mapeadas',
  'total_quadras': 'Total de Quadras Cadastradas',
  'area_cadastrada_m2': 'Área Total Cadastrada (m²)',
  'id': 'Identificador (ID)',
  'id_edificacao': 'Identificador da Edificação',
  'perimetro_m': 'Perímetro da Projeção (m)',
  'confianca_deteccao': 'Confiabilidade da Detecção',
  'metodo': 'Método de Levantamento',
  'fid': 'Feature ID (FID)',
  'Name': 'Nome do Recurso',
  'Distancia': 'Extensão / Distância (m)'
};

const AppState = {
  map: null,
  layers: {},
  layerGroups: {},
  activeBasemap: 'satellite',
  metadata: null,
  data: {
    limite: null,
    bairros: null,
    lotes: null,
    edificacoes: null,
    edificacoes_projetadas: null,
    quadras: null,
    vias: null,
    hidrografia: null
  },
  highlightLayer: null,
  measureState: {
    active: false,
    type: null,
    points: [],
    markers: [],
    line: null,
    polygon: null
  },
  tablePage: 1,
  tablePageSize: 50,
  filteredLotes: [],
  streetView: {
    active: false,
    marker: null
  }
};

document.addEventListener('DOMContentLoaded', () => {
  initMap();
  initBasemaps();
  initUIControls();
  initCoordinateTracker();
  loadAllData();
});

/* ==========================================================
   1. INICIALIZAÇÃO DO MAPA
   ========================================================== */
function initMap() {
  AppState.map = L.map('map', {
    center: [-20.0737, -44.1693],
    zoom: 14,
    minZoom: 11,
    maxZoom: 20,
    preferCanvas: true,
    zoomControl: false
  });

  L.control.zoom({ position: 'bottomright' }).addTo(AppState.map);
  L.control.scale({ imperial: false, metric: true, position: 'bottomleft' }).addTo(AppState.map);

  AppState.highlightLayer = L.geoJSON(null, {
    style: {
      color: '#facc15',
      weight: 4,
      fillColor: '#ffffff',
      fillOpacity: 0.6
    }
  }).addTo(AppState.map);

  // Evento de clique para Street View ativo em qualquer ponto do mapa
  AppState.map.on('click', (e) => {
    if (AppState.streetView && AppState.streetView.active) {
      openStreetView(e.latlng.lat, e.latlng.lng);
    }
  });

  // Fechar Street View ou Medição ao pressionar tecla ESC
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      const modal = document.getElementById('streetview-modal');
      if (modal && modal.classList.contains('active')) {
        closeStreetView();
      }
      if (AppState.measureState && AppState.measureState.active && window.resetMeasure) {
        window.resetMeasure();
      }
    }
  });
}

/* ==========================================================
   2. TRÊS MAPAS DE FUNDO (BASEMAPS)
   ========================================================== */
function initBasemaps() {
  const basemaps = {
    satellite: L.layerGroup([
      L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {
        maxZoom: 19,
        attribution: 'Tiles &copy; Esri &mdash; Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP, and the GIS User Community'
      }),
      L.tileLayer('https://{s}.basemaps.cartocdn.com/light_only_labels/{z}/{x}/{y}{r}.png', {
        maxZoom: 19,
        subdomains: 'abcd',
        opacity: 0.85
      })
    ]),
    
    osm: L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
    }),
    
    positron: L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', {
      maxZoom: 19,
      subdomains: 'abcd',
      attribution: '&copy; <a href="https://carto.com/">CARTO</a> Positron'
    })
  };

  AppState.basemaps = basemaps;
  basemaps.satellite.addTo(AppState.map);

  document.querySelectorAll('.basemap-option').forEach(el => {
    el.addEventListener('click', () => {
      const type = el.getAttribute('data-base');
      if (type === AppState.activeBasemap) return;

      document.querySelectorAll('.basemap-option').forEach(b => b.classList.remove('active'));
      el.classList.add('active');

      AppState.map.removeLayer(basemaps[AppState.activeBasemap]);
      basemaps[type].addTo(AppState.map);
      AppState.activeBasemap = type;
      
      Object.values(AppState.layers).forEach(layer => {
        if (AppState.map.hasLayer(layer)) {
          layer.bringToFront();
        }
      });
    });
  });
}

/* ==========================================================
   3. CARREGAMENTO DOS DADOS GEOESPACIAIS
   ========================================================== */
async function loadAllData() {
  const loadingIndicator = document.getElementById('loading-indicator');
  if (loadingIndicator) loadingIndicator.style.display = 'flex';

  try {
    const metaRes = await fetch('data/metadados.json');
    AppState.metadata = await metaRes.json();
    populateMetadataUI(AppState.metadata);

    const [limite, bairros, vias, hidro, edif, edifProj, quadras, lotes] = await Promise.all([
      fetch('data/limite_mario_campos.geojson').then(r => r.json()),
      fetch('data/bairros_limites.geojson').then(r => r.json()),
      fetch('data/vias.geojson').then(r => r.json()),
      fetch('data/hidrografia.geojson').then(r => r.json()),
      fetch('data/edificacoes.geojson').then(r => r.json()),
      fetch('data/edificacoes_projetadas.geojson').then(r => r.json()),
      fetch('data/quadras.geojson').then(r => r.json()),
      fetch('data/lotes_cadastrais.geojson').then(r => r.json())
    ]);

    AppState.data.limite = limite;
    AppState.data.bairros = bairros;
    AppState.data.vias = vias;
    AppState.data.hidrografia = hidro;
    AppState.data.edificacoes = edif;
    AppState.data.edificacoes_projetadas = edifProj;
    AppState.data.quadras = quadras;
    AppState.data.lotes = lotes;

    setupLayers();
    setupSearchIndex();
    setupAttributeTable();
    setupCharts();
    renderBairrosLegend();

    if (loadingIndicator) loadingIndicator.style.display = 'none';
  } catch (err) {
    console.error('Erro ao carregar dados:', err);
    if (loadingIndicator) {
      loadingIndicator.innerHTML = `<span style="color:#ef4444;font-weight:600;"><i class="fa-solid fa-triangle-exclamation"></i> Erro ao carregar dados geoespaciais.</span>`;
    }
  }
}

/* ==========================================================
   4. CONFIGURAÇÃO E ESTILIZAÇÃO DAS CAMADAS
   ========================================================== */
function setupLayers() {
  // 1. LIMITE MUNICIPAL (EM COR VERMELHA, APENAS REPRESENTATIVO, NÃO CLICÁVEL)
  AppState.layers['limite'] = L.geoJSON(AppState.data.limite, {
    interactive: false,
    style: {
      color: '#dc2626',       // Vermelho vivo
      weight: 4.5,            // Traço espesso e destacado
      dashArray: '9, 6',      // Estilo clássico de limite municipal
      fillColor: '#ef4444',
      fillOpacity: 0.05
    }
  }).addTo(AppState.map);

  // 3. LOTES CADASTRAIS (TODOS OS LOTES NAS CORES CORRESPONDENTES DO BAIRRO)
  AppState.layers['lotes'] = L.geoJSON(AppState.data.lotes, {
    style: (feature) => {
      const p = feature.properties;
      const bColor = getBairroColor(p.bairro_pasta || p.nome_bairro);
      return {
        color: bColor,
        weight: 1.2,
        fillColor: bColor,
        fillOpacity: 0.48
      };
    },
    onEachFeature: (feat, layer) => {
      const p = feat.properties;
      const bColor = getBairroColor(p.bairro_pasta || p.nome_bairro);
      
      layer.bindTooltip(`
        <div style="display:flex;align-items:center;gap:6px;">
          <span style="display:inline-block;width:9px;height:9px;background:${bColor};border-radius:2px;"></span>
          <b>Lote ${p.lote || '-'}</b> | Q: ${p.quadra || '-'}
        </div>
        <div style="font-size:0.75rem;color:#475569;">${p.nome_bairro || ''}</div>
      `, { sticky: true });

      layer.on('click', (e) => {
        if (AppState.measureState && AppState.measureState.active) {
          L.DomEvent.stopPropagation(e);
          if (window.handleMeasureClick) window.handleMeasureClick(e.latlng);
          return;
        }
        L.DomEvent.stopPropagation(e);
        if (AppState.streetView && AppState.streetView.active) {
          openStreetView(e.latlng.lat, e.latlng.lng);
          return;
        }
        openCadastrePopup(feat, layer);
      });
    }
  }).addTo(AppState.map);

  // 3.5. Edificações Projetadas (Satélite)
  AppState.layers['edificacoes_projetadas'] = L.geoJSON(AppState.data.edificacoes_projetadas, {
    style: {
      color: '#c2410c',
      weight: 1.2,
      fillColor: '#f97316',
      fillOpacity: 0.65
    },
    onEachFeature: (feat, layer) => {
      const p = feat.properties;
      const area = Number(p.area_m2).toLocaleString('pt-BR', { minimumFractionDigits: 2 });
      layer.bindTooltip(`
        <div style="display:flex;align-items:center;gap:6px;">
          <span style="display:inline-block;width:9px;height:9px;background:#f97316;border-radius:2px;"></span>
          <b style="color:#c2410c;">Edificação Projetada</b>
        </div>
        <div style="font-size:0.8rem;margin-top:2px;">
          Metragem: <b>${area} m²</b>
        </div>
        <div style="font-size:0.75rem;color:#64748b;">${p.nome_bairro || ''}</div>
      `, { sticky: true });

      layer.on('click', (e) => {
        if (AppState.measureState && AppState.measureState.active) {
          L.DomEvent.stopPropagation(e);
          if (window.handleMeasureClick) window.handleMeasureClick(e.latlng);
          return;
        }
        L.DomEvent.stopPropagation(e);
        if (AppState.streetView && AppState.streetView.active) {
          openStreetView(e.latlng.lat, e.latlng.lng);
          return;
        }
        openEdificacaoProjetadaPopup(feat, layer);
      });
    }
  });

  // 4. Edificações
  AppState.layers['edificacoes'] = L.geoJSON(AppState.data.edificacoes, {
    style: {
      color: '#334155',
      weight: 1.2,
      fillColor: '#94a3b8',
      fillOpacity: 0.8
    },
    onEachFeature: (feat, layer) => {
      layer.bindTooltip(`<b>Edificação</b><br>${feat.properties.bairro || ''}`, { sticky: true });
      layer.on('click', (e) => {
        if (AppState.measureState && AppState.measureState.active) {
          L.DomEvent.stopPropagation(e);
          if (window.handleMeasureClick) window.handleMeasureClick(e.latlng);
          return;
        }
        L.DomEvent.stopPropagation(e);
        if (AppState.streetView && AppState.streetView.active) {
          openStreetView(e.latlng.lat, e.latlng.lng);
          return;
        }
        openGenericPopup(feat, layer, "Edificação Mapeada");
      });
    }
  });

  // 5. Quadras Urbanas
  AppState.layers['quadras'] = L.geoJSON(AppState.data.quadras, {
    style: {
      color: '#312e81',
      weight: 2,
      dashArray: '4, 4',
      fillColor: '#6366f1',
      fillOpacity: 0.08
    },
    onEachFeature: (feat, layer) => {
      const p = feat.properties;
      const label = p.QUADRA || p.quadra || 'Quadra';
      layer.bindTooltip(`<b>Quadra ${label}</b><br>${p.bairro || ''}`, { sticky: true });
      layer.on('click', (e) => {
        if (AppState.measureState && AppState.measureState.active) {
          L.DomEvent.stopPropagation(e);
          if (window.handleMeasureClick) window.handleMeasureClick(e.latlng);
          return;
        }
        L.DomEvent.stopPropagation(e);
        if (AppState.streetView && AppState.streetView.active) {
          openStreetView(e.latlng.lat, e.latlng.lng);
          return;
        }
        openGenericPopup(feat, layer, `Quadra ${label}`);
      });
    }
  });

  // 6. Vias Urbanas
  AppState.layers['vias'] = L.geoJSON(AppState.data.vias, {
    style: {
      color: '#475569',
      weight: 2.2,
      opacity: 0.85
    },
    onEachFeature: (feat, layer) => {
      layer.bindTooltip("<b>Via Urbana / Logradouro</b>", { sticky: true });
      layer.on('click', (e) => {
        if (AppState.measureState && AppState.measureState.active) {
          L.DomEvent.stopPropagation(e);
          if (window.handleMeasureClick) window.handleMeasureClick(e.latlng);
          return;
        }
        L.DomEvent.stopPropagation(e);
        if (AppState.streetView && AppState.streetView.active) {
          openStreetView(e.latlng.lat, e.latlng.lng);
          return;
        }
        openGenericPopup(feat, layer, "Via Urbana");
      });
    }
  });

  // 7. Recursos Hídricos
  AppState.layers['hidrografia'] = L.geoJSON(AppState.data.hidrografia, {
    style: {
      color: '#0284c7',
      weight: 2.5,
      fillColor: '#38bdf8',
      fillOpacity: 0.6
    },
    onEachFeature: (feat, layer) => {
      layer.bindTooltip("<b>Recurso Hídrico</b>", { sticky: true });
      layer.on('click', (e) => {
        if (AppState.measureState && AppState.measureState.active) {
          L.DomEvent.stopPropagation(e);
          if (window.handleMeasureClick) window.handleMeasureClick(e.latlng);
          return;
        }
        L.DomEvent.stopPropagation(e);
        if (AppState.streetView && AppState.streetView.active) {
          openStreetView(e.latlng.lat, e.latlng.lng);
          return;
        }
        openGenericPopup(feat, layer, "Recurso Hídrico");
      });
    }
  });

  if (AppState.layers['limite']) {
    AppState.map.fitBounds(AppState.layers['limite'].getBounds(), { padding: [20, 20] });
  }

  setupLayerTreeEvents();
}

/* ==========================================================
   5. POPUP COMPLETO COM TODOS OS DADOS DA FEICAO
   ========================================================== */
function openCadastrePopup(feat, layer) {
  if (AppState.measureState && AppState.measureState.active) return;
  const p = feat.properties || {};
  
  // Destacar lote selecionado
  AppState.highlightLayer.clearLayers();
  AppState.highlightLayer.addData(feat);

  const bColor = getBairroColor(p.bairro_pasta || p.nome_bairro);
  const center = layer.getBounds ? layer.getBounds().getCenter() : AppState.map.getCenter();

  const lote = p.lote ? String(p.lote).replace(/\.$/, '') : '-';
  const quadra = p.quadra ? String(p.quadra).replace(/\.$/, '') : '-';
  const bairro = p.nome_bairro || '-';

  // Montar tabela contendo os dados da feição na ordem solicitada
  let allRowsHtml = '';
  const orderedKeys = Object.keys(p);

  // Ordem estrita solicitada: Inscrição Imobiliária, Bairro, Distrito, Código do Bairro, Quadra, Lote, Unidade, seguidos por Número Predial, Área do Terreno, Zoneamento, Situação, Titular, Matrícula
  const priority = ['insc_imob', 'nome_bairro', 'distrito', 'bairro_cod', 'quadra', 'lote', 'unidade', 'numero_predial', 'area_m2', 'zoneamento', 'situacao', 'titular', 'matricula'];
  orderedKeys.sort((a, b) => {
    const ia = priority.indexOf(a);
    const ib = priority.indexOf(b);
    if (ia !== -1 && ib !== -1) return ia - ib;
    if (ia !== -1) return -1;
    if (ib !== -1) return 1;
    return a.localeCompare(b);
  });

  orderedKeys.forEach(k => {
    // Remover campo de pasta / código do bairro conforme solicitação
    if (k === 'bairro_pasta') return;

    const rawVal = p[k];
    const label = FieldLabels[k] || k.replace(/_/g, ' ').toUpperCase();
    
    let displayVal = rawVal;
    if (rawVal === null || rawVal === undefined || rawVal === '') {
      displayVal = '<span style="color:#94a3b8;font-style:italic;">Não informado</span>';
    } else if (k === 'area_m2' && !isNaN(Number(rawVal))) {
      const numArea = Number(rawVal);
      if (numArea >= 10000) {
        displayVal = `<b>${numArea.toLocaleString('pt-BR', { minimumFractionDigits: 2 })} m²</b> (${(numArea / 10000).toFixed(2)} ha)`;
      } else {
        displayVal = `<b>${numArea.toLocaleString('pt-BR', { minimumFractionDigits: 2 })} m²</b>`;
      }
    } else if (k === 'insc_imob') {
      const cleanInsc = String(rawVal).replace(/\.{2,}/g, '.');
      displayVal = `<span style="font-family:monospace;font-weight:700;color:${bColor};">${cleanInsc}</span>`;
    } else if (typeof rawVal === 'string' && rawVal.endsWith('.')) {
      displayVal = rawVal.replace(/\.+$/, '');
    }

    allRowsHtml += `
      <div class="popup-row">
        <span class="popup-key">${label}:</span>
        <span class="popup-val">${displayVal}</span>
      </div>
    `;
  });

  // Exportar dados (removendo bairro_pasta)
  const exportProps = { ...p };
  delete exportProps.bairro_pasta;
  const jsonStr = JSON.stringify(exportProps, null, 2);

  const content = `
    <div class="cadastre-popup" style="border-top: 5px solid ${bColor};">
      <div class="popup-header" style="background: linear-gradient(135deg, ${bColor} 0%, #0f172a 100%);">
        <div style="display:flex;align-items:center;justify-content:space-between;">
          <span class="popup-badge" style="background:rgba(255,255,255,0.25);color:#ffffff;">Cadastro Técnico Imobiliário</span>
          <span style="font-size:0.7rem;color:#e2e8f0;background:rgba(0,0,0,0.3);padding:2px 8px;border-radius:999px;">
            <i class="fa-solid fa-circle" style="color:${bColor};font-size:0.55rem;margin-right:4px;"></i>${bairro}
          </span>
        </div>
        <div class="popup-title">Lote ${lote} &bull; Quadra ${quadra}</div>
        <div class="popup-subtitle">${bairro} &bull; Mário Campos - MG</div>
      </div>
      <div class="popup-body" style="max-height: 340px; overflow-y: auto;">
        ${allRowsHtml}
      </div>
      <div class="popup-footer">
        <button class="popup-btn-copy" onclick="copyAllProperties('${encodeURIComponent(jsonStr)}')">
          <i class="fa-solid fa-copy"></i> Copiar Dados do Imóvel
        </button>
        <button class="popup-btn-copy" onclick="zoomToFeature(${center.lat}, ${center.lng})">
          <i class="fa-solid fa-crosshairs"></i> Centralizar
        </button>
        <button class="popup-btn-copy" style="color:#d97706;border-color:#fde68a;background:#fffbeb;" onclick="openStreetView(${center.lat}, ${center.lng})">
          <i class="fa-solid fa-street-view"></i> Street View
        </button>
      </div>
    </div>
  `;

  L.popup({ offset: [0, -10], maxWidth: 410 })
    .setLatLng(center)
    .setContent(content)
    .openOn(AppState.map);
}

// Popup genérico para todas as outras camadas (Edificações, Vias, etc.)
function openGenericPopup(feat, layer, titulo) {
  if (AppState.measureState && AppState.measureState.active) return;
  const p = feat.properties || {};
  
  AppState.highlightLayer.clearLayers();
  AppState.highlightLayer.addData(feat);

  const center = layer.getBounds ? layer.getBounds().getCenter() : AppState.map.getCenter();

  let rowsHtml = '';
  const orderedKeys = Object.keys(p);
  const priority = ['insc_imob', 'nome_bairro', 'distrito', 'bairro_cod', 'quadra', 'lote', 'unidade', 'numero_predial', 'area_m2', 'zoneamento', 'situacao', 'titular', 'matricula'];
  orderedKeys.sort((a, b) => {
    const ia = priority.indexOf(a);
    const ib = priority.indexOf(b);
    if (ia !== -1 && ib !== -1) return ia - ib;
    if (ia !== -1) return -1;
    if (ib !== -1) return 1;
    return a.localeCompare(b);
  });

  orderedKeys.forEach(k => {
    if (k === 'bairro_pasta') return;

    const rawVal = p[k];
    const label = FieldLabels[k] || k.replace(/_/g, ' ').toUpperCase();
    let displayVal = (rawVal !== null && rawVal !== undefined && rawVal !== '') ? rawVal : '<span style="color:#94a3b8;font-style:italic;">Não informado</span>';
    if (typeof displayVal === 'string') {
      if (k === 'insc_imob') {
        displayVal = displayVal.replace(/\.{2,}/g, '.');
      } else if (displayVal.endsWith('.')) {
        displayVal = displayVal.replace(/\.+$/, '');
      }
    }

    rowsHtml += `
      <div class="popup-row">
        <span class="popup-key">${label}:</span>
        <span class="popup-val">${displayVal}</span>
      </div>
    `;
  });

  const exportProps = { ...p };
  delete exportProps.bairro_pasta;
  const jsonStr = JSON.stringify(exportProps, null, 2);

  const content = `
    <div class="cadastre-popup">
      <div class="popup-header" style="background: linear-gradient(135deg, #1e293b 0%, #0f172a 100%);">
        <span class="popup-badge">Informações Geoespaciais</span>
        <div class="popup-title">${titulo}</div>
      </div>
      <div class="popup-body" style="max-height: 320px; overflow-y: auto;">
        ${rowsHtml}
      </div>
      <div class="popup-footer">
        <button class="popup-btn-copy" onclick="copyAllProperties('${encodeURIComponent(jsonStr)}')">
          <i class="fa-solid fa-copy"></i> Copiar Dados
        </button>
        <button class="popup-btn-copy" onclick="zoomToFeature(${center.lat}, ${center.lng})">
          <i class="fa-solid fa-crosshairs"></i> Centralizar
        </button>
        <button class="popup-btn-copy" style="color:#d97706;border-color:#fde68a;background:#fffbeb;" onclick="openStreetView(${center.lat}, ${center.lng})">
          <i class="fa-solid fa-street-view"></i> Street View
        </button>
      </div>
    </div>
  `;

  L.popup({ offset: [0, -10], maxWidth: 390 })
    .setLatLng(center)
    .setContent(content)
    .openOn(AppState.map);
}

// Popup especializado para Edificações Projetadas (Satélite) com Metragem em destaque
function openEdificacaoProjetadaPopup(feat, layer) {
  if (AppState.measureState && AppState.measureState.active) return;
  const p = feat.properties || {};
  
  AppState.highlightLayer.clearLayers();
  AppState.highlightLayer.addData(feat);

  const center = layer.getBounds ? layer.getBounds().getCenter() : AppState.map.getCenter();
  const areaNum = Number(p.area_m2) || 0;
  const areaFormatted = areaNum.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  const perimFormatted = (Number(p.perimetro_m) || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  const exportProps = { ...p };
  const jsonStr = JSON.stringify(exportProps, null, 2);

  const content = `
    <div class="cadastre-popup" style="border-top: 5px solid #ea580c;">
      <div class="popup-header" style="background: linear-gradient(135deg, #c2410c 0%, #0f172a 100%);">
        <div style="display:flex;align-items:center;justify-content:space-between;">
          <span class="popup-badge" style="background:rgba(255,255,255,0.25);color:#ffffff;">
            <i class="fa-solid fa-satellite" style="margin-right:4px;"></i>Edificação Projetada
          </span>
          <span style="font-size:0.7rem;color:#fed7aa;background:rgba(0,0,0,0.3);padding:2px 8px;border-radius:999px;">
            ${p.nome_bairro || 'Mário Campos'}
          </span>
        </div>
        <div class="popup-title">${p.id_edificacao || 'Edificação'}</div>
        <div class="popup-subtitle">Vetorização por Satélite &bull; Mário Campos - MG</div>
      </div>

      <div class="popup-body" style="max-height: 350px; overflow-y: auto;">
        <!-- Card de Destaque da Metragem -->
        <div style="background:#fff7ed;border:1.5px solid #ffedd5;padding:12px 14px;border-radius:8px;margin-bottom:12px;display:flex;align-items:center;justify-content:space-between;box-shadow:0 1px 3px rgba(0,0,0,0.05);">
          <div>
            <span style="font-size:0.72rem;font-weight:700;color:#c2410c;text-transform:uppercase;letter-spacing:0.5px;">
              <i class="fa-solid fa-ruler-combined" style="margin-right:4px;"></i>Metragem Construída / Projeção
            </span>
            <div style="font-size:1.45rem;font-weight:800;color:#9a3412;margin-top:2px;">
              ${areaFormatted} m²
            </div>
            <div style="font-size:0.7rem;color:#7c2d12;">Perímetro: <b>${perimFormatted} m</b></div>
          </div>
          <div style="font-size:2rem;color:#ea580c;opacity:0.85;">
            <i class="fa-solid fa-building"></i>
          </div>
        </div>

        <div class="popup-row">
          <span class="popup-key">Bairro / Região:</span>
          <span class="popup-val"><b>${p.nome_bairro || 'Zona Rural / Expansão'}</b></span>
        </div>
        <div class="popup-row">
          <span class="popup-key">Categoria:</span>
          <span class="popup-val">${p.categoria || 'Residencial / Comercial'}</span>
        </div>
        <div class="popup-row">
          <span class="popup-key">Confiabilidade:</span>
          <span class="popup-val"><span style="background:#dcfce7;color:#15803d;padding:2px 8px;border-radius:999px;font-weight:700;font-size:0.75rem;">${p.confianca_deteccao || '95%'}</span></span>
        </div>
        <div class="popup-row">
          <span class="popup-key">Fonte de Dados:</span>
          <span class="popup-val">${p.fonte || 'Imagens de Satélite de Alta Resolução'}</span>
        </div>
        <div class="popup-row">
          <span class="popup-key">Método:</span>
          <span class="popup-val">${p.metodo || 'Detecção e Vetorização por IA'}</span>
        </div>
      </div>

      <div class="popup-footer">
        <button class="popup-btn-copy" onclick="copyAllProperties('${encodeURIComponent(jsonStr)}')">
          <i class="fa-solid fa-copy"></i> Copiar Dados
        </button>
        <button class="popup-btn-copy" onclick="zoomToFeature(${center.lat}, ${center.lng})">
          <i class="fa-solid fa-crosshairs"></i> Centralizar
        </button>
        <button class="popup-btn-copy" style="color:#d97706;border-color:#fde68a;background:#fffbeb;" onclick="openStreetView(${center.lat}, ${center.lng})">
          <i class="fa-solid fa-street-view"></i> Street View
        </button>
      </div>
    </div>
  `;

  L.popup({ offset: [0, -10], maxWidth: 390 })
    .setLatLng(center)
    .setContent(content)
    .openOn(AppState.map);
}

window.copyAllProperties = function(encodedJson) {
  const jsonStr = decodeURIComponent(encodedJson);
  navigator.clipboard.writeText(jsonStr).then(() => {
    alert("Todos os dados do imóvel foram copiados para a área de transferência!");
  }).catch(() => {
    prompt("Dados do imóvel:", jsonStr);
  });
};

window.zoomToFeature = function(lat, lng) {
  AppState.map.setView([lat, lng], 18, { animate: true });
};

/* ==========================================================
   GOOGLE STREET VIEW 360° CONTROLLER
   ========================================================== */
window.toggleStreetViewTool = function(forceState) {
  const newState = (forceState !== undefined) ? forceState : !AppState.streetView.active;
  if (newState && AppState.measureState && AppState.measureState.active && window.resetMeasure) {
    window.resetMeasure();
  }
  AppState.streetView.active = newState;

  const btn = document.getElementById('tool-streetview');
  if (btn) btn.classList.toggle('active', newState);

  const banner = document.getElementById('streetview-active-banner');
  if (banner) banner.classList.toggle('active', newState);

  const mapContainer = document.querySelector('.map-container');
  if (mapContainer) mapContainer.classList.toggle('streetview-crosshair', newState);

  if (!newState && !document.getElementById('streetview-modal').classList.contains('active')) {
    if (AppState.streetView.marker) {
      AppState.map.removeLayer(AppState.streetView.marker);
      AppState.streetView.marker = null;
    }
  }
};

window.openStreetView = function(lat, lng, centerMap = true) {
  const modal = document.getElementById('streetview-modal');
  const iframe = document.getElementById('streetview-iframe');
  const loader = document.getElementById('streetview-loader');
  const coordsDisplay = document.getElementById('streetview-coords-display');
  const externalLink = document.getElementById('streetview-external-link');

  if (!modal || !iframe) return;

  const latNum = Number(lat);
  const lngNum = Number(lng);

  // Atualizar coordenadas exibidas no cabeçalho
  if (coordsDisplay) {
    coordsDisplay.textContent = `Lat: ${latNum.toFixed(6)} | Lng: ${lngNum.toFixed(6)} • Mário Campos - MG`;
  }

  // Link para o Google Maps panorâmico oficial
  if (externalLink) {
    externalLink.href = `https://www.google.com/maps/@?api=1&map_action=pano&viewpoint=${latNum},${lngNum}`;
  }

  // Exibir loader enquanto iframe inicializa
  if (loader) loader.style.display = 'flex';

  iframe.onload = () => {
    if (loader) loader.style.display = 'none';
  };

  // URL oficial de embed do Google Street View 360°
  iframe.src = `https://maps.google.com/maps?q=&layer=c&cbll=${latNum},${lngNum}&cbp=11,0,0,0,0&output=svembed`;

  modal.classList.add('active');

  // Adicionar ou mover marcador do Pegman no mapa
  const pegmanIcon = L.divIcon({
    className: 'pegman-marker-icon',
    html: '<div class="pegman-pin" title="Arraste para reposicionar o Street View"><i class="fa-solid fa-street-view"></i></div>',
    iconSize: [38, 38],
    iconAnchor: [19, 38]
  });

  if (!AppState.streetView.marker) {
    AppState.streetView.marker = L.marker([latNum, lngNum], {
      icon: pegmanIcon,
      draggable: true,
      zIndexOffset: 1000
    }).addTo(AppState.map);

    AppState.streetView.marker.on('dragend', (e) => {
      const pos = e.target.getLatLng();
      openStreetView(pos.lat, pos.lng, false);
    });
  } else {
    AppState.streetView.marker.setLatLng([latNum, lngNum]);
    if (!AppState.map.hasLayer(AppState.streetView.marker)) {
      AppState.streetView.marker.addTo(AppState.map);
    }
  }

  if (centerMap) {
    AppState.map.panTo([latNum, lngNum], { animate: true });
  }
};

window.closeStreetView = function() {
  const modal = document.getElementById('streetview-modal');
  const iframe = document.getElementById('streetview-iframe');
  if (modal) modal.classList.remove('active');
  if (iframe) iframe.src = '';

  if (AppState.streetView.marker) {
    AppState.map.removeLayer(AppState.streetView.marker);
    AppState.streetView.marker = null;
  }
};

window.toggleMaximizeStreetView = function() {
  const dialog = document.getElementById('streetview-dialog');
  const icon = document.getElementById('streetview-maximize-icon');
  if (!dialog) return;

  const isMax = dialog.classList.toggle('maximized');
  if (icon) {
    icon.className = isMax ? 'fa-solid fa-compress' : 'fa-solid fa-expand';
  }
};

/* ==========================================================
   6. CONTROLE DE CAMADAS (ÁRVORE & SLIDERS)
   ========================================================== */
function setupLayerTreeEvents() {
  document.querySelectorAll('.layer-checkbox').forEach(cb => {
    cb.addEventListener('change', () => {
      const layerKey = cb.getAttribute('data-layer');
      const layer = AppState.layers[layerKey];
      if (!layer) return;

      if (cb.checked) {
        AppState.map.addLayer(layer);
      } else {
        AppState.map.removeLayer(layer);
      }
    });
  });

  document.querySelectorAll('.opacity-slider').forEach(slider => {
    slider.addEventListener('input', () => {
      const layerKey = slider.getAttribute('data-layer');
      const layer = AppState.layers[layerKey];
      const val = parseFloat(slider.value) / 100;
      
      const valSpan = slider.parentElement.querySelector('span');
      if (valSpan) valSpan.textContent = `${slider.value}%`;

      if (layer) {
        layer.eachLayer(l => {
          if (l.setStyle) {
            l.setStyle({
              fillOpacity: val * 0.5,
              opacity: val
            });
          }
        });
      }
    });
  });

  document.querySelectorAll('.btn-zoom-layer').forEach(btn => {
    btn.addEventListener('click', () => {
      const layerKey = btn.getAttribute('data-layer');
      const layer = AppState.layers[layerKey];
      if (layer && AppState.map.hasLayer(layer)) {
        AppState.map.fitBounds(layer.getBounds(), { padding: [30, 30] });
      }
    });
  });
}

/* ==========================================================
   7. LEGENDA DINÂMICA COM OS 33 BAIRROS E SUAS CORES
   ========================================================== */
function renderBairrosLegend() {
  const container = document.getElementById('bairros-legend-list');
  if (!container || !AppState.metadata) return;

  let html = '';
  AppState.metadata.bairros.forEach(b => {
    const bColor = getBairroColor(b.pasta);
    html += `
      <div style="display:flex;align-items:center;justify-content:space-between;padding:4px 6px;border-radius:4px;cursor:pointer;transition:background 0.15s;" onmouseover="this.style.background='#f1f5f9'" onmouseout="this.style.background='transparent'" onclick="zoomToBairroByFolder('${b.pasta}')">
        <div style="display:flex;align-items:center;gap:8px;font-size:0.78rem;">
          <span style="width:12px;height:12px;border-radius:3px;background:${bColor};border:1px solid rgba(0,0,0,0.15);flex-shrink:0;"></span>
          <span style="font-weight:500;">${b.codigo} - ${b.nome}</span>
        </div>
        <span style="font-size:0.7rem;background:#e2e8f0;padding:1px 6px;border-radius:999px;font-weight:600;color:#475569;">${b.lotes} lotes</span>
      </div>
    `;
  });

  container.innerHTML = html;
}

window.zoomToBairroByFolder = function(folder) {
  if (AppState.layers['lotes']) {
    const bGroup = L.featureGroup();
    AppState.layers['lotes'].eachLayer(l => {
      if (l.feature && l.feature.properties && l.feature.properties.bairro_pasta === folder) {
        bGroup.addLayer(l);
      }
    });
    if (bGroup.getLayers().length > 0) {
      AppState.map.fitBounds(bGroup.getBounds(), { padding: [40, 40] });
    }
  }
};

/* ==========================================================
   8. SELETOR RÁPIDO DE BAIRRO
   ========================================================== */
function populateMetadataUI(meta) {
  document.getElementById('header-stat-lotes').textContent = meta.total_lotes.toLocaleString('pt-BR');
  document.getElementById('header-stat-edif').textContent = meta.total_edificacoes.toLocaleString('pt-BR');
  document.getElementById('header-stat-vias').textContent = meta.total_vias.toLocaleString('pt-BR');
  document.getElementById('header-stat-bairros').textContent = meta.total_bairros;

  const badgeLotes = document.getElementById('badge-lotes');
  if (badgeLotes && meta.total_lotes) {
    badgeLotes.textContent = meta.total_lotes.toLocaleString('pt-BR');
  }

  const badgeProj = document.getElementById('badge-edificacoes-projetadas');
  if (badgeProj && meta.total_edificacoes_projetadas) {
    badgeProj.textContent = meta.total_edificacoes_projetadas.toLocaleString('pt-BR');
  }

  const bairroSelects = [
    document.getElementById('bairro-jumper-select'),
    document.getElementById('search-bairro')
  ];
  
  bairroSelects.forEach(select => {
    if (!select) return;
    meta.bairros.forEach(b => {
      const opt = document.createElement('option');
      opt.value = b.pasta;
      opt.textContent = `${b.codigo} - ${b.nome} (${b.lotes} lotes)`;
      select.appendChild(opt);
    });
  });

  const jumper = document.getElementById('bairro-jumper-select');
  if (jumper) {
    jumper.addEventListener('change', () => {
      const selectedFolder = jumper.value;
      if (!selectedFolder) {
        AppState.map.fitBounds(AppState.layers['limite'].getBounds());
        return;
      }

      let foundBounds = null;
      if (AppState.layers['lotes']) {
        const bGroup = L.featureGroup();
        AppState.layers['lotes'].eachLayer(l => {
          if (l.feature && l.feature.properties && l.feature.properties.bairro_pasta === selectedFolder) {
            bGroup.addLayer(l);
          }
        });
        if (bGroup.getLayers().length > 0) {
          foundBounds = bGroup.getBounds();
        }
      }

      if (foundBounds) {
        AppState.map.fitBounds(foundBounds, { padding: [40, 40] });
      }
    });
  }
}

/* ==========================================================
   9. BUSCA CADASTRAL AVANÇADA (LOTE, QUADRA E BAIRRO)
   ========================================================== */
function normalizeCode(val) {
  if (!val) return '';
  return String(val).trim().replace(/\.$/, '').replace(/^0+/, '').toLowerCase();
}

function setupSearchIndex() {
  const selectBairro = document.getElementById('search-bairro');
  const inputQuadra = document.getElementById('search-quadra');
  const inputLote = document.getElementById('search-lote');
  const inputGeral = document.getElementById('search-geral');
  const btnDoSearch = document.getElementById('btn-do-search');
  const btnClearSearch = document.getElementById('btn-clear-search');
  const countBadge = document.getElementById('search-count-badge');
  const searchResults = document.getElementById('search-results');

  function doSearch(autoZoomSingle = true) {
    const bairroVal = selectBairro ? selectBairro.value : '';
    const quadraVal = inputQuadra ? inputQuadra.value.trim() : '';
    const loteVal = inputLote ? inputLote.value.trim() : '';
    const geralVal = inputGeral ? inputGeral.value.trim().toLowerCase() : '';

    const hasCriteria = bairroVal || quadraVal || loteVal || geralVal;

    if (!hasCriteria) {
      if (countBadge) countBadge.style.display = 'none';
      searchResults.innerHTML = `
        <div style="text-align:center;color:#94a3b8;padding:30px 10px;font-size:0.8rem;">
          <i class="fa-solid fa-search" style="font-size:1.8rem;margin-bottom:10px;opacity:0.4;"></i><br>
          Preencha o <b>Bairro</b>, <b>Quadra</b> e/ou <b>Lote</b> acima e clique em <b>Consultar</b> para localizar o imóvel.
        </div>
      `;
      return;
    }

    const normQuadra = normalizeCode(quadraVal);
    const normLote = normalizeCode(loteVal);

    const allFeatures = AppState.data.lotes.features;
    const matches = [];

    for (let i = 0; i < allFeatures.length; i++) {
      const ft = allFeatures[i];
      const p = ft.properties;

      // 1. Filtro de Bairro
      if (bairroVal && p.bairro_pasta !== bairroVal) {
        continue;
      }

      // 2. Filtro de Quadra
      if (normQuadra) {
        const ftQuadraNorm = normalizeCode(p.quadra);
        const ftQuadraRaw = String(p.quadra || '').toLowerCase();
        if (ftQuadraNorm !== normQuadra && !ftQuadraRaw.includes(quadraVal.toLowerCase())) {
          continue;
        }
      }

      // 3. Filtro de Lote
      if (normLote) {
        const ftLoteNorm = normalizeCode(p.lote);
        const ftLoteRaw = String(p.lote || '').toLowerCase();
        if (ftLoteNorm !== normLote && !ftLoteRaw.includes(loteVal.toLowerCase())) {
          continue;
        }
      }

      // 4. Filtro Geral (Inscrição Imobiliária, Titular, Matrícula, Número Predial ou Situação)
      if (geralVal) {
        const insc = String(p.insc_imob || '').toLowerCase();
        const tit = String(p.titular || '').toLowerCase();
        const mat = String(p.matricula || '').toLowerCase();
        const num = String(p.numero_predial || '').toLowerCase();
        const sit = String(p.situacao || '').toLowerCase();
        if (!insc.includes(geralVal) && !tit.includes(geralVal) && !mat.includes(geralVal) && !num.includes(geralVal) && !sit.includes(geralVal)) {
          continue;
        }
      }

      matches.push(ft);
      if (matches.length >= 80) break;
    }

    // Exibir badge de contagem
    if (countBadge) {
      countBadge.style.display = 'inline-block';
      countBadge.textContent = `${matches.length} ${matches.length === 1 ? 'encontrado' : 'encontrados'}`;
      countBadge.style.background = matches.length > 0 ? '#dbeafe' : '#fee2e2';
      countBadge.style.color = matches.length > 0 ? '#1d4ed8' : '#dc2626';
    }

    renderSearchResults(matches);

    // Se encontrou exatamente 1 resultado e solicitado zoom automático
    if (matches.length === 1 && autoZoomSingle) {
      zoomToSearchResult(0);
    } else if (matches.length > 1 && autoZoomSingle) {
      const tempGroup = L.featureGroup(matches.map(m => L.geoJSON(m)));
      AppState.map.fitBounds(tempGroup.getBounds(), { padding: [40, 40], maxZoom: 18 });
    }
  }

  // Eventos de clique e teclado
  if (btnDoSearch) {
    btnDoSearch.addEventListener('click', () => doSearch(true));
  }

  if (btnClearSearch) {
    btnClearSearch.addEventListener('click', () => {
      if (selectBairro) selectBairro.value = '';
      if (inputQuadra) inputQuadra.value = '';
      if (inputLote) inputLote.value = '';
      if (inputGeral) inputGeral.value = '';
      if (countBadge) countBadge.style.display = 'none';
      AppState.highlightLayer.clearLayers();
      AppState.map.closePopup();
      doSearch(false);
    });
  }

  [inputQuadra, inputLote, inputGeral].forEach(el => {
    if (el) {
      el.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
          e.preventDefault();
          doSearch(true);
        }
      });
      el.addEventListener('input', () => {
        doSearch(false);
      });
    }
  });

  if (selectBairro) {
    selectBairro.addEventListener('change', () => {
      doSearch(true);
    });
  }
}

function renderSearchResults(features) {
  const container = document.getElementById('search-results');
  if (!features.length) {
    container.innerHTML = `
      <div style="text-align:center;color:#ef4444;padding:24px 10px;font-size:0.82rem;background:#fef2f2;border:1px solid #fecaca;border-radius:6px;">
        <i class="fa-solid fa-triangle-exclamation" style="font-size:1.6rem;margin-bottom:8px;"></i><br>
        Nenhum lote localizado com os critérios informados.<br>
        <span style="font-size:0.72rem;color:#64748b;">Verifique o número do lote, quadra ou selecione outro bairro.</span>
      </div>
    `;
    return;
  }

  let html = '';
  features.forEach((f, idx) => {
    const p = f.properties;
    const bColor = getBairroColor(p.bairro_pasta || p.nome_bairro);
    const quadra = p.quadra ? String(p.quadra).replace(/\.$/, '') : '-';
    const lote = p.lote ? String(p.lote).replace(/\.$/, '') : '-';
    const area = p.area_m2 ? `${Number(p.area_m2).toLocaleString('pt-BR')} m²` : 'Área não informada';
    
    html += `
      <div class="search-result-item" onclick="zoomToSearchResult(${idx})" style="border-left: 5px solid ${bColor};">
        <div class="result-insc">
          <span style="font-size:0.9rem;font-weight:700;color:#0f172a;">
            Lote <b>${lote}</b> &bull; Quadra <b>${quadra}</b>
          </span>
          <span style="font-size:0.72rem;color:${bColor};font-family:monospace;font-weight:700;background:${bColor}15;padding:2px 6px;border-radius:4px;">
            ${(p.insc_imob || 'S/ Inscrição').replace(/\.{2,}/g, '.')}
          </span>
        </div>
        <div class="result-details" style="margin-top:6px;">
          <span class="result-tag" style="background:${bColor}15;color:${bColor};font-weight:600;">
            <i class="fa-solid fa-location-dot"></i> ${p.nome_bairro || '-'}
          </span>
          <span class="result-tag"><i class="fa-solid fa-ruler-combined"></i> ${area}</span>
          ${p.titular ? `<span class="result-tag" style="color:#0f172a;font-weight:500;"><i class="fa-solid fa-user"></i> ${p.titular}</span>` : ''}
          ${p.zoneamento ? `<span class="result-tag" style="background:#e0f2fe;color:#0369a1;">${p.zoneamento}</span>` : ''}
          ${p.situacao ? `<span class="result-tag" style="background:#fef3c7;color:#92400e;font-weight:600;"><i class="fa-solid fa-tag"></i> ${p.situacao}</span>` : ''}
          ${p.numero_predial ? `<span class="result-tag" style="background:#ecfdf5;color:#065f46;font-weight:600;"><i class="fa-solid fa-house-chimney"></i> Nº ${p.numero_predial}</span>` : ''}
        </div>
      </div>
    `;
  });

  window._currentSearchMatches = features;
  container.innerHTML = html;
}

window.zoomToSearchResult = function(idx) {
  const ft = window._currentSearchMatches[idx];
  if (!ft) return;

  const tempLayer = L.geoJSON(ft);
  const bounds = tempLayer.getBounds();
  AppState.map.fitBounds(bounds, { maxZoom: 19, padding: [40, 40] });

  AppState.highlightLayer.clearLayers();
  AppState.highlightLayer.addData(ft);
  openCadastrePopup(ft, tempLayer.getLayers()[0]);
};

/* ==========================================================
   10. TABELA DE ATRIBUTOS COM EXPORTAÇÃO CSV
   ========================================================== */
function setupAttributeTable() {
  AppState.filteredLotes = AppState.data.lotes.features;
  renderTablePage();

  const searchInput = document.getElementById('table-search');
  if (searchInput) {
    searchInput.addEventListener('input', () => {
      const q = searchInput.value.toLowerCase();
      AppState.filteredLotes = AppState.data.lotes.features.filter(f => {
        const p = f.properties;
        return (p.insc_imob && p.insc_imob.toLowerCase().includes(q)) ||
               (p.nome_bairro && p.nome_bairro.toLowerCase().includes(q)) ||
               (p.titular && p.titular.toLowerCase().includes(q)) ||
               (p.matricula && p.matricula.toLowerCase().includes(q)) ||
               (p.numero_predial && String(p.numero_predial).toLowerCase().includes(q)) ||
               (p.situacao && p.situacao.toLowerCase().includes(q)) ||
               (p.quadra && String(p.quadra).toLowerCase().includes(q)) ||
               (p.lote && p.lote.toLowerCase().includes(q));
      });
      AppState.tablePage = 1;
      renderTablePage();
    });
  }

  document.getElementById('table-prev-page').addEventListener('click', () => {
    if (AppState.tablePage > 1) {
      AppState.tablePage--;
      renderTablePage();
    }
  });

  document.getElementById('table-next-page').addEventListener('click', () => {
    const maxPage = Math.ceil(AppState.filteredLotes.length / AppState.tablePageSize);
    if (AppState.tablePage < maxPage) {
      AppState.tablePage++;
      renderTablePage();
    }
  });

  document.getElementById('btn-export-csv').addEventListener('click', exportTableToCSV);
}

function renderTablePage() {
  const tbody = document.getElementById('attribute-table-body');
  const start = (AppState.tablePage - 1) * AppState.tablePageSize;
  const pageItems = AppState.filteredLotes.slice(start, start + AppState.tablePageSize);

  let rows = '';
  pageItems.forEach((f, idx) => {
    const p = f.properties;
    const bColor = getBairroColor(p.bairro_pasta || p.nome_bairro);
    rows += `
      <tr onclick="zoomToTableFeature(${start + idx})">
        <td style="font-weight:600;color:${bColor};font-family:monospace;">${(p.insc_imob || '-').replace(/\.{2,}/g, '.')}</td>
        <td><span style="display:inline-block;width:8px;height:8px;border-radius:2px;background:${bColor};margin-right:4px;"></span>${p.nome_bairro || '-'}</td>
        <td>${p.quadra ? String(p.quadra).replace(/\.+$/, '') : '-'}</td>
        <td>${p.lote ? String(p.lote).replace(/\.+$/, '') : '-'}</td>
        <td>${p.area_m2 ? `${p.area_m2} m²` : '-'}</td>
        <td>${p.zoneamento || '-'}</td>
        <td>${p.titular || '-'}</td>
      </tr>
    `;
  });

  tbody.innerHTML = rows;

  const total = AppState.filteredLotes.length;
  const maxPage = Math.ceil(total / AppState.tablePageSize) || 1;
  document.getElementById('table-page-info').textContent = `Página ${AppState.tablePage} de ${maxPage} (${total.toLocaleString('pt-BR')} lotes)`;
  
  document.getElementById('table-prev-page').disabled = (AppState.tablePage <= 1);
  document.getElementById('table-next-page').disabled = (AppState.tablePage >= maxPage);
}

window.zoomToTableFeature = function(globalIdx) {
  const ft = AppState.filteredLotes[globalIdx];
  if (!ft) return;

  const tempLayer = L.geoJSON(ft);
  AppState.map.fitBounds(tempLayer.getBounds(), { maxZoom: 19, padding: [50, 50] });

  AppState.highlightLayer.clearLayers();
  AppState.highlightLayer.addData(ft);
  openCadastrePopup(ft, tempLayer.getLayers()[0]);
};

function exportTableToCSV() {
  const data = AppState.filteredLotes.map(f => {
    const p = f.properties;
    return {
      'Inscrição Imobiliária': p.insc_imob || '',
      'Bairro': p.nome_bairro || '',
      'Distrito': p.distrito ? String(p.distrito).replace(/\.$/, '') : '',
      'Código do Bairro': p.bairro_cod ? String(p.bairro_cod).replace(/\.$/, '') : '',
      'Quadra': p.quadra ? String(p.quadra).replace(/\.$/, '') : '',
      'Lote': p.lote ? String(p.lote).replace(/\.$/, '') : '',
      'Unidade': p.unidade || '',
      'Número Predial': p.numero_predial || '',
      'Área (m²)': p.area_m2 || '',
      'Zoneamento': p.zoneamento || '',
      'Situação': p.situacao || '',
      'Titular': p.titular || '',
      'Matrícula': p.matricula || ''
    };
  });

  if (!data.length) return alert('Nenhum dado para exportar!');

  const headers = Object.keys(data[0]);
  let csvContent = '\uFEFF' + headers.join(';') + '\n';

  data.forEach(row => {
    const line = headers.map(h => `"${String(row[h]).replace(/"/g, '""')}"`).join(';');
    csvContent += line + '\n';
  });

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', `cadastro_imobiliario_mario_campos_${new Date().toISOString().slice(0, 10)}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

/* ==========================================================
   11. MEDIÇÃO INTERATIVA (DISTÂNCIA E ÁREA)
   ========================================================== */
function initMeasureTools() {
  const panel = document.getElementById('measure-panel');
  const valEl = document.getElementById('measure-value');
  const titleEl = document.getElementById('measure-type-title');

  window.toggleMeasureTool = function(type) {
    if (AppState.measureState.active && AppState.measureState.type === type) {
      resetMeasure();
      return;
    }

    // Se o Street View estiver ativo, desativa para não haver sobreposição
    if (AppState.streetView && AppState.streetView.active && window.toggleStreetViewTool) {
      window.toggleStreetViewTool(false);
    }

    resetMeasure();
    AppState.measureState.active = true;
    AppState.measureState.type = type;
    AppState.measureState._lastClickTime = 0;

    // Bloquear e fechar imediatamente quaisquer popups abertos no mapa
    AppState.map.closePopup();
    AppState.map.eachLayer(l => {
      if (l.closeTooltip) {
        try { l.closeTooltip(); } catch(err) {}
      }
    });

    // Adiciona classe de bloqueio global ao body (bloqueia tooltips, popups e ajusta o cursor)
    document.body.classList.add('measuring-active');

    panel.classList.add('active');
    titleEl.textContent = (type === 'distance') ? 'Medição de Distância' : 'Medição de Área';
    valEl.textContent = (type === 'distance') ? '0,00 m' : '0,00 m²';

    document.querySelectorAll('.tool-btn').forEach(b => {
      if (b.id === 'tool-measure-distance' || b.id === 'tool-measure-area') {
        b.classList.remove('active');
      }
    });
    const activeBtn = document.getElementById(`tool-measure-${type}`);
    if (activeBtn) activeBtn.classList.add('active');

    AppState.map.getContainer().style.cursor = 'crosshair';
  };

  // Função centralizada para registrar pontos de medição sem interferência das camadas
  window.handleMeasureClick = function(latlng) {
    if (!AppState.measureState || !AppState.measureState.active) return;

    const now = Date.now();
    if (AppState.measureState._lastClickTime && (now - AppState.measureState._lastClickTime < 60)) {
      return;
    }
    AppState.measureState._lastClickTime = now;

    AppState.measureState.points.push(latlng);

    const marker = L.circleMarker(latlng, {
      radius: 5,
      color: '#ef4444',
      fillColor: '#ffffff',
      fillOpacity: 1,
      weight: 2,
      interactive: false // Não captura cliques futuros para não bloquear novos vértices
    }).addTo(AppState.map);
    AppState.measureState.markers.push(marker);

    if (AppState.measureState.type === 'distance') {
      if (!AppState.measureState.line) {
        AppState.measureState.line = L.polyline(AppState.measureState.points, { 
          color: '#ef4444', 
          weight: 3,
          interactive: false 
        }).addTo(AppState.map);
      } else {
        AppState.measureState.line.setLatLngs(AppState.measureState.points);
      }

      let totalDist = 0;
      for (let i = 1; i < AppState.measureState.points.length; i++) {
        totalDist += AppState.measureState.points[i - 1].distanceTo(AppState.measureState.points[i]);
      }

      if (totalDist > 1000) {
        valEl.textContent = `${(totalDist / 1000).toFixed(2)} km (${totalDist.toLocaleString('pt-BR', { maximumFractionDigits: 1 })} m)`;
      } else {
        valEl.textContent = `${totalDist.toLocaleString('pt-BR', { maximumFractionDigits: 1 })} m`;
      }
    } else if (AppState.measureState.type === 'area') {
      if (AppState.measureState.points.length >= 3) {
        if (!AppState.measureState.polygon) {
          AppState.measureState.polygon = L.polygon(AppState.measureState.points, {
            color: '#ef4444',
            fillColor: '#ef4444',
            fillOpacity: 0.25,
            weight: 2,
            interactive: false
          }).addTo(AppState.map);
        } else {
          AppState.measureState.polygon.setLatLngs(AppState.measureState.points);
        }

        const areaM2 = calculatePolygonArea(AppState.measureState.points);
        if (areaM2 >= 10000) {
          valEl.textContent = `${(areaM2 / 10000).toFixed(2)} ha (${areaM2.toLocaleString('pt-BR', { maximumFractionDigits: 1 })} m²)`;
        } else {
          valEl.textContent = `${areaM2.toLocaleString('pt-BR', { maximumFractionDigits: 1 })} m²`;
        }
      } else {
        valEl.textContent = `${AppState.measureState.points.length} ponto${AppState.measureState.points.length === 1 ? '' : 's'} (mín. 3)`;
      }
    }
  };

  AppState.map.on('click', (e) => {
    if (AppState.measureState && AppState.measureState.active) {
      window.handleMeasureClick(e.latlng);
    }
  });

  window.resetMeasure = function() {
    AppState.measureState.active = false;
    AppState.measureState.type = null;
    AppState.measureState.points = [];
    AppState.measureState._lastClickTime = 0;

    AppState.measureState.markers.forEach(m => AppState.map.removeLayer(m));
    AppState.measureState.markers = [];

    if (AppState.measureState.line) {
      AppState.map.removeLayer(AppState.measureState.line);
      AppState.measureState.line = null;
    }
    if (AppState.measureState.polygon) {
      AppState.map.removeLayer(AppState.measureState.polygon);
      AppState.measureState.polygon = null;
    }

    // Remove classe de bloqueio global do body
    document.body.classList.remove('measuring-active');

    panel.classList.remove('active');
    document.querySelectorAll('.tool-btn').forEach(b => {
      if (b.id === 'tool-measure-distance' || b.id === 'tool-measure-area') {
        b.classList.remove('active');
      }
    });
    AppState.map.getContainer().style.cursor = '';
  };
}

function calculatePolygonArea(latlngs) {
  if (latlngs.length < 3) return 0;
  const R = 6378137;
  let area = 0;
  for (let i = 0; i < latlngs.length; i++) {
    const j = (i + 1) % latlngs.length;
    const p1 = latlngs[i];
    const p2 = latlngs[j];
    area += (p2.lng - p1.lng) * (Math.PI / 180) * (2 + Math.sin(p1.lat * Math.PI / 180) + Math.sin(p2.lat * Math.PI / 180));
  }
  area = Math.abs(area * R * R / 2);
  return area;
}

/* ==========================================================
   12. RASTREADOR DE COORDENADAS (WGS84 & UTM 23S)
   ========================================================== */
function initCoordinateTracker() {
  const coordLat = document.getElementById('coord-lat');
  const coordLng = document.getElementById('coord-lng');
  const coordUtmX = document.getElementById('coord-utm-x');
  const coordUtmY = document.getElementById('coord-utm-y');
  const zoomLevel = document.getElementById('zoom-level');

  AppState.map.on('mousemove', (e) => {
    const lat = e.latlng.lat;
    const lng = e.latlng.lng;

    coordLat.textContent = lat.toFixed(5);
    coordLng.textContent = lng.toFixed(5);

    const utm = proj4("EPSG:4326", "EPSG:31983", [lng, lat]);
    coordUtmX.textContent = Math.round(utm[0]).toLocaleString('pt-BR');
    coordUtmY.textContent = Math.round(utm[1]).toLocaleString('pt-BR');
  });

  AppState.map.on('zoomend', () => {
    zoomLevel.textContent = `Zoom: ${AppState.map.getZoom()}`;
  });
}

/* ==========================================================
   13. DASHBOARD COM GRÁFICOS INTERATIVOS
   ========================================================== */
function setupCharts() {
  const meta = AppState.metadata;
  if (!meta) return;

  const sortedBairros = [...meta.bairros].sort((a, b) => b.lotes - a.lotes).slice(0, 10);
  const ctxBairros = document.getElementById('chart-bairros').getContext('2d');

  new Chart(ctxBairros, {
    type: 'bar',
    data: {
      labels: sortedBairros.map(b => b.nome),
      datasets: [{
        label: 'Total de Lotes',
        data: sortedBairros.map(b => b.lotes),
        backgroundColor: sortedBairros.map(b => getBairroColor(b.pasta)),
        borderRadius: 4
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false }
      },
      scales: {
        x: { ticks: { font: { size: 10 } } },
        y: { beginAtZero: true }
      }
    }
  });

  const zoneCounts = {};
  AppState.data.lotes.features.forEach(f => {
    const z = f.properties.zoneamento || 'OUTROS';
    zoneCounts[z] = (zoneCounts[z] || 0) + 1;
  });

  const ctxZone = document.getElementById('chart-zoneamento').getContext('2d');
  new Chart(ctxZone, {
    type: 'doughnut',
    data: {
      labels: Object.keys(zoneCounts),
      datasets: [{
        data: Object.values(zoneCounts),
        backgroundColor: ['#3b82f6', '#10b981', '#f59e0b', '#8b5cf6', '#84cc16', '#06b6d4', '#94a3b8']
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          position: 'bottom',
          labels: { boxWidth: 10, font: { size: 9 } }
        }
      }
    }
  });
}

/* ==========================================================
   14. CONTROLES DE INTERFACE & FERRAMENTAS DO MAPA
   ========================================================== */
function initUIControls() {
  const sidebar = document.getElementById('sidebar');
  const toggleBtn = document.getElementById('sidebar-toggle');
  toggleBtn.addEventListener('click', () => {
    sidebar.classList.toggle('collapsed');
    const icon = toggleBtn.querySelector('i');
    if (sidebar.classList.contains('collapsed')) {
      icon.className = 'fa-solid fa-chevron-right';
    } else {
      icon.className = 'fa-solid fa-chevron-left';
    }
    setTimeout(() => AppState.map.invalidateSize(), 300);
  });

  document.querySelectorAll('.tab-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
      document.querySelectorAll('.tab-pane').forEach(p => p.classList.remove('active'));

      btn.classList.add('active');
      const target = btn.getAttribute('data-tab');
      document.getElementById(target).classList.add('active');

      if (sidebar.classList.contains('collapsed')) {
        sidebar.classList.remove('collapsed');
        toggleBtn.querySelector('i').className = 'fa-solid fa-chevron-left';
        setTimeout(() => AppState.map.invalidateSize(), 300);
      }
    });
  });

  initMeasureTools();

  document.getElementById('tool-home').addEventListener('click', () => {
    if (AppState.layers['limite']) {
      AppState.map.fitBounds(AppState.layers['limite'].getBounds(), { padding: [20, 20] });
    } else {
      AppState.map.setView([-20.0737, -44.1693], 14);
    }
  });

  document.getElementById('tool-locate').addEventListener('click', () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(pos => {
        const lat = pos.coords.latitude;
        const lng = pos.coords.longitude;
        AppState.map.setView([lat, lng], 17);
        L.circleMarker([lat, lng], { radius: 7, color: '#3b82f6', fillColor: '#60a5fa', fillOpacity: 0.8 }).addTo(AppState.map).bindPopup("Você está aqui").openPopup();
      }, () => {
        alert("Não foi possível obter sua localização atual.");
      });
    }
  });

  document.getElementById('tool-clear-highlight').addEventListener('click', () => {
    AppState.highlightLayer.clearLayers();
    AppState.map.closePopup();
    if (AppState.measureState && AppState.measureState.active && window.resetMeasure) {
      window.resetMeasure();
    }
  });

  document.getElementById('tool-print').addEventListener('click', () => {
    window.print();
  });

  document.getElementById('btn-header-about').addEventListener('click', () => {
    alert("Geoportal Mário Campos - Cadastro Técnico Imobiliário 2023\nLimite Municipal em destaque Vermelho Oficial.\n33 Bairros mapeados com cores individuais e lotes correspondentes.");
  });
}
