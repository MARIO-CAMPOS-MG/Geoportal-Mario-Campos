import os
import sys
import glob
import time
import datetime
import subprocess
import threading
import shutil

DIRECTORY = os.path.dirname(os.path.abspath(__file__))
SHAPEFILES_DIR = r"C:\Users\RAFAEL PC\Desktop\CADASTRO TECNICO IMOBILIÁRIO - 2023\Mapeamento - Mario Campos"
DATA_DIR = os.path.join(DIRECTORY, "data")
SCRIPT_BUILD = os.path.join(DIRECTORY, "build_geoportal_data.py")
QGIS_BAT = r"C:\Program Files\QGIS 3.36.2\bin\python-qgis.bat"
MINGIT_EXE = r"C:\Users\RAFAEL PC\.gemini\antigravity\scratch\tools\mingit\cmd\git.exe"

def get_git_executable():
    """Retorna o caminho do executavel do Git."""
    if os.path.exists(MINGIT_EXE):
        return MINGIT_EXE
    which_git = shutil.which("git")
    if which_git:
        return which_git
    return "git"

def get_python_executable():
    """Retorna o executavel Python com bibliotecas GDAL/OGR (QGIS se disponivel)."""
    if os.path.exists(QGIS_BAT):
        return QGIS_BAT
    return sys.executable

def rebuild_geoportal_data():
    """Executa o script build_geoportal_data.py para extrair dados dos shapefiles."""
    py_exe = get_python_executable()
    print(f"\n[SYNC] Iniciando reprocessamento com: {py_exe}")
    cmd = [py_exe, SCRIPT_BUILD]
    
    start_time = time.time()
    result = subprocess.run(
        cmd,
        cwd=DIRECTORY,
        stdout=subprocess.PIPE,
        stderr=subprocess.PIPE,
        text=True,
        encoding='utf-8',
        errors='replace'
    )
    elapsed = time.time() - start_time
    
    if result.returncode == 0:
        print(f"[SYNC] Reprocessamento concluido em {elapsed:.1f}s com sucesso!")
        return True, result.stdout
    else:
        print(f"[SYNC] Erro no reprocessamento: {result.stderr}")
        return False, result.stderr

def check_data_changes():
    """Verifica se ha alteracoes nao comitadas na pasta data/."""
    git_exe = get_git_executable()
    res = subprocess.run(
        [git_exe, "status", "--porcelain", "data/"],
        cwd=DIRECTORY,
        stdout=subprocess.PIPE,
        stderr=subprocess.PIPE,
        text=True,
        encoding='utf-8',
        errors='replace'
    )
    output = res.stdout.strip() if res.stdout else ""
    return len(output) > 0, output

def push_to_online(commit_message=None):
    """Realiza commit e push das alteracoes para os repositorios remotos (main e gh-pages)."""
    git_exe = get_git_executable()
    has_changes, changes_list = check_data_changes()
    
    if not has_changes:
        print("[SYNC] Nenhuma alteracao detectada nos arquivos data/. A base online ja esta em dia.")
        return {
            "success": True,
            "changed": False,
            "message": "Nenhuma alteracao detectada nos dados. O Geoportal Online ja esta com a versao mais recente."
        }
    
    now_str = datetime.datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    if not commit_message:
        commit_message = f"update(data): sincronizacao automatica de shapefiles para o geoportal online [{now_str}]"
    
    print(f"\n[SYNC] Alteracoes detectadas em data/:\n{changes_list}")
    print("[SYNC] Adicionando arquivos e criando commit...")
    
    # git add data/
    subprocess.run([git_exe, "add", "data/"], cwd=DIRECTORY, check=True)
    
    # git commit
    res_commit = subprocess.run(
        [git_exe, "commit", "-m", commit_message],
        cwd=DIRECTORY,
        stdout=subprocess.PIPE,
        stderr=subprocess.PIPE,
        text=True,
        encoding='utf-8',
        errors='replace'
    )
    print(f"[SYNC] Commit realizado: {res_commit.stdout.strip()[:200]}")
    
    remotes = ["mario-campos", "origin"]
    push_results = {}
    
    for remote in remotes:
        success = False
        last_details = ""
        for attempt in range(1, 3):
            print(f"[SYNC] Enviando para '{remote}' (tentativa {attempt}/2)...")
            res_main = subprocess.run(
                [git_exe, "push", remote, "main"],
                cwd=DIRECTORY,
                stdout=subprocess.PIPE,
                stderr=subprocess.PIPE,
                text=True,
                encoding='utf-8',
                errors='replace'
            )
            time.sleep(1.0)
            res_pages = subprocess.run(
                [git_exe, "push", remote, "main:gh-pages"],
                cwd=DIRECTORY,
                stdout=subprocess.PIPE,
                stderr=subprocess.PIPE,
                text=True,
                encoding='utf-8',
                errors='replace'
            )
            
            if res_main.returncode == 0 and res_pages.returncode == 0:
                success = True
                last_details = "OK"
                break
            else:
                last_details = (res_pages.stderr or res_main.stderr or res_pages.stdout or res_main.stdout)[:300]
                time.sleep(1.5)
        
        push_results[remote] = {
            "success": success,
            "details": last_details
        }
        if success:
            print(f"[SYNC] [OK] Sucesso no envio para '{remote}'!")
        else:
            print(f"[SYNC] [AVISO] Falha ou aviso no envio para '{remote}': {last_details}")
    
    all_success = any(r["success"] for r in push_results.values())
    return {
        "success": all_success,
        "changed": True,
        "push_results": push_results,
        "message": "Base cartografica e cadastral atualizada e publicada no Geoportal Online com sucesso!" if all_success else "Dados atualizados localmente, mas houve aviso no envio online."
    }

