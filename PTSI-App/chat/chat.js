/**
 * チャット機能を管理するメインクラス
 * Socket.IOを使用したリアルタイムチャット機能を提供
 * 
 * @author Yujiro Muraoka
 */
class ChatApp {
    constructor() {
        this.currentUser = null;
        this.currentRoom = 'general';
        this.currentChatType = 'room'; // 'room'(ルーム), 'direct'(個人), 'announcement'(お知らせ)
        this.currentDirectUserId = null;
        this.messages = [];
        this.admins = [];
        this.socket = null;
        this.init();
    }

    /**
     * チャットアプリケーションの初期化処理
     * @returns {void}
     */
    init() {
        this.loadUserInfo();
        this.loadAdmins();
        this.setupEventListeners();
        this.loadMessages();
        this.setupWebSocket();
        this.updateCharCount();
        this.setupModalListeners();
    }

    /**
     * ユーザー情報を読み込む
     * Cookieから学生IDを取得し、サーバーからユーザー情報を取得
     * @returns {void}
     */
    loadUserInfo() {
        const studentId = this.getCookie('studentID');
        
        if (studentId) {
            // サーバーからユーザー情報を取得
            this.fetchUserInfo(studentId);
        } else {
            // ログイン情報がない場合はログインページにリダイレクト
            window.location.href = '/login';
        }
    }

    /**
     * Cookieから指定された名前の値を取得する
     * @param {string} name - 取得するCookieの名前
     * @returns {string} Cookieの値（見つからない場合は空文字）
     */
    getCookie(name) {
        const decodedCookie = decodeURIComponent(document.cookie);
        const cookies = decodedCookie.split(';');
        
        for (let i = 0; i < cookies.length; i++) {
            let cookie = cookies[i];
            while (cookie.charAt(0) === ' ') {
                cookie = cookie.substring(1);
            }
            if (cookie.indexOf(name + '=') === 0) {
                return cookie.substring(name.length + 1, cookie.length);
            }
        }
        return '';
    }

