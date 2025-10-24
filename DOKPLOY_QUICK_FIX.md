# 🚀 Dokploy Deployment Guide - Panaglo

## ⚡ Quick Fix for Buildpack Error

The error you're seeing happens because Dokploy needs to know which directory to build. Here's the solution:

---

## 📋 Step-by-Step Deployment

### **1. Backend Deployment**

#### A. Create Backend App in Dokploy
1. Go to Dokploy Dashboard
2. Click **"Create Application"**
3. Fill in details:
   - **Name**: `panaglo-backend`
   - **Repository**: `https://github.com/omdev04/DreamProject`
   - **Branch**: `main`
   - **Build Path**: `/backend` ⚠️ **IMPORTANT**
   - **Buildpack**: Select "Paketo Buildpacks" or "Auto-detect"

#### B. Environment Variables
Add these in Dokploy:
```env
NODE_ENV=production
PORT=5000
MONGODB_URI=mongodb+srv://your_connection_string
JWT_SECRET=your_secure_random_string_here
JWT_EXPIRE=30d

# Email
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your_email@gmail.com
SMTP_PASS=your_app_password

# Company
COMPANY_NAME=Panaglo
EMAIL=info@panaglo.com
PHONE=+92-XXX-XXXXXXX
WEBSITE=https://panaglo.com
ADDRESS=Your Address

# Frontend (update after frontend deployment)
FRONTEND_URL=https://your-frontend-url.com
```

#### C. Build Settings
```
Start Command: npm start
Port: 5000
Health Check: /api/auth/me (optional)
```

---

### **2. Frontend Deployment**

#### A. Create Frontend App in Dokploy
1. Click **"Create Application"** again
2. Fill in details:
   - **Name**: `panaglo-frontend`
   - **Repository**: `https://github.com/omdev04/DreamProject`
   - **Branch**: `main`
   - **Build Path**: `/frontend` ⚠️ **IMPORTANT**
   - **Buildpack**: Select "Paketo Buildpacks" or "Auto-detect"

#### B. Environment Variables
```env
VITE_API_URL=https://your-backend-url.com/api
NODE_ENV=production
```

#### C. Build Settings
```
Build Command: npm run build
Start Command: npm start
Port: 3000 (or auto-assigned)
```

---

## 🔧 Alternative: Use Docker Instead

If Paketo Buildpacks still give issues, use Docker:

### **Backend Deployment (Docker)**
In Dokploy:
1. Select **"Docker"** instead of "Buildpacks"
2. **Dockerfile Path**: `/backend/Dockerfile`
3. **Context**: `/backend`
4. Add same environment variables

### **Frontend Deployment (Docker)**
In Dokploy:
1. Select **"Docker"**
2. **Dockerfile Path**: `/frontend/Dockerfile`
3. **Context**: `/frontend`
4. **Build Args**:
   ```
   VITE_API_URL=https://your-backend-url.com/api
   ```

---

## 🎯 Troubleshooting Common Errors

### Error: "No buildpack groups passed detection"
**Solution**: Make sure Build Path is set correctly:
- Backend: `/backend`
- Frontend: `/frontend`

### Error: "could not find app in /workspace"
**Solution**: 
- Backend: Check `Procfile` exists with `web: npm start`
- Verify `package.json` has correct `start` script

### Error: "could not find script(s) [build]"
**Solution**: 
- Frontend: Ensure `package.json` has `"build": "vite build"`

---

## ✅ Verification Checklist

### Before Deploying:
- [ ] Git repository pushed to GitHub
- [ ] `/backend` has `Procfile` and `project.toml`
- [ ] `/frontend` has `Procfile` and `project.toml`
- [ ] MongoDB Atlas connection string ready
- [ ] SMTP credentials ready

### After Backend Deploy:
- [ ] Backend URL accessible
- [ ] Test: `curl https://your-backend-url.com/api/health`
- [ ] Check logs for errors

### After Frontend Deploy:
- [ ] Frontend loads in browser
- [ ] API calls working
- [ ] Login functional
- [ ] Dashboard accessible

---

## 🔗 Link Frontend & Backend

### After Both Deployed:

1. **Get Backend URL** from Dokploy
   - Example: `https://panaglo-backend-xyz.dokploy.app`

2. **Update Frontend Environment**
   - Go to Frontend app → Settings → Environment
   - Update: `VITE_API_URL=https://panaglo-backend-xyz.dokploy.app/api`
   - Click **"Redeploy"**

3. **Update Backend Environment**
   - Go to Backend app → Settings → Environment
   - Update: `FRONTEND_URL=https://panaglo-frontend-xyz.dokploy.app`
   - Click **"Redeploy"**

---

## 📊 Monitoring

### Check Logs:
- Dokploy Dashboard → Your App → **Logs** tab
- Look for startup messages
- Check for connection errors

### Common Log Messages (Good):
```
✓ Connected to MongoDB
✓ Server running on port 5000
✓ Email service configured
✓ Cron jobs initialized
```

---

## 🆘 If Still Not Working

### Option 1: Simple Node.js Deployment
Deploy directly without buildpacks:
1. Select **"Node.js"** app type in Dokploy
2. Set root directory: `/backend` or `/frontend`
3. Let Dokploy auto-configure

### Option 2: Use Docker Compose
1. In Dokploy, use **"Docker Compose"**
2. Point to root directory (has `docker-compose.yml`)
3. All services deploy together

### Option 3: Manual Server Deployment
See main README for PM2 deployment on VPS.

---

## 🎉 Success Indicators

### Backend Working:
- ✅ `https://your-backend.dokploy.app/api/health` returns 200
- ✅ No errors in logs
- ✅ MongoDB connected

### Frontend Working:
- ✅ Website loads
- ✅ Login page accessible
- ✅ API calls successful
- ✅ Dashboard displays

---

## 📞 Support

If issues persist, check:
1. Dokploy documentation
2. Application logs
3. Environment variables
4. MongoDB Atlas connection
5. GitHub repository structure

---

**Remember**: The key is setting the correct **Build Path** in Dokploy:
- Backend: `/backend`
- Frontend: `/frontend`

Good luck! 🚀
