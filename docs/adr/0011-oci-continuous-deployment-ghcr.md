# [ADR-0011] OCI Always Free 向け GitHub Actions イミュータブル CD パイプラインと Watchtower による Pull 型デプロイの導入

* **ステータス**: 承認済
* **日付**: 2026-09-15
* **決定者**: プロジェクトオーナー, 開発チーム
* **関連 ADR**: ADR-0005, ADR-0007, ADR-0010

---

## 1. 文脈と問題提起 (Context)

ADR-0007（OCI Consolidated Single JAR）および ADR-0010（Google OAuth2 認証・常時 HTTPS）により、MyHomeStock は OCI Always Free 上で本番稼働を開始した。
しかし、本番環境への新機能・バグ修正のデプロイ運用に関して、以下の重大な課題とリスクが顕在化した：

1. **手動デプロイの運用破綻リスク**:
   - `main` ブランチマージ後のデプロイが手動運用となっており、更新漏れ、作業ミス、環境間ドリフトの原因となる。
2. **本番サーバー上ビルド（案A）の致命的アンチパターン**:
   - 「手軽だから」と OCI 本番サーバー上で `git pull` して直接 `docker compose build` を行う手法は、稼働中の本番サービス上で Maven（Java）と Vite（Node.js）の並行ビルドが走り、CPU/メモリが急騰して OOM Killer による本番コンテナ停止やレスポンス遅延を引き起こす。
   - さらに、本番サーバーにソースコード一式、Git 履歴、GitHub へのアクセスキーが常駐し、最小権限の原則（セキュリティ）に反する。
3. **OCI ARM64 (Ampere A1) 特有の QEMU ビルド時間ボトルネック**:
   - GitHub Actions の無料 Runner は `linux/amd64` (x86_64) であり、OCI は `linux/arm64` である。
   - QEMU エミュレーションを用いて Docker 内で Maven/npm のフルコンパイルを実行すると、ビルド時間が 15〜20 分以上に跳ね上がり、開発生産性を著しく阻害する。
4. **SSH インバウンドポート開放の攻撃リスク**:
   - GitHub Actions から OCI に SSH で直接入る Push 型デプロイは、動的 IP に対抗するためにファイアウォール（セキュリティリスト）で 22 番ポートを全世界（`0.0.0.0/0`）に開放せざるを得ず、不正侵入・総当たり攻撃の標的となる。

---

## 2. 決定内容 (Decision)

業界標準のベストプラクティスに基づき、**「GHCR を介したイミュータブルコンテナデプロイ ＋ Watchtower による Pull 型デプロイ」** を正式採用する：

1. **GitHub Container Registry (GHCR) を介したイミュータブルデプロイ**:
   - CI 品質ゲート全件（テスト、型検査、セキュリティガード）が 100% 合格した場合にのみ、完成したコンテナイメージを GHCR（`ghcr.io/yuki-yamagishi/my-home-stock`）へプッシュ。
   - 本番環境は「テスト済みの全く同じ不変イメージ」をプルして起動するのみとし、環境差異による不具合と本番負荷を完全排除。
2. **バイナリビルドとコンテナ化の完全分離（QEMU 遅延の完全回避）**:
   - Single JAR（Maven + Vite）の生成は GitHub Actions の x86_64 ネイティブ上で超高速実行（Java バイトコードおよびフロントエンド静的資産は CPU アーキテクチャ非依存）。
   - 本番専用の単一ステージ JRE コンテナ定義 [`Dockerfile.prod`](file:///c:/Users/yukiy/IdeaProjects/MyHomeStock/Dockerfile.prod) を新設し、事前ビルド済み Single JAR を直接 `COPY` して ARM64 コンテナ化を行う。
   - これにより、エミュレーションコンパイルの負荷をゼロにし、全デプロイ工程を数分（10分以内）で完了させる。
   - 既存の自己完結型 [`Dockerfile`](file:///c:/Users/yukiy/IdeaProjects/MyHomeStock/Dockerfile) はローカル開発環境用（`docker-compose.yml`）として一切変更せず維持し、開発者体験（DX）を保護。
3. **Watchtower による高セキュリティ Pull 型デプロイ**:
   - OCI サーバー側で **Watchtower**（コンテナ自動更新エージェント）を常駐運用。
   - アーカイブ済みの旧 `containrrr/watchtower`（Docker API v1.25固定で拒絶される）を排除し、Docker Engine v27+/v29+（API v1.40+）にネイティブ対応し ARM64 を完全サポートするアクティブ保守フォーク **`nickfedor/watchtower`** を採用。
   - OCI 側から GHCR へ外向き（Outbound HTTPS: 443）の通信のみで新しいイメージを検知・取得・再起動。
   - **OCI 側の SSH ポート（22）をインターネットに一切公開する必要がなくなり、最高強度の境界防御を維持**。
4. **データベース巻き込み再起動の物理防止**:
   - 同一 compose 内の PostgreSQL コンテナが誤って再起動されるのを防ぐため、`app` コンテナにのみ `com.centurylinklabs.watchtower.enable: "true"` を付与し、Watchtower 側で `--label-enable` を指定。DB コンテナの無警告再起動・トランザクション切断を物理的に防止。
5. **既存ヘルスチェック (`/api/v1/health`) との連動**:
   - Docker `healthcheck` にて既存の `/api/v1/health`（DB 疎通確認を含む）をポーリングし、新コンテナが健全に稼働開始するまで監視。
6. **レジストリ衛生管理（GHCR 自動パージ）**:
   - GitHub Actions ワークフロー内に `actions/delete-package-versions` を組み込み、`latest` タグおよび直近 5 つのバージョンを保護しつつ、それ以前の古いタグを自動削除してストレージ枯渇を恒久防止。

---

## 3. 結果・影響 (Consequences)

### メリット (Positive)
- **ゼロダウンタイムに近い安全更新**: 本番サーバーは完成済み軽量コンテナを pull して瞬時に起動するだけとなり、ビルドによるリソース圧迫や OOM リスクが皆無に。
- **高セキュリティ**: OCI インスタンスの SSH ポート開放が一切不要。ソースコードやビルドツール、Git 認証も本番サーバーに不要。
- **再現性 100%**: CI を通過した全く同じイメージが本番で稼働。万一の障害時も、直前のイメージタグを指定するだけで数秒でロールバック可能。
- **短時間ビルド**: ネイティブ x86_64 での JAR 生成により、ARM64 向け QEMU ビルドの遅延を回避。

### デメリット・トレードオフ (Negative / Trade-offs)
- **Watchtower 常駐リソース**: わずかなメモリ（数十MB程度）を消費するが、Ampere A1 (24GB RAM) では実質無視できる。
- **GitHub PAT 認証の必要性**: GHCR がプライベートパッケージの場合、Watchtower に GitHub PAT（`read:packages`）を環境変数経由で設定する必要がある。

---

## 4. 代替案 (Alternatives Considered)

- **案A: 本番サーバー上での `git pull` & Docker ビルド**:
  - 設定は手軽だが、本番サーバーの OOM・停止リスク、環境差異による再現性の崩壊、不要な秘密鍵・コード常駐による重大なセキュリティ脆弱性を招くアンチパターンのため却下。
- **GitHub Actions からの SSH 直接接続（Push 型デプロイ）**:
  - OCI の SSH ポートを全世界（`0.0.0.0/0`）に開放する必要があり、ブルートフォース攻撃や不正アクセスの標的となるため、より安全な Outbound 443 のみの Pull 型（Watchtower）を採用。
