import requests
import os

def testar_link(url):
    # Canais estáveis que não precisam de teste (evita erros)
    if any(x in url.lower() for x in ["pluto.tv", "jmvstream", "ebc.com.br"]):
        return True
    try:
        r = requests.head(url, timeout=3, allow_redirects=True)
        return r.status_code == 200
    except:
        return False

def iniciar():
    listas = [
        ("data/canais.m3u", "data/ativa_canais.m3u"),
        ("data/kids_canais.m3u", "data/ativa_kids_canais.m3u")
    ]

    for arquivo_in, arquivo_out in listas:
        if not os.path.exists(arquivo_in):
            print(f"Arquivo não encontrado: {arquivo_in}")
            continue

        with open(arquivo_in, 'r', encoding='utf-8', errors='ignore') as f:
            linhas = f.readlines()

        resultado = ["#EXTM3U\n"]
        for i in range(len(linhas)):
            if "#EXTINF" in linhas[i]:
                info = linhas[i]
                try:
                    link = linhas[i+1].strip()
                    if link.startswith("http"):
                        # Se o link estiver ON, adiciona
                        if testar_link(link):
                            resultado.append(info)
                            resultado.append(link + "\n")
                except:
                    continue

        with open(arquivo_out, 'w', encoding='utf-8') as f:
            f.writelines(resultado)
        print(f"Finalizado: {arquivo_out}")

if __name__ == "__main__":
    iniciar()
