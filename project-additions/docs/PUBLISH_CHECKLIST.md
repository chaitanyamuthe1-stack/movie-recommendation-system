# Publish Checklist

## Security (do first)
- [ ] Revoke the old TMDB API key and create a new one
- [ ] Copy `.env.example` → `.env` and set real values locally
- [ ] Replace the old files with those in this folder (`docker-compose.yml`, `.gitignore`, `scripts/update_curated_assets.py`)
- [ ] `git rm --cached recommender.db .env` if they were ever tracked
- [ ] Run `make secrets` → must print OK
- [ ] If secrets were committed earlier: clean git history or start a fresh repo

## Verify it works
- [ ] `make test` passes
- [ ] `make build` (frontend) succeeds
- [ ] `make up` brings up all four containers healthy
- [ ] README numbers match your actual results
- [ ] Confirm which dataset the models were trained on. The bundled `recommender.db`
      holds only 177 ratings and 4 users, so make sure "MovieLens 100K" in the README is accurate
      for training/evaluation, and say where that data lives.

## Repo polish
- [x] Put your name in `LICENSE`, `<YOUR-USERNAME>` in README badges
- [ ] Add 4 screenshots and a demo GIF to `docs/images/`
- [ ] Add a short repo description and topics: recommender-system, pytorch, fastapi, react, docker
- [ ] Pin the repo on your GitHub profile
- [ ] Deploy (Render / Railway / Hugging Face Spaces) and add the live link

## LinkedIn
- [ ] Post from `docs/LINKEDIN_POST.md` with video/screenshots
- [ ] Add to Featured + Projects, add skills
- [ ] Reply to comments in the first hour
