/**
 * データ分析ページのJavaScript
 * Chart.jsを使用したデータ可視化とテナント対応
 */

let currentTenant = null;
let studentData = [];
let charts = {}; // チャートオブジェクトを保存

/**
 * ページ読み込み時の初期化
 */
document.addEventListener('DOMContentLoaded', function() {
    initializePage();
});

/**
 * ページ初期化
 */
async function initializePage() {
    await loadTenantInfo();
    await loadStudentData();
    renderCharts();
    renderDataTable();
    setupEventListeners();
}

/**
 * テナント情報の読み込み
 */
async function loadTenantInfo() {
    const urlParams = new URLSearchParams(window.location.search);
    const tenantId = urlParams.get('tenant');
    
    if (!tenantId) {
        window.location.href = '/tenant-selection';
        return;
    }
    
    try {
        const response = await fetch(`/api/tenants/${tenantId}`);
        const result = await response.json();
        
        if (result.success) {
            currentTenant = result.tenant;
            
            // テナント情報を表示
            const tenantInfo = document.getElementById('tenant-info');
            const tenantName = document.getElementById('tenant-name');
            
            tenantName.textContent = currentTenant.name;
            tenantInfo.style.display = 'block';
            
            // ページタイトル更新
            document.title = `データ分析 - ${currentTenant.name}`;
        }
    } catch (error) {
        console.error('テナント情報の取得に失敗しました:', error);
        window.location.href = '/tenant-selection';
    }
}

/**
 * 学生データの読み込み
 */
async function loadStudentData() {
    if (!currentTenant) return;
    
    try {
        const response = await fetch(`/api/analytics/student-data?tenant=${currentTenant.tenantId}`);
        const result = await response.json();
        
        if (result.success) {
            studentData = result.data;
            updateSummaryCards();
        }
    } catch (error) {
        console.error('学生データの取得に失敗しました:', error);
    }
}

/**
 * サマリーカードの更新
 */
function updateSummaryCards() {
    const totalStudents = studentData.length;
    const classes = [...new Set(studentData.map(s => s.class))];
    const totalClasses = classes.length;
    
    // 出席率の計算（仮想的な計算）
    const avgAttendanceRate = calculateAverageAttendanceRate();
    
    // 延長保育利用率
    const extendedCareUsers = studentData.filter(s => s.type === '延長').length;
    const extendedCareRate = totalStudents > 0 ? Math.round((extendedCareUsers / totalStudents) * 100) : 0;
    
    // DOM更新
    document.getElementById('total-students').textContent = totalStudents;
    document.getElementById('total-classes').textContent = totalClasses;
    document.getElementById('attendance-rate').textContent = avgAttendanceRate + '%';
    document.getElementById('extended-care-rate').textContent = extendedCareRate + '%';
}

/**
 * 平均出席率の計算（遅刻・早退を考慮）
 */
function calculateAverageAttendanceRate() {
    if (studentData.length === 0) return 0;
    
    const totalIssues = studentData.reduce((sum, student) => {
        return sum + parseInt(student.late) + parseInt(student.early);
    }, 0);
    
    // 仮定：月20日登園、問題があった回数を差し引いて出席率を計算
    const assumedSchoolDays = 20;
    const avgIssuesPerStudent = totalIssues / studentData.length;
    const attendanceRate = Math.max(0, Math.round(((assumedSchoolDays - avgIssuesPerStudent) / assumedSchoolDays) * 100));
    
    return attendanceRate;
}

/**
 * チャートの描画
 */
function renderCharts() {
    renderClassDistributionChart();
    renderCareTypeChart();
    renderAttendanceIssuesChart();
    renderMonthlyTrendChart();
}

/**
 * クラス別園児数分布チャート
 */
function renderClassDistributionChart() {
    const ctx = document.getElementById('classDistributionChart').getContext('2d');
    
    // クラス別データ集計
    const classData = {};
    studentData.forEach(student => {
        classData[student.class] = (classData[student.class] || 0) + 1;
    });
    
    const labels = Object.keys(classData);
    const data = Object.values(classData);
    const colors = ['#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0', '#9966FF'];
    
    if (charts.classDistribution) {
        charts.classDistribution.destroy();
    }
    
    charts.classDistribution = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: labels,
            datasets: [{
                label: '園児数',
                data: data,
                backgroundColor: colors.slice(0, labels.length),
                borderColor: colors.slice(0, labels.length).map(color => color + 'CC'),
                borderWidth: 2
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: {
                        stepSize: 1
                    }
                }
            }
        }
    });
}

