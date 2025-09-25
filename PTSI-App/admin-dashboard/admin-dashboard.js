/**
 * 管理者ダッシュボード機能
 * 予約管理、学生情報管理、統計表示等の管理者向け機能
 * 
 * @author Yujiro Muraoka
 */

let currentAdmin = null;
let reservationsData = [];
let studentsData = [];

/**
 * ページ読み込み時の初期化処理
 * 管理者認証状態をチェックし、未認証の場合は管理者ログインページへリダイレクト
 */
window.onload = function() {
    const adminId = getCookie("adminId");
    const adminName = getCookie("adminName");
    const adminRole = getCookie("adminRole");
    
    if (!adminId || !adminName || !adminRole) {
        // 未認証の場合は管理者ログインページへリダイレクト
        console.log("未認証管理者：管理者ログインページへリダイレクト");
        location.href = "../admin-login";
        return;
    }
    
    // 管理者情報を設定
    currentAdmin = {
        id: adminId,
        name: decodeURIComponent(adminName),
        role: adminRole
    };
    
    // 画面を初期化
    document.getElementById('current-admin').textContent = `管理者: ${currentAdmin.name}`;
    
    // データを読み込み
    loadDashboardData();
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
        while (cookie.charAt(0) === ' ') {
            cookie = cookie.substring(1, cookie.length);
        }
        if (cookie.indexOf(nameEQ) === 0) {
            return cookie.substring(nameEQ.length, cookie.length);
        }
    }
    return "";
}

/**
 * 管理者ログアウト処理
 * Cookieを削除して管理者ログインページにリダイレクト
 * @returns {void}
 */
function adminLogout() {
    // Cookieを削除するために有効期限を過去の日付に設定
    const date = new Date();
    date.setTime(date.getTime() - (24 * 60 * 60 * 1000));
    const expires = "expires=" + date.toUTCString();

    // 管理者関連のCookieを削除
    document.cookie = "adminId=; " + expires + "; path=/";
    document.cookie = "adminName=; " + expires + "; path=/";
    document.cookie = "adminRole=; " + expires + "; path=/";
    
    // 管理者ログインページにリダイレクト
    location.href = "../admin-login";
}

/**
 * セクション表示の切り替え
 * @param {string} sectionName - 表示するセクション名
 * @returns {void}
 */
function showSection(sectionName) {
    // すべてのセクションを非表示
    const sections = document.querySelectorAll('.content-section');
    sections.forEach(section => section.classList.remove('active'));
    
    // すべてのメニューアイテムを非アクティブ
    const menuItems = document.querySelectorAll('.menu-item');
    menuItems.forEach(item => item.classList.remove('active'));
    
    // 指定されたセクションを表示
    const targetSection = document.getElementById(`${sectionName}-section`);
    if (targetSection) {
        targetSection.classList.add('active');
    }
    
    // 対応するメニューアイテムをアクティブ
    const targetMenuItem = document.querySelector(`[onclick="showSection('${sectionName}')"]`);
    if (targetMenuItem) {
        targetMenuItem.classList.add('active');
    }
    
    // セクション固有のデータ読み込み
    if (sectionName === 'reservations') {
        loadReservations();
    } else if (sectionName === 'students') {
        loadStudents();
    }
}

/**
 * ダッシュボードデータの読み込み
 * 統計情報と最近の活動を取得
 * @returns {void}
 */
function loadDashboardData() {
    // 統計情報を取得
    fetch('/admin/stats')
        .then(response => response.json())
        .then(data => {
            document.getElementById('today-reservations').textContent = data.todayReservations || 0;
            document.getElementById('total-students').textContent = data.totalStudents || 0;
            document.getElementById('total-reservations').textContent = data.totalReservations || 0;
        })
        .catch(error => {
            console.error('統計データの取得に失敗:', error);
        });
    
    // 最近の活動を取得
    fetch('/admin/recent-activities')
        .then(response => response.json())
        .then(data => {
            displayRecentActivities(data.activities || []);
        })
        .catch(error => {
            console.error('最近の活動データの取得に失敗:', error);
            document.getElementById('recent-activities').innerHTML = '<p>データの取得に失敗しました。</p>';
        });
}

