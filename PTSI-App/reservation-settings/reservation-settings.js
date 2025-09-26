/**
 * 予約オプション設定ページのJavaScript
 * PTSI幼稚園管理システム
 */

// グローバル変数
let currentDate = '';
let currentSettings = {
    lateArrival: { enabled: false, options: [] },
    earlyDeparture: { enabled: false, options: [] },
    childcare: { enabled: false, options: [] },
    extendedCare: { enabled: false, options: [] }
};
let isModified = false;

/**
 * ページ読み込み時の初期化
 */
document.addEventListener('DOMContentLoaded', function() {
    // 今日の日付をデフォルトに設定
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(today.getDate() + 1);
    document.getElementById('target-date').valueAsDate = tomorrow;
    
    // 最小日付を明日に設定
    document.getElementById('target-date').min = tomorrow.toISOString().split('T')[0];
    
    // イベントリスナーの設定
    setupEventListeners();
    
    // 認証確認
    checkAuthentication();
});

/**
 * 認証確認
 */
function checkAuthentication() {
    // セッションストレージから管理者情報を確認
    const adminUser = sessionStorage.getItem('adminUser');
    if (!adminUser) {
        // 未認証の場合はログイン画面にリダイレクト
        showMessage('認証が必要です。ログインしてください。', 'error');
        setTimeout(() => {
            window.location.href = '/login-select';
        }, 2000);
        return false;
    }
    return true;
}

/**
 * イベントリスナーの設定
 */
function setupEventListeners() {
    // 日付変更イベント
    document.getElementById('target-date').addEventListener('change', function() {
        updateSelectedDateDisplay();
        resetSettings();
    });
    
    // 設定変更の監視
    const inputs = document.querySelectorAll('input[type="checkbox"]');
    inputs.forEach(input => {
        input.addEventListener('change', function() {
            isModified = true;
            updateSaveStatus();
        });
    });
}

/**
 * 選択された日付の表示を更新
 */
function updateSelectedDateDisplay() {
    const dateInput = document.getElementById('target-date');
    const displayElement = document.getElementById('selected-date-display');
    
    if (dateInput.value) {
        const date = new Date(dateInput.value);
        const options = { 
            year: 'numeric', 
            month: 'long', 
            day: 'numeric', 
            weekday: 'long' 
        };
        displayElement.textContent = date.toLocaleDateString('ja-JP', options);
    } else {
        displayElement.textContent = '未選択';
    }
}

/**
 * 日付設定を読み込み
 */
async function loadDateSettings() {
    const dateInput = document.getElementById('target-date');
    if (!dateInput.value) {
        showMessage('日付を選択してください。', 'error');
        return;
    }
    
    currentDate = dateInput.value;
    updateSelectedDateDisplay();
    
    try {
        // サーバーから設定を取得
        const response = await fetch(`/api/reservation-settings/${currentDate}`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
            }
        });
        
        if (response.ok) {
            const settings = await response.json();
            loadSettingsToUI(settings);
            showMessage('設定を読み込みました。', 'success');
        } else if (response.status === 404) {
            // 設定が存在しない場合はデフォルト設定を適用
            loadDefaultSettings();
            showMessage('デフォルト設定を適用しました。', 'info');
        } else {
            throw new Error('設定の読み込みに失敗しました。');
        }
    } catch (error) {
        console.error('Error loading settings:', error);
        loadDefaultSettings();
        showMessage('設定の読み込みに失敗しました。デフォルト設定を適用します。', 'error');
    }
    
    isModified = false;
    updateSaveStatus();
}

/**
 * デフォルト設定を読み込み
 */
function loadDefaultSettings() {
    // すべてのカテゴリを有効にし、すべてのオプションを選択
    const categories = ['late-arrival', 'early-departure', 'childcare', 'extended-care'];
    
    categories.forEach(category => {
        const enabledCheckbox = document.getElementById(`${category}-enabled`);
        enabledCheckbox.checked = true;
        toggleCategory(category.replace('-', '-'));
        
        // カテゴリ内のすべてのオプションを選択
        const options = document.querySelectorAll(`#${category}-options input[type="checkbox"]`);
        options.forEach(option => {
            option.checked = true;
        });
    });
}

