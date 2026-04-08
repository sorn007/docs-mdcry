---
name: Public markdown download policy
overview: เพิ่มสิทธิ์ดาวน์โหลด Markdown และสิทธิ์ Export Word แบบราย public link (ค่าเริ่มต้นลิงก์เดิม = ปิดทั้งคู่); ซ่อนปุ่มเมื่อไม่อนุญาต; บล็อกดาวน์โหลด .md ที่ API; Export Word ทำฝั่ง JS ในเบราว์เซอร์จาก HTML ที่ render แล้ว
todos:
  - id: db-migration-download-export-flags
    content: เพิ่ม allowMarkdownDownload และ allowExportWord ใน PublicLink + migration default false
    status: completed
  - id: api-public-links-contract
    content: ขยาย public-links index.post/index.get ให้รับ-ส่ง allowMarkdownDownload และ allowExportWord
    status: completed
  - id: api-public-info-flags
    content: เพิ่ม allowMarkdownDownload และ allowExportWord ใน /api/public/info response
    status: completed
  - id: enforce-public-asset-policy
    content: บล็อกดาวน์โหลด .md ใน /api/public/asset เมื่อ allowMarkdownDownload=false
    status: completed
  - id: admin-ui-toggles
    content: เพิ่ม toggle ทั้งสองรายการใน admin create form และแสดงสถานะใน recent links
    status: completed
  - id: public-ui-download-export
    content: ปุ่มดาวน์โหลด .md และปุ่ม Export Word ในหน้า public — ซ่อนตามธงจาก info
    status: completed
  - id: client-export-word-util
    content: เพิ่มแพ็กเกจ/ยูทิลิตี้ฝั่ง client สร้างไฟล์ .docx จาก HTML/DOM (ไม่พึ่ง server)
    status: completed
  - id: verify-typecheck-flow
    content: ทดสอบ allow/deny แยกกรณี + npm run typecheck
    status: completed
isProject: false
---

# แผนเพิ่มสิทธิ์ดาวน์โหลด Markdown และ Export Word รายลิงก์

## ขอบเขตที่ยืนยันแล้ว
- ควบคุมสิทธิ์แบบ **ราย public link**
- เมื่อไม่อนุญาตดาวน์โหลด Markdown ให้ **ซ่อนปุ่มดาวน์โหลด** ในหน้า public
- ต้อง **บล็อก API** ไม่ให้ดาวน์โหลดไฟล์ `.md` ผ่าน `/api/public/asset` ได้เมื่อปิดสิทธิ์
- ลิงก์เดิมในฐานข้อมูล: ค่าเริ่มต้นเป็น **ไม่อนุญาต** (ทั้งดาวน์โหลดและ Export Word)
- **Export to Word**: แอดมินตั้งค่าได้แยกจากดาวน์โหลด `.md`; เมื่อปิดให้ **ซ่อนปุ่ม**; การสร้างไฟล์ทำ **ฝั่ง JS ในเบราว์เซอร์เท่านั้น** (ไม่เพิ่ม API สร้าง Word บนเซิร์ฟเวอร์)

## จุดที่ต้องแก้
- โมเดลลิงก์สาธารณะ: [`c:\project\access0\docs-mdcry\prisma\schema.prisma`](c:\project\access0\docs-mdcry\prisma\schema.prisma)
- API สร้าง/อ่านลิงก์: [`c:\project\access0\docs-mdcry\server\api\public-links\index.post.ts`](c:\project\access0\docs-mdcry\server\api\public-links\index.post.ts), [`c:\project\access0\docs-mdcry\server\api\public-links\index.get.ts`](c:\project\access0\docs-mdcry\server\api\public-links\index.get.ts)
- API ข้อมูล public viewer: [`c:\project\access0\docs-mdcry\server\api\public\info.get.ts`](c:\project\access0\docs-mdcry\server\api\public\info.get.ts)
- API ดาวน์โหลดไฟล์ผ่านลิงก์สาธารณะ: [`c:\project\access0\docs-mdcry\server\api\public\asset.get.ts`](c:\project\access0\docs-mdcry\server\api\public\asset.get.ts)
- หน้า Admin: [`c:\project\access0\docs-mdcry\app\pages\admin.vue`](c:\project\access0\docs-mdcry\app\pages\admin.vue)
- หน้า Public viewer: [`c:\project\access0\docs-mdcry\app\pages\public\[token].vue`](c:\project\access0\docs-mdcry\app\pages\public\[token].vue)
- ยูทิลิตี้ client ใหม่ (แนะนำ): [`c:\project\access0\docs-mdcry\app\utils\exportMarkdownToWord.ts`](c:\project\access0\docs-mdcry\app\utils\exportMarkdownToWord.ts) (หรือชื่อใกล้เคียง) — เรียกจากหน้า public เมื่อผู้ใช้กด Export

