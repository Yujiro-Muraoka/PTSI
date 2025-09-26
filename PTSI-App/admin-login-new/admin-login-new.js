/**
 * 管理者ログインページのJavaScript
 */

/**
 * 管理者ログイン処理
 */
async function adminLogin() {
    const adminId = document.getElementById('admin-id').value.trim();
    const adminPassword = document.getElementById('admin-password').value.trim();
    const errorElement = document.getElementById('error-message');
    
    // バリデーション
    if (!adminId || !adminPassword) {
        showError('管理者IDとパスワードを入力してください。');
        return;
    }
    
    // ローディング状態の設定
    const loginBtn = document.querySelector('.admin-login-btn');
    const originalText = loginBtn.innerHTML;
    loginBtn.innerHTML = '<span class="btn-icon">⏳</span>認証中...';
    loginBtn.disabled = true;
    
    try {
        // サーバーに認証リクエストを送信
        const response = await fetch('/login', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                adminId: adminId,
                adminPassword: adminPassword,
                loginType: 'admin'
            })
        });
        
        const result = await response.json();
        
        if (result.success) {
            // ログイン成功
            hideError();
            
            // 成功メッセージ表示
            loginBtn.innerHTML = '<span class="btn-icon">✅</span>認証成功！';
            loginBtn.style.background = 'linear-gradient(45deg, #27ae60, #2ecc71)';
            
            // セッション情報を保存
            if (result.user) {
                // 管理者認証トークンを生成・保存
                try {
                    const tokenResponse = await fetch('/api/admin-token', {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                        },
                        body: JSON.stringify({
                            adminId: result.user.id,
                            adminRole: result.user.role
                        })
                    });
                    
                    const tokenResult = await tokenResponse.json();
                    if (tokenResult.success) {
                        localStorage.setItem('adminToken', tokenResult.token);
                        console.log('管理者認証トークンを保存しました');
                    }
                } catch (tokenError) {
                    console.error('トークン生成エラー:', tokenError);
                }
                sessionStorage.setItem('adminUser', JSON.stringify(result.user));
            }
            
            // フェードアウト効果でリダイレクト
            setTimeout(() => {
                document.body.style.opacity = '0.8';
                document.body.style.transition = 'opacity 0.3s ease';
                
                setTimeout(() => {
                    // 管理者ダッシュボードにリダイレクト
                    window.location.href = result.redirectUrl || '/admin-dashboard';
                }, 300);
            }, 1000);
            
        } else {
            // ログイン失敗
            showError(result.message || '管理者ID またはパスワードが正しくありません。');
        }
        
    } catch (error) {
        console.error('Admin login error:', error);
        showError('ネットワークエラーが発生しました。しばらくしてから再度お試しください。');
    } finally {
        // ボタンを元に戻す（エラーの場合のみ）
        setTimeout(() => {
            if (loginBtn.innerHTML.includes('認証中') || loginBtn.innerHTML.includes('エラー')) {
                loginBtn.innerHTML = originalText;
                loginBtn.disabled = false;
                loginBtn.style.background = '';
            }
        }, 2000);
    }
}

/**
 * エラーメッセージ表示
 */
function showError(message) {
    const errorElement = document.getElementById('error-message');
    errorElement.textContent = message;
    errorElement.style.display = 'block';
    errorElement.style.animation = 'shake 0.5s ease-in-out';
    
    // シェイクアニメーション後にクリア
    setTimeout(() => {
        errorElement.style.animation = '';
    }, 500);
}

/**
 * エラーメッセージ非表示
 */
function hideError() {
    const errorElement = document.getElementById('error-message');
    errorElement.style.display = 'none';
}

/**
 * Enterキーでログイン
 */
document.addEventListener('DOMContentLoaded', function() {
    const form = document.getElementById('admin-login-form');
    const inputs = form.querySelectorAll('input');
    
    inputs.forEach(input => {
        input.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') {
                e.preventDefault();
                adminLogin();
            }
        });
    });
    
    // デモアカウント自動入力機能
    setupDemoAccount();
    
    // セキュリティ強化のための追加機能
    setupSecurityFeatures();
});

/**
 * デモアカウント自動入力機能のセットアップ
 */
function setupDemoAccount() {
    const demoCard = document.querySelector('.demo-card');
    if (demoCard) {
        demoCard.addEventListener('click', function() {
            document.getElementById('admin-id').value = 'admin';
            document.getElementById('admin-password').value = 'admin123';
            
            // フィードバック効果
            demoCard.style.transform = 'scale(0.95)';
            demoCard.style.background = 'rgba(46, 204, 113, 0.95)';
            
            setTimeout(() => {
                demoCard.style.transform = 'scale(1)';
                demoCard.style.background = 'rgba(52, 152, 219, 0.95)';
            }, 200);
            
            // フォーカスを最初の入力フィールドに移動
            document.getElementById('admin-id').focus();
        });
        
        // ホバー効果
        demoCard.addEventListener('mouseover', function() {
            demoCard.style.cursor = 'pointer';
            demoCard.style.transform = 'translateY(-2px)';
            demoCard.style.boxShadow = '0 15px 40px rgba(52, 152, 219, 0.4)';
        });
        
        demoCard.addEventListener('mouseout', function() {
            demoCard.style.transform = 'translateY(0)';
            demoCard.style.boxShadow = '0 10px 30px rgba(52, 152, 219, 0.3)';
        });
    }
}

/**
 * セキュリティ機能のセットアップ
 */
