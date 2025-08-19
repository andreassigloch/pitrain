# MultiServer NGINX Config Update

## Die funktionierende NGINX-Config für PitchTrainer

Die Datei `MultiServer-nginx-config/20-pitrain.conf` muss nach:
`~/MultiServer/nginx/sites-enabled/20-pitrain.conf`

## Auf dem Server:

```bash
# 1. MultiServer Repository updaten
cd ~/MultiServer
cp ~/pitrain/MultiServer-nginx-config/20-pitrain.conf nginx/sites-enabled/20-pitrain.conf
git add nginx/sites-enabled/20-pitrain.conf
git commit -m "Fix PitchTrainer NGINX config - remove broken upstream variable"
git push

# 2. NGINX neu laden
docker exec multiserver_nginx nginx -s reload

# 3. PitchTrainer deployen
cd ~/pitrain
git pull
bash deploy-multiserver.sh
```

## Was wurde gefixt:

- ❌ ENTFERNT: `set $upstream_pitrain pitrain:3000;` (Variable war nie definiert)
- ❌ ENTFERNT: `proxy_pass http://$upstream_pitrain;` (verwendete undefinierte Variable)
- ✅ NEU: `proxy_pass http://pitrain:3000;` (direkte Proxy-Verbindung)

Das war die Ursache für den HTTP 500 Fehler!