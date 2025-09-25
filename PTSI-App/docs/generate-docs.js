#!/usr/bin/env node

/**
 * PTSIアプリケーション技術仕様書 PDF変換ツール
 * 
 * 作成者: Yujiro Muraoka
 * 作成日: 2025-09-25
 * 
 * 使用方法:
 * 1. ブラウザでTECHNICAL_SPECIFICATION.htmlを開く
 * 2. Cmd+P (macOS) または Ctrl+P (Windows/Linux) で印刷
 * 3. 「PDFとして保存」を選択
 * 4. ファイル名を「PTSI_Technical_Specification.pdf」として保存
 */

const fs = require('fs');
const path = require('path');

console.log('📚 PTSIアプリケーション技術仕様書 生成完了');
console.log('=' .repeat(60));
console.log('');

console.log('✅ 生成されたファイル:');
console.log('  📄 Markdown版: TECHNICAL_SPECIFICATION.md (ソース版)');
console.log('  🌐 HTML版: TECHNICAL_SPECIFICATION.html (ブラウザ表示用)');
console.log('');

console.log('📖 PDF版の生成方法:');
console.log('  1. 以下のコマンドでHTMLファイルを開く:');
console.log('     open TECHNICAL_SPECIFICATION.html');
console.log('');
console.log('  2. ブラウザで開いたら:');
console.log('     • macOS: Cmd + P');
console.log('     • Windows/Linux: Ctrl + P');
console.log('');
console.log('  3. 印刷設定:');
console.log('     • 送信先: PDFとして保存');
console.log('     • 用紙サイズ: A4');
console.log('     • 余白: デフォルト');
console.log('     • オプション: 背景のグラフィック ✓');
console.log('');
console.log('  4. ファイル名を「PTSI_Technical_Specification.pdf」として保存');
console.log('');

console.log('🔧 技術仕様書の内容:');
console.log('  • システム概要と技術スタック');
console.log('  • 機能仕様とAPI仕様');
console.log('  • データベース設計');
console.log('  • セキュリティ要件');
console.log('  • デプロイメント手順');
console.log('  • 運用・保守ガイド');
console.log('');

console.log('📝 ドキュメント情報:');
console.log('  バージョン: 1.0.0');
console.log('  作成日: 2025年9月25日');
console.log('  対象システム: PTSI (Preschool Transportation System Interface)');
console.log('');

console.log('⚡ クイックスタート:');
console.log('  デモアカウント - ID: 22001, パスワード: 22001');
console.log('  サーバー起動: npm start');
console.log('  アクセス: http://localhost:3000');
console.log('');

console.log('🌟 文書作成完了！');

// ファイルの存在確認
const files = [
    'TECHNICAL_SPECIFICATION.md',
    'TECHNICAL_SPECIFICATION.html'
];

files.forEach(file => {
    const filePath = path.join(__dirname, file);
    if (fs.existsSync(filePath)) {
        const stats = fs.statSync(filePath);
        const sizeKB = Math.round(stats.size / 1024);
        console.log(`  ✓ ${file} (${sizeKB} KB)`);
    } else {
        console.log(`  ✗ ${file} (見つかりません)`);
    }
});