import requests
import os

# Configuração exata dos seus caminhos
arquivos_config = [
    {"entrada": "data/canais.m3u", "saida": "data/ativa_canais.m3u"},
    {"entrada": "data/kids_canais.m3u", "saida": "data/ativa_kids_canais.m3u"}
]

def verificar_link(url):
    # Forçar links estáveis a passarem sempre
    estaveis = ["pluto.tv", "ebc.com.br", "jmvstream", "nxplay", "cloudecast", "logicahost"]
    if any(x in url.lower() for x in estaveis):
        return True
    try:
        # Timeout curto para não travar o robô
        response = requests.head(url, timeout=3, allow_redirects=True)
        return response.status_code == 200
    except:
        return False

def processar():
    for item in arquivos_config:
        ent = item["entrada"]
        sai = item["saida"]
        
        if not os.path.exists(ent):
            print(f"PULANDO: {ent} não existe.")
            continue

        print(f"PROCESSANDO: {ent}")
        with open(ent, 'r', encoding='utf-8') as f:
            linhas = f.readlines()

        nova_lista = ["#EXTM3U\n"]
        for i in range(len(linhas)):
            if linhas[i].startswith("#EXTINF"):
                info = linhas[i]
                try:
                    link = linhas[i+1].strip()
                    if verificar_link(link):
                        nova_lista.append(info)
                        nova_lista.append(link + "\n")
                except:
                    continue

        # Cria a pasta data se ela não existir por algum motivo
        os.makedirs(os.path.dirname(sai), exist_ok=True)
        
        with open(sai, 'w', encoding='utf-8') as f:
            f.writelines(nova_lista)
        print(f"SUCESSO: {sai} criado com {len(nova_lista)//2} canais.")

if __name__ == "__main__":
    processar()
