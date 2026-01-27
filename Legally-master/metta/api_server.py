#!/usr/bin/env python3
"""
Simple Flask API server for MeTTa legal queries
"""
from flask import Flask, request, jsonify
from flask_cors import CORS
import os
import sys

# Add the project root to the Python path
sys.path.append(os.path.join(os.path.dirname(__file__), '..'))

from metta.legal_rag import LegalRAG
from metta.knowledge import initialize_legal_knowledge
from metta.utils import LLM, process_query
from hyperon import MeTTa

app = Flask(__name__)
CORS(app)

# Initialize MeTTa components globally
print("Initializing MeTTa legal system...")
metta = MeTTa()
initialize_legal_knowledge(metta)
rag = LegalRAG(metta)

# Get ASI API key from environment
asi_api_key = os.getenv("ASI_ONE_API_KEY")
if not asi_api_key:
    print("Warning: ASI_ONE_API_KEY not set in environment")
    llm = None
else:
    llm = LLM(api_key=asi_api_key)
    print("✓ MeTTa legal system initialized successfully")

@app.route('/api/metta-query', methods=['POST'])
def metta_query():
    try:
        data = request.get_json()
        if not data or 'query' not in data:
            return jsonify({"error": "Query is required"}), 400
        
        query = data['query']
        print(f"Received query: {query}")
        
        if not llm:
            return jsonify({"error": "ASI API key not configured"}), 500
        
        # Process the query
        print("Processing query...")
        response = process_query(query, rag, llm)
        
        print(f"Response: {response}")
        return jsonify(response)
        
    except Exception as e:
        print(f"Error processing query: {e}")
        import traceback
        traceback.print_exc()
        return jsonify({"error": f"Error processing query: {str(e)}"}), 500

@app.route('/health', methods=['GET'])
def health():
    return jsonify({"status": "healthy", "metta_initialized": rag is not None})

if __name__ == '__main__':
    print("Starting MeTTa API server on http://localhost:5001")
    app.run(host='0.0.0.0', port=5001, debug=True)
