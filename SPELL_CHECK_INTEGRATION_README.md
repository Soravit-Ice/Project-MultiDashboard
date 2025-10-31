# 🔍 Spell Check Integration - Real-time

## คุณสมบัติ (Features)

ระบบตรวจสอบคำผิดแบบ real-time ที่ทำงานกับทุก Input และ TextArea ในโปรแกรม

### ความสามารถ:
- ✅ ตรวจสอบคำผิดอัตโนมัติขณะพิมพ์ (debounce 1.5 วินาที)
- ✅ แสดงขีดเส้นใต้สีแดงแบบ wavy ที่คำผิด
- ✅ แสดง tooltip จำนวนคำผิดเมื่อ hover
- ✅ ซ่อนขีดเส้นใต้เมื่อกำลังพิมพ์ (focus)
- ✅ แสดงขีดเส้นใต้เมื่อเลิกพิมพ์ (blur)
- ✅ เปลี่ยนสีขอบเป็นสีแดงเมื่อพบคำผิด
- ✅ รองรับทั้งภาษาไทยและภาษาอังกฤษ

## ไฟล์ที่สร้าง

### 1. Custom Hook
**`frontend/src/hooks/useSpellCheck.js`**
- Hook สำหรับตรวจสอบคำผิดแบบ real-time
- รองรับ debounce เพื่อลด API calls
- คืนค่า errors และ function สำหรับ highlight

### 2. Wrapper Components
**`frontend/src/components/SpellCheckInput.jsx`**
- `SpellCheckInput` - Input wrapper พร้อมการตรวจสอบคำผิด
- `SpellCheckTextArea` - TextArea wrapper พร้อมการตรวจสอบคำผิด

## การใช้งาน

### Import Components
```jsx
import { SpellCheckInput, SpellCheckTextArea } from '../components/SpellCheckInput';
```

### ใช้กับ Form.Item (Ant Design)
```jsx
<Form.Item name="subject" label="หัวข้อ">
  <SpellCheckInput 
    placeholder="พิมพ์หัวข้อ..." 
    spellCheck={true} 
  />
</Form.Item>

<Form.Item name="content" label="ข้อความ">
  <SpellCheckTextArea 
    rows={4} 
    placeholder="พิมพ์ข้อความ..." 
    spellCheck={true} 
  />
</Form.Item>
```

### ใช้แบบ Controlled Component
```jsx
const [text, setText] = useState('');

<SpellCheckTextArea
  value={text}
  onChange={(e) => setText(e.target.value)}
  rows={6}
  placeholder="พิมพ์ข้อความ..."
  spellCheck={true}
/>
```

### ปิดการตรวจสอบคำผิด
```jsx
<SpellCheckInput 
  placeholder="ไม่ตรวจสอบคำผิด" 
  spellCheck={false} 
/>
```

## ช่อง Input ที่เพิ่ม Spell Check แล้ว

### AdminConsole (`frontend/src/pages/AdminConsole.jsx`)
1. ✅ SQL Query TextArea
2. ✅ Send Message - Content TextArea
3. ✅ Schedule Message - Content TextArea

### Dashboard (`frontend/src/pages/Dashboard.jsx`)
1. ✅ Send Message - Subject Input
2. ✅ Send Message - Content TextArea

## การตั้งค่า (Configuration)

### ใน useSpellCheck hook
```javascript
const { errors, getHighlightedHTML } = useSpellCheck(value, { 
  enabled: true,        // เปิด/ปิดการตรวจสอบ
  debounceMs: 1500,     // รอ 1.5 วินาทีหลังพิมพ์เสร็จ
  minLength: 5          // ตรวจสอบเมื่อข้อความยาวกว่า 5 ตัวอักษร
});
```

## การทำงาน

1. **User พิมพ์ข้อความ** → ไม่แสดงขีดเส้นใต้ (focus state)
2. **User หยุดพิมพ์ 1.5 วินาที** → เรียก API ตรวจสอบคำผิด
3. **User คลิกออกจาก input** → แสดงขีดเส้นใต้คำผิด (blur state)
4. **User คลิกกลับเข้า input** → ซ่อนขีดเส้นใต้ (focus state)

## Styling

### Underline Style
```css
text-decoration: underline wavy red;
text-decoration-thickness: 2px;
text-underline-offset: 2px;
```

### Border Color (เมื่อพบคำผิด)
```css
border-color: #ff4d4f;
```

## ตัวอย่างการใช้งานเพิ่มเติม

### เพิ่มให้กับ Input อื่นๆ

**ก่อน:**
```jsx
<Input placeholder="ชื่อ" />
```

**หลัง:**
```jsx
<SpellCheckInput placeholder="ชื่อ" spellCheck={true} />
```

**ก่อน:**
```jsx
<TextArea rows={4} placeholder="คำอธิบาย" />
```

**หลัง:**
```jsx
<SpellCheckTextArea rows={4} placeholder="คำอธิบาย" spellCheck={true} />
```

## Performance

- ใช้ debounce 1.5 วินาที เพื่อลด API calls
- ตรวจสอบเฉพาะข้อความที่ยาวกว่า 5 ตัวอักษร
- แสดง highlight เฉพาะเมื่อ blur (ไม่รบกวนการพิมพ์)
- ใช้ `dangerouslySetInnerHTML` สำหรับ performance ที่ดี

## ข้อจำกัด (Limitations)

1. **Overlay Position**: อาจไม่แม่นยำ 100% กับ font บางตัว
2. **Long Text**: ใน Input จะแสดงเฉพาะส่วนที่มองเห็น (overflow: hidden)
3. **API Dependency**: ต้องการ backend API ที่ทำงาน

## การพัฒนาต่อ (Future Improvements)

- [ ] เพิ่มให้กับ Input fields อื่นๆ ทั้งหมด
- [ ] รองรับ rich text editor
- [ ] เพิ่ม context menu สำหรับแก้ไขคำผิดด้วย right-click
- [ ] Cache ผลการตรวจสอบเพื่อลด API calls
- [ ] รองรับ offline mode ด้วย local dictionary
- [ ] เพิ่ม settings สำหรับเปิด/ปิดการตรวจสอบทั้งระบบ

## Troubleshooting

### ไม่แสดงขีดเส้นใต้
- ตรวจสอบว่า `spellCheck={true}` 
- ตรวจสอบว่าข้อความยาวกว่า 5 ตัวอักษร
- ตรวจสอบว่า blur จาก input แล้ว

### API Error
- ตรวจสอบ backend server ทำงานอยู่
- ตรวจสอบ authentication token
- ดู console log สำหรับ error messages

### Performance Issues
- เพิ่ม debounceMs ให้มากขึ้น (เช่น 2000ms)
- เพิ่ม minLength ให้มากขึ้น (เช่น 10)
- ปิดการตรวจสอบในช่องที่ไม่จำเป็น

## License
MIT
