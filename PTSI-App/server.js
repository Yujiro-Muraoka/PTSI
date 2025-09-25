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
// 各ディレクトリ内の唯一のHTMLファイルを直接開く
app.get('/chart', (req, res) => {
  res.sendFile(path.join(__dirname, 'chart', 'index.html'));
});

app.get('/check-reservation', (req, res) => {
  res.sendFile(path.join(__dirname, 'check-reservation', 'check-reservation.html'));
});

app.get('/login', (req, res) => {
  res.sendFile(path.join(__dirname, 'login', 'login.html'));
});

app.get('/reservation', (req, res) => {
  res.sendFile(path.join(__dirname, 'reservation', 'reservation.html'));
});

app.get('/chat', (req, res) => {
  res.sendFile(path.join(__dirname, 'chat', 'chat.html'));
});

// ルートパスへのアクセス時に/loginにリダイレクトする
app.get('/', (req, res) => {
  res.redirect('/login');
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




// チャット機能のためのメッセージ保存
let chatMessages = {
  general: [],
  class1: [],
  class2: [],
  class3: [],
  class4: [],
  announcements: [], // 運営からの一斉送信
  direct: {} // ダイレクトメッセージ (userId_adminId形式)
};

// 運営者リスト（実際のアプリケーションではデータベースから取得）
const adminUsers = [
  { id: 'admin001', name: '園長先生', role: 'principal' },
  { id: 'admin002', name: '主任保育士', role: 'head_teacher' },
  { id: 'admin003', name: 'ライオン組担任', role: 'teacher_lion' },
  { id: 'admin004', name: 'ぞう組担任', role: 'teacher_elephant' },
  { id: 'admin005', name: 'ひよこ組担任', role: 'teacher_chick' },
  { id: 'admin006', name: 'あひる組担任', role: 'teacher_duck' }
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
      const [id, name, type, late, early, latePickUp] = lines[i].split(',');
      if (id === studentID) {
        studentData = {
          id: id,
          name: name.trim(),
          type: type
        };
        break;
      }
    }

    if (studentData) {
      res.json({ success: true, user: studentData });
    } else {
      res.status(404).json({ success: false, message: '該当する学生のデータが見つかりませんでした' });
    }
  });
});

// エラーハンドリングミドルウェア
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  res.status(500).send('サーバーエラーが発生しました。');
});

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