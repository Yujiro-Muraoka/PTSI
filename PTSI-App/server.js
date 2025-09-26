/**
 * PTSI幼稚園管理システム - メインサーバー
 * Express.jsを使用したWebアプリケーション
 * 
 * 機能:
 * - ユーザー認証
 * - 予約管理
 * - チャット機能（Socket.IO使用）
 * - 学生情報管理
 * 
 * @author Yujiro Muraoka
 */

const express = require('express');
const app = express();
const path = require('path');
const fs = require('fs');
const bodyParser = require('body-parser');

// ミドルウェアの設定
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

// 文字化け対策
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// CORS対応（開発環境用）
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
  
  if (req.method === 'OPTIONS') {
    res.sendStatus(200);
  } else {
    next();
  }
});


// 各ディレクトリの静的ファイルを提供するためのミドルウェアを追加
app.use('/chart', express.static(path.join(__dirname, 'chart')));
app.use('/check-reservation', express.static(path.join(__dirname, 'check-reservation')));
app.use('/css', express.static(path.join(__dirname, 'css')));
app.use('/fonts', express.static(path.join(__dirname, 'fonts')));
app.use('/login', express.static(path.join(__dirname, 'login')));
app.use('/reservation', express.static(path.join(__dirname, 'reservation')));
app.use('/chat', express.static(path.join(__dirname, 'chat')));
app.use('/admin-login', express.static(path.join(__dirname, 'admin-login')));
app.use('/analytics', express.static(path.join(__dirname, 'analytics')));
app.use('/admin-dashboard', express.static(path.join(__dirname, 'admin-dashboard')));
app.use('/manuals', express.static(path.join(__dirname, 'manuals')));

// 新しいログインシステムの静的ファイル配信
app.use('/login-select', express.static(path.join(__dirname, 'login-select')));
app.use('/parent-login', express.static(path.join(__dirname, 'parent-login')));
app.use('/admin-login-new', express.static(path.join(__dirname, 'admin-login-new')));
app.use('/reservation-settings', express.static(path.join(__dirname, 'reservation-settings')));

// 各ディレクトリ内の唯一のHTMLファイルを直接開く
app.get('/chart', (req, res) => {
  res.sendFile(path.join(__dirname, 'chart', 'index.html'));
});

app.get('/check-reservation', (req, res) => {
  res.sendFile(path.join(__dirname, 'check-reservation', 'check-reservation.html'));
});

// 新しいログインシステムのルーティング（テナント対応）
app.get('/login-select', (req, res) => {
  const tenantId = req.query.tenant;
  if (!tenantId) {
    return res.redirect('/tenant-selection');
  }
  
  // テナント設定を確認
  const tenantConfig = getTenantConfig(tenantId);
  if (!tenantConfig) {
    return res.redirect('/tenant-selection?error=tenant_not_found');
  }
  
  res.sendFile(path.join(__dirname, 'login-select', 'login-select.html'));
});

app.get('/parent-login', (req, res) => {
  res.sendFile(path.join(__dirname, 'parent-login', 'parent-login.html'));
});

app.get('/admin-login-new', (req, res) => {
  res.sendFile(path.join(__dirname, 'admin-login-new', 'admin-login-new.html'));
});

// テナント対応ログインページ
app.get('/login', (req, res) => {
  const tenantId = req.query.tenant;
  const loginType = req.query.type; // 'parent' or 'admin'
  
  if (!tenantId) {
    // テナントが指定されていない場合はテナント選択にリダイレクト
    return res.redirect('/tenant-selection');
  }
  
  // テナントの存在確認
  if (!fs.existsSync(path.join(__dirname, 'tenant-config', `${tenantId}.json`))) {
    return res.redirect('/tenant-selection?error=tenant_not_found');
  }
  
  // ログインタイプに応じて適切なページを返す
  if (loginType === 'admin') {
    res.sendFile(path.join(__dirname, 'login', 'login.html'));
  } else {
    // デフォルトまたは保護者ログインの場合
    res.sendFile(path.join(__dirname, 'login', 'login.html'));
  }
});

app.get('/reservation', (req, res) => {
  res.sendFile(path.join(__dirname, 'reservation', 'reservation.html'));
});

app.get('/chat', (req, res) => {
  res.sendFile(path.join(__dirname, 'chat', 'chat.html'));
});

app.get('/admin-login', (req, res) => {
  const tenantId = req.query.tenant;
  
  if (!tenantId) {
    // テナントが指定されていない場合はテナント選択にリダイレクト
    return res.redirect('/tenant-selection');
  }
  
  // テナントの存在確認
  if (!fs.existsSync(path.join(__dirname, 'tenant-config', `${tenantId}.json`))) {
    return res.redirect('/tenant-selection?error=tenant_not_found');
  }
  
  res.sendFile(path.join(__dirname, 'admin-login', 'admin-login.html'));
});

app.get('/admin-dashboard', (req, res) => {
  const tenantId = req.query.tenant || req.cookies.tenantId;
  
  if (!tenantId) {
    // テナントが指定されていない場合はテナント選択にリダイレクト
    return res.redirect('/tenant-selection');
  }
  
  // テナントの存在確認
  if (!fs.existsSync(path.join(__dirname, 'tenant-config', `${tenantId}.json`))) {
    return res.redirect('/tenant-selection?error=tenant_not_found');
  }
  
  res.sendFile(path.join(__dirname, 'admin-dashboard', 'admin-dashboard.html'));
});

app.get('/reservation-settings', (req, res) => {
  res.sendFile(path.join(__dirname, 'reservation-settings', 'reservation-settings.html'));
});

// 保育園選択システムの静的ファイル配信
app.use('/tenant-selection', express.static(path.join(__dirname, 'tenant-selection')));

// データ分析システムの静的ファイル配信
app.use('/analytics', express.static(path.join(__dirname, 'analytics')));

// データ分析ページのルート
app.get('/analytics', (req, res) => {
  const tenantId = req.query.tenant || req.cookies.tenantId;
  
  if (!tenantId) {
    return res.redirect('/tenant-selection');
  }
  
  if (!fs.existsSync(path.join(__dirname, 'tenant-config', `${tenantId}.json`))) {
    return res.redirect('/tenant-selection?error=tenant_not_found');
  }
  
  res.sendFile(path.join(__dirname, 'analytics', 'analytics.html'));
});

// 保育園選択ページのルーティング
app.get('/tenant-selection', (req, res) => {
  res.sendFile(path.join(__dirname, 'tenant-selection', 'tenant-selection.html'));
});

// ルートパスへのアクセス時に保育園選択ページにリダイレクトする
app.get('/', (req, res) => {
  res.redirect('/tenant-selection');
});


/**
 * 保護者の予約情報を受信してCSVファイルに記録するAPI
 * 重複チェックを行い、同一学生・同一日付の予約を防ぐ
 */
