#!/usr/bin/env python3
"""
MeTTa Query Interface
This script serves as an interface between the Node.js service and the MeTTa agent.
It accepts a query as a command-line argument and returns the response as JSON.
"""

import sys
import json
import os
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Add the project root to the Python path to import metta modules
sys.path.append(os.path.join(os.path.dirname(__file__), '..'))

from metta.legal_rag import LegalRAG
from metta.knowledge import initialize_legal_knowledge
from metta.utils import LLM, process_query
from hyperon import MeTTa

def main():
    if len(sys.argv) < 2:
        print(json.dumps({"error": "Query is required"}))
        sys.exit(1)
    
    query = sys.argv[1]
    
    try:
        # Initialize the MeTTa components
        metta = MeTTa()
        initialize_legal_knowledge(metta)
        rag = LegalRAG(metta)
        
        # Get ASI API key from environment
        asi_api_key = os.getenv("ASI_ONE_API_KEY")
        if not asi_api_key:
            print(json.dumps({"error": "ASI_ONE_API_KEY not set in environment"}))
            sys.exit(1)
        
        llm = LLM(api_key=asi_api_key)
        
        # Process the query
        response = process_query(query, rag, llm)
        
        # Output the result as JSON
        print(json.dumps(response))
        
    except Exception as e:
        print(json.dumps({"error": f"Error processing query: {str(e)}"}))
        sys.exit(1)

if __name__ == "__main__":
    main()