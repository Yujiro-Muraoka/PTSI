// ページが読み込まれた際に実行する関数
window.onload = function() {
    var studentID = getCookie("studentID");
    if (studentID !== "") {
      // ログイン状態にする処理
      console.log("Cookie発見"+studentID);
      getStudentInfo(studentID);

    }
    else {
        // ログインページにリダイレクトする処理
        console.log("Cookieなし");
        location.href = "../login";
        // alert("ログインしてください。");

    }
}
  
function getCookie(name) {
    var decodedCookie = decodeURIComponent(document.cookie);
    var cookies = decodedCookie.split(';');
    for (var i = 0; i < cookies.length; i++) {
        var cookie = cookies[i];
        while (cookie.charAt(0) == ' ') {
            cookie = cookie.substring(1);
        }
        if (cookie.indexOf(name + '=') == 0) {
            return cookie.substring(name.length + 1, cookie.length); // '='以降の部分を返す
        }
    }
    return "";
}
  
//  今日の日付をデフォルトにする
document.getElementById('date').valueAsDate = new Date();


// 申し込み形式の選択によって表示する項目を変更する
document.addEventListener('DOMContentLoaded', function () {
    const radioButtons = document.querySelectorAll('.Radio-Input');
    const newRadioContainer = document.getElementById('white-box');

    radioButtons.forEach(function (radioButton) {
        radioButton.addEventListener('change', function (event) {
            const selectedValue = event.target.value;
            const selectedText = event.target.nextElementSibling.textContent;

            newRadioContainer.innerHTML = ''; // 以前の要素をクリア

            switch (selectedValue) {
                case 'type1':
                    newRadioContainer.innerHTML =
                        `
                        <p>３：遅刻申請</p>
                        <label class="Radio">
                            <input name="radio" class="Radio-Input" type="radio" value="type1-10to11">
                            <span class="Radio-Text">10時から11時</span>
                        </label>
                        <label class="Radio">
                            <input name="radio" class="Radio-Input" type="radio" value="type1-11to12">
                            <span class="Radio-Text">11時から12時</span>
                        </label>
                        <label class="Radio">
                            <input name="radio" class="Radio-Input" type="radio" value="type1-12to13">
                            <span class="Radio-Text">12時から13時</span>
                        </label>
                        <label class="Radio">
                            <input name="radio" class="Radio-Input" type="radio" value="type1-13to14">
                            <span class="Radio-Text">13時から14時</span>
                        </label>
                        <label class="Radio">
                            <input name="radio" class="Radio-Input" type="radio" value="type1-14to15">
                            <span class="Radio-Text">14時から15時</span>
                        </label>
                        `;
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
                    newRadioContainer.innerHTML += 
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
                            <span class="Radio-Text">17時まで（￥2,1000円）</span>
                        </label>
                        `
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

    function createNewRadio(value, labelText) {
        var newRadio = document.createElement('input');
        newRadio.type = 'radio';
        newRadio.name = 'newOptions';
        newRadio.value = value;

        var label = document.createElement('label');
        label.textContent = labelText;

        newRadioContainer.appendChild(newRadio);
        newRadioContainer.appendChild(label);
        newRadioContainer.appendChild(document.createElement('br'));
    }
});


function logout() {
    // Cookieを削除するために有効期限を過去の日付に設定
    var date = new Date();
    date.setTime(date.getTime() - (24 * 60 * 60 * 1000)); // 昨日の日付に設定
    var expires = "expires=" + date.toUTCString();

    // Cookieを削除
    document.cookie = "studentID=; " + expires + "; path=/";
    
    // alert("ログアウトしました。");
    // ログアウト後の処理（例：ログインページにリダイレクト）
    location.href = "../login";
}


function sendData() {
    // var studentID = document.getElementById("student-id").innerHTML;
    var studentID = getCookie("studentID");
    var date = document.getElementById("date").value;
    var type = document.querySelector('input[name="radio"]:checked').value;

    console.log(studentID+ " " + date + " " + type)

    var data = {
        studentID : studentID,
        date : date,
        type : type
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
      // 取得したJSONデータを使って何かしらの処理を行う
      console.log(data); // 例: データをコンソールに表示する
      // ここに取得したデータを利用するコードを追加
      fillStudentInfo(data);
    })
    .catch(error => console.error('エラー:', error));
  }
  

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
  