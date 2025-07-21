# Google OAuth Setup Guide

## Current Issue: 403 Error
The Google OAuth is returning a 403 "access denied" error, which means the callback URL is not properly configured in Google Cloud Console.

## Required Callback URL
Your app is using this exact callback URL:
```
https://a5c567a0-174b-47db-9d57-5e33365b5c4e-00-1fsioh8r1zwfp.janeway.replit.dev/api/auth/google/callback
```

## Step-by-Step Fix

### 1. Go to Google Cloud Console
- Open: https://console.cloud.google.com/
- Make sure you're in the correct project

### 2. Navigate to Credentials
- Go to: **APIs & Services** > **Credentials**
- Look for your OAuth 2.0 Client ID

### 3. Edit the OAuth Client
- Click the **pencil/edit icon** next to your OAuth 2.0 Client ID
- Find the **Authorized redirect URIs** section

### 4. Add the Callback URL
- Click **+ ADD URI**
- Copy and paste this EXACT URL:
  ```
  https://a5c567a0-174b-47db-9d57-5e33365b5c4e-00-1fsioh8r1zwfp.janeway.replit.dev/api/auth/google/callback
  ```
- Make sure there are NO extra spaces or characters
- Click **SAVE**

### 5. Wait for Propagation
- Changes can take 5-10 minutes to take effect
- Try the login again after waiting

## Common Mistakes to Avoid
- ❌ Missing `https://`
- ❌ Extra spaces in the URL
- ❌ Wrong domain name
- ❌ Missing `/api/auth/google/callback` path
- ❌ Not saving the changes

## Testing
After making the changes, the Google login should work without the 403 error.