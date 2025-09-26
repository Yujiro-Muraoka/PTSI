# PTSI（保育園・登降園管理システム）技術仕様書 v2.0

## 概要
PTSIは複数の保育園で利用可能なマルチテナント対応の登降園管理システムです。各保育園が独立したデータベースと設定を持ち、カスタマイズされたサービスを提供できます。

## システム構成

### 技術スタック
- **フロントエンド**: HTML5, CSS3, JavaScript (ES6+)
- **バックエンド**: Node.js, Express.js
- **データベース**: CSV形式ファイル（テナント別分離）
- **チャート描画**: Chart.js
- **リアルタイム通信**: Socket.IO（チャット機能）

### アーキテクチャ
```
┌─────────────────────────────────────────────────┐
│                フロントエンド                    │
├─────────────────────────────────────────────────┤
│ テナント選択 │ ログイン選択 │ 各種機能ページ      │
├─────────────────────────────────────────────────┤
│                Express.js API                   │
├─────────────────────────────────────────────────┤
│            マルチテナント管理レイヤー            │
├─────────────────────────────────────────────────┤
│         テナント別データストレージ               │
│ ┌─────────┐ ┌─────────┐ ┌─────────┐         │
│ │テナントA│ │テナントB│ │テナントC│         │
│ └─────────┘ └─────────┘ └─────────┘         │
└─────────────────────────────────────────────────┘
```

## ディレクトリ構造

```
PTSI-App/
├── tenant-selection/          # テナント選択システム
│   ├── tenant-selection.html
│   ├── tenant-selection.css
│   └── tenant-selection.js
├── tenant-config/             # テナント設定管理
│   ├── demo-hoikuen.json
│   ├── sakura-hoikuen.json
│   └── midori-hoikuen.json
├── tenant-data/               # テナント別データベース
│   ├── demo-hoikuen/
│   │   ├── login.csv
│   │   ├── student-info.csv
│   │   ├── reservation.csv
│   │   └── admin-login.csv
│   ├── sakura-hoikuen/
│   └── midori-hoikuen/
├── login-select/              # ログイン選択ページ
├── login/                     # 保護者ログイン
├── admin-login/               # 運営者ログイン
├── analytics/                 # データ分析システム
├── reservation/               # 予約管理
├── chat/                      # チャット機能
├── admin-dashboard/           # 管理者ダッシュボード
├── scripts/                   # ユーティリティスクリプト
│   └── generate-student-data.js
└── server.js                  # メインサーバー
```

## 主要機能

### 1. マルチテナント管理
- **テナント選択システム**: 利用する保育園を選択
- **テナント作成機能**: 新しい保育園の追加
- **設定管理**: 園ごとの料金、チャット設定、基本情報

### 2. 認証システム
- **保護者認証**: 園児の保護者向けログイン
- **運営者認証**: 園職員・管理者向けログイン
- **セッション管理**: Cookie based認証（1時間有効）

### 3. 予約管理
- **延長保育予約**: 事前申込システム
- **予約状況確認**: リアルタイム空き状況表示
- **料金計算**: 園別料金体系対応

### 4. チャット機能
- **リアルタイムチャット**: Socket.IO使用
- **園別チャットルーム**: テナント分離
- **ファイル共有**: 画像・文書送信

### 5. データ分析システム
- **園児統計**: クラス別、タイプ別分析
- **出席状況分析**: 遅刻・早退統計
- **データ可視化**: Chart.jsによるグラフ表示
- **レポート生成**: CSV、PDF出力対応

## データベース設計

### テナント管理
```csv
# DB/tenants.csv
tenantId,name,description,status,createdAt
demo-hoikuen,デモ保育園,システムデモ用,active,2025-01-01T00:00:00.000Z
```

### 学生情報（テナント別）
```csv
# tenant-data/{tenantId}/student-info.csv
student-id,name,type,late,early,late-pick-up,class
22001,田中太郎,一般,2,1,0,ひまわり組
```

### ログイン情報（テナント別）
```csv
# tenant-data/{tenantId}/login.csv
student-id,password
22001,22001
```

### 管理者情報（テナント別）
```csv
# tenant-data/{tenantId}/admin-login.csv
adminId,password,role,name
admin001,admin001,園長,管理者
```

## API仕様

### テナント管理API

#### GET /api/tenants
全テナント一覧取得
```json
{
  "success": true,
  "tenants": [
    {
      "tenantId": "demo-hoikuen",
      "name": "デモ保育園",
      "description": "システムデモ用",
      "status": "active"
    }
  ]
}
```

#### GET /api/tenants/:tenantId
特定テナント情報取得
```json
{
  "success": true,
  "tenant": {
    "tenantId": "demo-hoikuen",
    "name": "デモ保育園",
    "settings": { ... }
  }
}
```

#### POST /api/tenants/create
新規テナント作成
```json
{
  "name": "新しい保育園",
  "description": "説明",
  "contactInfo": { ... }
}
```

### データ分析API

#### GET /api/analytics/student-data?tenant={tenantId}
園児データ取得
```json
{
  "success": true,
  "data": [
    {
      "student-id": "22001",
      "name": "田中太郎",
      "class": "ひまわり組",
      "type": "一般"
    }
  ]
}
```

## セキュリティ

### 認証・認可
- Cookie based セッション管理
- テナント別データアクセス制御
- CSRF対策（同一オリジンポリシー）

### データ分離
- 物理的ファイル分離
- テナントID検証
- パス トラバーサル対策

## パフォーマンス

### データ規模
- 1テナントあたり: 120-150名の園児
- 5クラス構成（1クラス20-30名）
- CSV ファイルサイズ: 約10-20KB/ファイル

### レスポンス時間目標
- ページ読み込み: 2秒以内
- API レスポンス: 500ms以内
- データ更新: 1秒以内

## 監視・ログ

### システムログ
- アクセスログ
- エラーログ
- 認証ログ
- テナント操作ログ

### メトリクス
- テナント数
- アクティブユーザー数
- システム利用状況

## デプロイメント

### 必要環境
- Node.js 14.x以上
- NPM 6.x以上
- ディスク容量: 500MB以上

### 起動手順
```bash
npm install
node server.js
```

### 環境変数
```
PORT=3000
NODE_ENV=production
```

## 今後の拡張予定

### 短期（3ヶ月以内）
- [ ] 予約キャンセル機能
- [ ] メール通知機能
- [ ] モバイルアプリ対応

### 中期（6ヶ月以内）
- [ ] 料金自動計算システム
- [ ] 保護者向けアプリ
- [ ] バックアップ・復旧機能

### 長期（1年以内）
- [ ] AI予測機能
- [ ] 外部システム連携
- [ ] 多言語対応

## 変更履歴

### v2.0 (2025-01-XX)
- マルチテナント対応実装
- データ分析システム追加
- 大規模園児データ対応
- 運営者画面改善

### v1.0 (2024-XX-XX)
- 初期バージョン
- 基本的な登降園管理機能