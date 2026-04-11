# Spec Sheet Generator

A professional, bilingual (English/Simplified Chinese) product specification sheet generator. Built with React and Netlify Functions, powered by Claude AI for reliable translation.

## Features

✅ **Bilingual Output** - English + Simplified Chinese on separate pages  
✅ **Professional Formatting** - Clean, standardized spec sheet layout  
✅ **Product Images** - Multiple image placement options  
✅ **AI Translation** - Claude-powered translation (no Gemini errors)  
✅ **One-Click Generation** - Fill form → Download Word doc  
✅ **White-Labeled** - Client-friendly, no branding  
✅ **Easy Deployment** - Netlify (free tier supported)  

## What Gets Generated

Each Word document includes:
- **Page 1 (English)**
  - Product Overview
  - Specifications (dimensions, materials, colors, weight)
  - Standards & Certifications
  - Ordering Info (MOQ, lead time, pricing)
  - Quality Assurance
  - Shipping & Packaging

- **Page 2 (Simplified Chinese)**
  - Same structure, fully translated
  - Specification Summary Table in Chinese

## Setup Instructions

### Prerequisites
- Node.js 16+ (for local development)
- GitHub account (for code storage)
- Netlify account (free)
- Anthropic API key (get at https://console.anthropic.com)

### Step 1: Prepare Your API Key

1. Go to https://console.anthropic.com
2. Create or copy your API key
3. Save it securely (you'll use it in Step 3)

### Step 2: Deploy to Netlify

#### Option A: Deploy from GitHub (Recommended - Auto-Updates)

1. **Push code to GitHub:**
   ```bash
   git init
   git add .
   git commit -m "Initial commit"
   git remote add origin https://github.com/YOUR_USERNAME/spec-sheet-generator.git
   git push -u origin main
   ```

2. **Connect to Netlify:**
   - Go to https://app.netlify.com
   - Click "Add new site" → "Import an existing project"
   - Select GitHub and authorize
   - Select your `spec-sheet-generator` repository
   - Build command: `npm run build`
   - Publish directory: `build`
   - Click "Deploy site"

3. **Set Environment Variables:**
   - In Netlify dashboard, go to Site Settings → Environment
   - Click "Add environment variables"
   - Key: `ANTHROPIC_API_KEY`
   - Value: *Paste your API key from Step 1*
   - Click "Save"
   - Redeploy the site (Deploy → Trigger deploy)

#### Option B: Deploy via Netlify CLI (Faster Testing)

1. **Install Netlify CLI:**
   ```bash
   npm install -g netlify-cli
   ```

2. **Login to Netlify:**
   ```bash
   netlify login
   ```

3. **Create `.env.local` for local development:**
   ```bash
   cp .env.example .env.local
   # Edit .env.local and add your API key:
   # ANTHROPIC_API_KEY=sk-ant-xxxxxxxxxxxxxxxx
   ```

4. **Deploy:**
   ```bash
   netlify deploy
   ```

### Step 3: Test Your Deployment

1. Visit your Netlify site URL (e.g., `https://your-site-name.netlify.app`)
2. Fill in the form with test data
3. Upload a product image
4. Click "Generate Spec Sheet"
5. Download and verify the Word document

## Local Development

### Install Dependencies

```bash
npm install
cd netlify/functions
npm install
cd ../..
```

### Run Locally

```bash
npm start
```

This starts:
- React dev server on `http://localhost:3000`
- Netlify Functions on `http://localhost:9000/api`

### Build for Production

```bash
npm run build
```

## Troubleshooting

### "API Key not found" error
- ✅ Verify your API key is set in Netlify environment variables
- ✅ Redeploy the site after adding the API key
- ✅ Check that the key starts with `sk-ant-`

### Translation errors
- ✅ The app falls back to original text if translation fails
- ✅ Check your API key has sufficient credits
- ✅ Try again (API may be temporarily slow)

### Word document won't download
- ✅ Check browser console for errors (F12)
- ✅ Try a different browser
- ✅ Ensure form fields are filled correctly

### Netlify Functions not working
- ✅ Build logs: In Netlify dashboard, go to Deploys → select latest → Logs
- ✅ Function logs: Netlify → Functions → Monitor
- ✅ Check that `netlify/functions/generate-spec.js` exists

## Cost Estimate

**Hosting:** Free (Netlify free tier)  
**API Calls:** ~$0.01-0.05 per spec sheet (Anthropic Claude 3 Opus)

## Architecture

```
spec-sheet-generator/
├── src/
│   ├── App.js (React form component)
│   ├── App.css (styling)
│   └── index.js
├── netlify/functions/
│   ├── generate-spec.js (Netlify Function - handles translation + Word generation)
│   └── package.json
├── public/
│   └── index.html
├── netlify.toml (Netlify configuration)
└── package.json
```

**Data Flow:**
1. User fills form in React app
2. Form submitted to Netlify Function
3. Claude API translates content to Chinese
4. `docx` library generates Word document
5. Document downloaded to user's device

## Customization

### Change Image Placement Options
Edit `src/App.js`, line ~110 (`imagePlacement` select options)

### Add New Form Fields
1. Add to `formData` state in `App.js`
2. Add form input element
3. Update the Netlify Function to include the field

### Modify Spec Sheet Sections
Edit the spec rows in `netlify/functions/generate-spec.js` (lines ~200+)

### Update Styling
Edit `src/App.css` for frontend  
Edit spacing/formatting in `netlify/functions/generate-spec.js` for Word doc

## Support

For issues:
1. Check Netlify build & function logs
2. Test locally with `npm start`
3. Verify API key is correct
4. Check Anthropic dashboard for API errors

## License

For internal use. Do not redistribute.

---

**Built with:** React, Netlify Functions, Claude API, docx.js
