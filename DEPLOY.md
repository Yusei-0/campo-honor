# Deployment Guide: Render & Netlify

This guide explains how to deploy the **Backend to Render** and the **Frontend to Netlify**.

## 1. Backend Deployment (Render)

The backend will be hosted on Render. It needs to know the URL of your frontend to allow connections (CORS).

### Steps

1.  Push your code to GitHub.
2.  Log in to [Render](https://render.com/).
3.  Click **New +** -> **Web Service**.
4.  Connect your GitHub repository.
5.  **Root Directory**: Enter `backend`.
6.  **Build Command**: `npm install`
7.  **Start Command**: `node index.js`
8.  **Environment Variables**:

    - Scroll down to "Environment Variables" and add:
      - `PORT`: `3000` (Render usually sets this automatically, but good to be explicit or let it default).
      - `CORS_ORIGIN`: **LEAVE THIS BLANK FOR NOW**. You will come back and update this after you deploy the frontend and get its URL (e.g., `https://my-game.netlify.app`).
        - _Note: While testing, you can set it to `_` to allow all, but it's less secure.\*

9.  Click **Create Web Service**.
10. Wait for the deployment to finish. Copy the **Backend URL** (e.g., `https://my-game-backend.onrender.com`).

## 2. Frontend Deployment (Netlify)

The frontend will be hosted on Netlify. It needs to know the URL of your backend to connect to it.

### Steps

1.  Log in to [Netlify](https://www.netlify.com/).
2.  Click **Add new site** -> **Import from existing project**.
3.  Connect your GitHub repository.
4.  **Base directory**: `frontend`
5.  **Build command**: `npm run build`
6.  **Publish directory**: `frontend/dist`
7.  **Environment variables** (Click "Show advanced"):
    - Key: `VITE_API_URL`
    - Value: Paste your **Backend URL** from Render (e.g., `https://my-game-backend.onrender.com`).
8.  Click **Deploy site**.
9.  Wait for the deployment. Netlify will give you a URL (e.g., `https://my-game.netlify.app`).

## 3. Final Configuration

Now that you have the Frontend URL, go back to Render to secure your backend.

1.  Go to your **Render Dashboard** -> Select your Backend service.
2.  Go to **Environment**.
3.  Edit `CORS_ORIGIN` and set it to your **Netlify Frontend URL** (e.g., `https://my-game.netlify.app`).
    - _Make sure there is no trailing slash._
4.  Save changes. Render will automatically restart your server.

## Summary of Connections

- **Frontend (Netlify)** talks to -> **Backend (Render)** using `VITE_API_URL`.
- **Backend (Render)** allows -> **Frontend (Netlify)** using `CORS_ORIGIN`.
