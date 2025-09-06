## Run Locally

**Prerequisites:** Node.js

```bash
# 1. Install dependencies
npm install

# 2. Set the GEMINI_API_KEY
#   แก้ไฟล์ .env.local แล้วใส่ Gemini API key ของคุณ

# 3. Run the app
npm run dev

# 4. Run backend server (main.py)
cd backend
python -m uvicorn main:app --reload

# 5. Command UP TO Git
   git add .
   git commit -m "เพิ่มระบบ login"
   git push

# 6. Command pull down TO VSCode
#   ครั้งแรก (ยังไม่มีโฟลเดอร์โปรเจกต์)
git clone https://github.com/BossLyyXx/cyberwatch.git

#   ครั้งต่อ ๆ ไป (มีโฟลเดอร์แล้ว แค่ sync)
git pull
