# antigravity-review-loop アップストリーム連携設定ガイド

本ドキュメントは、**`antigravity-review-loop`**（https://github.com/yuki-yamagishi/antigravity-review-loop）でコード修正や PR マージが行われた際に、**`MyHomeStock`**（https://github.com/yuki-yamagishi/my-home-stock）側へ自動で更新通知を送信し、Submodule 自動更新 Pull Request を起票させるためのセットアップ手順書です。

---

## 1. 概要

`antigravity-review-loop` 側の `main` ブランチにプッシュがあった際、GitHub Actions から MyHomeStock の `repository_dispatch` API を呼び出します。
MyHomeStock 側のワークフロー（`.github/workflows/update-review-loop-submodule.yml`）が起動し、自動で Submodule を最新化して PR を作成します。

---

## 2. antigravity-review-loop 側へのワークフロー導入

`antigravity-review-loop` リポジトリの `.github/workflows/notify-downstream.yml` として以下のワークフローを作成・コミットしてください：

```yaml
name: Notify Downstream Repositories

on:
  push:
    branches:
      - main
      - master

jobs:
  notify-myhomestock:
    name: Trigger MyHomeStock Submodule Update
    runs-on: ubuntu-latest
    steps:
      - name: Send repository_dispatch event to MyHomeStock
        uses: peter-evans/repository-dispatch@v3
        with:
          token: ${{ secrets.MYHOMESTOCK_DISPATCH_PAT }}
          repository: yuki-yamagishi/my-home-stock
          event-type: update-review-loop
          client-payload: '{"ref": "${{ github.ref }}", "sha": "${{ github.sha }}", "actor": "${{ github.actor }}"}'
```

---

## 3. Personal Access Token (PAT) の発行と Secrets 登録

`antigravity-review-loop` から `MyHomeStock` の GitHub Actions を発火させるには、適切な権限を持つ PAT が必要です。

### 3.1. Fine-grained Personal Access Token の発行（推奨）
1. GitHub の **Settings** -> **Developer Settings** -> **Personal access tokens** -> **Fine-grained tokens** を開く。
2. 「**Generate new token**」をクリック。
3. 設定項目：
   - **Token name**: `review-loop-dispatch-token`
   - **Expiration**: 90 days または 1 year（運用ポリシーに合わせて設定）
   - **Repository access**: **Only select repositories** -> `yuki-yamagishi/my-home-stock` を選択
   - **Permissions**:
     - **Actions**: `Read and write`（Actions のワークフロー発火権限）
     - **Metadata**: `Read-only`（自動付与）
4. 「**Generate token**」をクリックし、生成されたトークン文字列をコピー。

※ または、Classic PAT を利用する場合は `repo` スコープを付与したトークンを発行してください。

### 3.2. antigravity-review-loop リポジトリへの Secret 登録
1. `https://github.com/yuki-yamagishi/antigravity-review-loop/settings/secrets/actions` を開く。
2. 「**New repository secret**」をクリック。
3. 設定項目：
   - **Name**: `MYHOMESTOCK_DISPATCH_PAT`
   - **Secret**: コピーした PAT 文字列を貼り付け
4. 「**Add secret**」をクリックして保存。

---

## 4. MyHomeStock 側のリポジトリ設定確認

MyHomeStock 側で GitHub Actions が自動で Pull Request を作成・管理できるようにするため、以下の設定を確認してください：

1. `https://github.com/yuki-yamagishi/my-home-stock/settings/actions` を開く。
2. 「**Workflow permissions**」セクション：
   - 「**Read and write permissions**」が選択されていること。
   - 「**Allow GitHub Actions to create and approve pull requests**」にチェックが入っていること。
3. 保存（Save）をクリック。

---

## 5. 動作確認

1. `antigravity-review-loop` 側でダミーコミットまたは PR マージを行い、`main` ブランチに push します。
2. `antigravity-review-loop` の **Actions** タブで `Notify Downstream Repositories` が成功することを確認します。
3. `MyHomeStock` の **Actions** タブで `Update antigravity-review-loop Submodule` が自動起動することを確認します。
4. `MyHomeStock` の **Pull requests** 一覧に、`chore(deps): update antigravity-review-loop submodule to <sha>` というタイトルの PR が自動起票されることを確認します。
