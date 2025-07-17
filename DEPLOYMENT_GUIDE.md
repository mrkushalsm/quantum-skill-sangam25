# 🚀 Deployment Guide

## Backend Deployment on Render

### Prerequisites
1. MongoDB Atlas account with a cluster set up
2. Firebase project with Admin SDK credentials
3. Gmail account with App Password for email service

### Steps to Deploy on Render

1. **Push your code to GitHub** (if not already done)
   ```bash
   git add .
   git commit -m "Add deployment configurations"
   git push origin main
   ```

2. **Create a Render Account**
   - Go to [render.com](https://render.com)
   - Sign up/Login with GitHub

3. **Create a Web Service**
   - Click "New +" → "Web Service"
   - Connect your GitHub repository
   - Select the repository: `quantum-skill-sangam25`
   - Configure the service:
     - **Name**: `armed-forces-welfare-backend`
     - **Root Directory**: `backend`
     - **Environment**: `Node`
     - **Build Command**: `chmod +x build.sh && ./build.sh`
     - **Start Command**: `npm start`

4. **Set Environment Variables in Render**
   Go to your service → Environment → Add the following variables:
   
   ```
   NODE_ENV=production
   MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/armed_forces_welfare
   DB_NAME=armed_forces_welfare
   FIREBASE_API_KEY=your-firebase-api-key
   FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
   FIREBASE_PROJECT_ID=your-firebase-project-id
   FIREBASE_STORAGE_BUCKET=your-project.firebasestorage.app
   FIREBASE_MESSAGING_SENDER_ID=123456789012
   FIREBASE_APP_ID=1:123456789012:web:abcdef1234567890abcdef
   FIREBASE_MEASUREMENT_ID=G-XXXXXXXXXX
   FIREBASE_WEB_API_KEY=your-firebase-web-api-key
   FIREBASE_PRIVATE_KEY_ID=your-private-key-id
   FIREBASE_PRIVATE_KEY=-----BEGIN PRIVATE KEY-----\nYOUR_COMPLETE_PRIVATE_KEY_HERE\n-----END PRIVATE KEY-----
   FIREBASE_CLIENT_EMAIL=firebase-adminsdk-xxxxx@your-project.iam.gserviceaccount.com
   FIREBASE_CLIENT_ID=123456789012345678901
   FIREBASE_AUTH_URI=https://accounts.google.com/o/oauth2/auth
   FIREBASE_TOKEN_URI=https://oauth2.googleapis.com/token
   FIREBASE_AUTH_PROVIDER_X509_CERT_URL=https://www.googleapis.com/oauth2/v1/certs
   FIREBASE_CLIENT_X509_CERT_URL=https://www.googleapis.com/robot/v1/metadata/x509/firebase-adminsdk-xxxxx%40your-project.iam.gserviceaccount.com
   JWT_SECRET=your-super-secure-jwt-secret-32-chars-minimum
   JWT_EXPIRES_IN=7d
   JWT_REFRESH_SECRET=your-refresh-token-secret-32-chars-minimum
   JWT_REFRESH_EXPIRES_IN=30d
   BCRYPT_ROUNDS=12
   EMAIL_HOST=smtp.gmail.com
   EMAIL_PORT=587
   EMAIL_USER=your-production-email@gmail.com
   EMAIL_PASS=your-gmail-app-password
   EMAIL_FROM_NAME=Armed Forces Welfare System
   EMAIL_FROM_ADDRESS=noreply@yourapp.com
   EMAIL_SERVICE=gmail
   CORS_ORIGIN=https://your-app.vercel.app
   MAX_FILE_SIZE=10485760
   UPLOAD_PATH=./uploads
   ALLOWED_FILE_TYPES=pdf,doc,docx,jpg,jpeg,png,gif,txt
   LOG_LEVEL=warn
   LOG_FILE_PATH=./logs
   MAX_LOG_FILES=3
   MAX_LOG_SIZE=5242880
   EMERGENCY_CONTACT_EMAIL=emergency@yourapp.com
   EMERGENCY_CONTACT_PHONE=+91-9999999999
   ```

5. **Deploy**
   - Click "Create Web Service"
   - Render will automatically build and deploy your backend
   - Your backend URL will be: `https://your-service-name.onrender.com`

---

## Frontend Deployment on Vercel

### Steps to Deploy on Vercel

1. **Create a Vercel Account**
   - Go to [vercel.com](https://vercel.com)
   - Sign up/Login with GitHub

2. **Import Project**
   - Click "New Project"
   - Import your GitHub repository
   - Select the `frontend` folder as the root directory

3. **Configure Project**
   - **Framework Preset**: Next.js
   - **Root Directory**: `frontend`
   - **Build Command**: `npm run build` (auto-detected)
   - **Output Directory**: `.next` (auto-detected)

4. **Set Environment Variables in Vercel**
   Go to Project Settings → Environment Variables → Add the following:
   
   ```
   NEXT_PUBLIC_APP_NAME=Armed Forces Welfare System
   NEXT_PUBLIC_ENVIRONMENT=production
   NEXT_PUBLIC_API_URL=https://your-backend-app.onrender.com/api
   NEXT_PUBLIC_SOCKET_URL=https://your-backend-app.onrender.com
   NEXT_PUBLIC_FIREBASE_API_KEY=your-firebase-api-key
   NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
   NEXT_PUBLIC_FIREBASE_PROJECT_ID=your-firebase-project-id
   NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your-project.firebasestorage.app
   NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=123456789012
   NEXT_PUBLIC_FIREBASE_APP_ID=1:123456789012:web:abcdef1234567890abcdef
   NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID=G-XXXXXXXXXX
   NEXT_PUBLIC_GOOGLE_CLIENT_ID=your-google-oauth-client-id
   NEXT_PUBLIC_MICROSOFT_CLIENT_ID=your-microsoft-app-id
   NEXT_PUBLIC_MAX_FILE_SIZE=4194304
   NEXT_PUBLIC_GOOGLE_ANALYTICS_ID=G-XXXXXXXXXX
   NODE_ENV=production
   ```

5. **Deploy**
   - Click "Deploy"
   - Vercel will automatically build and deploy your frontend
   - Your frontend URL will be: `https://your-app.vercel.app`

---

## Post-Deployment Configuration

### Update CORS Origin
1. After deploying frontend, get the Vercel URL
2. Update the `CORS_ORIGIN` environment variable in Render backend with your Vercel URL

### Update API URLs
1. After deploying backend, get the Render URL
2. Update `NEXT_PUBLIC_API_URL` and `NEXT_PUBLIC_SOCKET_URL` in Vercel frontend

### Firebase Configuration
1. In Firebase Console → Authentication → Settings → Authorized domains
2. Add your Vercel domain: `your-app.vercel.app`
3. Add your Render domain: `your-backend-app.onrender.com`

---

## Environment Files Created

- ✅ `backend/render.env.example` - Backend production environment variables
- ✅ `frontend/vercel.env.example` - Frontend production environment variables
- ✅ `render.yaml` - Render deployment configuration
- ✅ `frontend/vercel.json` - Vercel deployment configuration
- ✅ `backend/build.sh` - Render build script
- ✅ Updated `frontend/next.config.js` - Optimized for production

## Important Notes

1. **Free Tier Limitations**:
   - Render free tier spins down after 15 minutes of inactivity
   - Cold starts may take 30+ seconds
   - Consider upgrading for production use

2. **Security**:
   - Never commit real environment variables to Git
   - Use strong JWT secrets (32+ characters)
   - Enable Firebase App Check for production

3. **Monitoring**:
   - Set up logging and monitoring
   - Configure error tracking (Sentry)
   - Monitor API performance
