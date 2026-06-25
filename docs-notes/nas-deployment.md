# NAS配信手順（UGREEN DXP2800）

## 前提
- base設定は変更不要（wiki: `/`、計算機: `/` がデフォルト）
- Docker + Nginx で配信

---

## 手順

### 1. ビルド（PC側）

```bash
bun run build
# docs/ に静的ファイルが出力される
```

### 2. NASにファイルを転送

`docs/` の中身をNASの共有フォルダにコピーする。

例: `/volume1/web/anno-wiki/`

転送方法: SFTPまたはUGOSファイルマネージャー

### 3. nginx.conf を作成

NASの適当な場所（例: `/volume1/web/nginx.conf`）に以下を作成：

```nginx
server {
    listen 80;
    root /usr/share/nginx/html;
    index index.html;

    # VitePress wiki
    location / {
        try_files $uri $uri/ $uri.html /index.html;
    }

    # Calculator SPA
    location /calculator/ {
        try_files $uri $uri/ /calculator/index.html;
    }
}
```

### 4. Docker Compose で Nginx 起動

UGOSのDockerアプリ（またはPortainer）で以下のcompose定義を作成して起動：

```yaml
services:
  nginx:
    image: nginx:alpine
    ports:
      - "8080:80"
    volumes:
      - /volume1/web/anno-wiki:/usr/share/nginx/html:ro
      - /volume1/web/nginx.conf:/etc/nginx/conf.d/default.conf:ro
    restart: unless-stopped
```

---

## アクセス

```
http://NASのIPアドレス:8080/
```

---

## 更新時

```bash
bun run build
# docs/ をNASの /volume1/web/anno-wiki/ に上書きコピー
```

Nginxの再起動は不要（ファイルを上書きするだけでOK）。
