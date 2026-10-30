# Interview Q&A

**1. Why a hybrid instead of one model?**
Each model fails differently: CF can't handle cold-start, content-based over-specialises, regressors (SVD/NeuMF) don't optimise ranking. The hybrid blends them, and the weights shift toward CF as a user's history grows.

**2. Why do SVD and NeuMF have no Precision@10?**
They are trained to minimise rating error (RMSE/MAE). Their predictions are used as signals inside the hybrid ranker rather than ranked directly.

**3. How is NeuMF different from SVD?**
SVD scores with a dot product (linear interaction). NeuMF adds an MLP over concatenated embeddings next to a GMF branch, so it can learn non-linear interactions.

**4. How do you handle cold-start users?**
An onboarding step collects favorite genres and seed movies. Until ratings exist, the system uses a Bayesian weighted rating plus genre/content similarity.

**5. What is the Bayesian weighted rating?**
WR = v/(v+m)·R + m/(v+m)·C. It pulls ratings of movies with few votes toward the global mean C, so a 10/10 from 3 votes doesn't beat a 8.5 from 10,000.

**6. How does MMR work?**
It picks items greedily, trading relevance against similarity to already-selected items (λ controls the balance), which reduces repetitive genres.

**7. Why adjusted cosine for item CF?**
Subtracting each user's mean rating removes rating-scale bias (generous vs harsh raters).

**8. How is the assistant "grounded"?**
It extracts genres/entities, queries the real catalog and only returns validated titles, so it can't invent movies.

**9. How would you scale it to millions of users?**
Approximate nearest neighbours (FAISS/ScaNN) for retrieval, a two-tower model, precomputed embeddings, feature store, batch + online serving, caching, and distributed training (ALS on Spark).

**10. What biases or risks exist?**
Popularity bias, filter bubbles, and low catalog coverage (under 3% here). MMR helps diversity but doesn't fix coverage.

**11. How did you evaluate, and what are the weaknesses?**
Held-out split with Precision/Recall/F1@10, RMSE/MAE and coverage. Weaknesses: small dataset, single split, no confidence intervals, no online test.

**12. What would you improve next?**
Multiple-split evaluation with ablations, implicit feedback, a two-tower retrieval model, A/B testing, and streaming updates.