/**
 * 設定をUIに読み込み
 */
function loadSettingsToUI(settings) {
    currentSettings = settings;
    
    // 遅刻申請
    document.getElementById('late-arrival-enabled').checked = settings.lateArrival.enabled;
    toggleCategory('late-arrival');
    settings.lateArrival.options.forEach(option => {
        const checkbox = Array.from(document.querySelectorAll('#late-arrival-options input')).find(input => input.value === option);
        if (checkbox) checkbox.checked = true;
    });
    
    // 早退申請
    document.getElementById('early-departure-enabled').checked = settings.earlyDeparture.enabled;
    toggleCategory('early-departure');
    settings.earlyDeparture.options.forEach(option => {
        const checkbox = Array.from(document.querySelectorAll('#early-departure-options input')).find(input => input.value === option);
        if (checkbox) checkbox.checked = true;
    });
    
    // 預かり保育
    document.getElementById('childcare-enabled').checked = settings.childcare.enabled;
    toggleCategory('childcare');
    settings.childcare.options.forEach(option => {
        const checkbox = Array.from(document.querySelectorAll('#childcare-options input')).find(input => input.value === option);
        if (checkbox) checkbox.checked = true;
    });
    
    // 延長保育
    document.getElementById('extended-care-enabled').checked = settings.extendedCare.enabled;
    toggleCategory('extended-care');
    settings.extendedCare.options.forEach(option => {
        const checkbox = Array.from(document.querySelectorAll('#extended-care-options input')).find(input => input.value === option);
        if (checkbox) checkbox.checked = true;
    });
}

/**
 * カテゴリの有効/無効を切り替え
 */
function toggleCategory(categoryName) {
    const enabledCheckbox = document.getElementById(`${categoryName}-enabled`);
    const optionsContainer = document.getElementById(`${categoryName}-options`);
    
    if (enabledCheckbox.checked) {
        optionsContainer.classList.add('enabled');
        optionsContainer.style.opacity = '1';
        
        // オプション内のチェックボックスを有効化
        const checkboxes = optionsContainer.querySelectorAll('input[type="checkbox"]');
        checkboxes.forEach(checkbox => {
            checkbox.disabled = false;
        });
    } else {
        optionsContainer.classList.remove('enabled');
        optionsContainer.style.opacity = '0.5';
        
        // オプション内のチェックボックスを無効化してクリア
        const checkboxes = optionsContainer.querySelectorAll('input[type="checkbox"]');
        checkboxes.forEach(checkbox => {
            checkbox.disabled = true;
            checkbox.checked = false;
        });
    }
    
    isModified = true;
    updateSaveStatus();
}

/**
 * すべてのオプションを選択
 */
function selectAllOptions() {
    const categories = ['late-arrival', 'early-departure', 'childcare', 'extended-care'];
    
    categories.forEach(category => {
        // カテゴリを有効化
        const enabledCheckbox = document.getElementById(`${category}-enabled`);
        enabledCheckbox.checked = true;
        toggleCategory(category);
        
        // すべてのオプションを選択
        const options = document.querySelectorAll(`#${category}-options input[type="checkbox"]`);
        options.forEach(option => {
            option.checked = true;
        });
    });
    
    showMessage('すべてのオプションを選択しました。', 'success');
    isModified = true;
    updateSaveStatus();
}

/**
 * すべてのオプションをクリア
 */
function clearAllOptions() {
    const categories = ['late-arrival', 'early-departure', 'childcare', 'extended-care'];
    
    categories.forEach(category => {
        // カテゴリを無効化
        const enabledCheckbox = document.getElementById(`${category}-enabled`);
        enabledCheckbox.checked = false;
        toggleCategory(category);
    });
    
    showMessage('すべてのオプションをクリアしました。', 'info');
    isModified = true;
    updateSaveStatus();
}

/**
 * 前日の設定をコピー
 */
