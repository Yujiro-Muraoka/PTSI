/**
 * 職員間グループチャット機能を管理するメインクラス
 * Socket.IOを使用したリアルタイム職員チャット機能を提供
 * 
 * @author Yujiro Muraoka
 */
class StaffChatApp {
    constructor() {
        this.currentUser = null;
        this.currentRoom = 'staff-general';
        this.messages = [];
        this.onlineStaff = [];
        this.socket = null;
        this.isUrgentMode = false;
        this.init();
    }

    /**
     * 職員チャットアプリケーションの初期化処理
     * @returns {void}
     */
    init() {
        this.loadUserInfo();
        this.setupEventListeners();
        this.loadMessages();
        this.setupWebSocket();
        this.updateCharCount();
        this.setupModalListeners();
        this.updateOnlineCount();
    }

    /**
     * ユーザー情報を読み込む
     * Cookieから管理者IDを取得し、サーバーから職員情報を取得
     * @returns {void}
     */
    loadUserInfo() {
        const adminId = this.getCookie('adminID');
        
        if (adminId) {
            // サーバーから職員情報を取得
            this.fetchUserInfo(adminId);
        } else {
            // ログイン情報がない場合は管理者ログインページにリダイレクト
            window.location.href = '/admin-login';
        }
    }

    /**
     * Cookieから値を取得する
     * @param {string} name - Cookie名
     * @returns {string|null} Cookie値
     */
    getCookie(name) {
        const value = `; ${document.cookie}`;
        const parts = value.split(`; ${name}=`);
        if (parts.length === 2) return parts.pop().split(';').shift();
        return null;
    }

