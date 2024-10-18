// index.js
const express = require('express');
const app = express();

// นำเข้า API จาก user.js
const userRoutes = require('./user');

// ใช้ API จาก user.js ที่เส้นทางเริ่มต้น (เช่น /api)
app.use('/api', userRoutes);

// รันเซิร์ฟเวอร์
const PORT = 3000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
