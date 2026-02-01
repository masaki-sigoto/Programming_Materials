# WordPress自動デプロイ - セットアップガイド

## 🎯 概要

このリポジトリは、ローカルで作成した記事やサイトを自動的にWordPressに投稿・更新する仕組みを持っています。

**Git push だけで WordPress に自動反映！**

---

## 📋 準備するもの

1. WordPress管理者アカウント
2. GitHubアカウント
3. WordPressサイトURL

---

## 🚀 初期セットアップ

### ステップ1: WordPress Application Password を取得

1. **WordPressにログイン**
2. **ユーザー → プロフィール** に移動
3. **「Application Passwords」** セクションを探す
4. **新しいアプリケーション名**: `GitHub Actions` と入力
5. **「新しいアプリケーションパスワードを追加」** をクリック
6. **表示されたパスワードをコピー**（1回のみ表示されます）

> ⚠️ パスワードは必ず安全な場所に保存してください

---

### ステップ2: GitHub Secrets を設定

1. **GitHubリポジトリにアクセス**
   - https://github.com/masaki-sigoto/Programming_Materials

2. **Settings → Secrets and variables → Actions** に移動

3. **以下の3つのSecretを追加:**

   **WP_URL**
   ```
   https://your-wordpress-site.com
   ```
   ※最後の `/` は不要

   **WP_USERNAME**
   ```
   your-wordpress-username
   ```

   **WP_PASSWORD**
   ```
   xxxx xxxx xxxx xxxx xxxx xxxx
   ```
   ※ステップ1で取得したApplication Password

---

### ステップ3: REST API の確認

WordPressのREST APIが有効か確認します：

```bash
curl https://your-wordpress-site.com/wp-json/wp/v2
```

正常に動作していれば、JSONデータが返ってきます。

---

## 📝 使い方

### 記事を投稿する

1. **`articles/` フォルダに Markdown ファイルを作成**

   ```bash
   # 例: articles/my-first-post.md
   ```

2. **Markdown で記事を書く**

   ```markdown
   # 記事のタイトル

   ## 見出し2

   本文をここに書きます。

   **太字**や*イタリック*も使えます。
   ```

3. **Gitにコミット・プッシュ**

   ```bash
   git add articles/my-first-post.md
   git commit -m "新しい記事を追加"
   git push second main
   ```

4. **自動的にWordPressに投稿されます！**
   - WordPress管理画面 → 投稿 で確認
   - 下書きとして保存されます

---

### HTMLページを作成する

1. **`pages/` フォルダにHTMLファイルを作成**

   ```bash
   mkdir -p pages/my-page
   # 例: pages/my-page/index.html
   ```

2. **HTMLを編集**

   ```html
   <!DOCTYPE html>
   <html>
   <head>
       <title>マイページ</title>
   </head>
   <body>
       <h1>マイページ</h1>
       <p>コンテンツ</p>
   </body>
   </html>
   ```

3. **Gitにコミット・プッシュ**

   ```bash
   git add pages/my-page/
   git commit -m "新しいページを追加"
   git push second main
   ```

4. **自動的にWordPressの固定ページに反映されます！**

---

## 🔍 デプロイ状況の確認

### GitHub Actionsで確認

1. **GitHubリポジトリ → Actions タブ**
2. **最新のワークフロー実行をクリック**
3. **「Deploy to WordPress」ジョブを確認**

成功すれば ✅、失敗すれば ❌ が表示されます。

### WordPressで確認

1. **WordPress管理画面にログイン**
2. **投稿 または 固定ページ に移動**
3. **下書き一覧を確認**

---

## 🛠️ トラブルシューティング

### エラー: Application Password が無効

**原因**: パスワードが間違っているか、期限切れ

**解決策**:
1. 新しいApplication Passwordを作成
2. GitHub Secretsを更新

### エラー: REST API にアクセスできない

**原因**:
- WordPressのREST APIが無効化されている
- セキュリティプラグインがブロックしている

**解決策**:
1. セキュリティプラグインの設定を確認
2. REST APIを有効化

### 投稿が作成されない

**原因**: ファイルパスが正しくない

**解決策**:
- `articles/` 配下に `.md` ファイルを配置
- `pages/` 配下に `.html` ファイルを配置

---

## 📁 ディレクトリ構造

```
Programming_Materials/
├── .github/
│   └── workflows/
│       └── deploy-to-wordpress.yml   # 自動デプロイ設定
├── scripts/
│   └── deploy-to-wordpress.js        # デプロイスクリプト
├── articles/                         # 記事フォルダ
│   ├── example-post.md              # サンプル記事
│   └── (ここに.mdファイルを追加)
├── pages/                            # ページフォルダ
│   └── (ここにHTMLページを追加)
├── images/                           # 画像フォルダ
├── index.html                        # GitHub Pages用
└── package.json                      # Node.js設定
```

---

## ⚙️ 高度な設定

### デプロイ対象のカスタマイズ

`.github/workflows/deploy-to-wordpress.yml` の `paths:` を編集：

```yaml
paths:
  - 'articles/**'    # 記事フォルダ
  - 'pages/**'       # ページフォルダ
  - 'images/**'      # 画像フォルダ
```

### 公開ステータスの変更

`scripts/deploy-to-wordpress.js` の `status:` を編集：

```javascript
status: 'publish'  // 'draft' から 'publish' に変更で自動公開
```

---

## 🎉 完成！

これで、ローカルで記事を書いて `git push` するだけで、自動的にWordPressに投稿されます。

**開発フロー:**
```
ローカル編集 → git commit → git push → 自動デプロイ → WordPress反映
```

**所要時間**: プッシュから約30秒〜1分

---

## 📞 サポート

問題が発生した場合:
1. GitHub Actionsのログを確認
2. WordPress REST APIの動作確認
3. GitHub Secretsの設定を再確認
