# VPay Admin - Deployment Guide

## 🌐 Deployment Options

### Option 1: Vercel (Recommended - Easiest)

1. **Install Vercel CLI:**
   ```bash
   npm i -g vercel
   ```

2. **Deploy:**
   ```bash
   cd VPay-Admin
   vercel
   ```

3. **Configure Environment Variables in Vercel:**
   - Go to Vercel Dashboard → Project → Settings → Environment Variables
   - Add: `VITE_API_URL` = `https://your-backend-url.com/api/v1`

### Option 2: Netlify

1. **Install Netlify CLI:**
   ```bash
   npm i -g netlify-cli
   ```

2. **Build:**
   ```bash
   npm run build
   ```

3. **Deploy:**
   ```bash
   netlify deploy --prod --dir=dist
   ```

4. **Configure Environment Variables:**
   - Netlify Dashboard → Site Settings → Build & Deploy → Environment
   - Add: `VITE_API_URL`

### Option 3: AWS S3 + CloudFront

1. **Build:**
   ```bash
   npm run build
   ```

2. **Upload to S3:**
   ```bash
   aws s3 sync dist/ s3://your-bucket-name
   ```

3. **Configure CloudFront:**
   - Create CloudFront distribution
   - Point to S3 bucket
   - Add SSL certificate
   - Set up custom domain

### Option 4: Docker

1. **Create Dockerfile:**
   ```dockerfile
   FROM node:18-alpine as build
   WORKDIR /app
   COPY package*.json ./
   RUN npm install
   COPY . .
   RUN npm run build

   FROM nginx:alpine
   COPY --from=build /app/dist /usr/share/nginx/html
   COPY nginx.conf /etc/nginx/conf.d/default.conf
   EXPOSE 80
   CMD ["nginx", "-g", "daemon off;"]
   ```

2. **Create nginx.conf:**
   ```nginx
   server {
       listen 80;
       server_name localhost;
       root /usr/share/nginx/html;
       index index.html;

       location / {
           try_files $uri $uri/ /index.html;
       }

       location /api {
           proxy_pass http://backend:5000;
           proxy_http_version 1.1;
           proxy_set_header Upgrade $http_upgrade;
           proxy_set_header Connection 'upgrade';
           proxy_set_header Host $host;
           proxy_cache_bypass $http_upgrade;
       }
   }
   ```

3. **Build and run:**
   ```bash
   docker build -t vpay-admin .
   docker run -p 80:80 vpay-admin
   ```

### Option 5: Traditional Server (VPS)

1. **Build the application:**
   ```bash
   npm run build
   ```

2. **Install Nginx:**
   ```bash
   sudo apt update
   sudo apt install nginx
   ```

3. **Copy build files:**
   ```bash
   sudo cp -r dist/* /var/www/html/
   ```

4. **Configure Nginx:**
   ```bash
   sudo nano /etc/nginx/sites-available/vpay-admin
   ```

   ```nginx
   server {
       listen 80;
       server_name admin.vpay.com;
       root /var/www/html;
       index index.html;

       location / {
           try_files $uri $uri/ /index.html;
       }

       location /api {
           proxy_pass http://backend-server:5000;
           proxy_http_version 1.1;
           proxy_set_header Upgrade $http_upgrade;
           proxy_set_header Connection 'upgrade';
           proxy_set_header Host $host;
           proxy_cache_bypass $http_upgrade;
       }
   }
   ```

5. **Enable site and restart Nginx:**
   ```bash
   sudo ln -s /etc/nginx/sites-available/vpay-admin /etc/nginx/sites-enabled/
   sudo nginx -t
   sudo systemctl restart nginx
   ```