    /**
     * サーバーから職員情報を取得
     * @param {string} adminId - 管理者ID
     * @returns {void}
     */
    fetchUserInfo(adminId) {
        fetch('/api/admin-info', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ adminId: adminId })
        })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                this.currentUser = {
                    id: adminId,
                    name: data.admin.name,
                    role: data.admin.role || '職員',
                    department: data.admin.department || '一般'
                };
                document.getElementById('current-user').textContent = `職員: ${this.currentUser.name} (${this.currentUser.role})`;
                this.loadMessages();
            } else {
                console.error('職員情報の取得に失敗しました:', data.message);
                alert('職員情報の取得に失敗しました。再ログインしてください。');
                window.location.href = '/admin-login';
            }
        })
        .catch(error => {
            console.error('エラー:', error);
            alert('サーバーとの通信に失敗しました。');
        });
    }

    /**
     * イベントリスナーを設定
     * @returns {void}
     */
    setupEventListeners() {
        const messageInput = document.getElementById('message-input');
        const sendButton = document.getElementById('send-button');
        const urgentButton = document.getElementById('urgent-button');

        // メッセージ入力フィールドのイベント
        messageInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                this.sendMessage();
            }
        });

        messageInput.addEventListener('input', () => {
            this.updateCharCount();
        });

        // ボタンのイベント
        sendButton.addEventListener('click', () => this.sendMessage());
        urgentButton.addEventListener('click', () => this.sendUrgentMessage());

        // Escキーでモーダルを閉じる
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                this.closeAllModals();
            }
        });
    }

    /**
     * モーダルのイベントリスナーを設定
     * @returns {void}
     */
    setupModalListeners() {
        // モーダルの外側をクリックして閉じる
        window.addEventListener('click', (event) => {
            const modals = document.querySelectorAll('.modal');
            modals.forEach(modal => {
                if (event.target === modal) {
                    modal.style.display = 'none';
                }
            });
        });
    }

    /**
     * WebSocket接続を設定
     * @returns {void}
     */
    setupWebSocket() {
        // WebSocketの実装は後で追加
        console.log('WebSocket接続を設定中...');
    }

    /**
     * メッセージを送信
     * @returns {void}
     */
    sendMessage() {
        const messageInput = document.getElementById('message-input');
        const message = messageInput.value.trim();

        if (!message) {
            alert('メッセージを入力してください。');
            return;
        }

        if (!this.currentUser) {
            alert('ユーザー情報が取得できていません。再ログインしてください。');
            return;
        }

        const messageData = {
            room: this.currentRoom,
            message: message,
            userId: this.currentUser.id,
            userName: this.currentUser.name,
            userRole: this.currentUser.role,
            messageType: 'staff',
            urgent: this.isUrgentMode,
            timestamp: new Date().toISOString()
        };

        // サーバーにメッセージを送信
        fetch('/staff-chat/send', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(messageData)
        })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                messageInput.value = '';
                this.updateCharCount();
                this.loadMessages();
                this.isUrgentMode = false;
                this.updateUrgentButtonState();
            } else {
                alert('メッセージの送信に失敗しました: ' + data.message);
            }
        })
        .catch(error => {
            console.error('エラー:', error);
            alert('メッセージの送信中にエラーが発生しました。');
        });
    }

    /**
     * 緊急メッセージを送信
     * @returns {void}
     */
    sendUrgentMessage() {
        const confirmation = confirm('緊急メッセージとして送信しますか？\n全職員に緊急通知が送信されます。');
        if (confirmation) {
            this.isUrgentMode = true;
            this.sendMessage();
        }
    }

    /**
     * 緊急送信ボタンの状態を更新
     * @returns {void}
     */
    updateUrgentButtonState() {
        const urgentButton = document.getElementById('urgent-button');
        if (this.isUrgentMode) {
            urgentButton.textContent = '緊急送信中...';
            urgentButton.disabled = true;
        } else {
            urgentButton.textContent = '緊急送信';
            urgentButton.disabled = false;
        }
    }

    /**
     * チャットルームを変更
     * @returns {void}
     */
    changeRoom() {
        const roomSelect = document.getElementById('chat-room');
        this.currentRoom = roomSelect.value;
        
        // ルーム名に応じてタイトルを更新
        const roomTitles = {
            'staff-general': '全職員チャット',
            'staff-teachers': '担任教師チャット',
            'staff-admin': '管理職チャット',
            'staff-support': 'サポートスタッフチャット',
            'staff-emergency': '緊急連絡チャット'
        };
        
        document.getElementById('chat-title').textContent = roomTitles[this.currentRoom] || '職員チャット';
        this.loadMessages();
    }

    /**
     * メッセージを読み込み
     * @returns {void}
     */
    loadMessages() {
        if (!this.currentRoom) return;

        fetch(`/staff-chat/messages?room=${this.currentRoom}`)
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                this.messages = data.messages;
                this.displayMessages();
            } else {
                console.error('メッセージの読み込みに失敗しました:', data.message);
            }
        })
        .catch(error => {
            console.error('エラー:', error);
        });
    }

    /**
     * メッセージを表示
     * @returns {void}
     */
    displayMessages() {
        const messagesContainer = document.getElementById('chat-messages');
        messagesContainer.innerHTML = '';

        this.messages.forEach(message => {
            const messageElement = this.createMessageElement(message);
            messagesContainer.appendChild(messageElement);
        });

        // 最新のメッセージまでスクロール
        messagesContainer.scrollTop = messagesContainer.scrollHeight;
    }

    /**
     * メッセージ要素を作成
     * @param {Object} message - メッセージオブジェクト
     * @returns {HTMLElement} メッセージ要素
     */
    createMessageElement(message) {
        const messageDiv = document.createElement('div');
        messageDiv.className = 'message';
        
        // メッセージタイプに応じてクラスを追加
        if (message.urgent) {
            messageDiv.classList.add('urgent');
        }
        if (message.messageType === 'emergency') {
            messageDiv.classList.add('emergency');
        }
        if (message.room) {
            messageDiv.classList.add(message.room);
        }

        const header = document.createElement('div');
        header.className = 'message-header';

        const userInfo = document.createElement('div');
        userInfo.style.display = 'flex';
        userInfo.style.alignItems = 'center';
        userInfo.style.gap = '10px';

        const userName = document.createElement('span');
        userName.className = 'message-user';
        userName.textContent = message.userName;

        const userRole = document.createElement('span');
        userRole.className = 'message-role';
        userRole.textContent = message.userRole || '職員';

        const timestamp = document.createElement('span');
        timestamp.className = 'message-time';
        timestamp.textContent = this.formatTime(message.timestamp);

        userInfo.appendChild(userName);
        userInfo.appendChild(userRole);
        header.appendChild(userInfo);
        header.appendChild(timestamp);

        const content = document.createElement('div');
        content.className = 'message-content';
        
        // 緊急メッセージの場合は絵文字を追加
        if (message.urgent) {
            content.textContent = `🚨 ${message.message}`;
        } else {
            content.textContent = message.message;
        }

        messageDiv.appendChild(header);
        messageDiv.appendChild(content);

        return messageDiv;
    }

    /**
     * 時刻をフォーマット
     * @param {string} timestamp - タイムスタンプ
     * @returns {string} フォーマットされた時刻
     */
    formatTime(timestamp) {
        const date = new Date(timestamp);
        const now = new Date();
        const diffMs = now - date;
        const diffMins = Math.floor(diffMs / 60000);

        if (diffMins < 1) {
            return 'たった今';
        } else if (diffMins < 60) {
            return `${diffMins}分前`;
        } else if (diffMins < 1440) {
            const diffHours = Math.floor(diffMins / 60);
            return `${diffHours}時間前`;
        } else {
            return date.toLocaleDateString('ja-JP') + ' ' + date.toLocaleTimeString('ja-JP', { hour: '2-digit', minute: '2-digit' });
        }
    }

    /**
     * 文字数カウントを更新
     * @returns {void}
     */
    updateCharCount() {
        const messageInput = document.getElementById('message-input');
        const charCount = document.getElementById('char-count');
        const currentLength = messageInput.value.length;
        charCount.textContent = `${currentLength}/300`;
        
        if (currentLength > 250) {
            charCount.style.color = '#ff4757';
        } else {
            charCount.style.color = '#999';
        }
    }

    /**
     * 緊急連絡ブロードキャストモーダルを表示
     * @returns {void}
     */
    showBroadcastModal() {
        document.getElementById('broadcast-modal').style.display = 'block';
        document.getElementById('broadcast-text').focus();
    }

    /**
     * 緊急連絡ブロードキャストモーダルを閉じる
     * @returns {void}
     */
    closeBroadcastModal() {
        document.getElementById('broadcast-modal').style.display = 'none';
        document.getElementById('broadcast-text').value = '';
    }

    /**
     * 緊急連絡を送信
     * @returns {void}
     */
    sendBroadcast() {
        const broadcastText = document.getElementById('broadcast-text').value.trim();
        
        if (!broadcastText) {
            alert('緊急連絡内容を入力してください。');
            return;
        }

        const confirmation = confirm('全職員に緊急連絡を送信しますか？\nこの操作は取り消せません。');
        if (!confirmation) return;

        const broadcastData = {
            message: broadcastText,
            userId: this.currentUser.id,
            userName: this.currentUser.name,
            userRole: this.currentUser.role,
            messageType: 'emergency',
            timestamp: new Date().toISOString()
        };

        fetch('/staff-chat/broadcast', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(broadcastData)
        })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                alert('緊急連絡を全職員に送信しました。');
                this.closeBroadcastModal();
                this.loadMessages();
            } else {
                alert('緊急連絡の送信に失敗しました: ' + data.message);
            }
        })
        .catch(error => {
            console.error('エラー:', error);
            alert('緊急連絡の送信中にエラーが発生しました。');
        });
    }

    /**
     * オンライン職員モーダルを表示
     * @returns {void}
     */
    showOnlineStaffModal() {
        this.loadOnlineStaff();
        document.getElementById('online-staff-modal').style.display = 'block';
    }

    /**
     * オンライン職員モーダルを閉じる
     * @returns {void}
     */
    closeOnlineStaffModal() {
        document.getElementById('online-staff-modal').style.display = 'none';
    }

    /**
     * オンライン職員数を更新
     * @returns {void}
     */
    updateOnlineCount() {
        // 実際の実装では WebSocket や定期的な API 呼び出しで更新
        const count = Math.floor(Math.random() * 8) + 2; // デモ用のランダム値
        document.getElementById('online-count').textContent = count;
    }

    /**
     * オンライン職員リストを読み込み
     * @returns {void}
     */
    loadOnlineStaff() {
        // デモ用のダミーデータ
        const dummyStaff = [
            { name: '田中 太郎', role: '園長', status: 'online' },
            { name: '佐藤 花子', role: '主任', status: 'online' },
            { name: '鈴木 次郎', role: '担任教師', status: 'online' },
            { name: '高橋 美穂', role: '担任教師', status: 'online' },
            { name: '渡辺 健一', role: 'サポートスタッフ', status: 'online' }
        ];

        const staffList = document.getElementById('online-staff-list');
        staffList.innerHTML = '';

        dummyStaff.forEach(staff => {
            const staffItem = this.createStaffItem(staff);
            staffList.appendChild(staffItem);
        });
    }

    /**
     * 職員アイテム要素を作成
     * @param {Object} staff - 職員オブジェクト
     * @returns {HTMLElement} 職員アイテム要素
     */
    createStaffItem(staff) {
        const itemDiv = document.createElement('div');
        itemDiv.className = 'staff-item';

        const staffInfo = document.createElement('div');
        staffInfo.className = 'staff-info';

        const statusIndicator = document.createElement('div');
        statusIndicator.className = 'staff-status';

        const staffName = document.createElement('span');
        staffName.className = 'staff-name';
        staffName.textContent = staff.name;

        const staffRole = document.createElement('span');
        staffRole.className = 'staff-role';
        staffRole.textContent = staff.role;

        staffInfo.appendChild(statusIndicator);
        staffInfo.appendChild(staffName);
        itemDiv.appendChild(staffInfo);
        itemDiv.appendChild(staffRole);

        return itemDiv;
    }

    /**
     * 全てのモーダルを閉じる
     * @returns {void}
     */
    closeAllModals() {
        const modals = document.querySelectorAll('.modal');
        modals.forEach(modal => {
            modal.style.display = 'none';
        });
    }

    /**
     * キーボードイベントハンドラー（モーダル用）
     * @param {Event} event - キーボードイベント
     * @param {string} modalType - モーダルタイプ
     * @returns {void}
     */
    handleCloseKeydown(event, modalType) {
        if (event.key === 'Enter' || event.key === ' ') {
            event.preventDefault();
            if (modalType === 'broadcast') {
                this.closeBroadcastModal();
            } else if (modalType === 'online') {
                this.closeOnlineStaffModal();
            }
        }
    }

    /**
     * 管理画面に移動
     * @returns {void}
     */
    goToAdminDashboard() {
        window.location.href = '/admin-dashboard';
    }

    /**
     * 保護者チャットに移動
     * @returns {void}
     */
    goToParentChat() {
        window.location.href = '/chat';
    }

    /**
     * ログアウト
     * @returns {void}
     */
    logout() {
        const confirmation = confirm('ログアウトしますか？');
        if (confirmation) {
            // Cookieを削除
            document.cookie = 'adminID=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
            window.location.href = '/admin-login';
        }
    }
}

