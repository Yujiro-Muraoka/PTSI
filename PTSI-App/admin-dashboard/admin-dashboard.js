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
 * ダッシュボードデータを読み込む
 * @returns {void}
 */
function loadDashboardData() {
    // 統計情報を取得
    fetch('/admin/stats')
        .then(response => response.json())
        .then(data => {
            updateBasicStats(data);
            updateClassStats(data.classStats || {});
            updateTrendData(data.trends || {});
        })
        .catch(error => {
            console.error('統計データの取得に失敗:', error);
            // デモデータでフォールバック
            updateBasicStats(generateDemoStats());
            updateClassStats(generateDemoClassStats());
            loadDemoCharts();
        });
    
    // 最近の活動を取得
    fetch('/admin/recent-activities')
        .then(response => response.json())
        .then(data => {
            displayRecentActivities(data.activities || []);
        })
        .catch(error => {
            console.error('最近の活動データの取得に失敗:', error);
            displayRecentActivities(generateDemoActivities());
        });

    // アラートを取得
    loadSystemAlerts();
}

/**
 * 基本統計を更新する
 * @param {Object} data - 統計データ
 * @returns {void}
 */
function updateBasicStats(data) {
    // 今日の予約数
    updateStatCard('today-reservations', data.todayReservations || 0, data.reservationsTrend || '+0');
    
    // 登録学生数
    updateStatCard('total-students', data.totalStudents || 0, data.studentsTrend || '+0');
    
    // 総予約数
    updateStatCard('total-reservations', data.totalReservations || 0, data.totalReservationsTrend || '+0');
    
    // 出席率
    updateStatCard('attendance-rate', data.attendanceRate || '95%', data.attendanceTrend || '+2%');
}

/**
 * 統計カードを更新する
 * @param {string} elementId - 要素ID
 * @param {string|number} value - 値
 * @param {string} trend - トレンド
 * @returns {void}
 */
function updateStatCard(elementId, value, trend) {
    const element = document.getElementById(elementId);
    if (element) {
        element.textContent = value;
    }
    
    const trendElement = document.getElementById(`${elementId}-trend`);
    if (trendElement) {
        trendElement.textContent = trend;
        // トレンドに基づいてクラスを設定
        trendElement.className = 'stat-trend ' + (trend.startsWith('+') ? 'positive' : 
                                                 trend.startsWith('-') ? 'negative' : 'neutral');
    }
}

/**
 * クラス別統計を更新する
 * @param {Object} classStats - クラス別統計データ
 * @returns {void}
 */
function updateClassStats(classStats) {
    const classStatsGrid = document.getElementById('class-stats-grid');
    if (!classStatsGrid) return;

    const classStatsHTML = Object.entries(classStats).map(([className, stats]) => `
        <div class="class-stat-item">
            <h4>${className}</h4>
            <div class="stat-row">
                <span class="stat-label">在籍数</span>
                <span class="stat-value">${stats.enrolled || 0}名</span>
            </div>
            <div class="stat-row">
                <span class="stat-label">今日の出席</span>
                <span class="stat-value">${stats.todayAttendance || 0}名</span>
            </div>
            <div class="stat-row">
                <span class="stat-label">出席率</span>
                <span class="stat-value">${stats.attendanceRate || '0%'}</span>
            </div>
        </div>
    `).join('');

    classStatsGrid.innerHTML = classStatsHTML;
}

/**
 * トレンドデータを更新する
 * @param {Object} trends - トレンドデータ
 * @returns {void}
 */
function updateTrendData(trends) {
    // 月次予約トレンドチャート
    if (trends.monthlyReservations) {
        createMonthlyReservationsChart(trends.monthlyReservations);
    }
    
    // 週次出席率チャート
    if (trends.weeklyAttendance) {
        createWeeklyAttendanceChart(trends.weeklyAttendance);
    }
    
    // クラス別分布チャート
    if (trends.classDistribution) {
        createClassDistributionChart(trends.classDistribution);
    }
}

/**
 * システムアラートを読み込む
 * @returns {void}
 */
function loadSystemAlerts() {
    fetch('/admin/alerts')
        .then(response => response.json())
        .then(data => {
            displaySystemAlerts(data.alerts || []);
        })
        .catch(error => {
            console.error('アラートデータの取得に失敗:', error);
            displaySystemAlerts([]);
        });
}

/**
 * システムアラートを表示する
 * @param {Array<Object>} alerts - アラートデータ
 * @returns {void}
 */
