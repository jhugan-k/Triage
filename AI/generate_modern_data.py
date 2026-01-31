import pandas as pd
import random

def generate_data():
    # Large pool of varied templates to prevent overfitting
    templates = {
        "High": [
            "Critical {issue} in {component} preventing {action}.",
            "Security alert: {issue} detected. Potential {impact}.",
            "System is {impact} because of {issue}.",
            "Emergency: {issue} is causing {impact} for all users.",
            "Immediate attention required: {component} {ui_issue}."
        ],
        "Normal": [
            "Functional bug: {action} in {component} is {ui_issue}.",
            "The {ui_element} is {ui_issue} when {action}.",
            "Interface error: {ui_element} overlaps with {ui_element}.",
            "Standard issue: {action} doesn't work as expected in {component}.",
            "Logic error in {component} while {action}."
        ],
        "Low": [
            "Cosmetic: Typo in {component} - '{word1}' should be '{word2}'.",
            "Styling: {ui_element} padding is slightly {ui_issue}.",
            "Request: Could we update the {ui_element} to be more {impact}?",
            "Minor {ui_element} misalignment in the {component} view.",
            "Text correction: Found '{word1}' instead of '{word2}' in the footer."
        ]
    }

    keywords = {
        "issue": ["SQL injection", "Memory leak", "Database timeout", "500 Error", "Auth bypass", "Deadlock"],
        "component": ["Payment Module", "Auth Service", "Prisma Layer", "React Store", "API Gateway", "S3 Bucket"],
        "impact": ["completely unresponsive", "leaking credentials", "crashing production", "dropping connections"],
        "action": ["verifying JWT", "processing checkout", "fetching user data", "syncing logs", "uploading files"],
        "ui_element": ["Submit button", "Navbar", "Footer", "Avatar upload", "Dashboard card"],
        "ui_issue": ["failing", "broken", "off-center", "unresponsive", "missing", "lagging"],
        "word1": ["Recieve", "Proccess", "Comit", "Loggin"],
        "word2": ["Receive", "Process", "Commit", "Login"]
    }

    generated = []
    for severity, list_of_templates in templates.items():
        for _ in range(500): # 500 samples per class = 1500 total
            template = random.choice(list_of_templates)
            entry = template.format(**{k: random.choice(v) for k, v in keywords.items()})
            generated.append({"text": entry, "severity": severity})

    df = pd.DataFrame(generated)
    df.to_csv("RawData/ModernBugs.csv", index=False)
    print("Generated 1500 high-variety samples.")

if __name__ == "__main__":
    generate_data()