app.post('/submit', (req, res) => {
  const studentID = req.body.studentID.replace(/[０-９]/g, function(s) {
    return String.fromCharCode(s.charCodeAt(0) - 0xFEE0);
  });
  const date = req.body.date;
  const type = req.body.type;

  // CSVに書き込むデータの準備
  const data = `${studentID},${date},${type}\n`;

  // 重複をチェックし、csvファイルが存在しない場合は作成する
  const reservationPath = path.join(__dirname, 'DB', 'reservation.csv');
  fs.readFile(reservationPath, 'utf8', (err, fileData) => {
    if (err) {
      if (err.code === 'ENOENT') {
        // ファイルが存在しない場合は新しく作成する
        fs.writeFile(reservationPath, '', (writeErr) => {
          if (writeErr) {
            console.error('CSVファイルの作成に失敗しました:', writeErr);
            return res.status(500).send('サーバーエラーが発生しました。');
          }
          console.log('reservation.csv ファイルが作成されました。');
          checkDuplicateAndAddData(); // ファイルが作成されたら処理を続行する
        });
        return;
      } else {
        console.error('CSVファイルの読み込みに失敗しました:', err);
        return res.status(500).send('サーバーエラーが発生しました。');
      }
    }

    checkDuplicateAndAddData(); // ファイルが存在する場合は処理を続行する

    function checkDuplicateAndAddData() {
      const lines = fileData ? fileData.split('\n') : []; // ファイルが存在しない場合は空の配列を使用
      let isDuplicate = false;
      lines.forEach(line => {
        const [existingStudentID, existingDate, existingType] = line.split(',');
        if (existingStudentID === studentID && existingDate === date && existingType === type) {
          isDuplicate = true;
        }
      });

      if (isDuplicate) {
        res.send('このデータは既に存在します。重複のため追加されませんでした。');
        console.log('このデータは既に存在します。重複のため追加されませんでした。')
      } else {
        // ファイルに追記する
        fs.appendFile(reservationPath, data, (appendErr) => {
          if (appendErr) {
            console.error('データの追加に失敗しました:', appendErr);
            return res.status(500).send('サーバーエラーが発生しました。');
          }
          console.log('データが追加されました。');
          res.send('データが正常に送信されました。');
        });
      }
    }
  });
});

// 学生の情報を取得するAPIを作成
app.post('/studentInfo', (req, res) => {
  const studentID = req.body.studentID.replace(/[０-９]/g, function(s) {
    return String.fromCharCode(s.charCodeAt(0) - 0xFEE0);
  });
  
  // CSVファイルから該当するデータを取得
  const studentInfoPath = path.join(__dirname, 'DB', 'student-info.csv');
  fs.readFile(studentInfoPath, 'utf8', (err, fileData) => {
    if (err) {
      console.error('学生情報ファイルの読み込みに失敗しました:', err);
      return res.status(500).send('サーバーエラーが発生しました。');
    }
    const lines = fileData.split('\n');
    let studentData = null;

    for (let i = 1; i < lines.length; i++) {
      const [id, name, type, late, early, latePickUp] = lines[i].split(',');
      if (id === studentID) {
        studentData = {
          name: name,
          studentID: id,
          type: type,
          lateCount: late,
          earlyCount: early,
          latePickUpCount: latePickUp
        };
        break;
      }
    }

    if (studentData) {
      console.log("該当する学生のデータが見つかりました。")
      res.json(studentData); // データがある場合はJSON形式で返す
    } else {
      res.status(404).send('該当する学生のデータが見つかりませんでした。'); // データが見つからない場合はエラーメッセージを返す
    }
  });
});

/**
 * ユーザー認証API
 * 学生IDとパスワードを照合してログイン認証を行う
 */
app.post('/passwordAuthentication', (req, res) => {
  const { studentId, password } = req.body;
  
  // 入力値の検証
  if (!studentId || !password) {
    return res.status(400).json({ success: false, message: '学生IDとパスワードを入力してください。' });
  }
  
  console.log(`Login attempt for studentId: ${studentId}`);

  // login.csvからデータを読み込む
  const filePath = path.join(__dirname, 'DB', 'login.csv');
  fs.readFile(filePath, 'utf8', (err, data) => {
      if (err) {
          console.error('ログインファイル読み込みエラー:', err);
          return res.status(500).json({ success: false, message: 'サーバーエラーが発生しました。' });
      }

      const rows = data.split('\n').map(row => row.split(','));
      const user = rows.slice(1).find(row => row[0] === studentId && row[1].trim() === password);

      if (user) {
          res.json({ success: true });
      } else {
          res.status(401).json({ success: false, message: 'パスワードが正しくありません。' });
      }
  });
});

/**
 * 統一ログイン認証API（テナント対応）
 * 保護者と管理者の両方のログインを処理
 */
app.post('/login', (req, res) => {
  const { adminId, adminPassword, studentId, password, loginType, tenantId } = req.body;
  
  // テナントIDの検証
  if (!tenantId) {
    return res.status(400).json({ success: false, message: '保育園が選択されていません。' });
  }
  
  const tenantConfig = getTenantConfig(tenantId);
  if (!tenantConfig) {
    return res.status(400).json({ success: false, message: '指定された保育園が見つかりません。' });
  }
  
  if (loginType === 'admin') {
    // 管理者ログイン処理
    if (!adminId || !adminPassword) {
      return res.status(400).json({ success: false, message: '管理者IDとパスワードを入力してください。' });
    }
    
    console.log(`Admin login attempt for adminId: ${adminId} at tenant: ${tenantId}`);

    // テナント別admin-login.csvからデータを読み込む
    const adminLoginPath = getTenantDataPath(tenantId, 'admin-login.csv');
    fs.readFile(adminLoginPath, 'utf8', (err, data) => {
        if (err) {
            console.error('管理者ログインファイル読み込みエラー:', err);
            return res.status(500).json({ success: false, message: 'サーバーエラーが発生しました。' });
        }

        const rows = data.split('\n').map(row => row.split(','));
        const admin = rows.slice(1).find(row => row[0] === adminId && row[1].trim() === adminPassword);

        if (admin) {
            const adminData = {
                id: admin[0],
                name: admin[2],
                role: admin[3],
                tenantId: tenantId,
                tenantName: tenantConfig.name
            };
            res.json({ 
                success: true, 
                user: adminData,
                adminName: adminData.name,
                adminRole: adminData.role,
                userType: 'admin',
                tenantId: tenantId,
                tenantName: tenantConfig.name
            });
        } else {
            res.status(401).json({ success: false, message: '管理者IDまたはパスワードが正しくありません。' });
        }
    });
  } else {
    // 保護者ログイン処理
    if (!studentId || !password) {
      return res.status(400).json({ success: false, message: '学籍番号とパスワードを入力してください。' });
    }
    
    console.log(`Parent login attempt for studentId: ${studentId} at tenant: ${tenantId}`);

    const loginPath = getTenantDataPath(tenantId, 'login.csv');
    fs.readFile(loginPath, 'utf8', (err, data) => {
        if (err) {
            console.error('保護者ログインファイル読み込みエラー:', err);
            return res.status(500).json({ success: false, message: 'サーバーエラーが発生しました。' });
        }

        const rows = data.split('\n').map(row => row.split(','));
        const user = rows.slice(1).find(row => row[0] === studentId && row[1].trim() === password);

        if (user) {
            res.json({ 
                success: true,
                user: {
                  id: user[0],
                  name: user[2] || '保護者',
                  tenantId: tenantId,
                  tenantName: tenantConfig.name
                },
                userType: 'parent',
                tenantId: tenantId,
                tenantName: tenantConfig.name
            });
        } else {
            res.status(401).json({ success: false, message: 'パスワードが正しくありません。' });
        }
    });
  }
});

