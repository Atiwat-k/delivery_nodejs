const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const bodyParser = require('body-parser');
const path = require('path');
const admin = require('firebase-admin');
const multer = require('multer');

// โหลด Service Account Key
const serviceAccount = require(path.resolve(__dirname, '../config/serviceAccountKey.json'));

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  storageBucket: "gs://database-delivery-project.appspot.com" // เปลี่ยนเป็นชื่อบัคเก็ตที่ถูกต้อง
});

const bucket = admin.storage().bucket();

const app = express();
const dbPath = path.resolve(__dirname, '../database_delivery.db');
const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('Error opening database:', err.message);
  }
});

// ใช้ body-parser เพื่อรับข้อมูล JSON
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// ตั้งค่า multer สำหรับการอัปโหลดไฟล์
const upload = multer({ storage: multer.memoryStorage() });

// API POST สำหรับเพิ่มผู้ใช้และอัปโหลดภาพ
app.post('/add-user', upload.single('image'), async (req, res) => {
  const { name, phone, password, address, gps } = req.body;
  const file = req.file;

  // ตรวจสอบว่ามีการส่งข้อมูลครบหรือไม่
  if (!name || !phone || !password || !address || !gps || !file) {
    return res.status(400).json({ message: 'Please provide all required fields: name, phone, password, address, gps, image' });
  }

  // สร้างชื่อไฟล์ที่ไม่ซ้ำกัน
  const fileName = `${Date.now()}_${file.originalname}`;
  const fileUpload = bucket.file(fileName);

  // อัปโหลดไฟล์ไปยัง Firebase Storage
  const stream = fileUpload.createWriteStream({
    metadata: {
      contentType: file.mimetype
    }
  });

  stream.on('error', (err) => {
    return res.status(500).json({ message: 'Error uploading image', error: err.message });
  });

  stream.on('finish', async () => {
    // สร้าง URL ของภาพที่สามารถเข้าถึงได้
     const publicUrl = `https://firebasestorage.googleapis.com/v0/b/${bucket.name}/o/${encodeURIComponent(fileUpload.name)}?alt=media`;
    
    // เพิ่มข้อมูลผู้ใช้ใหม่เข้าไปในตาราง users พร้อม URL รูปภาพ
    db.run(`INSERT INTO users (name, phone, password, address, gps, image) VALUES (?, ?, ?, ?, ?, ?)`,
      [name, phone, password, address, gps, publicUrl], function(err) {
        if (err) {
          return res.status(400).json({ message: 'Error inserting user', error: err.message });
        }
        res.json({ message: 'User added successfully', uid: this.lastID, imageUrl: publicUrl });
      });
  });

  stream.end(file.buffer);
});

// API GET สำหรับดึงข้อมูลผู้ใช้ทั้งหมด
app.get('/users', (req, res) => {
  db.all(`SELECT * FROM users`, [], (err, rows) => {
    if (err) {
      return res.status(400).json({ message: 'Error retrieving users', error: err.message });
    }
    res.json(rows);
  });
});

// ส่งออกโมดูล app เพื่อให้ index.js สามารถใช้ได้
module.exports = app;
