import requests
import os

# Configuração dos caminhos (Ambos dentro da pasta data)
arquivos_config = [
    {"entrada": "data/canais.m3u", "saida": "data/ativa_canais.m3u"},
    {"entrada": "data/kids_canais.m3u", "saida": "data/ativa_kids_canais.m3u"}
]

def verificar_link(url):
    try:
        # Testa o link. Se demorar mais de 5s, considera fora do ar.
        response = requests.head(url, timeout=5, allow_redirects=True)
        return response.status_code == 200
    except:
        return False

def processar_listas():
    for item in arquivos_config:
        arquivo_entrada = item["entrada"]
        arquivo_saida = item["saida"]
        
        if not os.path.exists(arquivo_entrada):
            print(f"⚠️ Arquivo não encontrado: {arquivo_entrada}")
            continue

        with open(arquivo_entrada, 'r', encoding='utf-8') as f:
            linhas = f.readlines()

        nova_lista = ["#EXTM3U\n"]
        print(f"\n--- Analisando: {arquivo_entrada} ---")

        for i in range(len(linhas)):
            if linhas[i].startswith("#EXTINF"):
                info = linhas[i]
                try:
                    link = linhas[i+1].strip()
                    if link.startswith("http"):
                        # Links de plataformas conhecidas que não precisam de teste constante
                        if any(x in link.lower() for x in ["pluto.tv", "ebc.com.br", "jmvstream", "nxplay"]):
                            nova_lista.append(info)
                            nova_lista.append(link + "\n")
                        # Verifica os outros links (IPTV privada)
                        elif verificar_link(link):
                            nova_lista.append(info)
                            nova_lista.append(link + "\n")
                            print(f"✅ ON : {info.split(',')[-1].strip()}")
                        else:
                            print(f"❌ OFF: {info.split(',')[-1].strip()}")
                except IndexError:
                    continue

        with open(arquivo_saida, 'w', encoding='utf-8') as f:
            f.writelines(nova_lista)
        print(f"✔️ Concluído! Arquivo gerado: {arquivo_saida}")

if __name__ == "__main__":
    processar_listas()
