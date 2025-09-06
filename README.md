<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# Run and deploy your AI Studio app

This contains everything you need to run your app locally.

View your app in AI Studio: https://ai.studio/apps/drive/1hAYUXUzUDpH10PzgHY8QIpaVzjv938B8

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
