# [ADR-0013] アップストリーム非干渉・完全自律 Pull 型による Git Submodule 自動同期アーキテクチャ

* **ステータス**: 承認済
* **日付**: 2026-09-18
* **決定者**: プロジェクトオーナー, 開発チーム
* **関連 ADR**: ADR-0008, ADR-0009

---

## 1. 文脈と問題提起 (Context)

本プロジェクト（MyHomeStock）は、開発ガバナンス・レビュー自動化・物理ライフサイクルフックの共通基盤として `antigravity-review-loop`（https://github.com/yuki-yamagishi/antigravity-review-loop）を Git Submodule として導入している（ADR-0009）。

`antigravity-review-loop` は MyHomeStock 専用のコンポーネントではなく、多数のリポジトリ・プロジェクトで共通利用される **独立した汎用ガバナンス基盤** である。
そのため、サブモジュールの最新コミット自動同期を設計するにあたり、以下のアーキテクチャ上の境界原則を厳守する必要がある：
1. **アップストリーム非干渉・疎結合の原則**:
   - アップストリーム（`antigravity-review-loop`）に特定の下流プロジェクト（MyHomeStock）宛ての通知設定（`repository_dispatch`）、PAT（Personal Access Token）、Secrets をハードコードすることは、**依存関係の逆流アンチパターン** である。
   - 下流プロジェクトが複数存在する場合、アップストリームが個別下流の存在や挙動を検知・関知する構造にしてはならない。
2. **手動同期への精神論依存の排除 (Mechanisms do)**:
   - 一方で、「更新に気づいたら手動で `git submodule update` を叩く」という個人の注意深さ（Good intentions）に依存していては、セキュリティ修正等の取り込み漏れや滞留が生じる。
3. **下流リポジトリの完全自己完結 (Autonomous Pull)**:
   - 依存の方向は常に **下流（MyHomeStock）→ 上流（antigravity-review-loop）の一方通行** でなければならず、更新検知と取り込みは下流側が自律的に Pull する責任を負う。

---

## 2. 決定内容 (Decision)

以下のアーキテクチャ方針に基づき、**「アップストリームに一切の変更を求めない、下流完全自律 Pull 型（定期ポーリング ＋ 手動即時実行 ＋ Dependabot）および事前品質保証付き PR 自動起票メカニズム」** を採用する：

1. **アップストリーム完全非干渉（設定 0 件）の保証**:
   - `antigravity-review-loop` 側には、ワークフローの追加、PAT の発行・登録、Secrets の設定などを一切行わない。
   - アップストリームは MyHomeStock の存在や挙動を一切知る必要がなく、独立した共通ライブラリとしての純粋性を 100% 保持する。
2. **親リポジトリ自律の定期ポーリング (`schedule` cron)**:
   - MyHomeStock 側の GitHub Actions（`.github/workflows/update-review-loop-submodule.yml`）が、6 時間間隔（`cron: '0 */6 * * *'`）で自律的にリモートの最新コミットをチェックする。
3. **手動即時トリガー (`workflow_dispatch`)**:
   - 「今すぐ最新の review-loop を取り込みたい」場合は、MyHomeStock の GitHub Actions タブからワンクリックで即座に実行可能とする。
4. **プラットフォーム標準 Dependabot (`gitsubmodule`) の併設**:
   - `.github/dependabot.yml` を配置し、GitHub 公式の依存管理機能による日次 Submodule 更新検知も多重配備する。
5. **多重防衛による事前品質検証と PR 自動起票**:
   - サブモジュールの更新を `main` に直接 push することは厳禁とし、専用ブランチ（`chore/update-antigravity-review-loop`）で PR を自動起票する。
   - PR 作成前に、Node.js 22 環境で `qualityGateRunner.js`（プラグイン展開・ドキュメント整合性・シークレット検査）に加え、フロントエンドの厳格型検査（`npm run type-check`）および単体テスト全件（`npm run test:run`）を実行し、破壊的変更がないことを 100% 事前保証する。
6. **Git Submodule 追跡設定の明示化**:
   - `.gitmodules` に `branch = main` を明記し、リモート追跡ブランチを決定論的に固定する。

---

## 3. 代替案の検討と却下理由 (Alternatives Considered)

| 方式 | 判定 | 理由 |
| :--- | :--- | :--- |
| **A. アップストリームからの Push 通知 (`repository_dispatch`)** | ❌ **却下** | 汎用基盤（上流）に個別プロジェクト（下流）の宛先や PAT をハードコードする密結合アンチパターン。他プロジェクトへの展開性を阻害。 |
| **B. main への直接自動プッシュ** | ❌ 却下 | 万一の破壊的変更混入時に本番・開発環境が即座に破損する。憲章 2.3（人間マージ専権）に違反。 |
| **C. 完全自律 Pull 型 (Cron + 手動 + Dependabot)（採用）** | ✅ **採用** | アップストリームに 1 行の変更も求めず、下流側の責任で自律同期・事前検証・PR起票を完結させる世界標準ベストプラクティス。 |

---

## 4. 結果・影響 (Consequences)

### メリット (Positive)
- **ゼロ設定・疎結合**: `antigravity-review-loop` に一切の追加設定（PAT やワークフロー）が不要。相手側の設計や運用を 100% 汚染しない。
- **高堅牢性・安全性**: ワークフロー内での事前品質テスト（型検査・単体テスト）により、壊れたコードが PR になることを構造的に防止。
- **運用の自由度**: 6 時間ごとの自動チェックに加え、必要時にボタン一つで即時同期が可能。
- **トークン失効リスクゼロ**: GitHub Actions 標準の `GITHUB_TOKEN` のみで動作するため、PAT の有効期限管理や漏洩リスクが恒久的にゼロ。

### 留意点 (Negative / Trade-offs)
- プッシュした瞬間のミリ秒同期ではなく、スケジュール間隔（最大 6 時間）または手動トリガーでの同期となる（開発中の急ぎの更新は手動トリガーで即座に解消可能）。
