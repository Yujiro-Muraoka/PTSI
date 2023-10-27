const express = require('express');
const app = express();
const path = require('path');
const fs = require('fs');
const bodyParser = require('body-parser');
// ミドルウェアの設定
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());


// 各ディレクトリの静的ファイルを提供するためのミドルウェアを追加
app.use('/chart', express.static(path.join(__dirname, 'chart')));
app.use('/check-reservation', express.static(path.join(__dirname, 'check-reservation')));
app.use('/css', express.static(path.join(__dirname, 'css')));
app.use('/fonts', express.static(path.join(__dirname, 'fonts')));
app.use('/login', express.static(path.join(__dirname, 'login')));
app.use('/reservation', express.static(path.join(__dirname, 'reservation')));
// app.use('/DB', express.static(path.join(__dirname, 'DB')));

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

// ルートパスへのアクセス時にはindex.htmlを返す
// app.get('/', (req, res) => {
//   res.sendFile(path.join(__dirname, 'index.html'));
// });

// ルートパスへのアクセス時に/loginにリダイレクトする
app.get('/', (req, res) => {
  res.redirect('/login');
});


// 保護者の予約情報を取得し記録する
// フォームを扱うための設定
app.use(express.json());

// JSONデータの送信を処理するルート
app.post('/submit', (req, res) => {
  const studentID = req.body.studentID.replace(/[０-９]/g, function(s) {
    return String.fromCharCode(s.charCodeAt(0) - 0xFEE0);
  });
  const date = req.body.date;
  const type = req.body.type;

  // CSVに書き込むデータの準備
  const data = `${studentID},${date},${type}\n`;

  // 重複をチェックし、csvファイルが存在しない場合は作成する
  fs.readFile('DB/reservation.csv', 'utf8', (err, fileData) => {
    if (err) {
      if (err.code === 'ENOENT') {
        // ファイルが存在しない場合は新しく作成する
        fs.writeFile('DB/reservation.csv', '', (err) => {
          if (err) throw err;
          console.log('reservation.csv ファイルが作成されました。');
          checkDuplicateAndAddData(); // ファイルが作成されたら処理を続行する
        });
        return;
      } else {
        throw err;
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
        fs.appendFile('DB/reservation.csv', data, (err) => {
          if (err) throw err;
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
  fs.readFile('DB/student-info.csv', 'utf8', (err, fileData) => {
    if (err) throw err;
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

// パスワードの認証用のAPI
app.post('/passwordAuthentication', (req, res) => {
  const { studentId, password } = req.body;
  console.log(studentId + " " + password);

  // login.csvからデータを読み込む
  const filePath = path.join(__dirname, 'DB', 'login.csv');
  fs.readFile(filePath, 'utf8', (err, data) => {
      if (err) {
          console.error('エラー:', err);
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




// サーバーを起動
const port = 3000;
app.listen(port, () => {
  console.log(`App is running on http://localhost:${port}/`);
});