/**
 * 管理者認証API（下位互換性のため維持）
 * 管理者IDとパスワードを照合してログイン認証を行う
 */
app.post('/adminAuthentication', (req, res) => {
  const { adminId, password } = req.body;
  
  // 入力値の検証
  if (!adminId || !password) {
    return res.status(400).json({ success: false, message: '管理者IDとパスワードを入力してください。' });
  }
  
  console.log(`Admin login attempt for adminId: ${adminId}`);

  // admin-login.csvからデータを読み込む
  const adminLoginPath = path.join(__dirname, 'DB', 'admin-login.csv');
  fs.readFile(adminLoginPath, 'utf8', (err, data) => {
      if (err) {
          console.error('管理者ログインファイル読み込みエラー:', err);
          return res.status(500).json({ success: false, message: 'サーバーエラーが発生しました。' });
      }

      const rows = data.split('\n').map(row => row.split(','));
      const admin = rows.slice(1).find(row => row[0] === adminId && row[1].trim() === password);

      if (admin) {
          const adminData = {
              id: admin[0],
              name: admin[2],
              role: admin[3]
          };
          res.json({ 
              success: true, 
              adminName: adminData.name,
              adminRole: adminData.role
          });
      } else {
          res.status(401).json({ success: false, message: '管理者IDまたはパスワードが正しくありません。' });
      }
  });
});

// チャット機能のためのメッセージ保存
let chatMessages = {
  general: [],
  class1: [],
  class2: [],
  class3: [],
  class4: [],
  announcements: [], // 運営からの一斉送信
  direct: {}, // ダイレクトメッセージ (userId_adminId形式)
  // 職員チャット用
  'staff-general': [],
  'staff-teachers': [],
  'staff-admin': [],
  'staff-support': [],
  'staff-emergency': []
};

// 運営者リスト（実際のアプリケーションではデータベースから取得）
const adminUsers = [
  { id: 'admin001', name: '園長先生', role: 'principal', department: '管理職' },
  { id: 'admin002', name: '主任保育士', role: 'head_teacher', department: '管理職' },
  { id: 'admin003', name: 'ライオン組担任', role: 'teacher_lion', department: '担任教師' },
  { id: 'admin004', name: 'ぞう組担任', role: 'teacher_elephant', department: '担任教師' },
  { id: 'admin005', name: 'ひよこ組担任', role: 'teacher_chick', department: '担任教師' },
  { id: 'admin006', name: 'あひる組担任', role: 'teacher_duck', department: '担任教師' },
  { id: 'admin007', name: '栄養士', role: 'nutritionist', department: 'サポートスタッフ' },
  { id: 'admin008', name: '事務職員', role: 'office_staff', department: 'サポートスタッフ' }
];

// チャットメッセージ送信API
app.post('/chat/send', (req, res) => {
  const { message, room, userId, userName, messageType, targetUserId } = req.body;
  
  if (!message || !userId || !userName) {
    return res.status(400).json({ success: false, message: '必要な情報が不足しています' });
  }

  const newMessage = {
    id: Date.now(),
    text: message,
    user: {
      id: userId,
      name: userName
    },
    room: room,
    messageType: messageType || 'normal',
    timestamp: new Date().toISOString()
  };

  // メッセージタイプに応じて保存先を決定
  if (messageType === 'direct') {
    // ダイレクトメッセージの場合
    const directRoomKey = `${userId}_${targetUserId}`;
    if (!chatMessages.direct[directRoomKey]) {
      chatMessages.direct[directRoomKey] = [];
    }
    newMessage.targetUserId = targetUserId;
    chatMessages.direct[directRoomKey].push(newMessage);
    
    // 最新の100件のみ保持
    if (chatMessages.direct[directRoomKey].length > 100) {
      chatMessages.direct[directRoomKey] = chatMessages.direct[directRoomKey].slice(-100);
    }
  } else if (messageType === 'announcement') {
    // 一斉送信の場合
    newMessage.isAnnouncement = true;
    chatMessages.announcements.push(newMessage);
    
    // 最新の50件のみ保持
    if (chatMessages.announcements.length > 50) {
      chatMessages.announcements = chatMessages.announcements.slice(-50);
    }
  } else {
    // 通常のチャットルームメッセージ
    if (!chatMessages[room]) {
      chatMessages[room] = [];
    }
    chatMessages[room].push(newMessage);
    
    // 最新の50件のみ保持
    if (chatMessages[room].length > 50) {
      chatMessages[room] = chatMessages[room].slice(-50);
    }
  }

  console.log(`Chat message sent - Type: ${messageType}, Room: ${room}, Message: ${message}`);
  res.json({ success: true, message: newMessage });
});

// チャットメッセージ取得API
app.get('/chat/messages/:room', (req, res) => {
  const room = req.params.room;
  
  if (room === 'announcements') {
    return res.json({ messages: chatMessages.announcements || [] });
  }
  
  if (!chatMessages[room]) {
    return res.json({ messages: [] });
  }

  res.json({ messages: chatMessages[room] });
});

// ダイレクトメッセージ取得API
app.get('/chat/direct/:userId1/:userId2', (req, res) => {
  const userId1 = req.params.userId1;
  const userId2 = req.params.userId2;
  
  // 両方向のキーをチェック
  const directRoomKey1 = `${userId1}_${userId2}`;
  const directRoomKey2 = `${userId2}_${userId1}`;
  
  const messages1 = chatMessages.direct[directRoomKey1] || [];
  const messages2 = chatMessages.direct[directRoomKey2] || [];
  
  // 両方向のメッセージを統合して時間順にソート
  const allMessages = [...messages1, ...messages2];
  allMessages.sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
  
  res.json({ messages: allMessages });
});

// 運営者リスト取得API
app.get('/chat/admins', (req, res) => {
  res.json({ admins: adminUsers });
});

// 職員チャット用の静的ファイル配信
app.use('/staff-chat', express.static(path.join(__dirname, 'staff-chat')));

// 職員チャットページ
app.get('/staff-chat', (req, res) => {
  res.sendFile(path.join(__dirname, 'staff-chat', 'staff-chat.html'));
});

