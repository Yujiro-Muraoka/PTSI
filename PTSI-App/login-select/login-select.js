/**
 * ログイン選択ページのJavaScript（マルチテナント対応）
 */

let currentTenant = null;

/**
 * ページ読み込み時の初期化
 */
window.onload = function() {
    loadTenantInfo();
};

/**
 * テナント情報を読み込み
 */
async function loadTenantInfo() {
    // URLパラメータからテナントIDを取得
    const urlParams = new URLSearchParams(window.location.search);
    const tenantId = urlParams.get('tenant');
    
    if (!tenantId) {
        // テナントが指定されていない場合は保育園選択に戻る
        window.location.href = '/tenant-selection';
        return;
    }
    
    try {
        // テナント情報を取得
        const response = await fetch(`/api/tenants/${tenantId}`);
        const result = await response.json();
        
        if (result.success) {
            currentTenant = result.tenant;
            updatePageWithTenantInfo();
        } else {
            console.error('テナント情報取得エラー:', result.message);
            window.location.href = '/tenant-selection?error=tenant_not_found';
        }
    } catch (error) {
        console.error('テナント情報取得エラー:', error);
        window.location.href = '/tenant-selection?error=server_error';
    }
}

/**
 * テナント情報でページを更新
 */
function updatePageWithTenantInfo() {
    if (!currentTenant) return;
    
    // ページタイトルを更新
    document.title = `ログイン選択 - ${currentTenant.name}`;
    
    // 保育園名を表示
    const tenantNameElement = document.querySelector('.tenant-name');
    if (tenantNameElement) {
        tenantNameElement.textContent = currentTenant.name;
    } else {
        // 保育園名表示要素がない場合は追加
        const header = document.querySelector('.header');
        if (header) {
            const tenantInfo = document.createElement('div');
            tenantInfo.className = 'tenant-info';
            tenantInfo.innerHTML = `
                <div class="tenant-icon">${currentTenant.icon || '🏫'}</div>
                <div class="tenant-details">
                    <h2 class="tenant-name">${currentTenant.name}</h2>
                    <p class="tenant-description">${currentTenant.description || ''}</p>
                </div>
            `;
            header.appendChild(tenantInfo);
        }
    }
    
    // CSS変数でテーマカラーを設定
    if (currentTenant.theme) {
        document.documentElement.setAttribute('data-theme', currentTenant.theme);
    }
}

/**
 * 保護者ログインページに遷移
 */
function goToParentLogin() {
    if (!currentTenant) {
        console.error('テナント情報が取得されていません');
        return;
    }
    
    // フェードアウト効果を追加
    document.body.style.opacity = '0.8';
    document.body.style.transition = 'opacity 0.3s ease';
    
    setTimeout(() => {
        window.location.href = `/login?tenant=${currentTenant.tenantId}&type=parent`;
    }, 300);
}

/**
 * 運営側ログインページに遷移
 */
function goToAdminLogin() {
    if (!currentTenant) {
        console.error('テナント情報が取得されていません');
        return;
    }
    
    // フェードアウト効果
    document.body.style.transition = 'opacity 0.3s ease';
    document.body.style.opacity = '0.8';
    
    setTimeout(() => {
        window.location.href = `/login?tenant=${currentTenant.tenantId}&type=admin`;
    }, 300);
}

/**
 * 保育園選択に戻る
 */
function goBackToTenantSelection() {
    window.location.href = '/tenant-selection';
}

/**
 * 園を変更する（ヘッダーボタン用）
 */
function changeTenant() {
    // 確認ダイアログを表示
    if (confirm('園を変更すると現在の選択がリセットされます。続行しますか？')) {
        // ローカルストレージをクリア
        localStorage.removeItem('selectedTenantId');
        // テナント選択ページに戻る
        window.location.href = '/tenant-selection';
    }
}

/**
 * キーボードイベントハンドラー
 */
function handleKeyPress(event, callback) {
    if (event.key === 'Enter' || event.key === ' ') {
        event.preventDefault();
        callback();
    }
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