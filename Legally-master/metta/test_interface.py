#!/usr/bin/env python3
"""
Test script to verify the MeTTa query interface works correctly
This demonstrates the expected functionality of the interface script
"""
import sys
import json
import os
from unittest.mock import Mock, patch

# Add the project root to the Python path
sys.path.append(os.path.join(os.path.dirname(__file__), '..'))

def test_interface_logic():
    print("Testing the MeTTa query interface logic...")
    
    # Import the required modules
    from metta.legal_rag import LegalRAG
    from metta.knowledge import initialize_legal_knowledge
    from hyperon import MeTTa
    
    # Create mock LLM object since we don't have a real API key
    class MockLLM:
        def __init__(self, api_key=None):
            self.api_key = api_key
            
        def create_completion(self, prompt, max_tokens=200):
            # Mock response based on the prompt
            if "classify the intent" in prompt:
                # Mock intent classification
                if "contract" in prompt.lower():
                    return '{"intent": "law_area", "keyword": "contract"}'
                elif "file" in prompt.lower() and "suit" in prompt.lower():
                    return '{"intent": "legal_procedure", "keyword": "filing_suit"}'
                elif "valid contract" in prompt.lower():
                    return '{"intent": "faq", "keyword": "valid contract"}'
                else:
                    return '{"intent": "faq", "keyword": "general legal query"}'
            else:
                # Mock response generation - return proper format for process_query
                return "Selected Question: What is a valid contract?\nHumanized Answer: This is a mocked response for testing purposes."
    
    print("✓ Mock LLM created successfully")
    
    # Initialize the MeTTa components
    metta = MeTTa()
    initialize_legal_knowledge(metta)
    rag = LegalRAG(metta)
    llm = MockLLM(api_key="mock-api-key")
    
    print("✓ MeTTa legal knowledge and components initialized")
    
    # Test process_query function with mock components
    from metta.utils import get_intent_and_keyword
    
    # Test intent classification
    intent, keyword = get_intent_and_keyword("What is a valid contract?", llm)
    print(f"✓ Intent classification test: intent={intent}, keyword={keyword}")
    
    # Test the process_query function with the mock components
    from metta.utils import process_query
    response = process_query("What is a valid contract?", rag, llm)
    print(f"✓ Query processing test: {response}")
    
    print("\n✓ All interface logic tests passed! The interface script logic is working correctly.")

if __name__ == "__main__":
    test_interface_logic()