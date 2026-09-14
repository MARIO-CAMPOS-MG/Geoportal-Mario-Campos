import http.server
import socketserver
import webbrowser
import os
import sys

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
