# [ADR-0003] Spring Data JPA と @Version による楽観的排他制御 (Optimistic Locking)

* **ステータス**: 承認済
* **日付**: 2026-09-05
* **決定者**: MyHomeStock 開発チーム

---

## 1. 文脈と問題提起 (Context)
家庭内では夫婦や家族が別々のスマートフォンから同時に「在庫の消費」や「買い物リストのチェック」を行う場面が頻繁に発生します。排他制御がない場合、後から更新した側のデータで古い状態が上書きされてしまい、在庫数がズレる問題（Lost Update）が発生します。
一方、悲観的ロック（`SELECT FOR UPDATE`）は家庭用アプリとしては過剰で、DB接続保持やスループット低下のリスクがあります。

---

## 2. 決定内容 (Decision)
**Spring Data JPA (Hibernate) の `@Version` アノテーションによる楽観的排他制御** を採用します。
1. `stock_items` テーブルに `version BIGINT NOT NULL DEFAULT 0` カラムを配備。
2. 更新リクエスト時にクライアントが保持する `version` をリクエストボディに含める。
3. 競合時は Hibernate が `OptimisticLockingFailureException` を検知し、REST API は HTTP 409 Conflict を返却。
4. フロントエンドはトーストで競合を知らせ、最新状態を再取得して再操作を促す。

---

## 3. 結果・影響 (Consequences)

### メリット
- DBロックによるパフォーマンス劣化なしでデータ整合性を保証。
- 複数端末同時操作時のデータの意図しない消失を確実に防止。

### デメリット・トレードオフ
- クライアント側で更新時に `version` を送信し、409 発生時のリトライ・再取得ハンドリングが必要。
