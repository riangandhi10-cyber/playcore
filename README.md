# PlayCore 🎮

A Poki-style portal of free 3D browser games (Roblox-style avatars, Three.js).
Pure static site — HTML, CSS and vanilla JS, no build step.

## Games

| Game | Type |
|------|------|
| Block Parkour | 3D obby / platformer |
| Speed Racer 3D | Racing |
| Tower Stacker | Arcade |
| Block Blaster | First-person shooter |
| Sky Jump | Arcade platformer |
| Cube Maze | Maze / adventure |

## Run locally

From this folder:

```bash
python3 -m http.server 8765
```

Then open http://localhost:8765 (a server is needed because the games load
Three.js from a CDN and use pointer-lock / canvas).

## Deploy to Render (Static Site)

This folder is a self-contained, deployable static site.

### Option A — Blueprint (uses `render.yaml`, recommended)

1. Put **this `arcade` folder** in its own Git repo and push it to GitHub:
   ```bash
   cd arcade
   git init
   git add .
   git commit -m "PlayCore games site"
   git branch -M main
   git remote add origin https://github.com/<you>/playcore.git
   git push -u origin main
   ```
2. In the [Render dashboard](https://dashboard.render.com) → **New → Blueprint**.
3. Connect the repo. Render reads `render.yaml` and creates a **Static Site**
   named `playcore` automatically. Click **Apply**.
4. Your site goes live at `https://playcore.onrender.com` (or similar).

### Option B — Manual (no `render.yaml`)

1. Push the folder to GitHub (as above).
2. Render dashboard → **New → Static Site** → connect the repo.
3. Settings:
   - **Build Command:** leave empty
   - **Publish Directory:** `.` (or `arcade` if you kept the parent repo)
4. **Create Static Site.**

Static sites on Render are free, get automatic HTTPS, and redeploy on every
push to the connected branch.