/**
 * 最近の活動を画面に表示
 * @param {Array} activities - 活動データの配列
 * @returns {void}
 */
function displayRecentActivities(activities) {
    const container = document.getElementById('recent-activities');
    
    if (activities.length === 0) {
        container.innerHTML = '<p>最近の活動はありません。</p>';
        return;
    }
    
    const html = activities.map(activity => `
        <div class="activity-item">
            <div class="activity-text">${activity.text}</div>
            <div class="activity-time">${activity.time}</div>
        </div>
    `).join('');
    
    container.innerHTML = html;
}

/**
 * 予約データの読み込み
 * @returns {void}
 */
function loadReservations() {
    fetch('/admin/reservations')
        .then(response => response.json())
        .then(data => {
            reservationsData = data.reservations || [];
            displayReservations(reservationsData);
        })
        .catch(error => {
            console.error('予約データの取得に失敗:', error);
            document.getElementById('reservations-table').innerHTML = '<p>データの取得に失敗しました。</p>';
        });
}

/**
 * 予約データを画面に表示
 * @param {Array} reservations - 予約データの配列
 * @returns {void}
 */
function displayReservations(reservations) {
    const container = document.getElementById('reservations-table');
    
    if (reservations.length === 0) {
        container.innerHTML = '<p>予約データがありません。</p>';
        return;
    }
    
    const html = `
        <table class="table">
            <thead>
                <tr>
                    <th>学生ID</th>
                    <th>学生名</th>
                    <th>日付</th>
                    <th>種類</th>
                    <th>詳細</th>
                </tr>
            </thead>
            <tbody>
                ${reservations.map(reservation => `
                    <tr>
                        <td>${reservation.studentId}</td>
                        <td>${reservation.studentName}</td>
                        <td>${reservation.date}</td>
                        <td><span class="status-badge ${getStatusClass(reservation.type)}">${getTypeLabel(reservation.type)}</span></td>
                        <td>${getTypeDetail(reservation.type)}</td>
                    </tr>
                `).join('')}
            </tbody>
        </table>
    `;
    
    container.innerHTML = html;
}

/**
 * 学生データの読み込み
 * @returns {void}
 */
function loadStudents() {
    fetch('/admin/students')
        .then(response => response.json())
        .then(data => {
            studentsData = data.students || [];
            displayStudents(studentsData);
        })
        .catch(error => {
            console.error('学生データの取得に失敗:', error);
            document.getElementById('students-table').innerHTML = '<p>データの取得に失敗しました。</p>';
        });
}

/**
 * 学生データを画面に表示
 * @param {Array} students - 学生データの配列
 * @returns {void}
 */
function displayStudents(students) {
    const container = document.getElementById('students-table');
    
    if (students.length === 0) {
        container.innerHTML = '<p>学生データがありません。</p>';
        return;
    }
    
    const html = `
        <table class="table">
            <thead>
                <tr>
                    <th>学生ID</th>
                    <th>氏名</th>
                    <th>保育形態</th>
                    <th>遅刻回数</th>
                    <th>早退回数</th>
                    <th>お迎え遅れ</th>
                </tr>
            </thead>
            <tbody>
                ${students.map(student => `
                    <tr>
                        <td>${student.studentId}</td>
                        <td>${student.name}</td>
                        <td>${student.type}</td>
                        <td>${student.lateCount}</td>
                        <td>${student.earlyCount}</td>
                        <td>${student.latePickUpCount}</td>
                    </tr>
                `).join('')}
            </tbody>
        </table>
    `;
    
    container.innerHTML = html;
}

/**
 * 予約種類からCSSクラスを取得
 * @param {string} type - 予約種類
 * @returns {string} CSSクラス名
 */