function displaySystemAlerts(alerts) {
    const alertsContainer = document.getElementById('system-alerts');
    if (!alertsContainer) return;
    
    if (!alerts.length) {
        alertsContainer.innerHTML = '<p class="no-alerts">現在のアラートはありません。</p>';
        return;
    }
    
    const alertsHTML = alerts.map(alert => `
        <div class="alert-item ${alert.priority || 'info'}">
            <div class="alert-icon">
                ${getAlertIcon(alert.type)}
            </div>
            <div class="alert-content">
                <div class="alert-title">${alert.title}</div>
                <div class="alert-description">${alert.description}</div>
                <div class="alert-time">${new Date(alert.timestamp).toLocaleString('ja-JP')}</div>
            </div>
        </div>
    `).join('');
    
    alertsContainer.innerHTML = alertsHTML;
}

/**
 * アラートアイコンを取得する
 * @param {string} type - アラートタイプ
 * @returns {string} - アイコンHTML
 */
function getAlertIcon(type) {
    const icons = {
        warning: '⚠️',
        error: '❌',
        info: 'ℹ️',
        success: '✅'
    };
    return icons[type] || icons.info;
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
    if (type.startsWith('type4')) return '延長申請';
    return type;
}

// Chart.js関連の関数
let chartsInstances = {};

/**
 * 月次予約トレンドチャートを作成
 * @param {Object} data - チャートデータ
 * @returns {void}
 */
function createMonthlyReservationsChart(data) {
    const ctx = document.getElementById('monthlyReservationsChart');
    if (!ctx) return;

    // 既存のチャートを破棄
    if (chartsInstances.monthlyReservations) {
        chartsInstances.monthlyReservations.destroy();
    }

    chartsInstances.monthlyReservations = new Chart(ctx, {
        type: 'line',
        data: {
            labels: data.labels || ['1月', '2月', '3月', '4月', '5月', '6月'],
            datasets: [{
                label: '予約数',
                data: data.values || [45, 52, 48, 61, 55, 67],
                borderColor: '#4CAF50',
                backgroundColor: 'rgba(76, 175, 80, 0.1)',
                tension: 0.4,
                fill: true
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    display: false
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    grid: {
                        color: 'rgba(0,0,0,0.1)'
                    }
                },
                x: {
                    grid: {
                        display: false
                    }
                }
            }
        }
    });
}

/**
 * 週次出席率チャートを作成
 * @param {Object} data - チャートデータ
 * @returns {void}
 */
function createWeeklyAttendanceChart(data) {
    const ctx = document.getElementById('weeklyAttendanceChart');
    if (!ctx) return;

    // 既存のチャートを破棄
    if (chartsInstances.weeklyAttendance) {
        chartsInstances.weeklyAttendance.destroy();
    }

    chartsInstances.weeklyAttendance = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: data.labels || ['月', '火', '水', '木', '金'],
            datasets: [{
                label: '出席率 (%)',
                data: data.values || [95, 92, 98, 94, 96],
                backgroundColor: [
                    '#FF6384',
                    '#36A2EB',
                    '#FFCE56',
                    '#4BC0C0',
                    '#9966FF'
                ],
                borderWidth: 0,
                borderRadius: 4
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    display: false
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    max: 100,
                    grid: {
                        color: 'rgba(0,0,0,0.1)'
                    },
                    ticks: {
                        callback: function(value) {
                            return value + '%';
                        }
                    }
                },
                x: {
                    grid: {
                        display: false
                    }
                }
            }
        }
    });
}

/**
 * クラス別分布チャートを作成
 * @param {Object} data - チャートデータ
 * @returns {void}
 */
function createClassDistributionChart(data) {
    const ctx = document.getElementById('classDistributionChart');
    if (!ctx) return;

    // 既存のチャートを破棄
    if (chartsInstances.classDistribution) {
        chartsInstances.classDistribution.destroy();
    }

    chartsInstances.classDistribution = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: data.labels || ['ひまわり組', 'ばら組', 'さくら組', 'すみれ組'],
            datasets: [{
                data: data.values || [25, 30, 28, 22],
                backgroundColor: [
                    '#FFD700',
                    '#FF69B4',
                    '#FFC0CB',
                    '#9370DB'
                ],
                borderWidth: 2,
                borderColor: '#fff'
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'bottom',
                    labels: {
                        padding: 20,
                        usePointStyle: true
                    }
                }
            }
        }
    });
}

/**
 * デモチャートを読み込む
 * @returns {void}
 */
function loadDemoCharts() {
    // デモデータでチャートを初期化
    createMonthlyReservationsChart({
        labels: ['1月', '2月', '3月', '4月', '5月', '6月'],
        values: [45, 52, 48, 61, 55, 67]
    });
    
    createWeeklyAttendanceChart({
        labels: ['月', '火', '水', '木', '金'],
        values: [95, 92, 98, 94, 96]
    });
    
    createClassDistributionChart({
        labels: ['ひまわり組', 'ばら組', 'さくら組', 'すみれ組'],
        values: [25, 30, 28, 22]
    });
}

