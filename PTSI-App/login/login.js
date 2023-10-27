function login() {
    const studentId = document.getElementById('student-id').value;
    const password = document.getElementById('password').value.replace(/\r?\n|\r/g, ''); // 改行文字を削除

    fetch('/passwordAuthentication', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ studentId, password }),
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            const date = new Date();
            date.setTime(date.getTime() + (60 * 60 * 1000)); // 1時間後
            const expires = "expires=" + date.toUTCString();
            
            // CookieにstudentIDを保存（有効期限とパスを追加）
            document.cookie = `studentID=${studentId}; expires=${expires}; path=/`; 
            window.location.href = '/reservation';
        } else {
            alert(data.message);
        }
    })
    .catch(error => console.error('エラー:', error));
}