    /**
     * サーバーからユーザー情報を取得する
     * @param {string} studentId - 学生ID
     * @returns {void}
     */
    fetchUserInfo(studentId) {
        fetch('/chat/user-info', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ studentID: studentId }),
        })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                this.currentUser = data.user;
                document.getElementById('current-user').textContent = `ユーザー: ${data.user.name}`;
            } else {
                console.error('ユーザー情報の取得に失敗しました');
                window.location.href = '/login';
            }
        })
        .catch(error => {
            console.error('ユーザー情報取得エラー:', error);
            window.location.href = '/login';
        });
    }

    // イベントリスナーの設定
    setupEventListeners() {
        const messageInput = document.getElementById('message-input');
        const sendButton = document.getElementById('send-button');

        // Enterキーでメッセージ送信
        messageInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                this.sendMessage();
            }
        });

        // 文字数カウント
        messageInput.addEventListener('input', () => {
            this.updateCharCount();
        });

        // 送信ボタンクリック
        sendButton.addEventListener('click', () => {
            this.sendMessage();
        });
    }

    // WebSocket接続の設定
    setupWebSocket() {
        // 実際のWebSocket実装では、サーバー側でSocket.IOなどを使用
        // ここでは簡易的な実装として、ローカルストレージを使用
        this.simulateRealTimeChat();
    }

    // リアルタイムチャットのシミュレーション
    simulateRealTimeChat() {
        // 定期的にメッセージをチェック（5秒間隔）
        setInterval(() => {
            this.loadMessages();
        }, 5000);
    }

    // メッセージの送信
    sendMessage() {
        const messageInput = document.getElementById('message-input');
        const message = messageInput.value.trim();

        if (!message || !this.currentUser) return;

        let requestBody = {
            message: message,
            userId: this.currentUser.id,
            userName: this.currentUser.name
        };

        // チャットタイプに応じてリクエストボディを設定
        if (this.currentChatType === 'direct') {
            requestBody.messageType = 'direct';
            requestBody.targetUserId = this.currentDirectUserId;
            requestBody.room = `direct_${this.currentUser.id}_${this.currentDirectUserId}`;
        } else if (this.currentChatType === 'announcement') {
            requestBody.messageType = 'announcement';
            requestBody.room = 'announcements';
        } else {
            requestBody.messageType = 'normal';
            requestBody.room = this.currentRoom;
        }

        // サーバーにメッセージを送信
        fetch('/chat/send', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(requestBody),
        })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                // 入力フィールドをクリア
                messageInput.value = '';
                this.updateCharCount();
                
                // メッセージを再読み込み
                this.loadMessages();
            } else {
                console.error('メッセージの送信に失敗しました');
            }
        })
        .catch(error => {
            console.error('エラー:', error);
        });

        // システムメッセージを表示（実際のアプリでは不要）
        this.showSystemMessage(`${this.currentUser.name}さんがメッセージを送信しました`);
    }

    // メッセージの読み込み
    loadMessages() {
        let apiUrl;
        
        if (this.currentChatType === 'direct') {
            apiUrl = `/chat/direct/${this.currentUser.id}/${this.currentDirectUserId}`;
        } else {
            apiUrl = `/chat/messages/${this.currentRoom}`;
        }

        // サーバーからメッセージを取得
        fetch(apiUrl)
        .then(response => response.json())
        .then(data => {
            this.messages = data.messages || [];
            this.displayMessages();
        })
        .catch(error => {
            console.error('メッセージの読み込みに失敗しました:', error);
            this.messages = [];
            this.displayMessages();
        });
    }

    // メッセージの表示
    displayMessages() {
        const chatMessages = document.getElementById('chat-messages');
        chatMessages.innerHTML = '';

        this.messages.forEach(message => {
            this.addMessageToUI(message);
        });

        // 最新のメッセージまでスクロール
        chatMessages.scrollTop = chatMessages.scrollHeight;
    }

    // UIにメッセージを追加
    addMessageToUI(message) {
        const chatMessages = document.getElementById('chat-messages');
        const messageDiv = document.createElement('div');
        
        const isOwnMessage = message.user && message.user.id === this.currentUser.id;
        let messageClass = isOwnMessage ? 'message own' : 'message other';
        
        // お知らせメッセージの場合
        if (message.messageType === 'announcement' || message.isAnnouncement) {
            messageClass += ' announcement';
        }
        
        const time = new Date(message.timestamp).toLocaleTimeString('ja-JP', {
            hour: '2-digit',
            minute: '2-digit'
        });

        messageDiv.className = messageClass;
        messageDiv.innerHTML = `
            <div class="message-content">
                ${message.text}
            </div>
            <div class="message-info">
                <span class="message-user">${message.user ? message.user.name : 'システム'}</span>
                <span class="message-time">${time}</span>
            </div>
        `;

        chatMessages.appendChild(messageDiv);
        chatMessages.scrollTop = chatMessages.scrollHeight;
    }

    // システムメッセージの表示
    showSystemMessage(text) {
        const chatMessages = document.getElementById('chat-messages');
        const systemDiv = document.createElement('div');
        systemDiv.className = 'system-message';
        systemDiv.textContent = text;
        
        chatMessages.appendChild(systemDiv);
        chatMessages.scrollTop = chatMessages.scrollHeight;

        // 3秒後にシステムメッセージを削除
        setTimeout(() => {
            systemDiv.remove();
        }, 3000);
    }

    // ルーム変更
    changeRoom() {
        const roomSelect = document.getElementById('chat-room');
        this.currentRoom = roomSelect.value;
        this.currentChatType = 'room';
        this.currentDirectUserId = null;
        
        // チャットタイトルとUI状態を更新
        this.updateChatTitle();
        this.updateInputArea();
        
        // ルーム変更のシステムメッセージ
        const roomNames = {
            'general': '全体チャット',
            'class1': 'ライオン組',
            'class2': 'ぞう組',
            'class3': 'ひよこ組',
            'class4': 'あひる組',
            'announcements': '園からのお知らせ'
        };
        
        this.showSystemMessage(`${roomNames[this.currentRoom]}に参加しました`);
        
        // 新しいルームのメッセージを読み込み
        this.loadMessages();
    }

    // チャットタイトルの更新
    updateChatTitle() {
        const titleElement = document.getElementById('chat-title');
        if (!titleElement) {
            console.error('Chat title element not found');
            return;
        }

        const roomNames = {
            'general': '全体チャット',
            'class1': 'ライオン組チャット',
            'class2': 'ぞう組チャット',
            'class3': 'ひよこ組チャット',
            'class4': 'あひる組チャット',
            'announcements': '園からのお知らせ'
        };

        if (this.currentChatType === 'direct') {
            const admin = this.admins.find(a => a.id === this.currentDirectUserId);
            titleElement.textContent = `💬 ${admin ? admin.name : '先生'}との連絡`;
        } else {
            titleElement.textContent = roomNames[this.currentRoom] || '保護者チャット';
        }
    }

    // 入力エリアの表示/非表示を制御
    updateInputArea() {
        const inputArea = document.getElementById('chat-input-area');
        
        if (this.currentRoom === 'announcements' && this.currentChatType === 'room') {
            // お知らせページでは一般ユーザーは入力不可
            inputArea.style.display = 'none';
        } else {
            inputArea.style.display = 'block';
        }
    }

    // 文字数カウントの更新
    updateCharCount() {
        const messageInput = document.getElementById('message-input');
        const charCount = document.getElementById('char-count');
        const currentLength = messageInput.value.length;
        const maxLength = messageInput.maxLength;
        
        charCount.textContent = `${currentLength}/${maxLength}`;
        
        // 文字数制限に近づいたら色を変更
        if (currentLength > maxLength * 0.8) {
            charCount.style.color = '#f44336';
        } else {
            charCount.style.color = '#666';
        }
    }

    // 運営者リストの読み込み
    loadAdmins() {
        fetch('/chat/admins')
        .then(response => response.json())
        .then(data => {
            this.admins = data.admins || [];
        })
        .catch(error => {
            console.error('運営者リストの読み込みに失敗しました:', error);
            this.admins = [];
        });
    }

    // モーダルイベントリスナーの設定
    setupModalListeners() {
        // モーダル外クリックで閉じる
        window.addEventListener('click', (event) => {
            const directModal = document.getElementById('direct-message-modal');
            const announcementModal = document.getElementById('announcement-modal');
            
            if (event.target === directModal) {
                this.closeDirectMessageModal();
            }
            if (event.target === announcementModal) {
                this.closeAnnouncementModal();
            }
        });
    }

    // ダイレクトメッセージモーダルを表示
    showDirectMessageModal() {
        const modal = document.getElementById('direct-message-modal');
        const adminList = document.getElementById('admin-list');
        
        // 運営者リストを生成
        adminList.innerHTML = '';
        this.admins.forEach(admin => {
            const adminItem = document.createElement('div');
            adminItem.className = 'admin-item';
            adminItem.onclick = () => this.startDirectChat(admin);
            
            adminItem.innerHTML = `
                <div class="admin-avatar">${admin.name.charAt(0)}</div>
                <div class="admin-info">
                    <h4>${admin.name}</h4>
                    <p>${this.getRoleDescription(admin.role)}</p>
                </div>
            `;
            
            adminList.appendChild(adminItem);
        });
        
        modal.style.display = 'block';
    }

    // ダイレクトメッセージモーダルを閉じる
    closeDirectMessageModal() {
        const modal = document.getElementById('direct-message-modal');
        modal.style.display = 'none';
    }

    // 一斉送信モーダルを表示（将来の運営者機能用）
    showAnnouncementModal() {
        const modal = document.getElementById('announcement-modal');
        modal.style.display = 'block';
    }

    // 一斉送信モーダルを閉じる
    closeAnnouncementModal() {
        const modal = document.getElementById('announcement-modal');
        modal.style.display = 'none';
    }

    // ダイレクトチャット開始
    startDirectChat(admin) {
        if (!admin || !admin.id) {
            console.error('Invalid admin data');
            return;
        }

        this.currentChatType = 'direct';
        this.currentDirectUserId = admin.id;
        this.currentRoom = `direct_${this.currentUser.id}_${admin.id}`;
        
        // ルーム選択をリセット
        const roomSelect = document.getElementById('chat-room');
        if (roomSelect) {
            roomSelect.value = 'general';
        }
        
        // UI更新
        this.updateChatTitle();
        this.updateInputArea();
        
        // メッセージ読み込み
        this.loadMessages();
        
        // モーダルを閉じる
        this.closeDirectMessageModal();
        
        this.showSystemMessage(`${admin.name}との個別連絡を開始しました`);
    }

    // 役職の説明を取得
    getRoleDescription(role) {
        const roleDescriptions = {
            'principal': '園長',
            'head_teacher': '主任保育士',
            'teacher_lion': 'ライオン組担任',
            'teacher_elephant': 'ぞう組担任',
            'teacher_chick': 'ひよこ組担任',
            'teacher_duck': 'あひる組担任'
        };
        return roleDescriptions[role] || '職員';
    }

    // 一斉送信（運営者機能、将来の拡張用）
    sendAnnouncement() {
        const announcementText = document.getElementById('announcement-text');
        const message = announcementText.value.trim();
        
        if (!message) return;
        
        // 一斉送信API呼び出し（実装は運営者権限チェックが必要）
        fetch('/chat/send', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                message: message,
                messageType: 'announcement',
                room: 'announcements',
                userId: this.currentUser.id,
                userName: this.currentUser.name
            }),
        })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                announcementText.value = '';
                this.closeAnnouncementModal();
                alert('お知らせが送信されました');
            }
        })
        .catch(error => {
            console.error('一斉送信エラー:', error);
        });
    }

    // ログアウト
    logout() {
        // Cookieを削除
        const date = new Date();
        date.setTime(date.getTime() - (24 * 60 * 60 * 1000)); // 昨日の日付に設定
        const expires = "expires=" + date.toUTCString();
        document.cookie = "studentID=; " + expires + "; path=/";
        
        window.location.href = '/login';
    }
}