async function copyFromPreviousDay() {
    const dateInput = document.getElementById('target-date');
    if (!dateInput.value) {
        showMessage('日付を選択してください。', 'error');
        return;
    }
    
    const selectedDate = new Date(dateInput.value);
    const previousDay = new Date(selectedDate);
    previousDay.setDate(selectedDate.getDate() - 1);
    
    const previousDateStr = previousDay.toISOString().split('T')[0];
    
    try {
        const response = await fetch(`/api/reservation-settings/${previousDateStr}`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
            }
        });
        
        if (response.ok) {
            const settings = await response.json();
            loadSettingsToUI(settings);
            showMessage(`${previousDay.toLocaleDateString('ja-JP')}の設定をコピーしました。`, 'success');
            isModified = true;
            updateSaveStatus();
        } else {
            showMessage('前日の設定が見つかりません。', 'error');
        }
    } catch (error) {
        console.error('Error copying previous day settings:', error);
        showMessage('前日の設定のコピーに失敗しました。', 'error');
    }
}

/**
 * テンプレートを適用
 */
function applyTemplate() {
    // 平日の標準テンプレートを適用
    loadDefaultSettings();
    showMessage('標準テンプレートを適用しました。', 'success');
    isModified = true;
    updateSaveStatus();
}

/**
 * 設定のプレビュー
 */
function previewSettings() {
    if (!currentDate) {
        showMessage('日付を選択してください。', 'error');
        return;
    }
    
    const settings = collectCurrentSettings();
    displayPreview(settings);
}

/**
 * 現在の設定を収集
 */
function collectCurrentSettings() {
    const settings = {
        date: currentDate,
        lateArrival: {
            enabled: document.getElementById('late-arrival-enabled').checked,
            options: []
        },
        earlyDeparture: {
            enabled: document.getElementById('early-departure-enabled').checked,
            options: []
        },
        childcare: {
            enabled: document.getElementById('childcare-enabled').checked,
            options: []
        },
        extendedCare: {
            enabled: document.getElementById('extended-care-enabled').checked,
            options: []
        }
    };
    
    // 各カテゴリのオプションを収集
    if (settings.lateArrival.enabled) {
        const options = document.querySelectorAll('#late-arrival-options input[type="checkbox"]:checked');
        settings.lateArrival.options = Array.from(options).map(input => input.value);
    }
    
    if (settings.earlyDeparture.enabled) {
        const options = document.querySelectorAll('#early-departure-options input[type="checkbox"]:checked');
        settings.earlyDeparture.options = Array.from(options).map(input => input.value);
    }
    
    if (settings.childcare.enabled) {
        const options = document.querySelectorAll('#childcare-options input[type="checkbox"]:checked');
        settings.childcare.options = Array.from(options).map(input => input.value);
    }
    
    if (settings.extendedCare.enabled) {
        const options = document.querySelectorAll('#extended-care-options input[type="checkbox"]:checked');
        settings.extendedCare.options = Array.from(options).map(input => input.value);
    }
    
    return settings;
}

/**
 * プレビューを表示
 */
function displayPreview(settings) {
    const previewContent = document.getElementById('preview-content');
    const date = new Date(settings.date);
    
    let html = `
        <div class="preview-header">
            <h4>📅 ${date.toLocaleDateString('ja-JP', { year: 'numeric', month: 'long', day: 'numeric', weekday: 'long' })}</h4>
        </div>
        <div class="preview-body">
    `;
    
    // 遅刻申請
    html += generateCategoryPreview('⏰ 遅刻申請', settings.lateArrival);
    // 早退申請
    html += generateCategoryPreview('🏃 早退申請', settings.earlyDeparture);
    // 預かり保育
    html += generateCategoryPreview('🧸 預かり保育', settings.childcare);
    // 延長保育
    html += generateCategoryPreview('⏳ 延長保育', settings.extendedCare);
    
    html += '</div>';
    
    previewContent.innerHTML = html;
    document.getElementById('preview-modal').style.display = 'block';
}

/**
 * カテゴリプレビューを生成
 */
