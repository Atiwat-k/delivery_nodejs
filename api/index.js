const express = require('express');
const app = express();
const userRoutes = require('./user'); // ตรวจสอบให้แน่ใจว่าเส้นทางถูกต้อง

app.use(express.json()); // สำหรับรับข้อมูล JSON
app.use('/api', userRoutes);

const PORT = process.env.PORT || 3000;
app.listen(PORT, (err) => {
  if (err) {
    console.error('Error starting the server:', err);
  } else {
    console.log(`Server is running on port ${PORT}`);
  }
});
