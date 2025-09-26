/**
 * 保護者ログインページのJavaScript
 */

/**
 * 保護者ログイン処理
 */
async function parentLogin() {
    const studentId = document.getElementById('student-id').value.trim();
    const password = document.getElementById('password').value.trim();
    const errorElement = document.getElementById('error-message');
    
    // バリデーション
    if (!studentId || !password) {
        showError('学生IDとパスワードを入力してください。');
        return;
    }
    
    // ローディング状態の設定
    const loginBtn = document.querySelector('.login-btn');
    const originalText = loginBtn.innerHTML;
    loginBtn.innerHTML = '<span class="btn-icon">⏳</span>ログイン中...';
    loginBtn.disabled = true;
    
    try {
        // サーバーに認証リクエストを送信
        const response = await fetch('/login', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                studentId: studentId,
                password: password,
                loginType: 'parent'
            })
        });
        
        const result = await response.json();
        
        if (result.success) {
            // ログイン成功
            hideError();
            
            // 成功メッセージ表示
            loginBtn.innerHTML = '<span class="btn-icon">✅</span>ログイン成功！';
            loginBtn.style.background = 'linear-gradient(45deg, #4CAF50, #66BB6A)';
            
            // セッション情報を保存
            if (result.user) {
                sessionStorage.setItem('parentUser', JSON.stringify(result.user));
            }
            
            // フェードアウト効果でリダイレクト
            setTimeout(() => {
                document.body.style.opacity = '0.8';
                document.body.style.transition = 'opacity 0.3s ease';
                
                setTimeout(() => {
                    // 保護者用のメインページにリダイレクト
                    window.location.href = result.redirectUrl || '/reservation';
                }, 300);
            }, 1000);
            
        } else {
            // ログイン失敗
            showError(result.message || 'ログインに失敗しました。学生IDとパスワードを確認してください。');
        }
        
    } catch (error) {
        console.error('Login error:', error);
        showError('ネットワークエラーが発生しました。しばらくしてから再度お試しください。');
    } finally {
        // ボタンを元に戻す（エラーの場合のみ）
        setTimeout(() => {
            if (loginBtn.innerHTML.includes('ログイン中') || loginBtn.innerHTML.includes('エラー')) {
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
    const form = document.getElementById('parent-login-form');
    const inputs = form.querySelectorAll('input');
    
    inputs.forEach(input => {
        input.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') {
                e.preventDefault();
                parentLogin();
            }
        });
    });
    
    // デモアカウント自動入力
    const demoButton = createDemoButton();
    const formContainer = document.querySelector('.login-form-container');
    formContainer.appendChild(demoButton);
});

/**
 * デモアカウント自動入力ボタンを作成
 */
function createDemoButton() {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'demo-fill-btn';
    button.innerHTML = '💡 デモアカウント自動入力';
    button.style.cssText = `
        background: linear-gradient(45deg, #2196F3, #03A9F4);
        color: white;
        border: none;
        padding: 0.8rem 1.5rem;
        font-size: 1.2rem;
        border-radius: 0.6rem;
        cursor: pointer;
        margin-top: 1rem;
        width: 100%;
        transition: all 0.3s ease;
    `;
    
    button.addEventListener('click', function() {
        document.getElementById('student-id').value = '22001';
        document.getElementById('password').value = '22001';
        
        // ボタンのフィードバック
        const originalText = button.innerHTML;
        button.innerHTML = '✅ 入力完了！';
        button.style.background = 'linear-gradient(45deg, #4CAF50, #66BB6A)';
        
        setTimeout(() => {
            button.innerHTML = originalText;
            button.style.background = 'linear-gradient(45deg, #2196F3, #03A9F4)';
        }, 1500);
    });
    
    button.addEventListener('mouseover', function() {
        button.style.transform = 'translateY(-2px)';
        button.style.boxShadow = '0 8px 25px rgba(33, 150, 243, 0.3)';
    });
    
    button.addEventListener('mouseout', function() {
        button.style.transform = 'translateY(0)';
        button.style.boxShadow = 'none';
    });
    
    return button;
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
        document.getElementById('student-id').focus();
    }, 800);
});

/**
 * パスワード表示切り替え機能（将来の機能拡張用）
 */
function togglePasswordVisibility() {
    const passwordInput = document.getElementById('password');
    const toggleBtn = document.querySelector('.password-toggle');
    
    if (passwordInput.type === 'password') {
        passwordInput.type = 'text';
        toggleBtn.innerHTML = '🙈';
    } else {
        passwordInput.type = 'password';
        toggleBtn.innerHTML = '👁️';
    }
}

/**
 * フォーム入力のリアルタイムバリデーション
 */
document.addEventListener('DOMContentLoaded', function() {
    const studentIdInput = document.getElementById('student-id');
    const passwordInput = document.getElementById('password');
    
    studentIdInput.addEventListener('input', function() {
        const value = this.value.trim();
        if (value && !/^\d+$/.test(value)) {
            this.style.borderColor = '#e74c3c';
            showInputError(this, '学生IDは数字のみで入力してください');
        } else {
            this.style.borderColor = '#4CAF50';
            hideInputError(this);
        }
    });
    
    passwordInput.addEventListener('input', function() {
        const value = this.value.trim();
        if (value.length > 0 && value.length < 3) {
            this.style.borderColor = '#ff9800';
            showInputError(this, 'パスワードは3文字以上で入力してください');
        } else if (value.length >= 3) {
            this.style.borderColor = '#4CAF50';
            hideInputError(this);
        } else {
            this.style.borderColor = '#e9ecef';
            hideInputError(this);
        }
    });
});

/**
 * 入力エラー表示
 */
function showInputError(input, message) {
    let errorSpan = input.nextElementSibling;
    if (!errorSpan || !errorSpan.classList.contains('input-error')) {
        errorSpan = document.createElement('span');
        errorSpan.className = 'input-error';
        errorSpan.style.cssText = `
            color: #e74c3c;
            font-size: 1.1rem;
            margin-top: 0.3rem;
            display: block;
        `;
        input.parentNode.appendChild(errorSpan);
    }
    errorSpan.textContent = message;
}

/**
 * 入力エラー非表示
 */
function hideInputError(input) {
    const errorSpan = input.nextElementSibling;
    if (errorSpan && errorSpan.classList.contains('input-error')) {
        errorSpan.remove();
    }
}

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
`;
document.head.appendChild(style);