// グローバル関数として定義（HTML内のonclick属性から呼び出すため）
let staffChatApp;

document.addEventListener('DOMContentLoaded', function() {
    staffChatApp = new StaffChatApp();
});

function changeRoom() {
    staffChatApp.changeRoom();
}

function sendMessage() {
    staffChatApp.sendMessage();
}

function sendUrgentMessage() {
    staffChatApp.sendUrgentMessage();
}

function showBroadcastModal() {
    staffChatApp.showBroadcastModal();
}

function closeBroadcastModal() {
    staffChatApp.closeBroadcastModal();
}

function sendBroadcast() {
    staffChatApp.sendBroadcast();
}

function showOnlineStaffModal() {
    staffChatApp.showOnlineStaffModal();
}

function closeOnlineStaffModal() {
    staffChatApp.closeOnlineStaffModal();
}

function handleCloseKeydown(event, modalType) {
    staffChatApp.handleCloseKeydown(event, modalType);
}

function goToAdminDashboard() {
    staffChatApp.goToAdminDashboard();
}

function goToParentChat() {
    staffChatApp.goToParentChat();
}

function logout() {
    staffChatApp.logout();
}

function handleOnlineIndicatorKeydown(event) {
    if (event.key === 'Enter' || event.key === ' ') {
        event.preventDefault();
        showOnlineStaffModal();
    }
}