// 職員チャットメッセージ送信API
app.post('/staff-chat/send', (req, res) => {
  const { message, room, userId, userName, userRole, messageType, urgent } = req.body;
  
  if (!message || !userId || !userName || !room) {
    return res.status(400).json({ success: false, message: '必要な情報が不足しています' });
  }

  const newMessage = {
    id: Date.now(),
    message: message,
    userId: userId,
    userName: userName,
    userRole: userRole || '職員',
    room: room,
    messageType: messageType || 'staff',
    urgent: urgent || false,
    timestamp: new Date().toISOString()
  };

  // 職員チャットルームにメッセージを保存
  if (!chatMessages[room]) {
    chatMessages[room] = [];
  }
  
  chatMessages[room].push(newMessage);
  
  // 最新の100件のみ保持
  if (chatMessages[room].length > 100) {
    chatMessages[room] = chatMessages[room].slice(-100);
  }

  console.log(`Staff chat message sent - Room: ${room}, User: ${userName}, Urgent: ${urgent}`);
  res.json({ success: true, message: newMessage });
});

// 職員チャットメッセージ取得API
app.get('/staff-chat/messages', (req, res) => {
  const room = req.query.room;
  
  if (!room) {
    return res.status(400).json({ success: false, message: 'ルーム名が指定されていません' });
  }
  
  if (!chatMessages[room]) {
    chatMessages[room] = [];
  }

  res.json({ success: true, messages: chatMessages[room] });
});

// 職員緊急連絡ブロードキャストAPI
app.post('/staff-chat/broadcast', (req, res) => {
  const { message, userId, userName, userRole, messageType } = req.body;
  
  if (!message || !userId || !userName) {
    return res.status(400).json({ success: false, message: '必要な情報が不足しています' });
  }

  const broadcastMessage = {
    id: Date.now(),
    message: message,
    userId: userId,
    userName: userName,
    userRole: userRole || '職員',
    messageType: 'emergency',
    urgent: true,
    broadcast: true,
    timestamp: new Date().toISOString()
  };

  // 全ての職員チャットルームに緊急メッセージを追加
  const staffRooms = ['staff-general', 'staff-teachers', 'staff-admin', 'staff-support', 'staff-emergency'];
  
  staffRooms.forEach(room => {
    if (!chatMessages[room]) {
      chatMessages[room] = [];
    }
    chatMessages[room].push({...broadcastMessage, room: room});
    
    // 最新の100件のみ保持
    if (chatMessages[room].length > 100) {
      chatMessages[room] = chatMessages[room].slice(-100);
    }
  });

  console.log(`Emergency broadcast sent by ${userName}: ${message}`);
  res.json({ success: true, message: broadcastMessage });
});

// 管理者情報取得API（職員チャット用）
app.post('/api/admin-info', (req, res) => {
  const { adminId } = req.body;
  
  if (!adminId) {
    return res.status(400).json({ success: false, message: '管理者IDが指定されていません' });
  }

  const admin = adminUsers.find(user => user.id === adminId);
  
  if (admin) {
    res.json({ 
      success: true, 
      admin: {
        id: admin.id,
        name: admin.name,
        role: admin.role,
        department: admin.department
      }
    });
  } else {
    res.status(404).json({ success: false, message: '管理者が見つかりません' });
  }
});

// チャットユーザー情報取得API
app.post('/chat/user-info', (req, res) => {
  const studentID = req.body.studentID;
  
  // CSVファイルから該当するデータを取得
  const studentInfoPath = path.join(__dirname, 'DB', 'student-info.csv');
  fs.readFile(studentInfoPath, 'utf8', (err, fileData) => {
    if (err) {
      return res.status(500).json({ success: false, message: 'サーバーエラーが発生しました' });
    }
    
    const lines = fileData.split('\n');
    let studentData = null;

    for (let i = 1; i < lines.length; i++) {
      const columns = lines[i].split(',');
      if (columns.length >= 7) { // クラス情報を含む新しい形式
        const [id, name, type, late, early, latePickUp, studentClass] = columns;
        if (id === studentID) {
          studentData = {
            id: id,
            name: name.trim(),
            type: type,
            class: (studentClass || '').trim()
          };
          break;
        }
      } else if (columns.length >= 6) { // 旧形式（クラス情報なし）
        const [id, name, type, late, early, latePickUp] = columns;
        if (id === studentID) {
          studentData = {
            id: id,
            name: name.trim(),
            type: type,
            class: '' // クラス情報がない場合は空文字
          };
          break;
        }
      }
    }

    if (studentData) {
      res.json({ success: true, user: studentData });
    } else {
      res.status(404).json({ success: false, message: '該当する学生のデータが見つかりませんでした' });
    }
  });
});

/**
 * 保護者向けマニュアルHTML提供API
 * ブラウザの印刷機能でPDF生成できるHTMLを提供
 */
app.get('/download/parent-manual', (req, res) => {
  console.log('保護者向けマニュアルHTMLリクエストを受信');
  try {
    const htmlPath = path.join(__dirname, 'manuals', 'parent-manual.html');
    
    if (!fs.existsSync(htmlPath)) {
      return res.status(404).send('マニュアルファイルが見つかりません。');
    }
    
    let htmlContent = fs.readFileSync(htmlPath, 'utf8');
    
    // 印刷用のスタイルを追加
    const printStyles = `
    <style>
      @media print {
        body { margin: 0; }
        .no-print { display: none !important; }
        .container { box-shadow: none !important; }
        .page-break { page-break-before: always; }
      }
    </style>
    <script>
      window.onload = function() {
        // 印刷ダイアログを自動表示（オプション）
        if (window.location.search.includes('print=auto')) {
          setTimeout(() => window.print(), 1000);
        }
      }
    </script>`;
    
    // </head>タグの前に印刷用スタイルを挿入
    htmlContent = htmlContent.replace('</head>', printStyles + '</head>');
    
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.send(htmlContent);
    console.log('保護者向けマニュアルHTML送信完了');
    
  } catch (error) {
    console.error('マニュアル提供エラー:', error);
    res.status(500).send('マニュアルの読み込みに失敗しました。');
  }
});

/**
 * 運営者向けマニュアルHTML提供API
 * 管理者認証が必要なAPI - ブラウザの印刷機能でPDF生成できるHTMLを提供
 */
