import requests
import os

def testar_link(url):
    # Domínios que NÃO devem ser testados (Whitelist) para evitar que sumam da lista
    # Adicionei os servidores de IPTV que bloqueiam testes do GitHub e seu proxy
    ignorar_teste = [
        "pluto.tv", "jmvstream", "ebc.com.br", "workers.dev", 
        "samsung.wurl.tv", "amagi.tv", "ads.ottera.tv", 
        "streamlock.net", "sibfungold.org", "vipketseyket.top", 
        "zapping.life", "45.235"
    ]
    
    if any(x in url.lower() for x in ignorar_teste):
        return True
        
    try:
        # Teste leve apenas para outros links desconhecidos
        with requests.get(url, timeout=5, stream=True, allow_redirects=True) as r:
            return r.status_code < 400
    except:
        return False

def corrigir_link_e_nome(info, link):
    # 1. Limpa o link: Se o link de IPTV estiver dentro do seu proxy, nós o extraímos
    # Isso resolve o erro de "Navegador não suporta"
    if "paixaoflixtv.paixaoflix-vip.workers.dev/?url=" in link:
        link = link.split("?url=")[-1]

    # 2. Formata o nome para garantir o sufixo PaixãoFlix
    if "PaixãoFlix" not in info:
        partes = info.rsplit(',', 1)
        if len(partes) > 1:
            nome_canal = partes[1].strip()
            info = f"{partes[0]},{nome_canal} PaixãoFlix\n"
        else:
            info = info.strip() + " PaixãoFlix\n"
            
    return info, link

def iniciar():
    if not os.path.exists("data"):
        os.makedirs("data")

    # Mapeamento de arquivos (Entrada -> Saída)
    listas = [
        ("data/canais.m3u", "data/ativa_canais.m3u"),
        ("data/kids_canais.m3u", "data/ativa_kids_canais.m3u")
    ]

    for arquivo_in, arquivo_out in listas:
        if not os.path.exists(arquivo_in):
            print(f"Aviso: {arquivo_in} não encontrado.")
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
                        # Primeiro corrigimos o link (removemos o proxy se houver)
                        info_ok, link_ok = corrigir_link_e_nome(info, link)
                        
                        # Depois testamos se o link está ativo
                        if testar_link(link_ok):
                            resultado.append(info_ok)
                            resultado.append(link_ok + "\n")
                except:
                    continue

        with open(arquivo_out, 'w', encoding='utf-8') as f:
            f.writelines(resultado)
        print(f"Finalizado: {arquivo_out} - Canais salvos: {len(resultado)//2}")

if __name__ == "__main__":
    iniciar()
