/**
 * 管理者ログイン機能
 * 園職員専用の認証システム
 * 
 * @author Yujiro Muraoka
 */

/**
 * 管理者ログイン処理を実行する関数
 * 管理者IDとパスワードを検証し、認証成功時は管理者ダッシュボードへリダイレクト
 * @returns {void}
 */
function adminLogin() {
    // DOM要素の取得
    const adminIdInput = document.getElementById('adminId');
    const passwordInput = document.getElementById('password');
    const errorMessageElement = document.getElementById('error-message');

    // 入力フィールドの存在確認
    if (!adminIdInput || !passwordInput || !errorMessageElement) {
        console.error('必要なDOM要素が見つかりません');
        return;
    }

    // 入力値の取得
    const adminId = adminIdInput.value.trim();
    const password = passwordInput.value.trim();

    // 入力値のバリデーション
    if (!adminId || !password) {
        errorMessageElement.textContent = '管理者IDとパスワードを入力してください。';
        return;
    }

    // 入力値の長さチェック
    if (adminId.length < 3 || password.length < 3) {
        errorMessageElement.textContent = '管理者IDとパスワードは3文字以上で入力してください。';
        return;
    }

    // エラーメッセージをクリア
    errorMessageElement.textContent = '';

    // サーバーに管理者認証リクエストを送信
    fetch('/adminAuthentication', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            adminId: adminId,
            password: password
        }),
    })
    .then(response => {
        // HTTPレスポンスの確認
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        return response.json();
    })
    .then(data => {
        // 認証結果の処理
        if (data.success) {
            // セッション用Cookieの設定（管理者用、1時間有効）
            const expires = new Date();
            expires.setTime(expires.getTime() + (60 * 60 * 1000)); // 1時間
            document.cookie = `adminId=${adminId}; expires=${expires.toUTCString()}; path=/`;
            document.cookie = `adminRole=${data.adminRole}; expires=${expires.toUTCString()}; path=/`;
            document.cookie = `adminName=${encodeURIComponent(data.adminName)}; expires=${expires.toUTCString()}; path=/`;
            
            // 管理者ダッシュボードへリダイレクト
            window.location.href = '/admin-dashboard';
        } else {
            // 認証失敗時のエラー表示
            errorMessageElement.textContent = data.message || '管理者IDまたはパスワードが正しくありません。';
        }
    })
    .catch(error => {
        // エラーハンドリング
        console.error('管理者認証エラー:', error);
        errorMessageElement.textContent = 'サーバーエラーが発生しました。しばらくしてからもう一度お試しください。';
    });
}

/**
 * Enterキーでログインを実行する機能
 * パスワードフィールドでEnterキーが押された時にログイン処理を実行
 */
document.addEventListener('DOMContentLoaded', function() {
    const passwordInput = document.getElementById('password');
    const adminIdInput = document.getElementById('adminId');
    
    if (passwordInput) {
        passwordInput.addEventListener('keypress', function(event) {
            if (event.key === 'Enter') {
                adminLogin();
            }
        });
    }
    
    if (adminIdInput) {
        adminIdInput.addEventListener('keypress', function(event) {
            if (event.key === 'Enter') {
                adminLogin();
            }
        });
    }
});