app.get('/download/admin-manual', (req, res) => {
  console.log('運営者向けマニュアルHTMLリクエストを受信');
  
  // 管理者認証トークンをチェック
  const authToken = req.headers.authorization || req.query.token;
  
  if (!authToken) {
    return res.status(401).json({ 
      success: false, 
      message: '管理者認証が必要です。ログインしてからアクセスしてください。' 
    });
  }
  
  // トークンの検証（簡易実装）
  // 実際の実装では、よりセキュアなトークン検証を行う
  if (!authToken.startsWith('admin_')) {
    return res.status(403).json({ 
      success: false, 
      message: 'アクセス権限がありません。管理者としてログインしてください。' 
    });
  }
  
  try {
    const htmlPath = path.join(__dirname, 'manuals', 'admin-manual.html');
    
    if (!fs.existsSync(htmlPath)) {
      return res.status(404).send('マニュアルファイルが見つかりません。');
    }
    
    let htmlContent = fs.readFileSync(htmlPath, 'utf8');
    
    // 印刷用のスタイルを追加
    const printStyles = `
    <style>
      @media print {
        body { margin: 0; }
        .no-print { display: none !important; }
        .container { box-shadow: none !important; }
        .page-break { page-break-before: always; }
      }
    </style>
    <script>
      window.onload = function() {
        // 印刷ダイアログを自動表示（オプション）
        if (window.location.search.includes('print=auto')) {
          setTimeout(() => window.print(), 1000);
        }
      }
    </script>`;
    
    // </head>タグの前に印刷用スタイルを挿入
    htmlContent = htmlContent.replace('</head>', printStyles + '</head>');
    
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.send(htmlContent);
    console.log('運営者向けマニュアルHTML送信完了');
    
  } catch (error) {
    console.error('マニュアル提供エラー:', error);
    res.status(500).send('マニュアルの読み込みに失敗しました。');
  }
});

/**
 * 管理者認証トークン生成API
 */
app.post('/api/admin-token', (req, res) => {
  const { adminId, adminRole } = req.body;
  
  if (!adminId || !adminRole) {
    return res.status(400).json({ 
      success: false, 
      message: '管理者情報が不足しています。' 
    });
  }
  
  // 簡易トークン生成（実際の実装では、JWTなどを使用）
  const token = `admin_${adminId}_${Date.now()}`;
  
  console.log(`管理者認証トークン生成: ${adminId} -> ${token}`);
  
  res.json({ 
    success: true, 
    token: token,
    expiresIn: '24h'
  });
});

// =============================================================================
// マルチテナント API エンドポイント
// =============================================================================

/**
 * 保育園一覧取得API
 */
app.get('/api/tenants', (req, res) => {
  try {
    const tenantsPath = path.join(__dirname, 'DB', 'tenants.csv');
    
    if (!fs.existsSync(tenantsPath)) {
      return res.json({ success: true, tenants: [] });
    }
    
    const tenantsData = fs.readFileSync(tenantsPath, 'utf8');
    const tenantRows = tenantsData.split('\n').filter(row => row.trim()).slice(1);
    
    const tenants = tenantRows.map(row => {
      const [id, name, description, theme, status, icon, studentCount, classCount, staffCount, createdDate] = row.split(',');
      return {
        id: id,
        name: name,
        description: description,
        theme: theme,
        status: status,
        icon: icon,
        studentCount: parseInt(studentCount) || 0,
        classCount: parseInt(classCount) || 0,
        staffCount: parseInt(staffCount) || 0,
        createdDate: createdDate
      };
    });
    
    console.log(`保育園一覧取得: ${tenants.length}園`);
    res.json({ success: true, tenants: tenants });
  } catch (error) {
    console.error('保育園一覧取得エラー:', error);
    res.status(500).json({ success: false, message: 'サーバーエラーが発生しました。' });
  }
});

/**
 * 保育園詳細情報取得API
 */
app.get('/api/tenants/:tenantId', (req, res) => {
  try {
    const tenantId = req.params.tenantId;
    const configPath = path.join(__dirname, 'tenant-config', `${tenantId}.json`);
    
    if (!fs.existsSync(configPath)) {
      return res.status(404).json({ success: false, message: '指定された保育園が見つかりません。' });
    }
    
    const configData = fs.readFileSync(configPath, 'utf8');
    const tenantConfig = JSON.parse(configData);
    
    console.log(`保育園詳細取得: ${tenantId}`);
    res.json({ success: true, tenant: tenantConfig });
  } catch (error) {
    console.error('保育園詳細取得エラー:', error);
    res.status(500).json({ success: false, message: 'サーバーエラーが発生しました。' });
  }
});

/**
 * 新規保育園作成API
 */
