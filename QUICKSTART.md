# Quick Start: Deploy in 5 Minutes

## Step 1: Get Your API Key
Go to https://console.anthropic.com and copy your API key.

## Step 2: Push to GitHub
```bash
git init
git add .
git commit -m "Initial commit"
git remote add origin https://github.com/YOUR_USERNAME/spec-sheet-generator.git
git push -u origin main
```

## Step 3: Connect to Netlify
1. Go to https://app.netlify.com
2. Click "Add new site" → "Import an existing project"
3. Choose GitHub, select `spec-sheet-generator` repo
4. Build command: `npm run build`
5. Publish directory: `build`
6. Click "Deploy site"

## Step 4: Add API Key
In Netlify dashboard:
1. Site Settings → Environment
2. Click "Edit variables"
3. Add: `ANTHROPIC_API_KEY` = your key from Step 1
4. Redeploy (Deploys → Trigger deploy)

## Step 5: Test
Visit your site (e.g., `https://your-site.netlify.app`), fill in a form, and generate a spec sheet.

---

**That's it!** Your app is live. See README.md for troubleshooting.
