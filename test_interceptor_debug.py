#!/usr/bin/env python3
"""
Test script to debug the GraphRAG interceptor entity count capture
"""

import logging
import re
import sys

# Set up logging to see what's happening
logging.basicConfig(level=logging.DEBUG)
logger = logging.getLogger(__name__)

def test_regex_pattern():
    """Test the regex pattern against the expected nano-graphrag message"""

    # The exact message format from nano-graphrag (with typo "entites")
    test_messages = [
        "Using 20 entites, 5 communities, 75 relations, 3 text units",
        "Using 10 entites, 3 communities, 25 relations, 2 text units",
        "Using 0 entites, 0 communities, 0 relations, 0 text units",
    ]

    # Current pattern from the interceptor
    pattern = r'Using (\d+) entites, (\d+) communities, (\d+) relations, (\d+) text units'

    print("🧪 Testing regex pattern:")
    print(f"Pattern: {pattern}")
    print()

    for i, message in enumerate(test_messages):
        print(f"Test {i+1}: {message}")
        match = re.search(pattern, message)
        if match:
            entities = int(match.group(1))
            communities = int(match.group(2))
            relations = int(match.group(3))
            text_units = int(match.group(4))
            print(f"✅ Match found: {entities} entities, {communities} communities, {relations} relations, {text_units} text units")
        else:
            print("❌ No match found")
        print()

def test_logging_handler():
    """Test if the logging handler can capture nano-graphrag messages"""

    print("🧪 Testing logging handler:")

    # Create a mock nano-graphrag logger
    nano_logger = logging.getLogger('nano-graphrag')
    nano_logger.setLevel(logging.INFO)

    # Variables to capture the data
    captured_entities_count = 0

    # Create the same handler as in the interceptor
    class EntityCountHandler(logging.Handler):
        def __init__(self):
            super().__init__()
            self.captured_entities_count = 0
            self.captured_communities_count = 0
            self.captured_relations_count = 0
            self.captured_text_units_count = 0
            self.messages_processed = 0

        def emit(self, record):
            message = record.getMessage()
            self.messages_processed += 1
            print(f"📝 Handler received message {self.messages_processed}: {message}")

            # Check if this is the message we're looking for
            if "Using" in message and "entites" in message:
                print(f"🎯 Found target message: {message}")
                try:
                    # Parse the message
                    import re
                    pattern = r'Using (\d+) entites, (\d+) communities, (\d+) relations, (\d+) text units'
                    match = re.search(pattern, message)
                    if match:
                        self.captured_entities_count = int(match.group(1))
                        self.captured_communities_count = int(match.group(2))
                        self.captured_relations_count = int(match.group(3))
                        self.captured_text_units_count = int(match.group(4))

                        print(f"✅ Successfully parsed counts:")
                        print(f"   - Entities: {self.captured_entities_count}")
                        print(f"   - Communities: {self.captured_communities_count}")
                        print(f"   - Relations: {self.captured_relations_count}")
                        print(f"   - Text units: {self.captured_text_units_count}")
                    else:
                        print(f"❌ Could not parse message: {message}")
                except Exception as e:
                    print(f"❌ Error parsing message: {e}")
            else:
                print(f"⏭️  Message doesn't match criteria")

    # Create and add the handler
    entity_handler = EntityCountHandler()
    nano_logger.addHandler(entity_handler)

    # Test sending messages
    test_messages = [
        "This is a normal log message",
        "Using 20 entites, 5 communities, 75 relations, 3 text units",
        "Another message",
        "Using 10 entites, 3 communities, 25 relations, 2 text units"
    ]

    print("\n📤 Sending test messages to nano-graphrag logger:")
    for i, msg in enumerate(test_messages):
        print(f"\nSending message {i+1}: {msg}")
        nano_logger.info(msg)

    print(f"\n📊 Final results:")
    print(f"Messages processed by handler: {entity_handler.messages_processed}")
    print(f"Final captured entity count: {entity_handler.captured_entities_count}")

    # Clean up
    nano_logger.removeHandler(entity_handler)

if __name__ == "__main__":
    print("🔍 GraphRAG Interceptor Debug Test")
    print("=" * 50)

    test_regex_pattern()
    print("\n" + "=" * 50)
    test_logging_handler()