## แนวทาง implementation

### 1. Database + Migration
- เพิ่มใน `PublicLink`:
  - `allowMarkdownDownload Boolean @default(false)`
  - `allowExportWord Boolean @default(false)`
- Migration PostgreSQL: คอลัมน์ทั้งสอง default `false` สำหรับแถวเดิม

### 2. API contract ฝั่ง admin/public-links
- `POST /api/public-links`: รับ `allowMarkdownDownload`, `allowExportWord` จาก body (boolean; default false)
- `GET /api/public-links`: ส่งคืนทั้งสองฟิลด์ในรายการ recent links

### 3. API contract ฝั่ง public/info
- เพิ่ม `allowMarkdownDownload` และ `allowExportWord` ใน response ของ `GET /api/public/info` เพื่อให้หน้า public แสดง/ซ่อนปุ่มได้สอดคล้องกับลิงก์

### 4. บังคับสิทธิ์ที่ API ดาวน์โหลด (เฉพาะ Markdown ดิบ)
- ใน `GET /api/public/asset` หลัง resolve link: ถ้า `key` ลงท้าย `.md` และ `allowMarkdownDownload === false` → 403
- ไฟล์ non-markdown ยังทำงานตามเดิม (รูปในเอกสาร)

### 5. Export Word — เฉพาะ client (ไม่เพิ่ม endpoint Word)
- **ไม่บังคับผ่าน `/api/public/asset`** เพราะไม่ต้องส่งไฟล์ `.md` ดิบ: ใช้ **DOM ที่ render แล้ว** (`ref` ของเนื้อหา Markdown ในหน้า public) เป็นต้นทาง
- เลือกแพ็กเกจระหว่าง implement (ตัวอย่างทิศทาง):
  - สร้าง `.docx` ด้วย `docx` โดยแปลงโครงสร้างจาก DOM/HTML แบบจำกัด (หัวข้อ, ย่อหน้า, รายการ) **หรือ**
  - ไลบรารีที่รองรับ HTML → docx ใน browser (ถ้าเลือกได้และ license เหมาะสม)
- จัดการข้อจำกัดที่คาดไว้ในแผน: รูปในเอกสารอาจเป็น URL ภายนอก/ลงชื่อเซ็น — อาจส่งออกเป็นข้อความอย่างเดียวหรือพยายามแนบรูปเมื่อเป็น URL ที่โหลดได้ (ระบุในเอกสารโค้ดสั้นๆ ว่า v1 รองรับระดับใด)
- ชื่อไฟล์ดาวน์โหลด: จากชื่อเอกสาร (`docKey`) เปลี่ยนนามสกุลเป็น `.docx`

### 6. Admin UI
- ฟอร์มสร้างลิงก์: switch/checkbox สองรายการ — «อนุญาตดาวน์โหลด Markdown», «อนุญาต Export Word»
- Recent links: แสดงสถานะสั้นๆ ทั้งสองธง

### 7. Public viewer UI
- อ่านธงจาก `/api/public/info`
- แสดงปุ่มดาวน์โหลด `.md` เฉพาะเมื่อ `allowMarkdownDownload` (ลิงก์ไป `/api/public/asset?...`)
- แสดงปุ่ม «Export Word» เฉพาะเมื่อ `allowExportWord`; คลิกแล้วเรียกยูทิลิตี้ client จาก HTML ใน `markdownRoot`

## Test plan
- สร้างลิงก์ที่เปิด/ปิดแยกกัน 4 แบบ (ดาวน์โหลดอย่างเดียว / Export อย่างเดียว / ทั้งคู่ / ปิดทั้งคู่) แล้วตรวจปุ่มบนหน้า public
- ดาวน์โหลด `.md` ตรงๆ เมื่อปิดสิทธิ์ → 403
- Export Word เมื่อปิดสิทธิ์ → ไม่มีปุ่ม; เมื่อเปิด → ได้ไฟล์ .docx เปิดใน Word ได้
- รูป/ลิงก์ในเอกสาร: smoke test ตามระดับที่ implement ใน v1
- รัน `npm run typecheck`

## หมายเหตุด้านความปลอดภัย/ผลิตภาพ
- การปิด `allowMarkdownDownload` ยังคงกันการรั่วไฟล์ดิบ; Export Word จาก HTML อาจยังมีข้อความครบถ้าหน้า render ครบ — แยกสิทธิ์ชัดเจนตามธง `allowExportWord`
- Bundle ขนาด: แพ็กเกจ docx/HTML conversion อาจใหญ่ — โหลดแบบ dynamic `import()` เฉพาะเมื่อผู้ใช้กด Export หรือเมื่อ `allowExportWord` เป็นจริง (ลดผลต่อหน้าแรก)