/**
 * 保育タイプ別分布チャート
 */
function renderCareTypeChart() {
    const ctx = document.getElementById('careTypeChart').getContext('2d');
    
    // タイプ別データ集計
    const typeData = {};
    studentData.forEach(student => {
        typeData[student.type] = (typeData[student.type] || 0) + 1;
    });
    
    const labels = Object.keys(typeData);
    const data = Object.values(typeData);
    const colors = ['#FF6384', '#36A2EB', '#FFCE56'];
    
    if (charts.careType) {
        charts.careType.destroy();
    }
    
    charts.careType = new Chart(ctx, {
        type: 'pie',
        data: {
            labels: labels,
            datasets: [{
                data: data,
                backgroundColor: colors.slice(0, labels.length),
                borderColor: '#fff',
                borderWidth: 2
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'bottom'
                }
            }
        }
    });
}

/**
 * 遅刻・早退統計チャート
 */
function renderAttendanceIssuesChart() {
    const ctx = document.getElementById('attendanceIssuesChart').getContext('2d');
    
    // クラス別の遅刻・早退集計
    const classIssues = {};
    studentData.forEach(student => {
        if (!classIssues[student.class]) {
            classIssues[student.class] = { late: 0, early: 0 };
        }
        classIssues[student.class].late += parseInt(student.late);
        classIssues[student.class].early += parseInt(student.early);
    });
    
    const labels = Object.keys(classIssues);
    const lateData = labels.map(label => classIssues[label].late);
    const earlyData = labels.map(label => classIssues[label].early);
    
    if (charts.attendanceIssues) {
        charts.attendanceIssues.destroy();
    }
    
    charts.attendanceIssues = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: labels,
            datasets: [
                {
                    label: '遅刻回数',
                    data: lateData,
                    backgroundColor: '#FF6384',
                    borderColor: '#FF6384CC',
                    borderWidth: 2
                },
                {
                    label: '早退回数',
                    data: earlyData,
                    backgroundColor: '#36A2EB',
                    borderColor: '#36A2EBCC',
                    borderWidth: 2
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: {
                        stepSize: 1
                    }
                }
            }
        }
    });
}

/**
 * 月別園児数推移チャート（シミュレーションデータ）
 */
