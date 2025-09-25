function login() {
    const studentIdElement = document.getElementById('student-id');
    const passwordElement = document.getElementById('password');

    if (!studentIdElement || !passwordElement) {
        alert('入力フィールドが見つかりません。');
        return;
    }

    const studentId = studentIdElement.value.trim();
    const password = passwordElement.value.replace(/\r?\n|\r/g, ''); // 改行文字を削除

    // バリデーションチェック
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

    fetch('/passwordAuthentication', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ studentId, password }),
    })
    .then(response => {
        if (!response.ok) {
            throw new Error('ネットワークエラーが発生しました。');
        }
        return response.json();
    })
    .then(data => {
        if (data.success) {
            const date = new Date();
            date.setTime(date.getTime() + (60 * 60 * 1000)); // 1時間後
            const expires = "expires=" + date.toUTCString();
            
            // CookieにstudentIDを保存（有効期限とパスを追加）
            document.cookie = `studentID=${studentId}; expires=${expires}; path=/`; 
            window.location.href = '/reservation';
        } else {
            alert(data.message || 'ログインに失敗しました。');
        }
    })
    .catch(error => {
        console.error('ログインエラー:', error);
        alert('ログインに失敗しました。しばらく時間をおいてから再度お試しください。');
    });
}

