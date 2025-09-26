/**
 * 保育園選択システム - メインJavaScript
 * マルチテナント対応保育園管理システム
 * 
 * @author Yujiro Muraoka
 * @version 3.0.0
 */

let tenants = [];
let currentTenant = null;

/**
 * ページ読み込み時の初期化
 */
window.onload = function() {
    console.log('🏫 PTSI Multi-Tenant System v3.0.0 - Tenant Selection');
    loadTenants();
    
    // URLパラメータをチェック（直接アクセス用）
    const urlParams = new URLSearchParams(window.location.search);
    const tenantId = urlParams.get('tenant');
    if (tenantId) {
        redirectToTenant(tenantId);
    }
};

/**
 * 保育園一覧を読み込み
 */
async function loadTenants() {
    try {
        const response = await fetch('/api/tenants');
        const result = await response.json();
        
        if (result.success) {
            tenants = result.tenants;
            renderTenants();
        } else {
            showError('保育園一覧の読み込みに失敗しました: ' + result.message);
        }
    } catch (error) {
        console.error('保育園一覧読み込みエラー:', error);
        showError('サーバーとの通信に失敗しました。しばらくしてから再試行してください。');
    }
}

/**
 * 保育園一覧を画面に表示
 */
function renderTenants() {
    const grid = document.getElementById('tenant-grid');
    
    if (tenants.length === 0) {
        grid.innerHTML = `
            <div class="empty-state">
                <div class="empty-icon">🏫</div>
                <h3>登録された保育園がありません</h3>
                <p>システム管理者に新規保育園の登録を依頼してください。</p>
            </div>
        `;
        return;
    }
    
    const tenantCards = tenants.map(tenant => createTenantCard(tenant)).join('');
    grid.innerHTML = tenantCards;
}

/**
 * 保育園カードのHTMLを生成
 */
function createTenantCard(tenant) {
    const themeClass = tenant.theme ? `theme-${tenant.theme}` : '';
    const statusClass = tenant.status === 'active' ? 'active' : 'inactive';
    
    return `
        <div class="tenant-card ${themeClass} ${statusClass}" 
             onclick="selectTenant('${tenant.id}')">
            <div class="tenant-icon">${tenant.icon || '🏫'}</div>
            <h3 class="tenant-name">${tenant.name}</h3>
            <p class="tenant-description">${tenant.description || '保育園の詳細情報はありません。'}</p>
            
            <div class="tenant-stats">
                <div class="stat-item">
                    <span class="stat-value">${tenant.studentCount || 0}</span>
                    <span class="stat-label">園児数</span>
                </div>
                <div class="stat-item">
                    <span class="stat-value">${tenant.classCount || 0}</span>
                    <span class="stat-label">クラス数</span>
                </div>
                <div class="stat-item">
                    <span class="stat-value">${tenant.staffCount || 0}</span>
                    <span class="stat-label">職員数</span>
                </div>
            </div>
            
            <div class="tenant-actions">
                <button class="tenant-btn primary" onclick="event.stopPropagation(); selectTenant('${tenant.id}')">
                    <span class="btn-icon">🔑</span>
                    ログイン
                </button>
                ${tenant.status === 'active' ? '' : `
                    <span class="status-badge inactive">準備中</span>
                `}
            </div>
        </div>
    `;
}

/**
 * 保育園を選択してログインページに遷移
 */
function selectTenant(tenantId) {
    const tenant = tenants.find(t => t.id === tenantId);
    
    if (!tenant) {
        showError('選択された保育園が見つかりません。');
        return;
    }
    
    if (tenant.status !== 'active') {
        showError('この保育園は現在準備中です。しばらくお待ちください。');
        return;
    }
    
    // テナント情報をセッションストレージに保存
    sessionStorage.setItem('selectedTenant', JSON.stringify(tenant));
    
    // ログイン選択ページにリダイレクト
    window.location.href = `/login-select?tenant=${tenantId}`;
}

/**
 * 新規保育園登録ダイアログを表示
 */
function showNewTenantDialog() {
    document.getElementById('new-tenant-dialog').style.display = 'flex';
    
    // フォームをリセット
    document.getElementById('new-tenant-form').reset();
}

/**
 * 新規保育園登録ダイアログを非表示
 */
function hideNewTenantDialog() {
    document.getElementById('new-tenant-dialog').style.display = 'none';
}

/**
 * 新規保育園を作成
 */