def sync_full_pipeline(commit_message=None):
    """Executa o pipeline completo: Rebuild -> Commit -> Push Online."""
    ok, out = rebuild_geoportal_data()
    if not ok:
        return {
            "success": False,
            "error": "Falha no reprocessamento dos shapefiles.",
            "details": out[-500:]
        }
    
    push_status = push_to_online(commit_message)
    return push_status

def get_latest_shapefile_mtime():
    """Retorna o timestamp da modificacao mais recente entre todos os shapefiles da pasta de mapeamento."""
    if not os.path.exists(SHAPEFILES_DIR):
        return 0
    shps = glob.glob(os.path.join(SHAPEFILES_DIR, "**", "*.shp"), recursive=True)
    if not shps:
        return 0
    return max(os.path.getmtime(s) for s in shps)

class ShapefileWatcher(threading.Thread):
    """Thread em segundo plano que monitora a pasta de shapefiles para detectar alteracoes e sincronizar online."""
    def __init__(self, check_interval=15):
        super().__init__(daemon=True)
        self.check_interval = check_interval
        self.last_mtime = get_latest_shapefile_mtime()
        self.is_running = True
        self.is_syncing = False

    def run(self):
        print(f"[WATCHER] Observador automatico de Shapefiles ativado (intervalo: {self.check_interval}s).")
        print(f"[WATCHER] Monitorando pasta de Shapefiles: {SHAPEFILES_DIR}")
        while self.is_running:
            time.sleep(self.check_interval)
            try:
                current_mtime = get_latest_shapefile_mtime()
                if current_mtime > self.last_mtime:
                    # Espera 3 segundos para garantir que o salvamento no QGIS/ArcGIS terminou
                    time.sleep(3)
                    self.last_mtime = get_latest_shapefile_mtime()
                    now_time = datetime.datetime.now().strftime('%H:%M:%S')
                    print("\n" + "="*65)
                    print(f"[AUTO-SYNC] Alteracao detectada em shapefile as {now_time}!")
                    print("[AUTO-SYNC] Reprocessando dados e sincronizando com o Geoportal Online...")
                    print("="*65)
                    
                    self.is_syncing = True
                    res = sync_full_pipeline(f"auto-sync: shapefile atualizado localmente [{datetime.datetime.now().strftime('%Y-%m-%d %H:%M:%S')}]")
                    self.is_syncing = False
                    
                    if res.get("success"):
                        print("[AUTO-SYNC] [SUCESSO] Geoportal Online atualizado automaticamente!")
                    else:
                        print(f"[AUTO-SYNC] [AVISO] {res.get('message')}")
            except Exception as e:
                print(f"[WATCHER] Erro no monitoramento: {e}")

_watcher_instance = None

def start_auto_watcher(interval_seconds=15):
    """Inicia o observador automatico se ainda nao estiver ativo."""
    global _watcher_instance
    if _watcher_instance is None or not _watcher_instance.is_alive():
        _watcher_instance = ShapefileWatcher(check_interval=interval_seconds)
        _watcher_instance.start()
    return _watcher_instance

if __name__ == '__main__':
    print("Executando sincronizacao manual de teste...")
    res = sync_full_pipeline()
    print("Resultado:", res)
