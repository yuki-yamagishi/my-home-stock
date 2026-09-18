# [ADR-0013] repository_dispatch と PR 自動起票による Git Submodule 自動同期アーキテクチャ

* **ステータス**: 承認済
* **日付**: 2026-09-18
* **決定者**: プロジェクトオーナー, 開発チーム
* **関連 ADR**: ADR-0008, ADR-0009

---

## 1. 文脈と問題提起 (Context)

本プロジェクト（MyHomeStock）は、開発ガバナンス・レビュー自動化・物理ライフサイクルフックの共通基盤として `antigravity-review-loop`（https://github.com/yuki-yamagishi/antigravity-review-loop）を Git Submodule として導入している（ADR-0009）。

これまで、サブモジュール側で機能改修（例: curl タイムアウト防止ガードや branch DoR 検証強化）が行われた際、親リポジトリへの取り込みは開発者の手動操作（`git submodule update` および手動コミット）に依存していた。
この手動運用には以下の根本的課題が存在した：
1. **滞留と更新漏れ**: アップストリームでバグ修正やセキュリティ強化が行われても、親リポジトリ側が気づかずに古いバージョンのまま放置される。
2. **精神論の介在**: 「こまめに最新化する」という個人の注意深さ（Good intentions）に依存しており、品質ガバナンス憲章 1.1（精神論の排除と物理的仕組み化）に反する。

---

## 2. 決定内容 (Decision)

以下のアーキテクチャ方針に基づき、**「GitHub Actions によるトリプル・トリガー（repository_dispatch / workflow_dispatch / schedule cron）および Pull Request 自動起票メカニズム」** を採用する：

1. **イベント駆動即時同期 (`repository_dispatch`)**:
   - アップストリーム（`antigravity-review-loop`）のリポジトリで push が発生した際、GitHub REST API 経由で MyHomeStock に `update-review-loop` イベントを発火させる。
   - 親リポジトリは即座にワークフローを起動し、最新コミットを取り込む。
2. **冗長性とフェイルセーフの確保 (`workflow_dispatch` / `schedule`)**:
   - Webhook 不達やトークン有効期限切れへの保険として、毎日 1 回の定期実行（`cron: '0 2 * * *'`）および GitHub Web UI からのワンクリック手動実行（`workflow_dispatch`）を同一ワークフローに併設する。
3. **無検証直接プッシュの禁止と Pull Request 自動起票**:
   - サブモジュールの更新を `main` ブランチに直接プッシュすることは厳禁とし、専用ブランチ（`chore/update-antigravity-review-loop`）を切って **Pull Request を自動起票** する（`peter-evans/create-pull-request` を使用）。
   - PR が起票されることで、親リポジトリの既存 CI（`ci.yml`: Javaテスト、TypeScript型検査、Vitest、プロダクションビルド）が自動実行され、破壊的変更がないことを確認した上で人間開発者がマージする（憲章 2.3 人間マージ専権の徹底）。
4. **ワークフロー内での品質事前検証**:
   - PR 作成前に、Node.js 22 環境で `qualityGateRunner.js`（プラグイン展開ガード、ドキュメント整合性ガード、シークレット漏洩スキャン）を実行し、サブモジュール更新によって親リポジトリのガバナンス機構が破損していないかを事前チェックする。
5. **Git Submodule 追跡設定の明示化**:
   - `.gitmodules` に `branch = main` を明記し、`git submodule update --remote` が確実にアップストリームの最新追跡ブランチを参照するように固定する。

---

## 3. 代替案の検討と却下理由 (Alternatives Considered)

| 方式 | 判定 | 理由 |
| :--- | :--- | :--- |
| **A. main への直接自動プッシュ** | ❌ 却下 | アップストリームの変更によって親リポジトリのビルドやテストが破損した場合、本番・開発環境が即座に巻き添えになる。憲章 2.3（人間マージ専権）にも違反。 |
| **B. 定期 cron のみ（ポーリング型）** | ❌ 却下 | アップストリームを修正した直後に反映されず、最大24時間のタイムラグが発生する。開発のテンポを阻害。 |
| **C. Git Subtree への移行** | ❌ 却下 | 親リポジトリ内にコードが実体として混入し、アップストリーム無修正の原則やプラグインとしての境界が曖昧になる。 |
| **D. イベント駆動 + PR自動起票（採用）** | ✅ **採用** | 即時性、安全性、テスト自律性、人間承認ガバナンスのすべてを両立する業界標準ベストプラクティス。 |

---

## 4. 結果・影響 (Consequences)

### メリット (Positive)
- **完全自動化**: アップストリームが更新されると即座に MyHomeStock に PR が作成され、手作業が一切不要になる。
- **高堅牢性**: CI による全量回帰テストと品質ゲート通過が可視化され、安全な更新のみがマージされる。
- **可観測性**: PR 本文に最新コミットの SHA、日時、コミットログが自動記載され、どのような変更が含まれているかが一目でわかる。

### 留意点 (Negative / Trade-offs)
- アップストリーム側（`antigravity-review-loop`）に、MyHomeStock への dispatch を実行するための Personal Access Token (PAT) とワークフローの設定が 1 度だけ必要となる（設定手順書を完備して解決）。