/**
 * デモ統計データを生成
 * @returns {Object} デモ統計データ
 */
function generateDemoStats() {
    return {
        todayReservations: 42,
        totalStudents: 105,
        totalReservations: 1247,
        attendanceRate: '95%',
        reservationsTrend: '+5',
        studentsTrend: '+2',
        totalReservationsTrend: '+18',
        attendanceTrend: '+2%'
    };
}

/**
 * デモクラス統計データを生成
 * @returns {Object} デモクラス統計データ
 */
function generateDemoClassStats() {
    return {
        'ひまわり組': {
            enrolled: 25,
            todayAttendance: 23,
            attendanceRate: '92%'
        },
        'ばら組': {
            enrolled: 30,
            todayAttendance: 28,
            attendanceRate: '93%'
        },
        'さくら組': {
            enrolled: 28,
            todayAttendance: 27,
            attendanceRate: '96%'
        },
        'すみれ組': {
            enrolled: 22,
            todayAttendance: 21,
            attendanceRate: '95%'
        }
    };
}

/**
 * デモ活動データを生成
 * @returns {Array} デモ活動データ
 */
function generateDemoActivities() {
    const now = new Date();
    return [
        {
            type: 'reservation',
            description: '田中様が明日の遅刻申請を提出しました',
            timestamp: new Date(now.getTime() - 10 * 60 * 1000)
        },
        {
            type: 'login',
            description: '佐藤先生がログインしました',
            timestamp: new Date(now.getTime() - 25 * 60 * 1000)
        },
        {
            type: 'chat',
            description: '職員チャットに新しいメッセージがあります',
            timestamp: new Date(now.getTime() - 45 * 60 * 1000)
        },
        {
            type: 'system',
            description: 'システムの定期バックアップが完了しました',
            timestamp: new Date(now.getTime() - 2 * 60 * 60 * 1000)
        }
    ];
}

/**
 * 活動アイコンを取得する
 * @param {string} type - 活動タイプ
 * @returns {string} - アイコンHTML
 */
function getActivityIcon(type) {
    const icons = {
        reservation: '📅',
        login: '🔑',
        chat: '💬',
        system: '⚙️'
    };
    return icons[type] || icons.system;
}

/**
 * 分析期間を変更する
 * @param {string} period - 期間（week, month, year）
 * @returns {void}
 */
function changeAnalyticsPeriod(period) {
    // 期間ボタンのアクティブ状態を更新
    const buttons = document.querySelectorAll('.period-btn');
    buttons.forEach(btn => btn.classList.remove('active'));
    
    const activeButton = document.querySelector(`[onclick="changeAnalyticsPeriod('${period}')"]`);
    if (activeButton) {
        activeButton.classList.add('active');
    }
    
    // 期間に応じたデータを読み込み
    loadAnalyticsData(period);
}

/**
 * 分析データを読み込む
 * @param {string} period - 期間
 * @returns {void}
 */
function loadAnalyticsData(period) {
    fetch(`/admin/analytics?period=${period}`)
        .then(response => response.json())
        .then(data => {
            updateAnalyticsCharts(data);
        })
        .catch(error => {
            console.error('分析データの取得に失敗:', error);
            // デモデータで更新
            loadDemoCharts();
        });
}

/**
 * 分析チャートを更新
 * @param {Object} data - 分析データ
 * @returns {void}
 */
function updateAnalyticsCharts(data) {
    if (data.reservationTrend) {
        createMonthlyReservationsChart(data.reservationTrend);
    }
    
    if (data.attendanceData) {
        createWeeklyAttendanceChart(data.attendanceData);
    }
    
    if (data.classDistribution) {
        createClassDistributionChart(data.classDistribution);
    }
}

/**
 * レポートをエクスポートする
 * @param {string} format - エクスポート形式（pdf, excel, csv）
 * @returns {void}
 */
function exportReport(format) {
    const loadingMsg = document.createElement('div');
    loadingMsg.className = 'export-loading';
    loadingMsg.textContent = `${format.toUpperCase()}形式でエクスポート中...`;
    document.body.appendChild(loadingMsg);
    
    fetch(`/admin/export-report?format=${format}`)
        .then(response => {
            if (!response.ok) {
                throw new Error('エクスポートに失敗しました');
            }
            return response.blob();
        })
        .then(blob => {
            // ファイルダウンロード
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `report_${new Date().toISOString().split('T')[0]}.${format}`;
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(url);
            document.body.removeChild(a);
            
            // 成功メッセージ
            showNotification(`レポートを${format.toUpperCase()}形式でエクスポートしました`, 'success');
        })
        .catch(error => {
            console.error('エクスポートエラー:', error);
            showNotification('エクスポートに失敗しました', 'error');
        })
        .finally(() => {
            document.body.removeChild(loadingMsg);
        });
}

