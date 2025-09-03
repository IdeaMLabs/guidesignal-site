# GitHub Pages SSL Certificate Fix Guide

## 🔍 Issue Analysis
The website is experiencing SSL certificate issues with GitHub Pages custom domain configuration.

## 🔧 Step-by-Step Solution

### 1. Remove and Re-add Custom Domain
```bash
# This forces GitHub to regenerate the SSL certificate
# Go to: https://github.com/IdeaMLabs/guidesignal-site/settings/pages
```

1. **Navigate to Repository Settings:**
   - Go to https://github.com/IdeaMLabs/guidesignal-site
   - Click "Settings" tab
   - Scroll down to "Pages" section

2. **Remove Custom Domain:**
   - Clear the "Custom domain" field (currently: guide-signal.com)
   - Click "Save"
   - Wait 2-3 minutes

3. **Re-add Custom Domain:**
   - Enter "guide-signal.com" in Custom domain field
   - Click "Save"
   - Check "Enforce HTTPS" (may take time to become available)

### 2. Verify DNS Configuration
```bash
# Check current DNS settings
nslookup guide-signal.com

# Should point to GitHub Pages IPs:
# 185.199.108.153
# 185.199.109.153 
# 185.199.110.153
# 185.199.111.153
```

### 3. Wait for Certificate Provisioning
- SSL certificates can take 1-24 hours to provision
- GitHub will attempt to generate certificate each time you visit Pages settings
- Monitor the "Enforce HTTPS" checkbox - it becomes available when certificate is ready

### 4. Check CNAME Configuration
Current CNAME file content should be:
```
guide-signal.com
```

### 5. Disable Any DNS Proxies
If using Cloudflare or other DNS proxy services:
- Temporarily set DNS records to "DNS only" (not proxied)
- This allows GitHub to see DNS records for certificate generation

### 6. Certificate Authority Authorization (CAA)
If you have CAA records, ensure they include:
```
example.com. CAA 0 issue "letsencrypt.org"
```

## 🚨 Common Issues and Solutions

### Issue: "Certificate request error" 
**Solution:** DNS hasn't fully propagated. Wait 24 hours and try again.

### Issue: HTTPS checkbox grayed out
**Solution:** Certificate still being generated. Be patient, check back in a few hours.

### Issue: Mixed content warnings
**Solution:** Ensure all resources load over HTTPS (fixed in our security config).

### Issue: Certificate shows different domain
**Solution:** Clear browser cache, check in incognito mode.

## ⏰ Timeline Expectations
- DNS propagation: 1-4 hours
- Certificate generation: 1-24 hours  
- Total resolution time: Usually within 24 hours

## 🔍 Verification Steps
1. Visit https://guide-signal.com (should load without warnings)
2. Check browser security indicator (should show secure lock)
3. Use SSL Labs test: https://www.ssllabs.com/ssltest/analyze.html?d=guide-signal.com
4. Verify all pages load securely

## 📞 Escalation
If issues persist after 48 hours, contact GitHub Support with:
- Repository name: IdeaMLabs/guidesignal-site
- Custom domain: guide-signal.com
- Steps already attempted
- Screenshots of certificate errors

## 🛡️ Additional Security Enhancements
Our security-config.js provides:
- Automatic HTTPS enforcement
- Mixed content protection  
- Enhanced security headers
- Certificate monitoring
- Development environment detection