6. **Install SSL (Let's Encrypt):**
   ```bash
   sudo apt install certbot python3-certbot-nginx
   sudo certbot --nginx -d admin.vpay.com
   ```

## 🔒 Security Checklist

- [ ] Use HTTPS in production
- [ ] Set up proper CORS on backend
- [ ] Configure CSP headers
- [ ] Enable rate limiting
- [ ] Set secure cookie flags
- [ ] Implement session timeout
- [ ] Add API key rotation
- [ ] Set up monitoring
- [ ] Configure firewall rules
- [ ] Enable logging
- [ ] Set up backup system

## 🏗️ Build Optimization

### 1. **Optimize Bundle Size:**
   - Already configured with Vite
   - Automatic code splitting
   - Tree shaking enabled

### 2. **Enable Compression:**
   Add to nginx.conf:
   ```nginx
   gzip on;
   gzip_vary on;
   gzip_proxied any;
   gzip_comp_level 6;
   gzip_types text/plain text/css text/xml text/javascript application/json application/javascript application/xml+rss;
   ```

### 3. **Set Cache Headers:**
   ```nginx
   location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg)$ {
       expires 1y;
       add_header Cache-Control "public, immutable";
   }
   ```

## 📊 Monitoring

### Recommended Tools:
- **Sentry** - Error tracking
- **Google Analytics** - Usage analytics
- **Hotjar** - User behavior
- **Uptime Robot** - Uptime monitoring
- **LogRocket** - Session replay

### Setup Sentry:
```bash
npm install @sentry/react
```

```javascript
// src/main.jsx
import * as Sentry from "@sentry/react";

Sentry.init({
  dsn: "YOUR_SENTRY_DSN",
  environment: import.meta.env.MODE,
});
```

## 🔧 Environment Variables for Production

Create `.env.production`:
```env
VITE_API_URL=https://api.vpay.com/api/v1
VITE_APP_NAME=VPay Admin
VITE_SENTRY_DSN=your-sentry-dsn
VITE_GA_TRACKING_ID=your-ga-id
```

## 🚀 CI/CD Pipeline

### GitHub Actions Example:

`.github/workflows/deploy.yml`:
```yaml
name: Deploy to Production

on:
  push:
    branches: [main]

jobs:
  build-and-deploy:
    runs-on: ubuntu-latest
    
    steps:
      - uses: actions/checkout@v2
      
      - name: Setup Node.js
        uses: actions/setup-node@v2
        with:
          node-version: '18'
      
      - name: Install dependencies
        run: npm ci
      
      - name: Build
        run: npm run build
        env:
          VITE_API_URL: ${{ secrets.API_URL }}
      
      - name: Deploy to Vercel
        uses: amondnet/vercel-action@v20
        with:
          vercel-token: ${{ secrets.VERCEL_TOKEN }}
          vercel-org-id: ${{ secrets.ORG_ID }}
          vercel-project-id: ${{ secrets.PROJECT_ID }}
          vercel-args: '--prod'
```

## 🧪 Pre-Deployment Checklist

- [ ] All environment variables configured
- [ ] API endpoints tested
- [ ] Build runs without errors
- [ ] All pages accessible
- [ ] Authentication working
- [ ] API calls successful
- [ ] Error handling tested
- [ ] Mobile responsive
- [ ] Browser compatibility checked
- [ ] Performance optimized
- [ ] Security headers configured
- [ ] SSL certificate installed
- [ ] Backup system in place
- [ ] Monitoring tools configured
- [ ] Documentation updated

## 📈 Performance Targets

- **First Contentful Paint:** < 1.5s
- **Time to Interactive:** < 3.5s
- **Lighthouse Score:** > 90
- **Bundle Size:** < 500KB (gzipped)

## 🆘 Troubleshooting

### Issue: White screen after deployment
**Solution:** Check browser console for errors, verify API URL is correct

### Issue: API calls failing
**Solution:** Check CORS configuration on backend, verify API URL

### Issue: Routing not working
**Solution:** Configure server to serve index.html for all routes

### Issue: Environment variables not loading
**Solution:** Ensure variables are prefixed with `VITE_`

---

## 🎉 You're Ready!

Your VPay Admin dashboard is ready for deployment. Choose the deployment option that best fits your needs and follow the steps above.

For questions or issues, refer to the [README.md](README.md) or [SETUP_GUIDE.md](SETUP_GUIDE.md).