// チャットアプリの初期化
document.addEventListener('DOMContentLoaded', () => {
    window.chatApp = new ChatApp();
});

// グローバル関数として定義（HTMLから呼び出し可能）
function sendMessage() {
    if (window.chatApp) {
        window.chatApp.sendMessage();
    }
}

function changeRoom() {
    if (window.chatApp) {
        window.chatApp.changeRoom();
    }
}

function logout() {
    if (window.chatApp) {
        window.chatApp.logout();
    }
}

function showDirectMessageModal() {
    if (window.chatApp) {
        window.chatApp.showDirectMessageModal();
    }
}

function closeDirectMessageModal() {
    if (window.chatApp) {
        window.chatApp.closeDirectMessageModal();
    }
}

function showAnnouncementModal() {
    if (window.chatApp) {
        window.chatApp.showAnnouncementModal();
    }
}

function closeAnnouncementModal() {
    if (window.chatApp) {
        window.chatApp.closeAnnouncementModal();
    }
}

function sendAnnouncement() {
    if (window.chatApp) {
        window.chatApp.sendAnnouncement();
    }
}

// 予約ページに戻る
function goToReservation() {
    window.location.href = '/reservation';
}

// キーボードイベント処理
function handleCloseKeydown(event, modalType) {
    if (event.key === 'Enter' || event.key === ' ') {
        event.preventDefault();
        if (modalType === 'direct') {
            closeDirectMessageModal();
        } else if (modalType === 'announcement') {
            closeAnnouncementModal();
        }
    }
}
