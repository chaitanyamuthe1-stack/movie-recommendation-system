# LinkedIn Kit

## Main post (edit numbers to match your final results)
🎬 I built a movie recommendation platform from scratch, and it goes well beyond a notebook.

What it does:
✅ Hybrid engine: content-based + item CF + SVD + Neural CF (PyTorch NeuMF)
✅ Cold-start handling with Bayesian weighting and an onboarding flow
✅ MMR re-ranking so recommendations aren't repetitive
✅ Explainable AI: every pick shows why it was recommended
✅ A chat assistant grounded in the real catalog (no made-up movies)
✅ FastAPI + React/TypeScript + PostgreSQL + Redis, Dockerized with CI

Results on a held-out set: hybrid Precision@10 = 0.415 vs 0.055 for content-only; NeuMF RMSE = 0.842.

Biggest lesson: the model with the best RMSE isn't automatically best at ranking, which is why I combined them instead of picking one.

🔗 Live demo: <link>
💻 GitHub: <link>

Feedback welcome! 🙌

#MachineLearning #RecommenderSystems #PyTorch #FastAPI #React #Docker #DataScience

## Featured section
Title: Hybrid Movie Recommendation Platform (Live Demo)
Description: Full-stack recommender with Neural CF, SVD and item-CF hybrid, MMR diversification, explainable AI and a grounded chat assistant.

## Projects entry
Hybrid Movie Recommendation Platform
- Built an end-to-end recommender (FastAPI, PyTorch, React 19, Docker) combining content-based, item CF, SVD and NeuMF models
- Reached Precision@10 of 0.415 for the hybrid ensemble and RMSE 0.842 for NeuMF on a held-out split
- Added MMR diversification, explainability and a catalog-grounded chat assistant
Skills: Python, PyTorch, FastAPI, React, TypeScript, Docker, PostgreSQL, Redis, Recommender Systems

## Skills to add
Recommender Systems, PyTorch, FastAPI, scikit-learn, Machine Learning, Deep Learning, React.js, TypeScript, Docker, PostgreSQL, Redis, REST APIs, CI/CD

## Resume bullets
- Built a hybrid movie recommender (content, item CF, SVD, NeuMF) with dynamic weighting, reaching Precision@10 of 0.415 on a held-out split
- Trained a PyTorch NeuMF model (GMF + MLP, dropout, batch norm) with RMSE 0.842 and MAE 0.638, beating the SVD baseline (0.876)
- Implemented MMR re-ranking and per-recommendation explanations to reduce genre redundancy and improve transparency
- Shipped a FastAPI + React app with JWT auth, Redis caching, Docker Compose and a GitHub Actions CI pipeline

## Recruiter message (under 80 words)
Hi <Name>, I'm a final-year B.Tech AI/ML student applying for <role>. I built a hybrid movie recommender (PyTorch NeuMF, SVD, item-CF) with a FastAPI + React app, Docker and CI. Demo: <link> · Code: <link>. I'd love to share how it could apply to your team. Could we connect?
