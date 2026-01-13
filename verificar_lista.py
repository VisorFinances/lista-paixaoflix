import requests

def verificar_link(url):
    try:
        # Tenta conectar ao link por 5 segundos
        response = requests.head(url, timeout=5, allow_redirects=True)
        return response.status_code == 200
    except:
        return False

def processar_lista():
    arquivo_entrada = "canais.m3u" # Nome do seu arquivo original
    arquivo_saida = "lista_ativa.m3u"
    
    with open(arquivo_entrada, 'r', encoding='utf-8') as f:
        linhas = f.readlines()

    nova_lista = ["#EXTM3U\n"]
    print("Iniciando varredura de canais...")

    for i in range(len(linhas)):
        if linhas[i].startswith("#EXTINF"):
            info = linhas[i]
            link = linhas[i+1].strip()
            
            # Se for link do Pluto ou EBC (geralmente estáveis), mantemos
            if "pluto" in link or "ebc.com.br" in link:
                nova_lista.append(info)
                nova_lista.append(link + "\n")
            # Para os outros, verificamos se o link responde
            elif verificar_link(link):
                nova_lista.append(info)
                nova_lista.append(link + "\n")
                print(f"✅ Ativo: {info.split(',')[-1].strip()}")
            else:
                print(f"❌ Off-line: {info.split(',')[-1].strip()}")

    with open(arquivo_saida, 'w', encoding='utf-8') as f:
        f.writelines(nova_lista)

if __name__ == "__main__":
    processar_lista()
