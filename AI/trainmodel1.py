import numpy as np
from sklearn.metrics import classification_report

# ... after logreg.fit(X_train_resampled, y_train_resampled) ...

# 1. Get the probabilities instead of just the labels
# This returns a matrix: [[prob_High, prob_Low, prob_Normal], ...]
y_proba = logreg.predict_proba(X_test)

# 2. Find out which column corresponds to "High"
# logreg.classes_ is usually sorted alphabetically: ['High', 'Low', 'Normal']
high_index = list(logreg.classes_).index("High")
print(f"The 'High' category is at index: {high_index}")

# 3. Define a Custom Predict Function
def custom_predict(probabilities, threshold):
    final_preds = []
    for probs in probabilities:
        # If the probability of "High" is greater than our custom threshold...
        if probs[high_index] > threshold:
            final_preds.append("High")
        else:
            # Otherwise, pick the winner between Low and Normal
            # We temporarily set "High" prob to -1 so it doesn't win
            probs_copy = probs.copy()
            probs_copy[high_index] = -1
            max_index = np.argmax(probs_copy)
            final_preds.append(logreg.classes_[max_index])
    return final_preds

# 4. Run a loop to find the best threshold
thresholds = [0.5, 0.4, 0.3, 0.2]

print(f"\n{'='*40}")
print("OPTIMIZING FOR RECALL (CATCHING CRITICAL BUGS)")
print(f"{'='*40}")

for t in thresholds:
    print(f"\n--- Testing Threshold: {t} ---")
    y_pred_custom = custom_predict(y_proba, t)
    
    # We only care about the 'High' row here
    report = classification_report(y_test, y_pred_custom, output_dict=True)
    high_stats = report['High']
    
    print(f"Recall (High):    {high_stats['recall']:.2f}")
    print(f"Precision (High): {high_stats['precision']:.2f}")
    print(f"Accuracy:         {report['accuracy']:.2f}")