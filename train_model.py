# Generates synthetic training data and trains one logistic regression model
# per MBTI axis. Data is synthetic - see README for why.

import json
import random
import numpy as np
from sklearn.linear_model import LogisticRegression

from questions import QUESTIONS, AXES

random.seed(42)
np.random.seed(42)

N_PROFILES = 4000
NOISE_STD = 1.1

axes_list = ["EI", "SN", "TF", "JP"]
questions_by_axis = {axis: [q for q in QUESTIONS if q["axis"] == axis] for axis in axes_list}


def generate_dataset():
    rows = []
    labels = {axis: [] for axis in axes_list}

    for _ in range(N_PROFILES):
        true_strength = {axis: np.random.normal(0, 1.5) for axis in axes_list}

        answers = {}
        for axis in axes_list:
            for q in questions_by_axis[axis]:
                signal = true_strength[axis] * q["direction"]
                noisy = signal + np.random.normal(0, NOISE_STD)
                answer = int(np.clip(round(noisy), -3, 3))
                answers[q["id"]] = answer

        rows.append(answers)
        for axis in axes_list:
            labels[axis].append(1 if true_strength[axis] > 0 else 0)

    return rows, labels


def main():
    rows, labels = generate_dataset()

    models = {}
    accuracies = {}

    for axis in axes_list:
        q_ids = [q["id"] for q in questions_by_axis[axis]]
        X = np.array([[row[qid] for qid in q_ids] for row in rows])
        y = np.array(labels[axis])

        clf = LogisticRegression()
        clf.fit(X, y)
        acc = clf.score(X, y)
        accuracies[axis] = round(acc, 4)

        models[axis] = {
            "question_ids": q_ids,
            "coefficients": clf.coef_[0].tolist(),
            "intercept": float(clf.intercept_[0]),
            "positive_letter": AXES[axis][0],
            "negative_letter": AXES[axis][1],
        }

    print("Training accuracy per axis (on synthetic data):")
    for axis, acc in accuracies.items():
        print(f"  {axis}: {acc}")

    with open("model_weights.json", "w") as f:
        json.dump(models, f, indent=2)

    print("\nSaved model_weights.json")


if __name__ == "__main__":
    main()
