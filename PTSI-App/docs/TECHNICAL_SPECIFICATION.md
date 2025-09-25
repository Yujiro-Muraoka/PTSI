# PTSIアプリケーション 技術仕様書

## 目次
1. [システム概要](#システム概要)
2. [技術スタック](#技術スタック)
3. [システム要件](#システム要件)
4. [アーキテクチャ](#アーキテクチャ)
5. [機能仕様](#機能仕様)
6. [API仕様](#api仕様)
7. [データベース設計](#データベース設計)
8. [ファイル構成](#ファイル構成)
9. [セキュリティ](#セキュリティ)
10. [デプロイメント](#デプロイメント)
11. [運用・保守](#運用保守)

---

## システム概要

### プロジェクト名
**PTSI (Preschool Transportation System Interface)**  
近畿大学付属幼稚園 登降園管理システム

### 目的
幼稚園・保育園向けの登降園管理Webアプリケーションとして、保護者と園側の効率的なコミュニケーションと各種申請手続きを支援する。

### 対象ユーザー
- **主要ユーザー**: 保護者
- **管理ユーザー**: 園職員（園長、主任保育士、担任教諭）

### 開発者
Yujiro Muraoka

---

## 技術スタック

### Backend
- **Runtime**: Node.js (v14以上推奨)
- **Framework**: Express.js v4.18.2
- **Body Parser**: body-parser v1.20.2
- **リアルタイム通信**: Socket.IO v4.7.2 (予定)

### Frontend
- **HTML**: HTML5
- **CSS**: CSS3 (カスタムCSS、Flexbox、Grid使用)
- **JavaScript**: Vanilla JavaScript (ES6+)
- **データ可視化**: Chart.js v2.1.4

### データベース
- **形式**: CSVファイルシステム
- **ファイル操作**: Node.js fs モジュール

### フォント
- **日本語フォント**: 
  - KosugiMaru-Regular.ttf
  - ShipporiMincho (Regular, SemiBold, ExtraBold)

---

## システム要件

### 動作環境
- **OS**: macOS, Windows, Linux
- **ブラウザ**: Chrome, Firefox, Safari, Edge (最新版)
- **Node.js**: v14.0.0以上
- **ポート**: 3000 (デフォルト)

### パフォーマンス要件
- **レスポンス時間**: 2秒以内
- **セッション保持**: 1時間
- **ファイルサイズ制限**: 10MB

---

## アーキテクチャ

### システム構成
```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Frontend      │    │    Backend      │    │   Database      │
│   (Browser)     │◄──►│   (Node.js)     │◄──►│   (CSV Files)   │
│                 │    │   Express.js    │    │                 │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

### ディレクトリ構造
```
PTSI-App/
├── server.js              # メインサーバーファイル
├── package.json            # 依存関係とスクリプト設定
├── .gitignore             # Git除外設定
├── chart/                 # データ可視化機能
│   ├── index.html
│   ├── script.js
│   ├── styles.css
│   └── data.csv
├── chat/                  # チャット機能
│   ├── chat.html
│   ├── chat.js
│   └── chat.css
├── check-resrvation/      # 予約確認機能
│   ├── check-resrvation.html
│   └── check-resrvation.css
├── css/                   # 共通スタイル
│   ├── main.css
│   └── reset.css
├── DB/                    # CSVデータベース
│   ├── login.csv
│   ├── student-info.csv
│   └── reservation.csv
├── fonts/                 # フォントファイル
│   ├── KosugiMaru-Regular.ttf
│   └── ShipporiMincho-*.ttf
├── login/                 # ログイン機能
│   ├── login.html
│   ├── login.js
│   └── login.css
└── reservation/           # 予約申請機能
    ├── reservation.html
    ├── reservation.js
    └── reservation.css
```

---

## 機能仕様

### 1. 認証システム (Login)
**ファイル**: `login/`

#### 機能概要
- 学生IDとパスワードによる認証
- セッション管理（Cookie使用、1時間有効）
- 入力値検証

#### 実装詳細
- **認証方式**: CSVファイルベース認証
- **セッション**: HTTP Cookie (`studentID`)
- **バリデーション**: 空値チェック、改行文字除去

#### UI要素
- 学生ID入力フィールド
- パスワード入力フィールド
- ログインボタン
- デモ用ログイン情報表示

### 2. 予約申請システム (Reservation)
**ファイル**: `reservation/`

#### 機能概要
- 4種類の申請タイプ
  1. **遅刻申請**: 時間帯選択 (10:00-15:00)
  2. **早退申請**: 時間帯選択 (10:00-15:00)
  3. **預かり保育予約**: 料金別プラン (￥800-￥2,100)
  4. **延長保育予約**: 料金別プラン (￥300-￥800)

#### 実装詳細
- **日付選択**: HTML5 date input
- **動的UI**: 申請タイプに応じた選択肢表示
- **重複チェック**: 同一申請の重複防止
- **データ保存**: reservation.csv への追記

#### バリデーション
- ログイン状態確認
- 日付選択必須
- 過去日付選択防止
- 申請タイプ選択必須

### 3. チャットシステム (Chat)
**ファイル**: `chat/`

#### 機能概要
- **ルームベースチャット**: 
  - 全体チャット
  - クラス別チャット (4クラス)
  - 園からのお知らせ
- **ダイレクトメッセージ**: 先生との個別連絡
- **リアルタイム更新**: 5秒間隔でメッセージ更新

#### 実装詳細
- **メッセージ保存**: サーバーメモリ内 (chatMessages オブジェクト)
- **メッセージ制限**: 通常50件、ダイレクト100件
- **文字数制限**: 200文字
- **管理者定義**: 6名の園職員

### 4. データ可視化 (Chart)
**ファイル**: `chart/`

#### 機能概要
- Chart.js を使用した月別データ表示
- CSVファイル読み込み機能（準備中）
- バーチャート形式でのデータ表示

### 5. 予約確認システム (Check Reservation)
**ファイル**: `check-resrvation/`

#### 機能概要
- クラス別の申請状況表示
- 静的HTMLによる表示（現在）

---

## API仕様

### 認証API

#### POST /passwordAuthentication
```javascript
// Request
{
  "studentId": "22001",
  "password": "22001"
}

// Response (Success)
{
  "success": true
}

// Response (Error)
{
  "success": false,
  "message": "パスワードが正しくありません。"
}
```

### 学生情報API

#### POST /studentInfo
```javascript
// Request
{
  "studentID": "22001"
}

// Response
{
  "name": "中田和輝",
  "studentID": "22001",
  "type": "一般",
  "lateCount": "3",
  "earlyCount": "1",
  "latePickUpCount": "1"
}
```

### 予約申請API

#### POST /submit
```javascript
// Request
{
  "studentID": "22001",
  "date": "2025-12-25",
  "type": "type1-12to13"
}

// Response
"データが正常に送信されました。"
```

### チャットAPI

#### POST /chat/send
```javascript
// Request
{
  "message": "こんにちは",
  "room": "general",
  "userId": "22001",
  "userName": "中田和輝",
  "messageType": "normal"
}

// Response
{
  "success": true,
  "message": {
    "id": 1703123456789,
    "text": "こんにちは",
    "user": {
      "id": "22001",
      "name": "中田和輝"
    },
    "room": "general",
    "messageType": "normal",
    "timestamp": "2024-12-21T03:04:16.789Z"
  }
}
```

#### GET /chat/messages/:room
```javascript
// Response
{
  "messages": [
    {
      "id": 1703123456789,
      "text": "こんにちは",
      "user": {
        "id": "22001",
        "name": "中田和輝"
      },
      "room": "general",
      "messageType": "normal",
      "timestamp": "2024-12-21T03:04:16.789Z"
    }
  ]
}
```

#### GET /chat/direct/:userId1/:userId2
ダイレクトメッセージ取得

#### GET /chat/admins
```javascript
// Response
{
  "admins": [
    {
      "id": "admin001",
      "name": "園長先生",
      "role": "principal"
    }
  ]
}
```

---

## データベース設計

### 1. login.csv
```csv
student-id,password
22001,22001
22002,22002
...
```

### 2. student-info.csv
```csv
student-id,name,type,late,early,late-pick-up
22001,中田和輝,一般,3,1,1
22002,丸山晴久,一般,3,1,2
...
```

**フィールド説明**:
- `student-id`: 学生ID（主キー）
- `name`: 学生氏名
- `type`: 保育形態（一般/短時間児）
- `late`: 遅刻回数
- `early`: 早退回数
- `late-pick-up`: お迎え遅れ回数

### 3. reservation.csv
```csv
22001,2025-12-25,type1-12to13
22002,2025-12-26,type3-4
...
```

**フィールド説明**:
- フィールド1: 学生ID
- フィールド2: 申請日
- フィールド3: 申請タイプ

**申請タイプ一覧**:
- `type1-*`: 遅刻申請
- `type2-*`: 早退申請
- `type3-*`: 預かり保育予約
- `type4-*`: 延長保育予約

---

## セキュリティ

### 実装済みセキュリティ対策

#### HTTPセキュリティヘッダー
```javascript
app.use((req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
  next();
});
```

#### 入力値検証
- 空値チェック
- 改行文字除去
- SQLインジェクション対策（CSVファイル使用のため該当なし）

#### セッション管理
- Cookie有効期限: 1時間
- パス指定: `/`

### セキュリティ上の注意点
1. **パスワード**: 平文保存（改善が必要）
2. **HTTPS**: 本番環境では必須
3. **CSRF対策**: 現在未実装
4. **ファイルアクセス**: 直接アクセス制限が必要

---

## デプロイメント

### 開発環境
```bash
# プロジェクトのクローン
git clone <repository-url>
cd PTSI-App

# 依存関係のインストール
npm install

# 開発サーバー起動
npm start
```

### 本番環境
```bash
# Node.js環境の準備
node --version  # v14以上確認

# プロジェクトの配置
cp -r PTSI-App /var/www/

# 依存関係のインストール
cd /var/www/PTSI-App
npm install --production

# サーバー起動
npm start

# プロセス管理 (PM2推奨)
npm install -g pm2
pm2 start server.js --name "ptsi-app"
```

### 環境変数
```bash
# .env ファイル (推奨)
PORT=3000
NODE_ENV=production
```

---

## 運用・保守

### ログ管理
- **アクセスログ**: Express標準出力
- **エラーログ**: console.error()
- **チャットログ**: メモリ内保存

### バックアップ
```bash
# CSVファイルのバックアップ
tar -czf backup_$(date +%Y%m%d).tar.gz DB/
```

### モニタリング
- **サーバー状態**: `http://localhost:3000/`
- **メモリ使用量**: Node.jsプロセス監視
- **ファイルサイズ**: CSV ファイル定期確認

### パフォーマンス最適化
1. **CSVファイル**: 定期的なアーカイブ
2. **メッセージ履歴**: 件数制限実装済み
3. **静的ファイル**: CDN使用検討

### 既知の制限事項
1. **データベース**: CSVファイルのため同時書き込み制限
2. **スケーラビリティ**: シングルサーバー構成
3. **リアルタイム通信**: 完全なWebSocket未実装

---

## 付録

### パッケージ情報
```json
{
  "name": "ptsi-app",
  "version": "1.0.0",
  "description": "近畿大学付属幼稚園 登降園管理システム",
  "main": "server.js",
  "author": "Yujiro Muraoka",
  "license": "ISC",
  "dependencies": {
    "body-parser": "^1.20.2",
    "express": "^4.18.2",
    "socket.io": "^4.7.2"
  }
}
```

### デモアカウント
- **学生ID**: 22001
- **パスワード**: 22001
- **対応学生**: 中田和輝

### 利用可能なエンドポイント
- `GET /` → `/login` にリダイレクト
- `GET /login` → ログインページ
- `GET /reservation` → 予約申請ページ
- `GET /chat` → チャットページ
- `GET /chart` → データ可視化ページ
- `GET /check-reservation` → 予約確認ページ

---

## 改訂履歴

| バージョン | 日付 | 変更内容 | 作成者 |
|-----------|------|----------|--------|
| 1.0.0 | 2025-09-25 | 初版作成 | Yujiro Muraoka |

---

*この技術仕様書は、PTSIアプリケーションの技術的な詳細を記載したものです。*
*運用時は定期的な更新とセキュリティレビューを実施してください。*
*作成者: Yujiro Muraoka*