function getStatusClass(type) {
    if (type.startsWith('type1')) return 'status-late';
    if (type.startsWith('type2')) return 'status-early';
    if (type.startsWith('type3')) return 'status-absent';
    if (type.startsWith('type4')) return 'status-extended';
    return '';
}

/**
 * 予約種類からラベルを取得
 * @param {string} type - 予約種類
 * @returns {string} ラベル文字列
 */
function getTypeLabel(type) {
    if (type.startsWith('type1')) return '遅刻申請';
    if (type.startsWith('type2')) return '早退申請';
    if (type.startsWith('type3')) return '欠席申請';
    if (type.startsWith('type4')) return '延長保育';
    return type;
}

/**
 * 予約種類から詳細情報を取得
 * @param {string} type - 予約種類
 * @returns {string} 詳細情報
 */
function getTypeDetail(type) {
    const details = {
        'type1-10to11': '10時から11時',
        'type1-11to12': '11時から12時',
        'type1-12to13': '12時から13時',
        'type1-13to14': '13時から14時',
        'type1-14to15': '14時から15時',
        'type2-10to11': '10時から11時',
        'type2-11to12': '11時から12時',
        'type2-12to13': '12時から13時',
        'type2-13to14': '13時から14時',
        'type2-14to15': '14時から15時',
        'type4-1': '早朝預かり（￥300円）',
        'type4-2': '17時まで（￥300円）',
        'type4-3': '18時まで（￥600円）',
        'type4-4': '18時30分まで（￥800円）'
    };
    return details[type] || '';
}

/**
 * 予約フィルタリング処理
 * @returns {void}
 */
function filterReservations() {
    const dateFilter = document.getElementById('date-filter').value;
    const typeFilter = document.getElementById('type-filter').value;
    
    let filteredData = reservationsData;
    
    if (dateFilter) {
        filteredData = filteredData.filter(r => r.date === dateFilter);
    }
    
    if (typeFilter) {
        filteredData = filteredData.filter(r => r.type.startsWith(typeFilter));
    }
    
    displayReservations(filteredData);
}

/**
 * 学生検索処理
 * @returns {void}
 */
function searchStudents() {
    const searchTerm = document.getElementById('student-search').value.toLowerCase();
    
    if (!searchTerm) {
        displayStudents(studentsData);
        return;
    }
    
    const filteredData = studentsData.filter(student => 
        student.name.toLowerCase().includes(searchTerm) || 
        student.studentId.toLowerCase().includes(searchTerm)
    );
    
    displayStudents(filteredData);
}

/**
 * 学生データの更新
 * @returns {void}
 */
function refreshStudents() {
    loadStudents();
}

/**
 * 予約データのCSV出力
 * @returns {void}
 */
function exportReservations() {
    if (reservationsData.length === 0) {
        alert('出力するデータがありません。');
        return;
    }
    
    const csv = convertToCSV(reservationsData);
    downloadCSV(csv, 'reservations.csv');
}

/**
 * データをCSV形式に変換
 * @param {Array} data - データ配列
 * @returns {string} CSV文字列
 */
function convertToCSV(data) {
    const headers = ['学生ID', '学生名', '日付', '種類', '詳細'];
    const rows = data.map(item => [
        item.studentId,
        item.studentName,
        item.date,
        getTypeLabel(item.type),
        getTypeDetail(item.type)
    ]);
    
    const csvContent = [headers, ...rows]
        .map(row => row.map(field => `"${field}"`).join(','))
        .join('\n');
    
    return csvContent;
}

/**
 * CSVファイルをダウンロード
 * @param {string} csv - CSV文字列
 * @param {string} filename - ファイル名
 * @returns {void}
 */
function downloadCSV(csv, filename) {
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    
    if (link.download !== undefined) {
        const url = URL.createObjectURL(blob);
        link.setAttribute('href', url);
        link.setAttribute('download', filename);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    }
}

/**
 * チャットページへ移動
 * @returns {void}
 */
function goToChat() {
    window.location.href = '/chat';
}