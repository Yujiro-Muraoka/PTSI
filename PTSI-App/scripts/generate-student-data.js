/**
 * 園児データ生成スクリプト
 * 各テナントに対して4-5クラス、1クラス20-30名のデータを生成
 */

const fs = require('fs');
const path = require('path');

// 日本の姓の例
const lastNames = [
    '田中', '佐藤', '鈴木', '高橋', '渡辺', '伊藤', '山本', '中村', '小林', '加藤',
    '吉田', '山田', '佐々木', '山口', '松本', '井上', '木村', '林', '清水', '山崎',
    '池田', '橋本', '阿部', '石川', '石田', '前田', '藤田', '小川', '後藤', '岡田',
    '長谷川', '村上', '近藤', '坂本', '遠藤', '青木', '藤井', '西村', '福田', '太田',
    '三浦', '藤原', '岡本', '松田', '中川', '中野', '原田', '小野', '田村', '竹内'
];

// 日本の名の例
const firstNames = [
    '大翔', '蓮', '陽翔', '樹', '悠人', '湊', '大和', '陽太', '翔太', '海翔',
    '陽菜', '凛', '心春', '結菜', '陽葵', '咲良', '美桜', '結愛', '莉子', '花音',
    '悠真', '颯太', '陽斗', '蒼', '拓海', '颯真', '智也', '航大', '怜', '晴翔',
    '美咲', '美羽', '美月', '愛莉', '心音', '優花', '結衣', '琴音', '美織', '心結',
    '隼人', '翔', '大輝', '颯人', '拓真', '健太', '翔真', '颯', '大樹', '龍之介'
];

// クラス名の例
const classNames = ['ひまわり組', 'さくら組', 'つぼみ組', 'たんぽぽ組', 'すみれ組'];

// タイプの例
const types = ['一般', '延長', '短時間'];

/**
 * ランダムな整数を生成
 */
function randomInt(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

/**
 * ランダムな名前を生成
 */
function generateRandomName() {
    const lastName = lastNames[randomInt(0, lastNames.length - 1)];
    const firstName = firstNames[randomInt(0, firstNames.length - 1)];
    return lastName + firstName;
}

/**
 * 学生IDを生成（年度＋連番）
 */
function generateStudentId(baseId) {
    return 22000 + baseId;
}

/**
 * 園児データを生成
 */
function generateStudentData(tenantId, numClasses = 5, studentsPerClass = 25) {
    const data = [];
    data.push('student-id,name,type,late,early,late-pick-up,class');
    
    let studentIdCounter = 1;
    
    for (let classIndex = 0; classIndex < numClasses; classIndex++) {
        const className = classNames[classIndex];
        const studentsInThisClass = randomInt(20, 30); // 20-30名
        
        for (let studentIndex = 0; studentIndex < studentsInThisClass; studentIndex++) {
            const studentId = generateStudentId(studentIdCounter);
            const name = generateRandomName();
            const type = types[randomInt(0, types.length - 1)];
            const late = randomInt(0, 5); // 遅刻回数
            const early = randomInt(0, 3); // 早退回数
            const latePickUp = randomInt(0, 2); // お迎え遅れ回数
            
            data.push(`${studentId},${name},${type},${late},${early},${latePickUp},${className}`);
            studentIdCounter++;
        }
    }
    
    return data.join('\n');
}

/**
 * ログイン情報も生成（園児数に応じて）
 */
function generateLoginData(tenantId, numStudents = 125) {
    const data = [];
    data.push('student-id,password');
    
    for (let i = 1; i <= numStudents; i++) {
        const studentId = generateStudentId(i);
        const password = studentId.toString(); // パスワードは学生IDと同じ
        data.push(`${studentId},${password}`);
    }
    
    return data.join('\n');
}

/**
 * 各テナントのデータを生成
 */
function generateDataForAllTenants() {
    const tenants = ['demo-hoikuen', 'sakura-hoikuen', 'midori-hoikuen'];
    
    tenants.forEach(tenantId => {
        const tenantDataPath = path.join(__dirname, '..', 'tenant-data', tenantId);
        
        // student-info.csvの生成
        const studentData = generateStudentData(tenantId, 5, 25);
        fs.writeFileSync(path.join(tenantDataPath, 'student-info.csv'), studentData, 'utf8');
        
        // login.csvの生成
        const loginData = generateLoginData(tenantId, 125);
        fs.writeFileSync(path.join(tenantDataPath, 'login.csv'), loginData, 'utf8');
        
        console.log(`✅ ${tenantId} のデータを生成しました (約125名)`);
    });
}

// データ生成実行
generateDataForAllTenants();
console.log('🎉 全テナントの園児データ生成が完了しました！');