# PTSI-App

近畿大学付属幼稚園 登降園管理システム

## 🎉 最新アップデート (2025-09-25)

- **Node.js アップグレード**: v16.14.2 → v24.8.0 🚀
- **ドキュメント整理**: 専用`docs/`フォルダに技術仕様書を整理
- **新機能追加**: チャットシステム、PDF生成ツール
- **作成者**: Yujiro Muraoka

## 概要

PTSIは幼稚園・保育園向けの登降園管理Webアプリケーションです。保護者と園側の効率的なコミュニケーションと各種申請手続きを支援します。

## 主な機能

- **ログイン機能**: 学生IDとパスワードによる認証
- **予約申請機能**: 遅刻・早退・預かり保育・延長保育の申請
- **チャット機能**:
  - クラス別チャットルーム
  - 先生との個別連絡（ダイレクトメッセージ）
  - 園からのお知らせ配信
- **データ可視化**: Chart.jsによる統計表示
- **予約確認機能**: 提出済み申請の確認

## 技術スタック

- **Backend**: Node.js + Express
- **Frontend**: HTML5 + CSS3 + JavaScript
- **Database**: CSV file system
- **Charts**: Chart.js

## インストール・起動方法

### 前提条件

- Node.js (v14以上推奨)
- npm

### セットアップ

```bash
cd PTSI-App
npm install
npm start
```

サーバーが起動したら、ブラウザで `http://localhost:3000` にアクセスしてください。

### デモ用ログイン情報

- ID: `22001`
- パスワード: `22001`

## プロジェクト構造

```text
PTSI-App/
├── server.js          # メインサーバーファイル
├── package.json        # 依存関係とスクリプト
├── chart/             # データ可視化機能
├── chat/              # チャット機能
├── check-reservation/ # 予約確認機能
├── css/               # 共通スタイル
├── DB/                # CSVデータベース
├── fonts/             # フォントファイル
├── login/             # ログイン機能
└── reservation/       # 予約申請機能
```

## 📚 ドキュメント

詳細な技術仕様書は `PTSI-App/docs/` フォルダにあります：

- **技術仕様書 (Markdown)**: `docs/TECHNICAL_SPECIFICATION.md`
- **技術仕様書 (HTML)**: `docs/TECHNICAL_SPECIFICATION.html`
- **ドキュメントガイド**: `docs/README.md`

### 新しいnpmスクリプト

```bash
# ドキュメント情報表示
npm run docs

# HTML仕様書をブラウザで開く
npm run docs:open

# PDF生成
npm run docs:pdf
```

## 作者

Yujiro Muraoka

## ライセンス

ISC