async function createNewTenant() {
    const form = document.getElementById('new-tenant-form');
    const formData = new FormData(form);
    
    // バリデーション
    const tenantId = formData.get('tenantId');
    const tenantName = formData.get('tenantName');
    const adminId = formData.get('adminId');
    const adminPassword = formData.get('adminPassword');
    const adminName = formData.get('adminName');
    
    if (!tenantId || !tenantName || !adminId || !adminPassword || !adminName) {
        showError('必須項目をすべて入力してください。');
        return;
    }
    
    // テナントIDの重複チェック
    if (tenants.some(t => t.id === tenantId)) {
        showError('この保育園IDは既に使用されています。');
        return;
    }
    
    try {
        const response = await fetch('/api/tenants/create', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                tenantId: tenantId,
                tenantName: tenantName,
                description: formData.get('description') || '',
                themeColor: formData.get('themeColor') || 'blue',
                adminId: adminId,
                adminPassword: adminPassword,
                adminName: adminName
            })
        });
        
        const result = await response.json();
        
        if (result.success) {
            showSuccess('新規保育園が正常に作成されました！');
            hideNewTenantDialog();
            loadTenants(); // リスト更新
        } else {
            showError('保育園の作成に失敗しました: ' + result.message);
        }
    } catch (error) {
        console.error('保育園作成エラー:', error);
        showError('サーバーエラーが発生しました。');
    }
}

/**
 * 保育園管理ダイアログを表示
 */
function showTenantManagement() {
    document.getElementById('tenant-management-dialog').style.display = 'flex';
    showManagementTab('overview');
}

/**
 * 保育園管理ダイアログを非表示
 */
function hideTenantManagement() {
    document.getElementById('tenant-management-dialog').style.display = 'none';
}

/**
 * 管理タブを切り替え
 */
function showManagementTab(tabName) {
    // タブボタンの状態更新
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    event.target.classList.add('active');
    
    // コンテンツ更新
    const content = document.getElementById('management-content');
    
    switch (tabName) {
        case 'overview':
            content.innerHTML = renderOverviewTab();
            break;
        case 'settings':
            content.innerHTML = renderSettingsTab();
            break;
        case 'billing':
            content.innerHTML = renderBillingTab();
            break;
    }
}

/**
 * 概要タブのHTMLを生成
 */