function generateCategoryPreview(title, category) {
    let html = `<div class="preview-category">
        <h5>${title}</h5>`;
    
    if (category.enabled && category.options.length > 0) {
        html += '<ul>';
        category.options.forEach(option => {
            html += `<li>✅ ${option}</li>`;
        });
        html += '</ul>';
    } else {
        html += '<p class="disabled">❌ 受付停止</p>';
    }
    
    html += '</div>';
    return html;
}

/**
 * 設定を保存
 */
async function saveSettings() {
    if (!currentDate) {
        showMessage('日付を選択してください。', 'error');
        return;
    }
    
    const settings = collectCurrentSettings();
    
    try {
        const response = await fetch('/api/reservation-settings', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(settings)
        });
        
        if (response.ok) {
            showMessage('設定を保存しました。', 'success');
            isModified = false;
            updateSaveStatus();
        } else {
            throw new Error('保存に失敗しました。');
        }
    } catch (error) {
        console.error('Error saving settings:', error);
        showMessage('設定の保存に失敗しました。', 'error');
    }
}

/**
 * プレビューから保存
 */
function saveSettingsFromPreview() {
    closeModal();
    saveSettings();
}

/**
 * 設定をリセット
 */
function resetSettings() {
    if (currentDate) {
        loadDateSettings();
    } else {
        clearAllOptions();
    }
    showMessage('設定をリセットしました。', 'info');
}

/**
 * 保存状況を更新
 */
function updateSaveStatus() {
    const statusElement = document.getElementById('save-status');
    if (isModified) {
        statusElement.textContent = '未保存';
        statusElement.className = '';
    } else {
        statusElement.textContent = '保存済み';
        statusElement.className = 'saved';
    }
}

/**
 * モーダルを閉じる
 */
function closeModal() {
    document.getElementById('preview-modal').style.display = 'none';
}

/**
 * ダッシュボードに移動
 */
function goToDashboard() {
    if (isModified) {
        if (confirm('未保存の変更があります。破棄してダッシュボードに移動しますか？')) {
            window.location.href = '/admin-dashboard';
        }
    } else {
        window.location.href = '/admin-dashboard';
    }
}

/**
 * ログアウト
 */
function logout() {
    if (isModified) {
        if (confirm('未保存の変更があります。破棄してログアウトしますか？')) {
            sessionStorage.clear();
            localStorage.clear();
            window.location.href = '/login-select';
        }
    } else {
        sessionStorage.clear();
        localStorage.clear();
        window.location.href = '/login-select';
    }
}

/**
 * メッセージを表示
 */
function showMessage(text, type = 'info') {
    const container = document.getElementById('message-container');
    const message = document.createElement('div');
    message.className = `message ${type}`;
    message.textContent = text;
    
    container.appendChild(message);
    
    // 5秒後に自動削除
    setTimeout(() => {
        if (message.parentNode) {
            message.parentNode.removeChild(message);
        }
    }, 5000);
}

/**
 * モーダル外クリックで閉じる
 */
window.onclick = function(event) {
    const modal = document.getElementById('preview-modal');
    if (event.target == modal) {
        closeModal();
    }
}

// CSS スタイルを動的に追加
const additionalStyles = `
    <style>
    .preview-header {
        text-align: center;
        margin-bottom: 2rem;
        padding-bottom: 1rem;
        border-bottom: 2px solid #e9ecef;
    }
    
    .preview-header h4 {
        font-size: 1.5rem;
        color: #2c3e50;
        font-weight: bold;
    }
    
    .preview-category {
        margin-bottom: 2rem;
        background: #f8f9fa;
        padding: 1.5rem;
        border-radius: 0.8rem;
        border-left: 4px solid #3498db;
    }
    
    .preview-category h5 {
        font-size: 1.3rem;
        color: #2c3e50;
        margin-bottom: 1rem;
        font-weight: bold;
    }
    
    .preview-category ul {
        list-style: none;
        padding: 0;
        margin: 0;
    }
    
    .preview-category li {
        padding: 0.5rem 0;
        font-size: 1.1rem;
        color: #27ae60;
    }
    
    .preview-category .disabled {
        color: #e74c3c;
        font-size: 1.1rem;
        font-weight: 500;
    }
    </style>
`;

document.head.insertAdjacentHTML('beforeend', additionalStyles);