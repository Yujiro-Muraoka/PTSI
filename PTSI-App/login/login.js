/**
 * ページ読み込み時にテナント情報を表示
 */
document.addEventListener('DOMContentLoaded', function() {
    displayTenantInfo();
});

/**
 * テナント情報を表示する関数
 */
async function displayTenantInfo() {
    const urlParams = new URLSearchParams(window.location.search);
    const tenantId = urlParams.get('tenant');
    
    if (tenantId) {
        try {
            const response = await fetch(`/api/tenants/${tenantId}`);
            const result = await response.json();
            
            if (result.success) {
                const tenantInfo = document.getElementById('tenant-info');
                const tenantName = document.getElementById('tenant-name');
                
                tenantName.textContent = result.tenant.name;
                tenantInfo.style.display = 'block';
                
                // ページタイトルも更新
                document.title = `ログイン - ${result.tenant.name}`;
            }
        } catch (error) {
            console.error('テナント情報の取得に失敗しました:', error);
        }
    }
}

/**
 * ログイン処理を実行する関数
 * 学生IDとパスワードを取得し、サーバーに認証リクエストを送信
 * @returns {void}
 */
function login() {
    // DOM要素の取得
    const studentIdElement = document.getElementById('student-id');
    const passwordElement = document.getElementById('password');

    // 入力フィールドの存在確認
    if (!studentIdElement || !passwordElement) {
        alert('入力フィールドが見つかりません。');
        return;
    }

    // 入力値の取得と正規化
    const studentId = studentIdElement.value.trim();
    const password = passwordElement.value.replace(/\r?\n|\r/g, ''); // 改行文字を削除

    // 入力値のバリデーション
    if (!studentId) {
        alert('学生IDを入力してください。');
        studentIdElement.focus();
        return;
    }

    if (!password) {
        alert('パスワードを入力してください。');
        passwordElement.focus();
        return;
    }

    // サーバーに認証リクエストを送信
    fetch('/passwordAuthentication', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ studentId, password }),
    })
    .then(response => {
        // HTTPレスポンスの確認
        if (!response.ok) {
            throw new Error('ネットワークエラーが発生しました。');
        }
        return response.json();
    })
    .then(data => {
        // 認証結果の処理
        if (data.success) {
            // セッション用Cookieの設定（1時間有効）
            const date = new Date();
            date.setTime(date.getTime() + (60 * 60 * 1000));
            const expires = "expires=" + date.toUTCString();
            
            document.cookie = `studentID=${studentId}; expires=${expires}; path=/`; 
            
            // 予約ページへリダイレクト
            window.location.href = '/reservation';
        } else {
            alert(data.message || 'ログインに失敗しました。');
        }
    })
    .catch(error => {
        // エラーハンドリング
        console.error('ログインエラー:', error);
        alert('ログインに失敗しました。しばらく時間をおいてから再度お試しください。');
    });
}