function renderOverviewTab() {
    const totalTenants = tenants.length;
    const activeTenants = tenants.filter(t => t.status === 'active').length;
    const totalStudents = tenants.reduce((sum, t) => sum + (t.studentCount || 0), 0);
    
    return `
        <div class="overview-stats">
            <div class="overview-card">
                <div class="overview-icon">🏫</div>
                <div class="overview-content">
                    <h4>登録保育園数</h4>
                    <div class="overview-number">${totalTenants}</div>
                    <div class="overview-detail">運用中: ${activeTenants}園</div>
                </div>
            </div>
            <div class="overview-card">
                <div class="overview-icon">👶</div>
                <div class="overview-content">
                    <h4>総園児数</h4>
                    <div class="overview-number">${totalStudents}</div>
                    <div class="overview-detail">全保育園合計</div>
                </div>
            </div>
        </div>
        
        <div class="tenant-list">
            <h4>保育園一覧</h4>
            <div class="tenant-table">
                <table>
                    <thead>
                        <tr>
                            <th>保育園名</th>
                            <th>ID</th>
                            <th>園児数</th>
                            <th>状態</th>
                            <th>操作</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${tenants.map(tenant => `
                            <tr>
                                <td>${tenant.name}</td>
                                <td><code>${tenant.id}</code></td>
                                <td>${tenant.studentCount || 0}名</td>
                                <td>
                                    <span class="status-badge ${tenant.status}">
                                        ${tenant.status === 'active' ? '運用中' : '準備中'}
                                    </span>
                                </td>
                                <td>
                                    <button class="btn-small" onclick="editTenant('${tenant.id}')">
                                        編集
                                    </button>
                                </td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            </div>
        </div>
    `;
}

/**
 * 設定タブのHTMLを生成
 */
function renderSettingsTab() {
    return `
        <div class="settings-section">
            <h4>システム全体設定</h4>
            <div class="setting-item">
                <label>
                    <input type="checkbox" id="auto-backup" checked>
                    自動バックアップを有効にする
                </label>
                <p class="setting-description">毎日午前2時に全保育園のデータを自動バックアップします。</p>
            </div>
            <div class="setting-item">
                <label>
                    <input type="checkbox" id="maintenance-mode">
                    メンテナンスモード
                </label>
                <p class="setting-description">システム全体を一時的に利用停止にします。</p>
            </div>
        </div>
        
        <div class="settings-section">
            <h4>通知設定</h4>
            <div class="setting-item">
                <label for="admin-email">システム管理者メール</label>
                <input type="email" id="admin-email" placeholder="admin@example.com">
                <p class="setting-description">エラーやアラートの通知先メールアドレス</p>
            </div>
        </div>
        
        <div class="settings-actions">
            <button class="btn primary" onclick="saveSystemSettings()">
                設定を保存
            </button>
        </div>
    `;
}

/**
 * 料金タブのHTMLを生成
 */
function renderBillingTab() {
    return `
        <div class="billing-section">
            <h4>料金プラン</h4>
            <div class="plan-grid">
                <div class="plan-card">
                    <h5>ベーシックプラン</h5>
                    <div class="plan-price">¥5,000<span>/月</span></div>
                    <ul class="plan-features">
                        <li>園児数 50名まで</li>
                        <li>基本機能すべて利用可能</li>
                        <li>メールサポート</li>
                    </ul>
                </div>
                <div class="plan-card">
                    <h5>スタンダードプラン</h5>
                    <div class="plan-price">¥10,000<span>/月</span></div>
                    <ul class="plan-features">
                        <li>園児数 100名まで</li>
                        <li>カスタマイズ機能</li>
                        <li>電話サポート</li>
                        <li>データ分析機能</li>
                    </ul>
                </div>
                <div class="plan-card premium">
                    <h5>プレミアムプラン</h5>
                    <div class="plan-price">¥20,000<span>/月</span></div>
                    <ul class="plan-features">
                        <li>園児数 無制限</li>
                        <li>すべての機能利用可能</li>
                        <li>専任サポート</li>
                        <li>カスタム開発対応</li>
                    </ul>
                </div>
            </div>
        </div>
        
        <div class="billing-summary">
            <h4>現在の利用状況</h4>
            <div class="billing-table">
                <table>
                    <thead>
                        <tr>
                            <th>保育園名</th>
                            <th>プラン</th>
                            <th>園児数</th>
                            <th>月額料金</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${tenants.map(tenant => {
                            const plan = getBillingPlan(tenant.studentCount || 0);
                            return `
                                <tr>
                                    <td>${tenant.name}</td>
                                    <td>${plan.name}</td>
                                    <td>${tenant.studentCount || 0}名</td>
                                    <td>¥${plan.price.toLocaleString()}</td>
                                </tr>
                            `;
                        }).join('')}
                    </tbody>
                </table>
            </div>
        </div>
    `;
}

/**
 * 園児数に基づいて料金プランを取得
 */
function getBillingPlan(studentCount) {
    if (studentCount <= 50) {
        return { name: 'ベーシック', price: 5000 };
    } else if (studentCount <= 100) {
        return { name: 'スタンダード', price: 10000 };
    } else {
        return { name: 'プレミアム', price: 20000 };
    }
}

/**
 * 保育園情報を編集
 */
function editTenant(tenantId) {
    // 実装予定: 保育園編集ダイアログを表示
    console.log('Edit tenant:', tenantId);
    showInfo('保育園編集機能は開発中です。');
}

/**
 * システム設定を保存
 */
function saveSystemSettings() {
    // 実装予定: システム設定の保存
    showSuccess('設定が保存されました。');
}

/**
 * 特定の保育園にリダイレクト
 */
function redirectToTenant(tenantId) {
    const tenant = tenants.find(t => t.id === tenantId);
    if (tenant) {
        selectTenant(tenantId);
    } else {
        showError('指定された保育園が見つかりません。');
    }
}

/**
 * 成功メッセージを表示
 */
function showSuccess(message) {
    showNotification(message, 'success');
}

/**
 * エラーメッセージを表示
 */
function showError(message) {
    showNotification(message, 'error');
}

/**
 * 情報メッセージを表示
 */
function showInfo(message) {
    showNotification(message, 'info');
}

/**
 * 通知を表示
 */
function showNotification(message, type = 'info') {
    // 既存の通知を削除
    const existingNotification = document.querySelector('.notification');
    if (existingNotification) {
        existingNotification.remove();
    }
    
    // 新しい通知を作成
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.innerHTML = `
        <div class="notification-content">
            <span class="notification-icon">
                ${type === 'success' ? '✅' : type === 'error' ? '❌' : 'ℹ️'}
            </span>
            <span class="notification-message">${message}</span>
            <button class="notification-close" onclick="this.parentElement.parentElement.remove()">×</button>
        </div>
    `;
    
    // 通知のスタイル
    notification.style.cssText = `
        position: fixed;
        top: 2rem;
        right: 2rem;
        background: ${type === 'success' ? '#2ecc71' : type === 'error' ? '#e74c3c' : '#3498db'};
        color: white;
        padding: 1.5rem;
        border-radius: 8px;
        box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
        z-index: 2000;
        animation: slideIn 0.3s ease-out;
        max-width: 400px;
    `;
    
    // 通知を画面に追加
    document.body.appendChild(notification);
    
    // 5秒後に自動削除
    setTimeout(() => {
        if (notification.parentElement) {
            notification.remove();
        }
    }, 5000);
}

// アニメーションのスタイルを追加
if (!document.querySelector('#notification-styles')) {
    const style = document.createElement('style');
    style.id = 'notification-styles';
    style.textContent = `
        @keyframes slideIn {
            from {
                transform: translateX(100%);
                opacity: 0;
            }
            to {
                transform: translateX(0);
                opacity: 1;
            }
        }
        
        .notification-content {
            display: flex;
            align-items: center;
            gap: 1rem;
        }
        
        .notification-close {
            background: none;
            border: none;
            color: white;
            font-size: 1.5rem;
            cursor: pointer;
            opacity: 0.8;
            transition: opacity 0.2s;
        }
        
        .notification-close:hover {
            opacity: 1;
        }
    `;
    document.head.appendChild(style);
}