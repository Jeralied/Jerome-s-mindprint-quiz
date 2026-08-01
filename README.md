# Jerome's MindPrint — ML Personality Quiz

A 32-question personality quiz that predicts a 4-letter MBTI type using logistic regression, not a simple points table.

**Live site:** https://jeralied.github.io/Jerome-s-mindprint-quiz/

## The problem

Most online personality quizzes just add up agree/disagree answers. This one treats each personality axis as a real classification problem and trains a separate logistic regression model per axis.

## How it works

Answer 32 questions on a 7-point scale. Four trained models (one per axis: E/I, S/N, T/F, J/P) each take your answers and output a probability and a predicted letter. The four letters combine into a type, and the result screen shows a spectrum bar with a percentage per axis rather than a flat binary, since personality traits aren't really either/or.

Once you get a result, you can download it as an image or share it straight to WhatsApp, X, or copy a link.

## A note on the framework and the data

MBTI is popular but has real criticism behind it. Studies have found people often get a different result if they retake the test a few weeks later, and it hasn't been shown to reliably predict things like job performance. This project uses it because it's a widely known, engaging framework to build around, not because it's a validated clinical tool. Take your result as a fun estimate, not a label.

The training data is also synthetic, not real survey responses. My coding environment doesn't have internet access, so I generated 4,000 simulated respondents instead: each with a random underlying trait strength per axis, and answers simulated from that strength plus noise (see `train_model.py`). A well-known public MBTI dataset on Kaggle does the same thing and says so in its own description, so this isn't an unusual shortcut, but it's worth being upfront about it.

## Under the hood

1. `questions.py` — 32 questions, 8 per axis, each tagged with which letter agreeing points toward
2. `train_model.py` — generates the synthetic dataset and trains one logistic regression model per axis with scikit-learn
3. Weights get exported to `model_weights.json` / `weights.js`
4. The frontend runs the model entirely in the browser, no backend, using the exported weights and a plain sigmoid calculation
5. Result cards can be downloaded as a PNG (via html2canvas) or shared directly through the Web Share API, with fallback links for WhatsApp and X

Training accuracy per axis on the synthetic data: EI 91.2%, SN 92.3%, TF 91.1%, JP 92.0%. Not 100%, since the data generation includes realistic noise on purpose.

## Tech stack

- Python + scikit-learn for training
- HTML/CSS/JS for the frontend, no framework, no backend
- html2canvas for the downloadable result card
- Hosted on GitHub Pages

## What I learned

- How to frame a quiz as an actual classification problem instead of point-scoring
- Generating synthetic training data and being honest about it
- Exporting a trained model so it runs client-side with no server needed
- Being upfront about a popular framework's real limitations instead of overselling it
- Capturing part of a page as a downloadable image without a backend

## Feedback

Add real testing notes here once a few people have tried it.

## What's next

- A Big Five (OCEAN) mode as a more research-backed alternative
- Swapping in real survey data if I find a suitable public dataset
- Comparing logistic regression against other classifiers
- Showing which answers influenced the result most

## Author

Built by Ali Jerome Edem Yao, GCTU student, Ghana