app.post('/api/tenants/create', (req, res) => {
  try {
    const { tenantId, tenantName, description, themeColor, adminId, adminPassword, adminName } = req.body;
    
    // バリデーション
    if (!tenantId || !tenantName || !adminId || !adminPassword || !adminName) {
      return res.status(400).json({ success: false, message: '必須項目が不足しています。' });
    }
    
    // 保育園IDの重複チェック
    const tenantsPath = path.join(__dirname, 'DB', 'tenants.csv');
    if (fs.existsSync(tenantsPath)) {
      const tenantsData = fs.readFileSync(tenantsPath, 'utf8');
      if (tenantsData.includes(tenantId)) {
        return res.status(409).json({ success: false, message: 'この保育園IDは既に使用されています。' });
      }
    }
    
    // テナントディレクトリ作成
    const tenantDataDir = path.join(__dirname, 'tenant-data', tenantId);
    if (!fs.existsSync(tenantDataDir)) {
      fs.mkdirSync(tenantDataDir, { recursive: true });
    }
    
    // 保育園設定ファイル作成
    const tenantConfig = {
      tenantId: tenantId,
      name: tenantName,
      description: description || '',
      theme: themeColor || 'blue',
      status: 'active',
      icon: '🏫',
      settings: {
        timezone: 'Asia/Tokyo',
        currency: 'JPY',
        dateFormat: 'YYYY-MM-DD',
        language: 'ja'
      },
      features: {
        chat: true,
        reservations: true,
        reports: true,
        customPricing: false
      },
      pricing: {
        type1: { name: '遅刻申請', basePrice: 0, timeSlots: {} },
        type2: { name: '早退申請', basePrice: 0, timeSlots: {} },
        type3: { name: '預かり保育', basePrice: 500, timeSlots: {} },
        type4: { name: '延長保育', basePrice: 800, timeSlots: {} }
      },
      chatSettings: {
        enableParentChat: true,
        enableStaffChat: true,
        enableAnonymous: false,
        moderationEnabled: true,
        allowFileUpload: true,
        maxMessageLength: 1000
      },
      classes: [],
      contact: {
        phone: '',
        email: '',
        address: ''
      },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    
    const configPath = path.join(__dirname, 'tenant-config', `${tenantId}.json`);
    fs.writeFileSync(configPath, JSON.stringify(tenantConfig, null, 2));
    
    // 初期管理者データ作成
    const adminData = `admin-id,password,name,role\n${adminId},${adminPassword},${adminName},principal\n`;
    fs.writeFileSync(path.join(tenantDataDir, 'admin-login.csv'), adminData);
    
    // 空のデータファイル作成
    fs.writeFileSync(path.join(tenantDataDir, 'login.csv'), 'student-id,password\n');
    fs.writeFileSync(path.join(tenantDataDir, 'student-info.csv'), 'student-id,name,type,late,early,late-pick-up,class\n');
    fs.writeFileSync(path.join(tenantDataDir, 'reservation.csv'), '');
    fs.writeFileSync(path.join(tenantDataDir, 'reservation-settings.csv'), '');
    
    // テナント一覧に追加
    const tenantEntry = `${tenantId},${tenantName},"${description}",${themeColor},active,🏫,0,0,1,${new Date().toISOString().split('T')[0]}\n`;
    fs.appendFileSync(tenantsPath, tenantEntry);
    
    console.log(`新規保育園作成: ${tenantId} - ${tenantName}`);
    res.json({ success: true, message: '保育園が正常に作成されました。' });
  } catch (error) {
    console.error('保育園作成エラー:', error);
    res.status(500).json({ success: false, message: 'サーバーエラーが発生しました。' });
  }
});

/**
 * テナント設定更新API
 */
app.post('/api/tenants/:tenantId/settings', (req, res) => {
  try {
    const tenantId = req.params.tenantId;
    const settings = req.body;
    
    const configPath = path.join(__dirname, 'tenant-config', `${tenantId}.json`);
    
    if (!fs.existsSync(configPath)) {
      return res.status(404).json({ success: false, message: '指定された保育園が見つかりません。' });
    }
    
    const configData = fs.readFileSync(configPath, 'utf8');
    const tenantConfig = JSON.parse(configData);
    
    // 設定を更新
    tenantConfig.settings = { ...tenantConfig.settings, ...settings };
    tenantConfig.updatedAt = new Date().toISOString();
    
    fs.writeFileSync(configPath, JSON.stringify(tenantConfig, null, 2));
    
    console.log(`保育園設定更新: ${tenantId}`);
    res.json({ success: true, message: '設定が更新されました。' });
  } catch (error) {
    console.error('保育園設定更新エラー:', error);
    res.status(500).json({ success: false, message: 'サーバーエラーが発生しました。' });
  }
});

/**
 * テナント別データパス取得ヘルパー関数
 */
function getTenantDataPath(tenantId, filename) {
  return path.join(__dirname, 'tenant-data', tenantId, filename);
}

/**
 * テナント設定取得ヘルパー関数
 */
function getTenantConfig(tenantId) {
  try {
    const configPath = path.join(__dirname, 'tenant-config', `${tenantId}.json`);
    if (fs.existsSync(configPath)) {
      const configData = fs.readFileSync(configPath, 'utf8');
      return JSON.parse(configData);
    }
    return null;
  } catch (error) {
    console.error('テナント設定取得エラー:', error);
    return null;
  }
}

/**
 * データ分析API - 学生データ取得
 */
app.get('/api/analytics/student-data', (req, res) => {
  try {
    const tenantId = req.query.tenant;
    
    if (!tenantId) {
      return res.status(400).json({ success: false, message: 'テナントIDが指定されていません。' });
    }
    
    const studentInfoPath = getTenantDataPath(tenantId, 'student-info.csv');
    
    if (!fs.existsSync(studentInfoPath)) {
      return res.status(404).json({ success: false, message: '学生データが見つかりません。' });
    }
    
    const csvData = fs.readFileSync(studentInfoPath, 'utf8');
    const lines = csvData.trim().split('\n');
    const headers = lines[0].split(',');
    
    const students = lines.slice(1).map(line => {
      const values = line.split(',');
      const student = {};
      headers.forEach((header, index) => {
        student[header] = values[index];
      });
      return student;
    });
    
    res.json({ success: true, data: students });
  } catch (error) {
    console.error('学生データ取得エラー:', error);
    res.status(500).json({ success: false, message: 'サーバーエラーが発生しました。' });
  }
});

// エラーハンドリングミドルウェア
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  res.status(500).send('サーバーエラーが発生しました。');
});

// 管理者ダッシュボード用API群

/**
 * 管理者ダッシュボード統計情報API
 */
