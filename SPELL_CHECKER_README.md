# 🔍 Spell Checker Feature

## คุณสมบัติ (Features)

ระบบตรวจสอบคำผิด คำพิมพ์ผิด ทั้งภาษาไทยและภาษาอังกฤษ

### ความสามารถหลัก:
- ✅ ตรวจสอบคำผิดภาษาไทย
- ✅ ตรวจสอบคำผิดภาษาอังกฤษ
- ✅ แสดงคำแนะนำสำหรับคำที่ผิด
- ✅ แก้ไขอัตโนมัติตามคำแนะนำที่เลือก
- ✅ แสดงสถิติการตรวจสอบ
- ✅ รองรับการคัดลอกข้อความที่แก้ไขแล้ว

## การติดตั้ง (Installation)

### Backend
```bash
cd backend
npm install natural compromise
```

### Frontend
ไม่ต้องติดตั้ง dependencies เพิ่มเติม (ใช้ Ant Design ที่มีอยู่แล้ว)

## การใช้งาน (Usage)

### 1. เข้าสู่ระบบ
ล็อกอินเข้าสู่ระบบด้วยบัญชีผู้ใช้

### 2. เข้าถึง Spell Checker
- จาก Dashboard คลิกปุ่ม "ตรวจสอบคำผิด"
- หรือเข้าผ่าน URL: `/spell-check`

### 3. ตรวจสอบคำผิด
1. พิมพ์หรือวางข้อความที่ต้องการตรวจสอบ
2. คลิกปุ่ม "ตรวจสอบคำผิด"
3. ระบบจะแสดง:
   - สถิติการตรวจสอบ (จำนวนคำทั้งหมด, คำผิด, คำภาษาไทย, คำภาษาอังกฤษ)
   - รายการคำผิดพร้อมคำแนะนำ
   - คลิกที่คำแนะนำเพื่อเลือกคำที่ต้องการแก้ไข

### 4. แก้ไขอัตโนมัติ
1. เลือกคำแนะนำสำหรับแต่ละคำผิด
2. คลิกปุ่ม "แก้ไขอัตโนมัติ"
3. ระบบจะแสดงข้อความที่แก้ไขแล้ว
4. คลิกปุ่ม "คัดลอก" เพื่อคัดลอกข้อความ

## API Endpoints

### POST `/api/spell-check/check`
ตรวจสอบคำผิดในข้อความ

**Request Body:**
```json
{
  "text": "สวัสดิ ครัป ขอบคุน มาก I liek to plaay games"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "originalText": "สวัสดิ ครัป ขอบคุน มาก I liek to plaay games",
    "errors": [
      {
        "word": "สวัสดิ",
        "position": 0,
        "language": "thai"
      },
      {
        "word": "ครัป",
        "position": 1,
        "language": "thai"
      },
      {
        "word": "liek",
        "position": 4,
        "language": "english"
      }
    ],
    "suggestions": {
      "สวัสดิ": ["สวัสดี"],
      "ครัป": ["ครับ"],
      "liek": ["like"]
    },
    "statistics": {
      "totalWords": 8,
      "errorsFound": 3,
      "thaiWords": 4,
      "englishWords": 4
    }
  }
}
```

### POST `/api/spell-check/correct`
แก้ไขข้อความอัตโนมัติ

**Request Body:**
```json
{
  "text": "สวัสดิ ครัป ขอบคุน มาก",
  "corrections": {
    "สวัสดิ": "สวัสดี",
    "ครัป": "ครับ",
    "ขอบคุน": "ขอบคุณ"
  }
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "originalText": "สวัสดิ ครัป ขอบคุน มาก",
    "correctedText": "สวัสดี ครับ ขอบคุณ มาก",
    "changesApplied": 3
  }
}
```

## โครงสร้างไฟล์ (File Structure)

### Backend
```
backend/
├── src/
│   ├── services/
│   │   └── spellCheckService.js      # Logic การตรวจสอบคำผิด
│   ├── controllers/
│   │   └── spellCheckController.js   # Controller สำหรับ API
│   └── routes/
│       └── spellCheckRoutes.js       # Routes สำหรับ spell check
```

### Frontend
```
frontend/
├── src/
│   ├── api/
│   │   └── spellCheck.js             # API calls
│   ├── components/
│   │   └── SpellChecker.jsx          # Component หลัก
│   └── pages/
│       └── SpellCheckPage.jsx        # Page wrapper
```

## การปรับแต่ง (Customization)

### เพิ่มคำศัพท์ภาษาไทย
แก้ไขไฟล์ `backend/src/services/spellCheckService.js`:
```javascript
const thaiCommonWords = new Set([
  'สวัสดี', 'ขอบคุณ', 'ครับ', 'ค่ะ',
  // เพิ่มคำศัพท์ที่นี่
]);
```

### เพิ่ม Typo Patterns ภาษาไทย
```javascript
const thaiTypoPatterns = {
  'สวัสดี': ['สวัสดิ', 'สวัสดีี', 'สวัดดี'],
  // เพิ่ม patterns ที่นี่
};
```

### เพิ่มคำศัพท์ภาษาอังกฤษ
```javascript
const spellcheck = new natural.Spellcheck([
  'the', 'be', 'to', 'of', 'and',
  // เพิ่มคำศัพท์ที่นี่
]);
```

## ข้อจำกัด (Limitations)

1. **พจนานุกรมจำกัด**: ใช้พจนานุกรมคำศัพท์พื้นฐาน อาจไม่ครอบคลุมคำศัพท์เฉพาะทาง
2. **การตัดคำภาษาไทย**: ใช้วิธีง่ายๆ ในการตัดคำ อาจไม่แม่นยำ 100%
3. **Context-aware**: ไม่ได้ตรวจสอบบริบทของประโยค เช่น "ได้" vs "ได"

## การพัฒนาต่อ (Future Improvements)

- [ ] เพิ่มพจนานุกรมที่ครอบคลุมมากขึ้น
- [ ] ใช้ AI/ML สำหรับการตรวจสอบที่แม่นยำขึ้น
- [ ] รองรับการตรวจสอบไวยากรณ์
- [ ] เพิ่มการตรวจสอบบริบทของประโยค
- [ ] รองรับภาษาอื่นๆ เพิ่มเติม
- [ ] บันทึกประวัติการตรวจสอบ
- [ ] เพิ่ม custom dictionary สำหรับแต่ละผู้ใช้

## การทดสอบ (Testing)

### ตัวอย่างข้อความทดสอบ:

**ภาษาไทย:**
```
สวัสดิ ครัป ขอบคุน มาก ไมม่ ไดด้ เปนน อะไล
```

**ภาษาอังกฤษ:**
```
I liek to plaay games and wrtie code
```

**ผสมทั้งสองภาษา:**
```
สวัสดิ ครัป I liek to plaay games ขอบคุน มาก
```

## License
MIT
