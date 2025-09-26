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
            const selectedType = document.querySelector('.Radio-Input:checked');
            if (selectedType) {
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
                    newRadioContainer.innerHTML =
                        `
                        <p>３：早退申請</p>
                        <label class="Radio">
                            <input name="radio" class="Radio-Input" type="radio" value="type2-10to11">
                            <span class="Radio-Text">10時から11時</span>
                        </label>
                        <label class="Radio">
                            <input name="radio" class="Radio-Input" type="radio" value="type2-11to12">
                            <span class="Radio-Text">11時から12時</span>
                        </label>
                        <label class="Radio">
                            <input name="radio" class="Radio-Input" type="radio" value="type2-12to13">
                            <span class="Radio-Text">12時から13時</span>
                        </label>
                        <label class="Radio">
                            <input name="radio" class="Radio-Input" type="radio" value="type2-13to14">
                            <span class="Radio-Text">13時から14時</span>
                        </label>
                        <label class="Radio">
                            <input name="radio" class="Radio-Input" type="radio" value="type2-14to15">
                            <span class="Radio-Text">14時から15時</span>
                        </label>
                         `;
                    break;
                case 'type3':
                    newRadioContainer.innerHTML = 
                        `
                        <p>３：預かり保育予約</p>
                        <label class="Radio">
                            <input name="radio" class="Radio-Input" type="radio" value="type3-1">
                            <span class="Radio-Text">午前中（￥800円）</span>
                        </label>
                        <label class="Radio">
                            <input name="radio" class="Radio-Input" type="radio" value="type3-2">
                            <span class="Radio-Text">13時まで（￥1,400円）</span>
                        </label>
                        <label class="Radio">
                            <input name="radio" class="Radio-Input" type="radio" value="type3-3">
                            <span class="Radio-Text">15時まで（￥1,700円）</span>
                        </label>
                        <label class="Radio">
                            <input name="radio" class="Radio-Input" type="radio" value="type3-4">
                            <span class="Radio-Text">17時まで（￥2,100円）</span>
                        </label>
                        `;
                    break;
                case 'type4':
                    newRadioContainer.innerHTML =
                        `
                        <p>３：延長保育予約</p>
                        <label class="Radio">
                            <input name="radio" class="Radio-Input" type="radio" value="type4-1">
                            <span class="Radio-Text">早朝預かり（￥300円）</span>
                        </label>
                        <label class="Radio">
                            <input name="radio" class="Radio-Input" type="radio" value="type4-2">
                            <span class="Radio-Text">17時まで（￥300円）</span>
                        </label>
                        <label class="Radio">
                            <input name="radio" class="Radio-Input" type="radio" value="type4-3">
                            <span class="Radio-Text">18時まで（￥600円）</span>
                        </label>
                        <label class="Radio">
                            <input name="radio" class="Radio-Input" type="radio" value="type4-4">
                            <span class="Radio-Text">18時30分まで（￥800円）</span>
                        </label>
                          `;
                    break;
            }
        });
    });

    /**
     * 新しいラジオボタン要素を動的に生成する関数
     * @param {string} value - ラジオボタンの値
     * @param {string} labelText - ラベルテキスト
     * @returns {void}
     */
    function createNewRadio(value, labelText) {
        const newRadio = document.createElement('input');
        newRadio.type = 'radio';
        newRadio.name = 'newOptions';
        newRadio.value = value;

        const label = document.createElement('label');
        label.textContent = labelText;

        newRadioContainer.appendChild(newRadio);
        newRadioContainer.appendChild(label);
        newRadioContainer.appendChild(document.createElement('br'));
    }
});


/**
 * ユーザーをログアウトさせる関数
 * Cookieを削除してログインページにリダイレクト
 * @returns {void}
 */
function logout() {
    // Cookieを削除するために有効期限を過去の日付に設定
    const date = new Date();
    date.setTime(date.getTime() - (24 * 60 * 60 * 1000)); // 24時間前に設定
    const expires = "expires=" + date.toUTCString();

    // 学生IDのCookieを削除
    document.cookie = "studentID=; " + expires + "; path=/";
    
    // ログインページにリダイレクト
    location.href = "../login";
}


/**
 * 予約データをサーバーに送信する関数
 * フォームの入力値を検証してからサーバーに送信
 * @returns {void}
 */
function sendData() {
    const studentID = getCookie("studentID");
    const dateElement = document.getElementById("date");
    const checkedRadio = document.querySelector('input[name="radio"]:checked');

    // 入力値のバリデーション
    if (!studentID) {
        alert("ログイン情報が見つかりません。再ログインしてください。");
        location.href = "../login";
        return;
    }

    if (!dateElement || !dateElement.value) {
        alert("日付を選択してください。");
        return;
    }

    // 選択日が過去でないかチェック
    const selectedDate = new Date(dateElement.value);
    const today = new Date();
    today.setHours(0, 0, 0, 0); // 時刻をリセット
    
    if (selectedDate < today) {
        alert("過去の日付は選択できません。");
        return;
    }

    if (!checkedRadio) {
        alert("申請種類を選択してください。");
        return;
    }

    const date = dateElement.value;
    const type = checkedRadio.value;

    console.log("予約送信データ:", studentID, date, type);

    const data = {
        studentID: studentID,
        date: date,
        type: type
    };

    // JSONデータをPOSTリクエストで送信
    fetch('/submit', {
    method: 'POST',
    headers: {
        'Content-Type': 'application/json'
    },
    body: JSON.stringify(data)
    })
    .then(response => response.text())
    .then(data => {
    document.getElementById("result").textContent = data;
    })
    .catch(error => {
    console.error('Error:', error);
    });
}

/**
 * 学生情報をサーバーから取得する関数（fetchを使用）
 * @param {string} studentID - 学生ID
 * @returns {void}
 */  
function getStudentInfo(studentID) {
    fetch(`/studentInfo`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ studentID: studentID })
    })
    .then(response => response.json())
    .then(data => {
      console.log("学生情報取得成功:", data);
      // 取得したデータで画面を更新
      fillStudentInfo(data);
    })
    .catch(error => console.error('学生情報取得エラー:', error));
  }
  

/**
 * 取得した学生情報でページの内容を更新する関数
 * @param {Object} jsonData - 学生情報のJSONデータ
 * @param {string} jsonData.name - 学生名
 * @param {string} jsonData.studentID - 学生ID
 * @param {string} jsonData.type - 保育形態
 * @param {number} jsonData.lateCount - 遅刻回数
 * @param {number} jsonData.earlyCount - 早退回数
 * @returns {void}
 */
function fillStudentInfo(jsonData) {
    const container = document.querySelector('.container');
    container.innerHTML = `
      <p class="name">${jsonData.name}</p>
      <p class="student-info">在籍番号：${jsonData.studentID}</p>
      <p class="student-info">保育形態：${jsonData.type}</p>
      <p class="student-info">遅刻回数：${jsonData.lateCount}</p>
      <p class="student-info">早退回数：${jsonData.earlyCount}</p>
      <p class="student-info">お迎え遅れ：${jsonData.latePickUpCount}</p>
    `;
}
  