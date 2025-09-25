/**
 * PTSIアプリケーション技術仕様書 PDF自動生成ツール
 * 
 * 作成者: Yujiro Muraoka
 * 作成日: 2025-09-25
 * 要件: Node.js v18以上, Puppeteer
 */

const puppeteer = require('puppeteer');
const path = require('path');

async function generatePDF() {
    const browser = await puppeteer.launch({
        headless: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    
    const page = await browser.newPage();
    
    // HTMLファイルのパスを取得
    const htmlPath = path.join(__dirname, 'TECHNICAL_SPECIFICATION.html');
    
    // HTMLファイルを読み込み
    await page.goto(`file://${htmlPath}`, {
        waitUntil: 'networkidle0'
    });
    
    // PDF生成
    await page.pdf({
        path: 'TECHNICAL_SPECIFICATION.pdf',
        format: 'A4',
        printBackground: true,
        margin: {
            top: '20mm',
            right: '15mm',
            bottom: '20mm',
            left: '15mm'
        },
        displayHeaderFooter: true,
        headerTemplate: `
            <div style="font-size: 10px; margin: 0 auto; color: #666;">
                PTSIアプリケーション 技術仕様書
            </div>
        `,
        footerTemplate: `
            <div style="font-size: 10px; margin: 0 auto; color: #666;">
                <span class="pageNumber"></span> / <span class="totalPages"></span>
            </div>
        `
    });
    
    await browser.close();
    
    console.log('✅ PDF generated successfully: TECHNICAL_SPECIFICATION.pdf');
}

// PDFの代替としてブラウザで印刷する方法を提供
function printInstructions() {
    console.log('\n📄 PDF生成方法:');
    console.log('1. TECHNICAL_SPECIFICATION.html をブラウザで開く');
    console.log('2. Ctrl+P (または Cmd+P) で印刷ダイアログを開く');
    console.log('3. 「PDFとして保存」を選択');
    console.log('4. ファイル名を「TECHNICAL_SPECIFICATION.pdf」として保存');
    console.log('\n🔧 または以下のコマンドでPuppeteerを使用:');
    console.log('npm install puppeteer');
    console.log('node generate-pdf.js');
}

// Puppeteerがインストールされているかチェック
try {
    generatePDF();
} catch (error) {
    console.log('⚠️  Puppeteerが見つかりません。手動でPDF生成してください。');
    printInstructions();
}