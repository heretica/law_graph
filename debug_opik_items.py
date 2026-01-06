#!/usr/bin/env python3
"""Debug OPIK experiment items to understand their structure."""

import json
import os
import opik

# Configure OPIK
OPIK_API_KEY = os.getenv("OPIK_API_KEY", "PoW5aZXyT2CsSIEoSvBBN4eTU")
opik.configure(api_key=OPIK_API_KEY)
client = opik.Opik()

# Get Dust experiment
experiments = client.get_dataset_experiments(
    dataset_name="civic-law-eval",
    max_results=100
)

dust_exp = None
for exp in experiments:
    if "Dust" in exp.name and "20260106_160751" in exp.name:
        dust_exp = exp
        break

if dust_exp:
    print(f"Found experiment: {dust_exp.name}")
    print(f"ID: {dust_exp.id}")
    print()

    # Get first item
    items = dust_exp.get_items()
    print(f"Total items: {len(items)}")
    print()

    if items:
        item = items[0]
        print("=" * 70)
        print("FIRST ITEM STRUCTURE:")
        print("=" * 70)
        print()

        print("Available attributes:")
        for attr in dir(item):
            if not attr.startswith('_'):
                print(f"  - {attr}")
        print()

        print("=" * 70)
        print("ATTRIBUTE VALUES:")
        print("=" * 70)

        for attr in ['id', 'trace_id', 'input', 'output', 'expected_output',
                     'feedback_scores', 'created_at']:
            if hasattr(item, attr):
                value = getattr(item, attr)
                print(f"\n{attr}:")
                print(f"  Type: {type(value)}")
                if isinstance(value, (dict, list)):
                    print(f"  Value:\n{json.dumps(value, indent=4, default=str)}")
                else:
                    print(f"  Value: {value}")
