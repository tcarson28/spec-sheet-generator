# Complete Setup Guide

## What You'll Build

A professional bilingual spec sheet generator that:
- Takes product info + image as input
- Generates a Word document with English + Chinese pages
- Uses Claude AI for reliable translation
- Runs on Netlify (free)

## Prerequisites Check

Before starting, verify you have:
- [ ] GitHub account (free at github.com)
- [ ] Netlify account (free at netlify.com)
- [ ] Anthropic API key (from console.anthropic.com)
- [ ] Node.js 16+ installed (download at nodejs.org)

## Phase 1: Get API Key (2 minutes)

1. Go to https://console.anthropic.com
2. Log in (create account if needed)
3. Click "API Keys" in left sidebar
4. Click "Create Key"
5. Copy the key (starts with `sk-ant-`)
6. **Save this key securely** - you'll need it in Phase 3

## Phase 2: Prepare Code for GitHub (3 minutes)

This project is in `/home/claude/spec-sheet-generator`

```bash
cd /home/claude/spec-sheet-generator
git init
git config user.name "Your Name"
git config user.email "your.email@example.com"
git add .
git commit -m "Initial commit: Spec sheet generator"
```

## Phase 3: Create GitHub Repo (2 minutes)

1. Go to https://github.com/new
2. Repository name: `spec-sheet-generator`
3. Description: "Bilingual product spec sheet generator"
4. Public (so Netlify can access it)
5. Click "Create repository"
6. Follow the "push an existing repository from the command line" instructions:

```bash
git remote add origin https://github.com/YOUR_USERNAME/spec-sheet-generator.git
git branch -M main
git push -u origin main
```

## Phase 4: Deploy to Netlify (3 minutes)

1. Go to https://app.netlify.com
2. Click "Add new site" → "Import an existing project"
3. Choose "GitHub"
4. Authorize Netlify to access GitHub
5. Select `spec-sheet-generator` from your repos
6. Build settings:
   - Build command: `npm run build`
   - Publish directory: `build`
   - Click "Deploy site"

**Wait for build to finish** (2-3 minutes). You'll see a URL like `https://xxxxx.netlify.app`

## Phase 5: Add API Key to Netlify (1 minute)

1. In Netlify, go to your site
2. Click "Site Settings" (top right)
3. Scroll to "Environment"
4. Click "Edit variables" (or "Add environment variables")
5. Add a new variable:
   - **Key:** `ANTHROPIC_API_KEY`
   - **Value:** Paste your API key from Phase 1
6. Click "Save"
7. Go back to Deployments and click "Trigger deploy"

**The site will rebuild with your API key.**

## Phase 6: Test (2 minutes)

1. Visit your Netlify URL
2. Fill in test data:
   - Product Name: "Test Frame"
   - Description: "A beautiful frame"
   - Dimensions: "34cm x 49cm"
   - Materials: "Wood, Glass"
   - MOQ: "100 units"
   - Lead Time: "30 days"
   - Pricing: "Contact for quote"
3. Upload any image
4. Click "Generate Spec Sheet"
5. Download and open the Word document

**If it works, you're done!** 🎉

## Troubleshooting

### "Failed to generate spec sheet"
- ✅ Check that API key is in Netlify environment variables
- ✅ Verify the key starts with `sk-ant-`
- ✅ Click "Trigger deploy" in Netlify after adding the key

### Page won't load
- ✅ Check browser console (F12) for errors
- ✅ Look at Netlify build logs (Deploys tab)
- ✅ Wait 5 minutes and refresh

### Document won't download
- ✅ Try a different browser
- ✅ Fill in all required fields (marked with *)
- ✅ Check browser's Downloads folder

## Next Steps

Once deployed:
- Share the URL with clients
- They fill the form and download spec sheets
- You can customize colors, sections, etc. (see README.md)

## File Structure

```
spec-sheet-generator/
├── src/                    # React app code
│   ├── App.js            # Main form
│   ├── App.css           # Styling
│   └── index.js
├── netlify/
│   └── functions/
│       ├── generate-spec.js  # Spec sheet generation logic
│       └── package.json
├── public/
│   └── index.html        # Main HTML file
├── package.json
├── netlify.toml          # Netlify config
├── README.md             # Full documentation
└── QUICKSTART.md         # This file
```

## Cost

- **Hosting:** Free (Netlify)
- **API:** ~$0.01-0.05 per spec sheet (Anthropic)
- **Total:** Free hosting + pay-per-use API

## Support

If something breaks:
1. Check Netlify logs (Deploys → select latest → View deploy log)
2. Check Netlify Functions logs (Functions tab)
3. Verify API key is correct
4. Try deploying again

## Customization (Advanced)

See README.md for:
- Adding custom form fields
- Changing spec sheet sections
- Modifying styling
- Adding branding

---

**You did it!** 🚀 Your spec sheet generator is live.
