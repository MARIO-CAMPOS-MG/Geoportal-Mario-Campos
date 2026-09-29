import http.server
import socketserver
import webbrowser
import os
import sys
import json
import subprocess

PORT = 8080
DIRECTORY = os.path.dirname(os.path.abspath(__file__))

class Handler(http.server.SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=DIRECTORY, **kwargs)

    def end_headers(self):
        # Habilitar CORS e desativar cache durante desenvolvimento
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Cache-Control', 'no-store, no-cache, must-revalidate')
        super().end_headers()

    def do_POST(self):
        if self.path == '/api/sync-shapefiles':
            try:
                script_path = os.path.join(DIRECTORY, "build_geoportal_data.py")
                if not os.path.exists(script_path):
                    self.send_response(404)
                    self.send_header('Content-Type', 'application/json; charset=utf-8')
                    self.end_headers()
                    self.wfile.write(json.dumps({"success": False, "error": "Script build_geoportal_data.py não encontrado."}, ensure_ascii=False).encode('utf-8'))
                    return

                # Define o interpretador Python (usa python-qgis.bat se disponível, ou sys.executable)
                qgis_bat = r"C:\Program Files\QGIS 3.36.2\bin\python-qgis.bat"
                if os.path.exists(qgis_bat):
                    cmd = [qgis_bat, script_path]
                else:
                    cmd = [sys.executable, script_path]

                print("\n[SYNC] Reprocessando shapefiles cadastrais a pedido do usuário...")
                result = subprocess.run(
                    cmd,
                    cwd=DIRECTORY,
                    stdout=subprocess.PIPE,
                    stderr=subprocess.PIPE,
                    text=True,
                    encoding='utf-8',
                    errors='replace'
                )

                if result.returncode == 0:
                    print("[SYNC] Shapefiles reprocessados com sucesso!")
                    self.send_response(200)
                    self.send_header('Content-Type', 'application/json; charset=utf-8')
                    self.end_headers()
                    resp = {
                        "success": True,
                        "message": "Base cartográfica e cadastral atualizada com sucesso a partir dos Shapefiles originais!",
                        "details": result.stdout[-600:] if result.stdout else ""
                    }
                    self.wfile.write(json.dumps(resp, ensure_ascii=False).encode('utf-8'))
                else:
                    print(f"[SYNC] Erro ao reprocessar: {result.stderr}")
                    self.send_response(500)
                    self.send_header('Content-Type', 'application/json; charset=utf-8')
                    self.end_headers()
                    resp = {
                        "success": False,
                        "error": "Falha na execução do processamento de shapefiles.",
                        "details": result.stderr[-600:] if result.stderr else result.stdout[-600:]
                    }
                    self.wfile.write(json.dumps(resp, ensure_ascii=False).encode('utf-8'))
            except Exception as e:
                print(f"[SYNC] Exceção durante reprocessamento: {e}")
                self.send_response(500)
                self.send_header('Content-Type', 'application/json; charset=utf-8')
                self.end_headers()
                self.wfile.write(json.dumps({"success": False, "error": str(e)}, ensure_ascii=False).encode('utf-8'))
        else:
            self.send_response(404)
            self.end_headers()

def run_server():
    os.chdir(DIRECTORY)
    port = PORT
    server = None
    for p in range(PORT, PORT + 20):
        try:
            server = socketserver.TCPServer(("", p), Handler)
            port = p
            break
        except OSError:
            continue

    if not server:
        print("Erro: Nenhuma porta disponível encontrada.")
        sys.exit(1)

    url = f"http://localhost:{port}"
    print("=" * 65)
    print("  GEOPORTAL MÁRIO CAMPOS - CADASTRO TÉCNICO IMOBILIÁRIO 2023")
    print("=" * 65)
    print(f"\n>> Servidor WebGIS iniciado com sucesso!")
    print(f">> Acessando: {url}")
    print("\n>> Abrindo navegador padrão...")
    print(">> Pressione Ctrl+C para encerrar o servidor.\n")
    print("=" * 65)

    webbrowser.open(url)

    try:
        server.serve_forever()
    except KeyboardInterrupt:
        print("\nServidor finalizado pelo usuário.")
        server.server_close()

if __name__ == '__main__':
    run_server()