function setupSecurityFeatures() {
    let loginAttempts = 0;
    const maxAttempts = 5;
    
    // ログイン試行回数の追跡
    const originalAdminLogin = window.adminLogin;
    window.adminLogin = async function() {
        if (loginAttempts >= maxAttempts) {
            showError(`セキュリティのため、${maxAttempts}回の失敗後はログインが一時的に無効化されています。`);
            return;
        }
        
        try {
            await originalAdminLogin();
        } catch (error) {
            loginAttempts++;
            if (loginAttempts >= maxAttempts) {
                showError('セキュリティ警告: 複数回の失敗によりアクセスが制限されました。');
                // セキュリティログを記録（実装時）
                console.warn('Security Alert: Multiple failed admin login attempts');
            }
            throw error;
        }
    };
    
    // Caps Lock警告
    const passwordInput = document.getElementById('admin-password');
    passwordInput.addEventListener('keyup', function(e) {
        const capsLockOn = e.getModifierState && e.getModifierState('CapsLock');
        if (capsLockOn) {
            showTemporaryWarning('⚠️ Caps Lock がオンになっています');
        }
    });
    
    // セッションタイムアウト警告（実装時用）
    setupSessionWarning();
}

/**
 * 一時的な警告メッセージ表示
 */
function showTemporaryWarning(message) {
    let warningElement = document.getElementById('caps-warning');
    if (!warningElement) {
        warningElement = document.createElement('div');
        warningElement.id = 'caps-warning';
        warningElement.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: linear-gradient(45deg, #f39c12, #e67e22);
            color: white;
            padding: 1rem 1.5rem;
            border-radius: 0.8rem;
            font-size: 1.1rem;
            font-weight: 500;
            box-shadow: 0 4px 15px rgba(243, 156, 18, 0.3);
            z-index: 2000;
            transition: all 0.3s ease;
        `;
        document.body.appendChild(warningElement);
    }
    
    warningElement.textContent = message;
    warningElement.style.display = 'block';
    warningElement.style.opacity = '1';
    
    setTimeout(() => {
        warningElement.style.opacity = '0';
        setTimeout(() => {
            warningElement.style.display = 'none';
        }, 300);
    }, 3000);
}

/**
 * セッション警告のセットアップ
 */
function setupSessionWarning() {
    // セッションタイムアウトの設定（30分）
    const sessionTimeout = 30 * 60 * 1000; // 30分
    const warningTime = 5 * 60 * 1000; // 5分前に警告
    
    setTimeout(() => {
        if (sessionStorage.getItem('adminUser')) {
            showSessionWarning();
        }
    }, sessionTimeout - warningTime);
}

/**
 * セッション警告表示
 */
function showSessionWarning() {
    const warningModal = document.createElement('div');
    warningModal.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0, 0, 0, 0.7);
        display: flex;
        justify-content: center;
        align-items: center;
        z-index: 3000;
    `;
    
    warningModal.innerHTML = `
        <div style="
            background: white;
            padding: 2rem;
            border-radius: 1rem;
            text-align: center;
            max-width: 400px;
            box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
        ">
            <h3 style="color: #e67e22; margin-bottom: 1rem;">⚠️ セッション警告</h3>
            <p style="margin-bottom: 2rem; color: #2c3e50;">
                セッションがまもなく期限切れになります。<br>
                継続しますか？
            </p>
            <div style="display: flex; gap: 1rem; justify-content: center;">
                <button onclick="extendSession()" style="
                    background: linear-gradient(45deg, #27ae60, #2ecc71);
                    color: white;
                    border: none;
                    padding: 0.8rem 1.5rem;
                    border-radius: 0.5rem;
                    cursor: pointer;
                ">継続</button>
                <button onclick="logout()" style="
                    background: linear-gradient(45deg, #e74c3c, #c0392b);
                    color: white;
                    border: none;
                    padding: 0.8rem 1.5rem;
                    border-radius: 0.5rem;
                    cursor: pointer;
                ">ログアウト</button>
            </div>
        </div>
    `;
    
    document.body.appendChild(warningModal);
    
    // 自動ログアウト
    setTimeout(() => {
        if (document.body.contains(warningModal)) {
            logout();
        }
    }, 5 * 60 * 1000); // 5分後に自動ログアウト
}

/**
 * セッション延長
 */
function extendSession() {
    const warningModal = document.querySelector('[style*="position: fixed"][style*="z-index: 3000"]');
    if (warningModal) {
        warningModal.remove();
    }
    
    // セッションを延長（実装時にサーバーサイドでも処理）
    sessionStorage.setItem('sessionExtended', new Date().toISOString());
    
    showTemporaryWarning('✅ セッションが延長されました');
}

/**
 * ログアウト
 */
function logout() {
    sessionStorage.clear();
    localStorage.clear();
    window.location.href = '/login-select';
}

/**
 * ページ読み込み時のアニメーション
 */
window.addEventListener('load', function() {
    // ヘッダーのアニメーション
    const header = document.querySelector('.header');
    header.style.opacity = '0';
    header.style.transform = 'translateY(-20px)';
    header.style.transition = 'all 0.6s ease';
    
    setTimeout(() => {
        header.style.opacity = '1';
        header.style.transform = 'translateY(0)';
    }, 200);
    
    // フォームのフォーカス
    setTimeout(() => {
        document.getElementById('admin-id').focus();
    }, 800);
});

/**
 * CSS アニメーション追加
 */
const style = document.createElement('style');
style.textContent = `
    @keyframes shake {
        0%, 100% { transform: translateX(0); }
        25% { transform: translateX(-5px); }
        75% { transform: translateX(5px); }
    }
    
    @keyframes pulse {
        0%, 100% { transform: scale(1); }
        50% { transform: scale(1.05); }
    }
`;
document.head.appendChild(style);