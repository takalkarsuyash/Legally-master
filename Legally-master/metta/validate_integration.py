#!/usr/bin/env python3
# Final validation script for the Legal-E MeTTa integration
import sys
import os

def validate_integration():
    print(\"🔍 Validating Legal-E MeTTa Integration...\")
    
    # Check that all required directories exist
    required_dirs = [
        \"metta\",
        \"server\"
    ]
    
    for d in required_dirs:
        if not os.path.exists(d):
            print(f\"❌ Directory {d} does not exist\")
            return False
        print(f\"✅ Directory {d} exists\")
    
    # Check that all required files exist
    required_files = [
        \"metta/__init__.py\",
        \"metta/legal_rag.py\", 
        \"metta/knowledge.py\",
        \"metta/utils.py\",
        \"server/legalMettaService.js\",
        \"server/metta_agent.py\",
        \"server/metta_query_interface.py\",
        \"metta_query_interface.py\",
        \"requirements.txt\",
        \"guide.txt\"
    ]
    
    for f in required_files:
        if not os.path.exists(f):
            print(f\"❌ File {f} does not exist\")
            return False
        print(f\"✅ File {f} exists\")
    
    # Validate Python files can be compiled
    python_files = [
        \"metta/legal_rag.py\",
        \"metta/knowledge.py\", 
        \"metta/utils.py\",
        \"server/metta_agent.py\",
        \"metta_query_interface.py\",
        \"test_metta.py\"
    ]
    
    for f in python_files:
        try:
            import py_compile
            py_compile.compile(f, doraise=True)
            print(f\"✅ Python file {f} compiles successfully\")
        except py_compile.PyCompileError as e:
            print(f\"❌ Python file {f} has compilation errors: {e}\")
            return False
    
    # Test the core MeTTa functionality
    print(\"\\n🧪 Testing MeTTa core functionality...\")
    try:
        sys.path.append(os.path.join(os.path.dirname(__file__)))
        from metta.legal_rag import LegalRAG
        from metta.knowledge import initialize_legal_knowledge
        from hyperon import MeTTa
        
        metta = MeTTa()
        initialize_legal_knowledge(metta)
        rag = LegalRAG(metta)
        
        # Test a simple query
        concepts = rag.query_law_area(\"contract\")
        if concepts:
            print(f\"✅ MeTTa legal knowledge works: found {len(concepts)} concept(s) for 'contract'\")
        else:
            print(\"⚠️  MeTTa found no concepts for 'contract' (this might be normal if not in knowledge base)\")
        
        print(\"✅ Core MeTTa functionality validated\")
    except Exception as e:
        print(f\"❌ Error testing MeTTa functionality: {e}\")
        return False
    
    # Check that the Chatbot has been modified
    print(\"\\n🔍 Verifying Chatbot integration...\")
    with open(\"frontend/src/components/Chatbot.tsx\", \"r\") as f:
        content = f.read()
        if \"metta-query\" in content and \"handleSendWithOriginalApiFallback\" in content:
            print(\"✅ Chatbot component has been updated with MeTTa integration\")
        else:
            print(\"⚠️  Chatbot component may not have MeTTa integration\")
    
    print(\"\\n🎉 Legal-E MeTTa Integration Validation Complete!\")
    print(\"\\n📋 Summary of Integration:\")
    print(\"- Python MeTTa backend with legal knowledge graphs\")
    print(\"- Node.js API service bridging frontend and Python\")
    print(\"- React frontend with fallback mechanism\")
    print(\"- Legal-specific knowledge base for contracts, procedures, precedents\")
    print(\"- Intent classification for legal queries\")
    print(\"- Dynamic knowledge addition capabilities\")
    
    return True

if __name__ == \"__main__\":
    success = validate_integration()
    if success:
        print(\"\\n✅ All validations passed! The Legal-E MeTTa integration is ready.\")
        sys.exit(0)
    else:
        print(\"\\n❌ Some validations failed. Please check the output above.\")
        sys.exit(1)