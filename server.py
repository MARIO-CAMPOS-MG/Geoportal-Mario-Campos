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
                import sync_manager
                print("\n[SYNC] Solicitação de sincronização recebida pela interface do Geoportal...")
                res = sync_manager.sync_full_pipeline("update(shapefiles): sincronizacao manual via interface do Geoportal")
                
                if res.get("success"):
                    self.send_response(200)
                    self.send_header('Content-Type', 'application/json; charset=utf-8')
                    self.end_headers()
                    resp = {
                        "success": True,
                        "message": res.get("message", "Base cartográfica e cadastral atualizada localmente e publicada no Geoportal Online!"),
                        "changed": res.get("changed", True),
                        "details": res.get("push_results", {})
                    }
                    self.wfile.write(json.dumps(resp, ensure_ascii=False).encode('utf-8'))
                else:
                    self.send_response(500)
                    self.send_header('Content-Type', 'application/json; charset=utf-8')
                    self.end_headers()
                    resp = {
                        "success": False,
                        "error": res.get("error", "Falha durante o processamento ou envio online."),
                        "details": res.get("details", "")
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
    # Inicia observador automático de shapefiles em segundo plano
    try:
        import sync_manager
        sync_manager.start_auto_watcher(interval_seconds=15)
        print(">> [AUTO-SYNC] Observador ativo: alterações em shapefiles serão sincronizadas automaticamente com o Geoportal Online.")
    except Exception as e:
        print(f">> [AVISO] Observador automático não pôde ser iniciado: {e}")

    try:
        server.serve_forever()
    except KeyboardInterrupt:
        print("\nServidor finalizado pelo usuário.")
        server.server_close()

if __name__ == '__main__':
    run_server()
