# Evaluation Notes

## Protocol
- Held-out test split of real user ratings; Top-10 recommendations per user.
- Ranking metrics: Precision@10, Recall@10, F1@10, catalog coverage.
- Rating metrics: RMSE, MAE (SVD and NeuMF only).
- Latency measured per request (vectorized inference).

## Results (from the project README)
| Model | P@10 | R@10 | F1@10 | RMSE | MAE | Coverage |
|---|---|---|---|---|---|---|
| Hybrid | 0.4150 | 0.0572 | 0.0973 | - | - | 2.27% |
| Item CF | 0.4050 | 0.0559 | 0.0949 | - | - | 2.94% |
| Content (TF-IDF) | 0.0550 | 0.0077 | 0.0129 | - | - | 1.60% |
| NeuMF | n/a | n/a | n/a | 0.8422 | 0.6383 | 2.60% |
| SVD | n/a | n/a | n/a | 0.8755 | 0.6610 | 0.46% |

## Why SVD / NeuMF have no Precision@10
They are regressors: they minimise rating error, not ranking error. Their predicted ratings are
used as signals inside the hybrid, which is why the hybrid's ranking improves.

## Honest caveats (say these in interviews, it builds trust)
- Small public dataset; results may not transfer to a real platform.
- Coverage is low (under 3%), so the system favours a narrow set of popular titles.
- Hybrid P@10 (0.4150) is only slightly above Item CF (0.4050); report the gap honestly and
  consider confidence intervals or multiple random splits.
- No online A/B test.

## To reproduce / strengthen
1. Fix random seeds and save the split.
2. Run 5 different splits and report mean ± std.
3. Add an ablation: hybrid minus each component.
4. Add popularity-baseline (top-N most popular) as a sanity check.
5. Save results to `docs/results.json` and plot a bar chart for the README.
