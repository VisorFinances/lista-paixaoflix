import requests
import os

def testar_link(url):
    # Domínios oficiais/estáveis que bloqueiam testes automatizados mas funcionam no player
    estaveis = [
        "pluto.tv", "jmvstream", "ebc.com.br", 
        "workers.dev", "samsung.wurl.tv", "amagi.tv",
        "ads.ottera.tv", "streamlock.net"
    ]
    
    if any(x in url.lower() for x in estaveis):
        return True
        
    try:
        # Usamos GET com stream=True e timeout curto para ser mais eficiente que o HEAD
        with requests.get(url, timeout=5, stream=True, allow_redirects=True) as r:
            return r.status_code < 400
    except:
        return False

def formatar_nome(info):
    # Garante que o sufixo PaixãoFlix esteja no nome do canal sem duplicar
    if "PaixãoFlix" not in info:
        # Divide pela vírgula (padrão M3U: #EXTINF:...,Nome do Canal)
        partes = info.rsplit(',', 1)
        if len(partes) > 1:
            nome_canal = partes[1].strip()
            return f"{partes[0]},{nome_canal} PaixãoFlix\n"
    return info

def iniciar():
    # Cria a pasta data caso ela não exista
    if not os.path.exists("data"):
        os.makedirs("data")

    listas = [
        ("data/canais.m3u", "data/ativa_canais.m3u"),
        ("data/kids_canais.m3u", "data/ativa_kids_canais.m3u")
    ]

    for arquivo_in, arquivo_out in listas:
        if not os.path.exists(arquivo_in):
            print(f"Arquivo de entrada não encontrado: {arquivo_in}")
            continue

        print(f"Processando: {arquivo_in}...")
        
        with open(arquivo_in, 'r', encoding='utf-8', errors='ignore') as f:
            linhas = f.readlines()

        resultado = ["#EXTM3U\n"]
        for i in range(len(linhas)):
            if "#EXTINF" in linhas[i]:
                info = linhas[i]
                try:
                    link = linhas[i+1].strip()
                    if link.startswith("http"):
                        # Só adiciona se o link passar no teste
                        if testar_link(link):
                            info_formatada = formatar_nome(info)
                            resultado.append(info_formatada)
                            resultado.append(link + "\n")
                except Exception as e:
                    continue

        with open(arquivo_out, 'w', encoding='utf-8') as f:
            f.writelines(resultado)
        print(f"Sucesso! Gerado: {arquivo_out} com {len(resultado)//2} canais ativos.")

if __name__ == "__main__":
    iniciar()
