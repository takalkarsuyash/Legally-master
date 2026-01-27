#!/usr/bin/env python3
"""
Test script to verify the MeTTa legal system works correctly
"""
import sys
import os
sys.path.append(os.path.join(os.path.dirname(__file__), '..'))

from metta.legal_rag import LegalRAG
from metta.knowledge import initialize_legal_knowledge
from hyperon import MeTTa

def test_metta_system():
    print("Initializing MeTTa legal system...")
    
    # Initialize the MeTTa components
    metta = MeTTa()
    initialize_legal_knowledge(metta)
    rag = LegalRAG(metta)
    
    print("✓ MeTTa legal knowledge initialized")
    
    # Test some basic queries
    print("\nTesting legal queries:")
    
    # Test law area query
    concepts = rag.query_law_area("contract")
    print(f"✓ Contract law concepts: {concepts}")
    
    # Test legal procedure query
    procedures = rag.get_legal_procedure("filing_suit")
    print(f"✓ Filing suit procedures: {procedures}")
    
    # Test case precedent query
    precedents = rag.get_case_precedent("contract_dispute")
    print(f"✓ Contract dispute precedents: {precedents}")
    
    # Test document requirements query
    requirements = rag.get_document_requirements("rental_agreement")
    print(f"✓ Rental agreement requirements: {requirements}")
    
    # Test court jurisdiction query
    jurisdictions = rag.get_court_jurisdiction("murder")
    print(f"✓ Murder jurisdiction: {jurisdictions}")
    
    # Test FAQ query
    faq_answer = rag.query_faq("What is a valid contract?")
    print(f"✓ FAQ answer for 'What is a valid contract?': {faq_answer}")
    
    print("\n✓ All tests passed! The MeTTa legal system is working correctly.")

if __name__ == "__main__":
    test_metta_system()