/**
 * 通知を表示する
 * @param {string} message - メッセージ
 * @param {string} type - タイプ（success, error, info）
 * @returns {void}
 */
function showNotification(message, type = 'info') {
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.textContent = message;
    
    document.body.appendChild(notification);
    
    // アニメーション
    setTimeout(() => notification.classList.add('show'), 100);
    
    // 3秒後に削除
    setTimeout(() => {
        notification.classList.remove('show');
        setTimeout(() => {
            if (document.body.contains(notification)) {
                document.body.removeChild(notification);
            }
        }, 300);
    }, 3000);
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
/**
 * 保護者チャットページへ遷移
 */
function goToChat() {
    window.location.href = '/chat';
}

/**
 * 職員チャットページへ遷移
 */
function goToStaffChat() {
    window.location.href = '/staff-chat';
}

/**
 * 運営者向けマニュアルをダウンロード/表示
 * 管理者認証トークンを使用してセキュアにアクセス
 */
async function downloadAdminManual() {
    const btn = document.querySelector('.admin-manual-btn');
    const originalText = btn.innerHTML;
    
    try {
        // ローディング状態に変更
        btn.innerHTML = '<span class="btn-icon">⏳</span>認証中...';
        btn.disabled = true;
        
        // 管理者認証トークンを取得
        const adminToken = localStorage.getItem('adminToken');
        
        if (!adminToken) {
            throw new Error('管理者認証が必要です。再ログインしてください。');
        }
        
        // 認証付きでマニュアルにアクセス
        const manualUrl = `/download/admin-manual?token=${encodeURIComponent(adminToken)}`;
        
        // 新しいタブで開く
        const newWindow = window.open(manualUrl, '_blank', 'width=1200,height=800,scrollbars=yes,resizable=yes');
        
        if (!newWindow) {
            throw new Error('ポップアップブロッカーが有効になっています。ポップアップを許可してください。');
        }
        
        // 成功状態に変更
        btn.innerHTML = '<span class="btn-icon">✅</span>マニュアル表示完了';
        btn.style.background = 'linear-gradient(45deg, #27ae60, #2ecc71)';
        
        // 3秒後に元に戻す
        setTimeout(() => {
            btn.innerHTML = originalText;
            btn.style.background = '';
            btn.disabled = false;
        }, 3000);
        
    } catch (error) {
        console.error('運営者マニュアルアクセスエラー:', error);
        
        // エラー状態に変更
        btn.innerHTML = '<span class="btn-icon">❌</span>アクセスエラー';
        btn.style.background = 'linear-gradient(45deg, #e74c3c, #c0392b)';
        
        // エラーメッセージを表示
        alert(`マニュアルへのアクセスに失敗しました：\n${error.message}`);
        
        // 3秒後に元に戻す
        setTimeout(() => {
            btn.innerHTML = originalText;
            btn.style.background = '';
            btn.disabled = false;
        }, 3000);
    }
}

/**
 * 保護者向けマニュアルをダウンロード/表示
 * 認証不要でアクセス可能
 */
async function downloadParentManual() {
    const btn = document.querySelector('.parent-manual-btn');
    const originalText = btn.innerHTML;
    
    try {
        // ローディング状態に変更
        btn.innerHTML = '<span class="btn-icon">⏳</span>読み込み中...';
        btn.disabled = true;
        
        // 保護者向けマニュアルにアクセス（認証不要）
        const manualUrl = '/download/parent-manual';
        
        // 新しいタブで開く
        const newWindow = window.open(manualUrl, '_blank', 'width=1200,height=800,scrollbars=yes,resizable=yes');
        
        if (!newWindow) {
            throw new Error('ポップアップブロッカーが有効になっています。ポップアップを許可してください。');
        }
        
        // 成功状態に変更
        btn.innerHTML = '<span class="btn-icon">✅</span>マニュアル表示完了';
        btn.style.background = 'linear-gradient(45deg, #3498db, #2980b9)';
        
        // 3秒後に元に戻す
        setTimeout(() => {
            btn.innerHTML = originalText;
            btn.style.background = '';
            btn.disabled = false;
        }, 3000);
        
    } catch (error) {
        console.error('保護者マニュアルアクセスエラー:', error);
        
        // エラー状態に変更
        btn.innerHTML = '<span class="btn-icon">❌</span>アクセスエラー';
        btn.style.background = 'linear-gradient(45deg, #e74c3c, #c0392b)';
        
        // エラーメッセージを表示
        alert(`マニュアルへのアクセスに失敗しました：\n${error.message}`);
        
        // 3秒後に元に戻す
        setTimeout(() => {
            btn.innerHTML = originalText;
            btn.style.background = '';
            btn.disabled = false;
        }, 3000);
    }
}