# Deploying to Railway

## Quick Deploy Steps

1. **Go to Railway.app**
   - Visit https://railway.app and sign in with GitHub

2. **Create New Project**
   - Click "New Project"
   - Select "Deploy from GitHub repo"
   - Choose your repository
   - Select the `python-backend` directory as the root

3. **Railway will automatically:**
   - Detect the Dockerfile
   - Build the image
   - Deploy the service
   - Assign a port automatically

4. **Generate Public Domain**
   - Click on your deployed service
   - Go to "Settings" tab
   - Scroll to "Networking" section
   - Click "Generate Domain"
   - Copy the generated URL (e.g., `https://python-backend-production-xxxx.up.railway.app`)

5. **Add URL to v0**
   - In v0, click "Vars" in the left sidebar
   - Find `PYTHON_BACKEND_URL`
   - Paste the Railway URL (include `https://` but no trailing `/`)
   - Click "Submit"

## Troubleshooting

### Check Logs
- In Railway, go to your service
- Click "Deployments" tab
- Click on the latest deployment
- View logs to see any errors

### Common Issues
1. **Build fails**: Check that all files are committed to GitHub
2. **App crashes**: Check logs for Python errors
3. **500 errors**: Ensure PORT environment variable is being used correctly

### Environment Variables
Railway automatically provides:
- `PORT` - The port your app should listen on
- No additional env vars needed for basic operation

## Testing Your Deployment

Once deployed, test these endpoints:
- `https://your-app.railway.app/` - Should return running status
- `https://your-app.railway.app/health` - Should return `{"status": "ok"}`