function renderMonthlyTrendChart() {
    const ctx = document.getElementById('monthlyTrendChart').getContext('2d');
    
    // 仮想的な月別データ生成
    const months = ['4月', '5月', '6月', '7月', '8月', '9月'];
    const currentTotal = studentData.length;
    const trendData = months.map((month, index) => {
        // 少しずつ園児数が増える傾向をシミュレーション
        return Math.max(100, currentTotal - (months.length - index - 1) * 3 + Math.random() * 10 - 5);
    });
    
    if (charts.monthlyTrend) {
        charts.monthlyTrend.destroy();
    }
    
    charts.monthlyTrend = new Chart(ctx, {
        type: 'line',
        data: {
            labels: months,
            datasets: [{
                label: '園児数',
                data: trendData,
                borderColor: '#4BC0C0',
                backgroundColor: 'rgba(75, 192, 192, 0.2)',
                borderWidth: 3,
                fill: true,
                tension: 0.4
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                y: {
                    beginAtZero: false,
                    ticks: {
                        stepSize: 5
                    }
                }
            }
        }
    });
}

/**
 * データテーブルの描画
 */
function renderDataTable() {
    const tbody = document.getElementById('student-data-tbody');
    const classFilter = document.getElementById('class-filter');
    
    // クラスフィルターオプションを設定
    const classes = [...new Set(studentData.map(s => s.class))];
    classFilter.innerHTML = '<option value="">全クラス</option>';
    classes.forEach(className => {
        const option = document.createElement('option');
        option.value = className;
        option.textContent = className;
        classFilter.appendChild(option);
    });
    
    // テーブルデータを描画
    updateDataTable();
}

/**
 * データテーブルの更新
 */
function updateDataTable() {
    const tbody = document.getElementById('student-data-tbody');
    const searchTerm = document.getElementById('search-input').value.toLowerCase();
    const classFilter = document.getElementById('class-filter').value;
    
    // フィルタリング
    let filteredData = studentData;
    
    if (searchTerm) {
        filteredData = filteredData.filter(student => 
            student.name.toLowerCase().includes(searchTerm)
        );
    }
    
    if (classFilter) {
        filteredData = filteredData.filter(student => 
            student.class === classFilter
        );
    }
    
    // テーブル行の生成
    tbody.innerHTML = '';
    filteredData.forEach(student => {
        const row = document.createElement('tr');
        
        // 出席率の計算
        const totalIssues = parseInt(student.late) + parseInt(student.early);
        const attendanceRate = Math.max(0, Math.round(((20 - totalIssues) / 20) * 100));
        
        row.innerHTML = `
            <td>${student['student-id']}</td>
            <td>${student.name}</td>
            <td>${student.class}</td>
            <td><span class="type-badge type-${student.type}">${student.type}</span></td>
            <td>${student.late}</td>
            <td>${student.early}</td>
            <td>${student['late-pick-up']}</td>
            <td><span class="attendance-rate ${attendanceRate >= 90 ? 'good' : attendanceRate >= 80 ? 'warning' : 'poor'}">${attendanceRate}%</span></td>
        `;
        
        tbody.appendChild(row);
    });
}

/**
 * イベントリスナーの設定
 */
function setupEventListeners() {
    // 検索機能
    document.getElementById('search-input').addEventListener('input', updateDataTable);
    document.getElementById('class-filter').addEventListener('change', updateDataTable);
    
    // チャートタイプ変更
    document.getElementById('class-chart-type').addEventListener('change', function() {
        const newType = this.value;
        charts.classDistribution.config.type = newType;
        charts.classDistribution.update();
    });
}

/**
 * データ更新
 */
async function refreshData() {
    const refreshBtn = document.querySelector('.refresh-btn');
    refreshBtn.disabled = true;
    refreshBtn.textContent = '🔄 更新中...';
    
    try {
        await loadStudentData();
        renderCharts();
        renderDataTable();
        
        // 成功メッセージ
        showNotification('データが更新されました', 'success');
    } catch (error) {
        console.error('データ更新に失敗しました:', error);
        showNotification('データ更新に失敗しました', 'error');
    } finally {
        refreshBtn.disabled = false;
        refreshBtn.textContent = '🔄 データ更新';
    }
}

/**
 * データエクスポート
 */
function exportData() {
    // CSVデータの生成
    const headers = ['学生ID', '氏名', 'クラス', '保育タイプ', '遅刻回数', '早退回数', 'お迎え遅れ'];
    const csvContent = [
        headers.join(','),
        ...studentData.map(student => [
            student['student-id'],
            student.name,
            student.class,
            student.type,
            student.late,
            student.early,
            student['late-pick-up']
        ].join(','))
    ].join('\n');
    
    // ダウンロード実行
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `${currentTenant.name}_園児データ_${new Date().toISOString().split('T')[0]}.csv`);
    link.click();
    
    showNotification('データをエクスポートしました', 'success');
}

/**
 * レポート生成
 */
function generateReport(format) {
    const options = {
        summary: document.getElementById('report-summary').checked,
        attendance: document.getElementById('report-attendance').checked,
        classes: document.getElementById('report-classes').checked,
        trends: document.getElementById('report-trends').checked
    };
    
    // 実装予定の機能
    showNotification(`${format.toUpperCase()}レポート生成機能は開発中です`, 'info');
}

/**
 * 通知表示
 */
function showNotification(message, type = 'info') {
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.textContent = message;
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        padding: 1rem 1.5rem;
        border-radius: 10px;
        color: white;
        font-weight: 500;
        z-index: 1000;
        transition: all 0.3s ease;
        box-shadow: 0 4px 15px rgba(0, 0, 0, 0.2);
    `;
    
    // タイプ別の色設定
    const colors = {
        success: '#27ae60',
        error: '#e74c3c',
        warning: '#f39c12',
        info: '#3498db'
    };
    
    notification.style.backgroundColor = colors[type] || colors.info;
    
    document.body.appendChild(notification);
    
    // 3秒後に削除
    setTimeout(() => {
        notification.style.opacity = '0';
        notification.style.transform = 'translateX(100%)';
        setTimeout(() => {
            document.body.removeChild(notification);
        }, 300);
    }, 3000);
}