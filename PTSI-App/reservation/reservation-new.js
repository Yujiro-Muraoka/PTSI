/**
 * ページ読み込み時の初期化処理
 * ログイン状態をチェックし、未ログインの場合はログインページへリダイレクト
 */
window.onload = function() {
    const studentID = getCookie("studentID");
    
    if (studentID !== "") {
        // ログイン済み：学生情報を取得して画面を初期化
        console.log("認証済みユーザー: " + studentID);
        getStudentInfo(studentID);
    } else {
        // 未ログイン：ログインページへリダイレクト
        console.log("未認証ユーザー：ログインページへリダイレクト");
        location.href = "../login";
    }
}

/**
 * チャットページへ移動する関数
 * @returns {void}
 */
function goToChat() {
    window.location.href = "/chat";
}
  
/**
 * Cookieから指定された名前の値を取得する関数
 * @param {string} name - 取得するCookieの名前
 * @returns {string} Cookieの値（見つからない場合は空文字）
 */
function getCookie(name) {
    const nameEQ = name + "=";
    const cookies = document.cookie.split(';');
    
    for (let i = 0; i < cookies.length; i++) {
        let cookie = cookies[i];
        // 先頭の空白を削除
        while (cookie.charAt(0) === ' ') {
            cookie = cookie.substring(1, cookie.length);
        }
        // 指定された名前のCookieを発見した場合、値を返す
        if (cookie.indexOf(nameEQ) === 0) {
            return cookie.substring(nameEQ.length, cookie.length);
        }
    }
    return "";
}

// 今日の日付をデフォルト値として設定
document.getElementById('date').valueAsDate = new Date();

// 予約オプションのキャッシュ
let reservationOptions = {};

/**
 * 指定日の予約オプションを取得
 */
async function loadReservationOptions(date) {
    try {
        const response = await fetch(`/api/reservation-options/${date}`);
        if (response.ok) {
            reservationOptions = await response.json();
        } else {
            console.warn('予約オプションの取得に失敗しました。デフォルト設定を使用します。');
            reservationOptions = getDefaultReservationOptions();
        }
    } catch (error) {
        console.error('予約オプション取得エラー:', error);
        reservationOptions = getDefaultReservationOptions();
    }
}

/**
 * デフォルト予約オプションを取得
 */
function getDefaultReservationOptions() {
    return {
        lateArrival: ['10時から11時', '11時から12時', '12時から13時', '13時から14時', '14時から15時'],
        earlyDeparture: ['10時から11時', '11時から12時', '12時から13時', '13時から14時', '14時から15時'],
        childcare: ['朝預かり (7:30-8:30)', '午後預かり (14:00-18:00)', '一日預かり (7:30-18:00)'],
        extendedCare: ['18時から19時', '19時から20時', '緊急延長']
    };
}

/**
 * 動的オプションを生成
 */
function generateDynamicOptions(container, title, options, typePrefix) {
    if (!options || options.length === 0) {
        container.innerHTML = `<p class="no-options">３：${title} - 本日は受付停止中です</p>`;
        return;
    }
    
    let html = `<p>３：${title}</p>`;
    options.forEach((option, index) => {
        const value = `${typePrefix}-${index + 1}`;
        html += `
            <label class="Radio">
                <input name="radio" class="Radio-Input" type="radio" value="${value}">
                <span class="Radio-Text">${option}</span>
            </label>
        `;
    });
    
    container.innerHTML = html;
}

/**
 * 予約タイプの変更を処理
 */
function handleReservationTypeChange(selectedValue, container) {
    // 以前の選択内容をクリア
    container.innerHTML = '';

    switch (selectedValue) {
        case 'type1':
            generateDynamicOptions(container, '遅刻申請', reservationOptions.lateArrival || [], 'type1');
            break;
        case 'type2':
            generateDynamicOptions(container, '早退申請', reservationOptions.earlyDeparture || [], 'type2');
            break;
        case 'type3':
            generateDynamicOptions(container, '預かり保育予約', reservationOptions.childcare || [], 'type3');
            break;
        case 'type4':
            generateDynamicOptions(container, '延長保育予約', reservationOptions.extendedCare || [], 'type4');
            break;
        default:
            container.innerHTML = '<p>予約タイプを選択してください。</p>';
            break;
    }
}

/**
 * 申し込み形式の選択に応じて表示項目を動的に変更する
 * DOMが読み込まれた後にイベントリスナーを設定
 */
document.addEventListener('DOMContentLoaded', function () {
    const radioButtons = document.querySelectorAll('.Radio-Input');
    const newRadioContainer = document.getElementById('white-box');
    const dateInput = document.getElementById('date');
    
    // 日付変更時に予約オプションを更新
    dateInput.addEventListener('change', async function() {
        const selectedDate = this.value;
        if (selectedDate) {
            await loadReservationOptions(selectedDate);
            // 現在選択されている予約タイプがあれば再表示
            const selectedType = document.querySelector('input[name="radio"]:checked');
            if (selectedType && selectedType.value.startsWith('type')) {
                handleReservationTypeChange(selectedType.value, newRadioContainer);
            }
        }
    });
    
    // 初期日付の予約オプションを読み込み
    const initialDate = dateInput.value || new Date().toISOString().split('T')[0];
    loadReservationOptions(initialDate);

    radioButtons.forEach(function (radioButton) {
        radioButton.addEventListener('change', function (event) {
            const selectedValue = event.target.value;
            handleReservationTypeChange(selectedValue, newRadioContainer);
        });
    });
});

/**
 * 学生情報を取得して画面に表示する関数
 * @param {string} studentID - 学生ID
 */
function getStudentInfo(studentID) {
    fetch('/studentInfo', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ studentID: studentID })
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            // 学生情報を画面に表示
            const studentName = data.student.name;
            const studentClass = data.student.class;
            
            // 学生情報を画面に反映（この部分は既存のコードに従って実装）
            if (document.querySelector('.student-info')) {
                document.querySelector('.student-info').innerHTML = 
                    `<p>学生名: ${studentName}</p><p>クラス: ${studentClass}</p>`;
            }
        } else {
            console.error('学生情報の取得に失敗しました:', data.message);
        }
    })
    .catch(error => {
        console.error('学生情報取得エラー:', error);
    });
}

/**
 * 送信ボタンクリック時の処理
 */
function submitForm() {
    const form = document.getElementById('myForm');
    const formData = new FormData(form);
    
    // 必要なデータを取得
    const date = formData.get('date');
    const selectedOption = formData.get('radio');
    
    if (!date) {
        alert('日付を入力してください。');
        return;
    }
    
    if (!selectedOption) {
        alert('予約タイプを選択してください。');
        return;
    }
    
    // フォーム送信処理（既存のロジックを維持）
    const studentID = getCookie("studentID");
    
    fetch('/submit', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
            studentID: studentID,
            date: date,
            type: selectedOption
        })
    })
    .then(response => response.text())
    .then(data => {
        alert('予約が完了しました。');
        console.log('Success:', data);
    })
    .catch(error => {
        console.error('Error:', error);
        alert('予約に失敗しました。');
    });
}

/**
 * ログアウト処理
 */
function logout() {
    // Cookieをクリア
    document.cookie = "studentID=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
    // ログインページにリダイレクト
    window.location.href = "/login-select";
}