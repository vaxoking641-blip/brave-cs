# CS Email Generator - BRAVE

## Deploy Guide (Free - Vercel)

### Tong quan
- **Chi phi:** $0 (Vercel free tier)
- **Thoi gian setup:** ~10 phut
- **Can:** Trinh duyet + tai khoan GitHub (mien phi)
- **Ket qua:** App chay tren URL rieng, dung duoc tren moi may tinh

---

### BUOC 1: Tao tai khoan (neu chua co)

**GitHub** (luu code):
1. Vao https://github.com
2. Click "Sign up" > tao tai khoan mien phi
3. Xac nhan email

**Vercel** (host app):
1. Vao https://vercel.com
2. Click "Sign Up" > chon "Continue with GitHub"
3. Cho phep Vercel truy cap GitHub

---

### BUOC 2: Upload code len GitHub

**Cach 1: Qua GitHub web (de nhat, khong can cai dat gi)**

1. Dang nhap GitHub > click dau "+" goc tren phai > "New repository"
2. Dat ten: `cs-email-generator`
3. Chon: Public hoac Private (tuy ban)
4. KHONG tick "Add a README file"
5. Click "Create repository"
6. Trong trang repository moi, click "uploading an existing file"
7. Keo tha TAT CA file trong folder `cs-app-deploy` vao:
   - package.json
   - vite.config.js
   - vercel.json
   - index.html
   - .gitignore
   - src/main.jsx
   - src/App.jsx
8. Click "Commit changes"

**Cach 2: Dung Git command line**

```bash
cd cs-app-deploy
git init
git add .
git commit -m "Initial commit"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/cs-email-generator.git
git push -u origin main
```

---

### BUOC 3: Deploy tren Vercel

1. Vao https://vercel.com/dashboard
2. Click "Add New..." > "Project"
3. Tim va chon repository `cs-email-generator`
4. Vercel tu dong nhan dien la Vite project
5. **KHONG can thay doi gi** - de nguyen mac dinh
6. Click "Deploy"
7. Doi 1-2 phut...
8. DONE! Vercel cho ban URL dang: `cs-email-generator-xxx.vercel.app`

---

### BUOC 4: Chia se cho team

- URL cua ban: `https://cs-email-generator-xxx.vercel.app`
- Gui link nay cho 1-2 nguoi trong team
- Ho mo link tren browser la dung duoc ngay
- Moi nguoi co data rieng (luu tren browser cua ho)

---

### BUOC 5 (tuy chon): Custom domain

Neu ban muon URL dep hon (vd: cs.yourbrand.com):
1. Vercel dashboard > project > Settings > Domains
2. Nhap domain cua ban
3. Cau hinh DNS theo huong dan Vercel

---

### Cap nhat app sau nay

Khi toi (Claude) tao version moi cho ban:
1. Download file App.jsx moi
2. Vao GitHub repository > src/App.jsx > click edit (bieu tuong but chi)
3. Xoa het noi dung cu, paste noi dung moi
4. Click "Commit changes"
5. Vercel TU DONG deploy lai trong 1 phut

---

### Xu ly su co

**App khong load:**
- Kiem tra Vercel dashboard > Deployments > xem log loi
- Thu click "Redeploy"

**Data bi mat:**
- Data luu trong localStorage cua browser
- Neu xoa browser data thi mat
- Moi nguoi/moi browser co data rieng

**AI gen khong hoat dong:**
- Tinh nang AI can Anthropic API key
- Trong Claude artifact thi hoat dong tu dong
- Khi deploy rieng, can them API key vao code (bao toi se huong dan)

---

### Cau truc project

```
cs-app-deploy/
  index.html          <- Trang HTML chinh
  package.json        <- Dependencies
  vite.config.js      <- Build config
  vercel.json         <- Vercel routing
  .gitignore          <- Ignore files
  src/
    main.jsx          <- Entry point + storage polyfill
    App.jsx           <- App chinh (code tu Claude)
```
