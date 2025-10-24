# Dokploy Deployment Guide for Panaglo

## 📋 Prerequisites
- Dokploy instance running
- GitHub repository (or GitLab/Bitbucket)
- MongoDB Atlas connection string
- SMTP credentials

---

## 🚀 Deployment Steps

### 1. Backend Deployment

#### A. Create Backend App in Dokploy
```
1. Go to Dokploy Dashboard
2. Click "Create Application"
3. Select "Backend" as type
4. Choose "Paketo Buildpacks"
5. Connect your Git repository
6. Set branch: main
7. Set root directory: /backend
```

#### B. Environment Variables (Backend)
```env
NODE_ENV=production
PORT=5000
MONGODB_URI=your_mongodb_atlas_uri
JWT_SECRET=your_secure_jwt_secret_here
JWT_EXPIRE=30d

# Email Configuration
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your_email@gmail.com
SMTP_PASS=your_app_password

# Company Details
COMPANY_NAME=Panaglo
EMAIL=info@panaglo.com
PHONE=+92-XXX-XXXXXXX
WEBSITE=https://panaglo.com
ADDRESS=Your Company Address

# Frontend URL (update after frontend deployment)
FRONTEND_URL=https://your-frontend-domain.com
```

#### C. Build Configuration
```
Build Command: npm install
Start Command: npm start
Port: 5000
Health Check: /api/health (optional)
```

---

### 2. Frontend Deployment

#### A. Create Frontend App in Dokploy
```
1. Go to Dokploy Dashboard
2. Click "Create Application"
3. Select "Frontend" as type
4. Choose "Paketo Buildpacks"
5. Connect your Git repository
6. Set branch: main
7. Set root directory: /frontend
```

#### B. Environment Variables (Frontend)
```env
VITE_API_URL=https://your-backend-domain.com/api
VITE_FRONTEND_URL=https://your-frontend-domain.com
NODE_ENV=production
```

#### C. Build Configuration
```
Build Command: npm run build
Output Directory: dist
Port: 80 (or as assigned by Dokploy)
```

---

## 🔗 Linking Frontend & Backend

### After Both Apps are Deployed:

1. **Get Backend URL** from Dokploy
   - Example: `https://panaglo-backend.dokploy.app`

2. **Update Frontend Environment**
   - Go to Frontend app settings
   - Update `VITE_API_URL=https://panaglo-backend.dokploy.app/api`
   - Redeploy frontend

3. **Update Backend Environment**
   - Go to Backend app settings
   - Update `FRONTEND_URL=https://panaglo-frontend.dokploy.app`
   - Redeploy backend

---

## 📊 Post-Deployment Checklist

### Backend:
- ✅ MongoDB Atlas connection working
- ✅ Email service configured
- ✅ API endpoints responding
- ✅ Health check passing
- ✅ Logs show no errors

### Frontend:
- ✅ Build successful
- ✅ Static files served correctly
- ✅ API calls working
- ✅ Login/logout functioning
- ✅ All pages loading

### Security:
- ✅ HTTPS enabled (Dokploy auto-provides)
- ✅ Environment variables secured
- ✅ MongoDB Atlas IP whitelist updated (0.0.0.0/0 for cloud)
- ✅ CORS configured correctly
- ✅ Strong JWT secret

---

## 🔄 CI/CD Setup

Dokploy automatically redeploys when you push to the connected branch.

### Auto-Deploy Trigger:
```bash
# Make changes
git add .
git commit -m "Update: your message"
git push origin main

# Dokploy will auto-detect and redeploy
```

---

## 📝 Dokploy App Configuration

### Backend `project.toml`:
```toml
[_]
schema-version = "0.2"

[[io.buildpacks.group]]
id = "paketo-buildpacks/nodejs"
version = "3.2.0"

[io.buildpacks.build.env]
BP_NODE_VERSION = "18.*"
```

### Frontend `project.toml`:
```toml
[_]
schema-version = "0.2"

[[io.buildpacks.group]]
id = "paketo-buildpacks/nodejs"
version = "3.2.0"

[[io.buildpacks.group]]
id = "paketo-buildpacks/nginx"
version = "0.18.0"

[io.buildpacks.build.env]
BP_NODE_VERSION = "18.*"
BP_WEB_SERVER = "nginx"
BP_WEB_SERVER_ROOT = "dist"
```

---

## 🛠️ Troubleshooting

### Backend not starting:
```
1. Check logs in Dokploy dashboard
2. Verify MongoDB connection string
3. Check all environment variables
4. Ensure port 5000 is exposed
```

### Frontend not loading:
```
1. Check build logs
2. Verify VITE_API_URL is correct
3. Check nginx configuration
4. Ensure dist folder is generated
```

### API calls failing:
```
1. Check CORS settings in backend
2. Verify backend URL in frontend env
3. Check network tab in browser
4. Verify backend health endpoint
```

---

## 🎯 Quick Deploy Commands

### Initial Setup:
```bash
# Commit buildpack configs
git add backend/project.toml backend/Procfile backend/buildpack.json
git add frontend/project.toml frontend/buildpack.json frontend/nginx.conf
git commit -m "Add Paketo Buildpack configuration for Dokploy"
git push origin main
```

### Update Deployment:
```bash
git add .
git commit -m "Update: description"
git push origin main
# Dokploy auto-deploys
```

---

## 📞 Support

If deployment issues persist:
1. Check Dokploy documentation
2. Review application logs
3. Verify all environment variables
4. Test locally first with `npm run build`

---

## ✅ Success Indicators

- Backend: `GET https://your-backend.dokploy.app/api/health` returns 200
- Frontend: Opens without errors
- Login: Successfully authenticates
- Dashboard: Loads customer/site data
- Widget: API endpoint accessible

---

Happy Deploying! 🚀