app.get('/admin/stats', (req, res) => {
  try {
    // 今日の日付を取得
    const today = new Date().toISOString().split('T')[0];
    
    // 予約データを読み込み
    const reservationPath = path.join(__dirname, 'DB', 'reservation.csv');
    const studentInfoPath = path.join(__dirname, 'DB', 'student-info.csv');
    
    let todayReservations = 0;
    let totalReservations = 0;
    let totalStudents = 0;
    
    // 予約データ統計
    if (fs.existsSync(reservationPath)) {
      const reservationData = fs.readFileSync(reservationPath, 'utf8');
      const reservationRows = reservationData.split('\n').filter(row => row.trim());
      
      totalReservations = Math.max(0, reservationRows.length - 1); // ヘッダー行を除く
      
      // 今日の予約数をカウント
      todayReservations = reservationRows.slice(1).filter(row => {
        const columns = row.split(',');
        return columns[1] === today;
      }).length;
    }
    
    // 学生数統計
    if (fs.existsSync(studentInfoPath)) {
      const studentData = fs.readFileSync(studentInfoPath, 'utf8');
      const studentRows = studentData.split('\n').filter(row => row.trim());
      totalStudents = Math.max(0, studentRows.length - 1); // ヘッダー行を除く
    }
    
    // 拡張統計データ
    const attendanceRate = '95%'; // デモデータ
    const classStats = {
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
    
    const trends = {
      monthlyReservations: {
        labels: ['1月', '2月', '3月', '4月', '5月', '6月'],
        values: [45, 52, 48, 61, 55, 67]
      },
      weeklyAttendance: {
        labels: ['月', '火', '水', '木', '金'],
        values: [95, 92, 98, 94, 96]
      },
      classDistribution: {
        labels: ['ひまわり組', 'ばら組', 'さくら組', 'すみれ組'],
        values: [25, 30, 28, 22]
      }
    };

    res.json({
      todayReservations,
      totalReservations,
      totalStudents,
      attendanceRate,
      reservationsTrend: '+5',
      studentsTrend: '+2',
      totalReservationsTrend: '+18',
      attendanceTrend: '+2%',
      classStats,
      trends
    });
  } catch (error) {
    console.error('統計データ取得エラー:', error);
    res.status(500).json({ error: 'サーバーエラーが発生しました' });
  }
});

/**
 * 管理者ダッシュボード最近の活動API
 */
app.get('/admin/recent-activities', (req, res) => {
  try {
    const activities = [];
    
    // 予約データから最近の活動を取得
    const reservationPath = path.join(__dirname, 'DB', 'reservation.csv');
    if (fs.existsSync(reservationPath)) {
      const reservationData = fs.readFileSync(reservationPath, 'utf8');
      const reservationRows = reservationData.split('\n').filter(row => row.trim()).slice(1);
      
      // 最新5件の予約を取得
      const recentReservations = reservationRows.slice(-5).reverse();
      
      recentReservations.forEach(row => {
        const [studentId, date, type] = row.split(',');
        const typeLabel = getAdminTypeLabel(type);
        activities.push({
          text: `学生ID ${studentId} が ${typeLabel} を申請しました`,
          time: date
        });
      });
    }
    
    res.json({ activities });
  } catch (error) {
    console.error('最近の活動データ取得エラー:', error);
    res.status(500).json({ error: 'サーバーエラーが発生しました' });
  }
});

/**
 * 管理者ダッシュボード予約一覧API
 */
app.get('/admin/reservations', (req, res) => {
  try {
    const reservations = [];
    
    const reservationPath = path.join(__dirname, 'DB', 'reservation.csv');
    const studentInfoPath = path.join(__dirname, 'DB', 'student-info.csv');
    
    if (!fs.existsSync(reservationPath)) {
      return res.json({ reservations: [] });
    }
    
    // 学生情報を読み込み
    const studentMap = new Map();
    if (fs.existsSync(studentInfoPath)) {
      const studentData = fs.readFileSync(studentInfoPath, 'utf8');
      const studentRows = studentData.split('\n').filter(row => row.trim()).slice(1);
      
      studentRows.forEach(row => {
        const [id, name] = row.split(',');
        studentMap.set(id, name);
      });
    }
    
    // 予約データを読み込み
    const reservationData = fs.readFileSync(reservationPath, 'utf8');
    const reservationRows = reservationData.split('\n').filter(row => row.trim()).slice(1);
    
    reservationRows.forEach(row => {
      const [studentId, date, type] = row.split(',');
      reservations.push({
        studentId,
        studentName: studentMap.get(studentId) || '不明',
        date,
        type
      });
    });
    
    // 日付順にソート（新しい順）
    reservations.sort((a, b) => new Date(b.date) - new Date(a.date));
    
    res.json({ reservations });
  } catch (error) {
    console.error('予約データ取得エラー:', error);
    res.status(500).json({ error: 'サーバーエラーが発生しました' });
  }
});

/**
 * 管理者ダッシュボード学生一覧API
 */
app.get('/admin/students', (req, res) => {
  try {
    const students = [];
    
    const studentInfoPath = path.join(__dirname, 'DB', 'student-info.csv');
    
    if (!fs.existsSync(studentInfoPath)) {
      return res.json({ students: [] });
    }
    
    const studentData = fs.readFileSync(studentInfoPath, 'utf8');
    const studentRows = studentData.split('\n').filter(row => row.trim()).slice(1);
    
    studentRows.forEach(row => {
      const [studentId, name, type, lateCount, earlyCount, latePickUpCount] = row.split(',');
      students.push({
        studentId,
        name,
        type,
        lateCount: parseInt(lateCount) || 0,
        earlyCount: parseInt(earlyCount) || 0,
        latePickUpCount: parseInt(latePickUpCount) || 0
      });
    });
    
    res.json({ students });
  } catch (error) {
    console.error('学生データ取得エラー:', error);
    res.status(500).json({ error: 'サーバーエラーが発生しました' });
  }
});

/**
 * 予約種類からラベルを取得するヘルパー関数
 * @param {string} type - 予約種類
 * @returns {string} ラベル文字列
 */
function getAdminTypeLabel(type) {
  if (type.startsWith('type1')) return '遅刻申請';
  if (type.startsWith('type2')) return '早退申請';
  if (type.startsWith('type3')) return '欠席申請';
  if (type.startsWith('type4')) return '延長保育';
  return type;
}

// 404エラーハンドリング
app.use((req, res) => {
  res.status(404).send('ページが見つかりません。');
});

// セキュリティヘッダーの追加
app.use((req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
  next();
});

/**
 * システムアラートAPI
 */
app.get('/admin/alerts', (req, res) => {
  try {
    const alerts = [
      {
        type: 'warning',
        priority: 'warning',
        title: '出席率低下の注意',
        description: 'ひまわり組の出席率が平均を下回っています',
        timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000)
      },
      {
        type: 'info',
        priority: 'info',
        title: 'システムメンテナンス予定',
        description: '来週日曜日にシステムメンテナンスを予定しています',
        timestamp: new Date(Date.now() - 1 * 60 * 60 * 1000)
      }
    ];
    
    res.json({ alerts });
  } catch (error) {
    console.error('アラートデータ取得エラー:', error);
    res.status(500).json({ error: 'サーバーエラーが発生しました' });
  }
});

/**
 * 分析データAPI
 */
app.get('/admin/analytics', (req, res) => {
  try {
    const period = req.query.period || 'month';
    
    // 期間に応じたサンプルデータ
    let analyticsData = {};
    
    switch (period) {
      case 'week':
        analyticsData = {
          reservationTrend: {
            labels: ['月', '火', '水', '木', '金', '土', '日'],
            values: [12, 15, 18, 14, 16, 8, 5]
          },
          attendanceData: {
            labels: ['月', '火', '水', '木', '金'],
            values: [98, 95, 97, 93, 96]
          }
        };
        break;
      case 'year':
        analyticsData = {
          reservationTrend: {
            labels: ['1月', '2月', '3月', '4月', '5月', '6月', '7月', '8月', '9月', '10月', '11月', '12月'],
            values: [45, 52, 48, 61, 55, 67, 72, 58, 63, 69, 51, 47]
          },
          attendanceData: {
            labels: ['1月', '2月', '3月', '4月', '5月', '6月', '7月', '8月', '9月', '10月', '11月', '12月'],
            values: [94, 95, 92, 96, 98, 95, 93, 89, 97, 95, 94, 96]
          }
        };
        break;
      default: // month
        analyticsData = {
          reservationTrend: {
            labels: ['1月', '2月', '3月', '4月', '5月', '6月'],
            values: [45, 52, 48, 61, 55, 67]
          },
          attendanceData: {
            labels: ['月', '火', '水', '木', '金'],
            values: [95, 92, 98, 94, 96]
          }
        };
    }
    
    analyticsData.classDistribution = {
      labels: ['ひまわり組', 'ばら組', 'さくら組', 'すみれ組'],
      values: [25, 30, 28, 22]
    };
    
    res.json(analyticsData);
  } catch (error) {
    console.error('分析データ取得エラー:', error);
    res.status(500).json({ error: 'サーバーエラーが発生しました' });
  }
});

/**
 * レポートエクスポートAPI
 */
app.get('/admin/export-report', (req, res) => {
  try {
    const format = req.query.format || 'pdf';
    
    // 実際の実装では、適切な形式でレポートを生成
    // ここではデモ用の簡単なレスポンス
    switch (format) {
      case 'pdf':
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', 'attachment; filename="report.pdf"');
        res.send(Buffer.from('PDF Report Content')); // デモ用
        break;
      case 'excel':
        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.setHeader('Content-Disposition', 'attachment; filename="report.xlsx"');
        res.send(Buffer.from('Excel Report Content')); // デモ用
        break;
      case 'csv':
        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', 'attachment; filename="report.csv"');
        res.send('Name,Class,Attendance\nTest Student,ひまわり組,95%'); // デモ用
        break;
      default:
        res.status(400).json({ error: '不正なフォーマット' });
    }
  } catch (error) {
    console.error('レポートエクスポートエラー:', error);
    res.status(500).json({ error: 'サーバーエラーが発生しました' });
  }
});


