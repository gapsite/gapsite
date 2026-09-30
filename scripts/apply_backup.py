import json
import os

# We will read the existing storage and update it with the new entities provided by the user
data_file = 'data/crm_persistent_storage.json'

with open(data_file, 'r', encoding='utf-8') as f:
    existing = json.load(f)

print('Existing keys:', list(existing.keys()))
