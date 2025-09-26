/**
 * ログイン選択ページのJavaScript
 */

/**
 * 保護者ログインページに遷移
 */
function goToParentLogin() {
    // フェードアウト効果を追加
    document.body.style.opacity = '0.8';
    document.body.style.transition = 'opacity 0.3s ease';
    
    setTimeout(() => {
        window.location.href = '/parent-login';
    }, 300);
}

/**
 * 運営側ログインページに遷移
 */
function navigateToAdmin() {
    // フェードアウト効果
    document.body.style.transition = 'opacity 0.3s ease';
    document.body.style.opacity = '0.8';
    
    setTimeout(() => {
        window.location.href = '/admin-login-new';
    }, 300);
}

/**
 * キーボードアクセシビリティサポート
 */
document.addEventListener('DOMContentLoaded', function() {
    // 保護者ログインカード
    const parentCard = document.querySelector('.option-card.parent-login');
    if (parentCard) {
        parentCard.setAttribute('tabindex', '0');
        parentCard.setAttribute('role', 'button');
        parentCard.setAttribute('aria-label', '保護者ログインページに移動');
        
        parentCard.addEventListener('keydown', function(e) {
            if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                goToParentLogin();
            }
        });
    }
    
    // 運営側ログインカード
    const adminCard = document.querySelector('.option-card.admin-login');
    if (adminCard) {
        adminCard.setAttribute('tabindex', '0');
        adminCard.setAttribute('role', 'button');
        adminCard.setAttribute('aria-label', '運営側ログインページに移動');
        
        adminCard.addEventListener('keydown', function(e) {
            if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                goToAdminLogin();
            }
        });
    }
});

/**
 * ページ読み込み時のアニメーション
 */
window.addEventListener('load', function() {
    // ヘッダーのフェードイン
    const header = document.querySelector('.header');
    if (header) {
        header.style.opacity = '0';
        header.style.transform = 'translateY(-20px)';
        header.style.transition = 'all 0.6s ease';
        
        setTimeout(() => {
            header.style.opacity = '1';
            header.style.transform = 'translateY(0)';
        }, 200);
    }
    
    // 選択ヘッダーのアニメーション
    const selectionHeader = document.querySelector('.selection-header');
    if (selectionHeader) {
        selectionHeader.style.opacity = '0';
        selectionHeader.style.transform = 'translateY(20px)';
        selectionHeader.style.transition = 'all 0.6s ease';
        
        setTimeout(() => {
            selectionHeader.style.opacity = '1';
            selectionHeader.style.transform = 'translateY(0)';
        }, 400);
    }
});

/**
 * マニュアルダウンロードのトラッキング
 */
function trackManualDownload(type) {
    // ダウンロード統計を記録（実装時）
    console.log(`Manual download: ${type}`);
    
    // ダウンロード完了の視覚的フィードバック
    const btn = event.target.closest('.manual-btn');
    if (btn) {
        const originalText = btn.innerHTML;
        btn.style.background = '#4CAF50';
        btn.style.color = 'white';
        
        setTimeout(() => {
            btn.innerHTML = originalText;
            btn.style.background = '';
            btn.style.color = '';
        }, 2000);
    }
}

/**
 * エラーハンドリング
 */
window.addEventListener('error', function(e) {
    console.error('Login selection page error:', e.error);
});

/**
 * 戻るボタンの処理
 */
window.addEventListener('popstate', function(e) {
    // ブラウザの戻るボタンが押された時の処理
    location.reload();
});