/**
 * 予約設定関連のAPI
 */

/**
 * 指定日の予約設定を取得
 */
app.get('/api/reservation-settings/:date', (req, res) => {
  try {
    const targetDate = req.params.date;
    const settingsPath = path.join(__dirname, 'DB', 'reservation-settings.csv');
    
    // CSVファイルが存在しない場合は作成
    if (!fs.existsSync(settingsPath)) {
      const headers = 'date,category,enabled,options\n';
      fs.writeFileSync(settingsPath, headers, 'utf8');
    }
    
    const csvData = fs.readFileSync(settingsPath, 'utf8');
    const lines = csvData.split('\n').filter(line => line.trim() !== '');
    
    // 指定日の設定を検索
    const dateSettings = {
      date: targetDate,
      lateArrival: { enabled: false, options: [] },
      earlyDeparture: { enabled: false, options: [] },
      childcare: { enabled: false, options: [] },
      extendedCare: { enabled: false, options: [] }
    };
    
    let foundSettings = false;
    
    for (let i = 1; i < lines.length; i++) { // ヘッダーをスキップ
      const line = lines[i];
      const columns = parseCSVLine(line);
      
      if (columns.length >= 4 && columns[0] === targetDate) {
        foundSettings = true;
        const category = columns[1];
        const enabled = columns[2] === 'true';
        const options = columns[3] ? columns[3].split(',').map(opt => opt.trim().replace(/"/g, '')) : [];
        
        switch (category) {
          case 'lateArrival':
            dateSettings.lateArrival = { enabled, options };
            break;
          case 'earlyDeparture':
            dateSettings.earlyDeparture = { enabled, options };
            break;
          case 'childcare':
            dateSettings.childcare = { enabled, options };
            break;
          case 'extendedCare':
            dateSettings.extendedCare = { enabled, options };
            break;
        }
      }
    }
    
    if (foundSettings) {
      res.json(dateSettings);
    } else {
      res.status(404).json({ error: '指定された日付の設定が見つかりません' });
    }
    
  } catch (error) {
    console.error('予約設定取得エラー:', error);
    res.status(500).json({ error: 'サーバーエラーが発生しました' });
  }
});

/**
 * 予約設定を保存
 */
app.post('/api/reservation-settings', (req, res) => {
  try {
    const settings = req.body;
    const settingsPath = path.join(__dirname, 'DB', 'reservation-settings.csv');
    
    // CSVファイルが存在しない場合は作成
    if (!fs.existsSync(settingsPath)) {
      const headers = 'date,category,enabled,options\n';
      fs.writeFileSync(settingsPath, headers, 'utf8');
    }
    
    const csvData = fs.readFileSync(settingsPath, 'utf8');
    const lines = csvData.split('\n').filter(line => line.trim() !== '');
    
    // 既存の設定を削除
    const filteredLines = lines.filter(line => {
      const columns = parseCSVLine(line);
      return columns.length < 4 || columns[0] !== settings.date;
    });
    
    // 新しい設定を追加
    const categories = ['lateArrival', 'earlyDeparture', 'childcare', 'extendedCare'];
    
    categories.forEach(category => {
      const categoryData = settings[category];
      const optionsStr = categoryData.options.length > 0 ? '"' + categoryData.options.join(',') + '"' : '""';
      const newLine = `${settings.date},${category},${categoryData.enabled},${optionsStr}`;
      filteredLines.push(newLine);
    });
    
    // CSVファイルに書き戻し
    const newCsvData = filteredLines.join('\n') + '\n';
    fs.writeFileSync(settingsPath, newCsvData, 'utf8');
    
    console.log(`予約設定保存完了: ${settings.date}`);
    res.json({ success: true, message: '設定を保存しました' });
    
  } catch (error) {
    console.error('予約設定保存エラー:', error);
    res.status(500).json({ error: 'サーバーエラーが発生しました' });
  }
});

/**
 * 指定日の利用可能な予約オプションを取得（保護者用）
 */
app.get('/api/reservation-options/:date', (req, res) => {
  try {
    const targetDate = req.params.date;
    const settingsPath = path.join(__dirname, 'DB', 'reservation-settings.csv');
    
    if (!fs.existsSync(settingsPath)) {
      // デフォルト設定を返す
      res.json(getDefaultReservationOptions());
      return;
    }
    
    const csvData = fs.readFileSync(settingsPath, 'utf8');
    const lines = csvData.split('\n').filter(line => line.trim() !== '');
    
    const availableOptions = {
      lateArrival: [],
      earlyDeparture: [],
      childcare: [],
      extendedCare: []
    };
    
    let foundSettings = false;
    
    for (let i = 1; i < lines.length; i++) {
      const line = lines[i];
      const columns = parseCSVLine(line);
      
      if (columns.length >= 4 && columns[0] === targetDate) {
        foundSettings = true;
        const category = columns[1];
        const enabled = columns[2] === 'true';
        const options = enabled && columns[3] ? columns[3].split(',').map(opt => opt.trim().replace(/"/g, '')) : [];
        
        switch (category) {
          case 'lateArrival':
            availableOptions.lateArrival = options;
            break;
          case 'earlyDeparture':
            availableOptions.earlyDeparture = options;
            break;
          case 'childcare':
            availableOptions.childcare = options;
            break;
          case 'extendedCare':
            availableOptions.extendedCare = options;
            break;
        }
      }
    }
    
    if (foundSettings) {
      res.json(availableOptions);
    } else {
      // 設定が見つからない場合はデフォルト設定を返す
      res.json(getDefaultReservationOptions());
    }
    
  } catch (error) {
    console.error('予約オプション取得エラー:', error);
    res.status(500).json({ error: 'サーバーエラーが発生しました' });
  }
});

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
 * CSV行をパースする簡易関数
 */
function parseCSVLine(line) {
  const result = [];
  let current = '';
  let inQuotes = false;
  
  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    
    if (char === '"') {
      inQuotes = !inQuotes;
    } else if (char === ',' && !inQuotes) {
      result.push(current);
      current = '';
    } else {
      current += char;
    }
  }
  
  result.push(current);
  return result;
}

// サーバーを起動
const port = process.env.PORT || 3000;
const server = app.listen(port, () => {
  console.log(`🚀 PTSI App is running on http://localhost:${port}/`);
  console.log('📋 Available routes:');
  console.log('- GET  /          -> redirects to /login');
  console.log('- GET  /login     -> login page');
  console.log('- GET  /reservation -> reservation page');
  console.log('- GET  /chat      -> chat page');
  console.log('- GET  /chart     -> chart page');
  console.log('- GET  /check-reservation -> check reservation page');
  console.log(`\n🌐 Open your browser and navigate to: http://localhost:${port}`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down gracefully');
  server.close(() => {
    console.log('Process terminated');
  });
});