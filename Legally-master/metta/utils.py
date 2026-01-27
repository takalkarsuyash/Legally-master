import json
from openai import OpenAI
from .legal_rag import LegalRAG

class LLM:
    def __init__(self, api_key):
        self.client = OpenAI(
            api_key=api_key,
            base_url="https://api.asi1.ai/v1"
        )

    def create_completion(self, prompt, max_tokens=300):
        completion = self.client.chat.completions.create(
            messages=[{"role": "user", "content": prompt}],
            model="asi1-mini",
            max_tokens=max_tokens,
            temperature=0.7
        )
        return completion.choices[0].message.content

def get_intent_and_keyword(query, llm):
    """Use ASI:One API to classify legal intent and extract a keyword."""
    prompt = (
        f"Given the legal query: '{query}'\n"
        "Classify the intent as one of: 'law_area', 'legal_procedure', 'case_precedent', 'document_requirements', 'court_jurisdiction', 'impact_factors', 'penalty_range', 'faq', or 'unknown'.\n"
        "Extract the most relevant keyword (e.g., contract, criminal, family, property, divorce, theft) from the query.\n"
        "Return *only* the result in JSON format like this, with no additional text:\n"
        "{\n"
        '  "intent": "<classified_intent>",\n'
        '  "keyword": "<extracted_keyword>"\n'
        "}"
    )
    response = llm.create_completion(prompt)
    try:
        result = json.loads(response)
        return result["intent"], result["keyword"]
    except json.JSONDecodeError:
        print(f"Error parsing ASI:One response: {response}")
        return "unknown", None

def generate_knowledge_response(query, intent, keyword, llm):
    """Use ASI:One to generate a response for new knowledge based on intent."""
    if intent == "law_area":
        prompt = (
            f"Query: '{query}'\n"
            "The law area '{keyword}' is not in my knowledge base. Suggest relevant legal concepts for this area.\n"
            "Return *only* the legal concepts, no additional text."
        )
    elif intent == "legal_procedure":
        prompt = (
            f"Query: '{query}'\n"
            "The legal procedure '{keyword}' has no specific steps in my knowledge base. Provide general legal procedure guidance.\n"
            "Return *only* the procedure steps, no additional text."
        )
    elif intent == "case_precedent":
        prompt = (
            f"Query: '{query}'\n"
            "The case type '{keyword}' has no precedent information in my knowledge base. Suggest relevant legal precedents.\n"
            "Return *only* the precedent information, no additional text."
        )
    elif intent == "document_requirements":
        prompt = (
            f"Query: '{query}'\n"
            "The document type '{keyword}' has no requirement data in my knowledge base. Suggest required documents.\n"
            "Return *only* the document requirements, no additional text."
        )
    elif intent == "court_jurisdiction":
        prompt = (
            f"Query: '{query}'\n"
            "The case type '{keyword}' has no jurisdiction information in my knowledge base. Suggest appropriate court jurisdiction.\n"
            "Return *only* the jurisdiction information, no additional text."
        )
    elif intent == "faq":
        prompt = (
            f"Query: '{query}'\n"
            "This is a new legal question not in my knowledge base. Provide a helpful, concise answer with proper legal disclaimers.\n"
            "Return *only* the answer, no additional text."
        )
    else:
        return None
    return llm.create_completion(prompt)

def process_query(query, rag: LegalRAG, llm: LLM):
    intent, keyword = get_intent_and_keyword(query, llm)
    print(f"Intent: {intent}, Keyword: {keyword}")
    prompt = ""

    if intent == "faq":
        faq_answer = rag.query_faq(query)
        if not faq_answer and keyword:
            new_answer = generate_knowledge_response(query, intent, keyword, llm)
            rag.add_knowledge("faq", query, new_answer)
            print(f"Knowledge graph updated - Added FAQ: '{query}' → '{new_answer}'")
            prompt = (
                f"Query: '{query}'\n"
                f"Legal Answer: '{new_answer}'\n"
                "Provide this as professional legal guidance with appropriate disclaimers."
            )
        elif faq_answer:
            prompt = (
                f"Query: '{query}'\n"
                f"Legal Answer: '{faq_answer}'\n"
                "Provide this as professional legal guidance with appropriate disclaimers."
            )
    elif intent == "law_area" and keyword:
        concepts = rag.query_law_area(keyword)
        if not concepts:
            legal_concepts = generate_knowledge_response(query, intent, keyword, llm)
            rag.add_knowledge("law_area", keyword, legal_concepts)
            print(f"Knowledge graph updated - Added law area: '{keyword}' → '{legal_concepts}'")
            prompt = (
                f"Query: '{query}'\n"
                f"Legal Area: {keyword}\n"
                f"Key Concepts: {legal_concepts}\n"
                "Provide professional legal guidance with appropriate disclaimers."
            )
        else:
            concept = concepts[0]
            procedures = rag.get_legal_procedure(concept) or ["consult a legal professional"]
            precedents = [rag.get_case_precedent(c) for c in concepts] if concepts else []
            prompt = (
                f"Query: '{query}'\n"
                f"Legal Area: {keyword}\n"
                f"Key Concept: {concept}\n"
                f"Procedures: {', '.join(procedures)}\n"
                f"Precedents: {', '.join([', '.join(p) for p in precedents if p])}\n"
                "Provide professional legal guidance with appropriate disclaimers."
            )
    elif intent == "legal_procedure" and keyword:
        procedures = rag.get_legal_procedure(keyword)
        if not procedures:
            procedure_steps = generate_knowledge_response(query, intent, keyword, llm)
            rag.add_knowledge("legal_procedure", keyword, procedure_steps)
            print(f"Knowledge graph updated - Added procedure: '{keyword}' → '{procedure_steps}'")
            prompt = (
                f"Query: '{query}'\n"
                f"Legal Procedure: {keyword}\n"
                f"Steps: {procedure_steps}\n"
                "Provide professional legal procedure guidance with appropriate disclaimers."
            )
        else:
            prompt = (
                f"Query: '{query}'\n"
                f"Legal Procedure: {keyword}\n"
                f"Steps: {', '.join(procedures)}\n"
                "Provide professional legal procedure guidance with appropriate disclaimers."
            )
    elif intent == "case_precedent" and keyword:
        precedents = rag.get_case_precedent(keyword)
        if not precedents:
            precedent_info = generate_knowledge_response(query, intent, keyword, llm)
            rag.add_knowledge("case_precedent", keyword, precedent_info)
            print(f"Knowledge graph updated - Added precedent: '{keyword}' → '{precedent_info}'")
            prompt = (
                f"Query: '{query}'\n"
                f"Case Type: {keyword}\n"
                f"Precedents: {precedent_info}\n"
                "Provide professional legal precedent guidance with appropriate disclaimers."
            )
        else:
            prompt = (
                f"Query: '{query}'\n"
                f"Case Type: {keyword}\n"
                f"Precedents: {', '.join(precedents)}\n"
                "Provide professional legal precedent guidance with appropriate disclaimers."
            )
    elif intent == "document_requirements" and keyword:
        requirements = rag.get_document_requirements(keyword)
        if not requirements:
            doc_requirements = generate_knowledge_response(query, intent, keyword, llm)
            rag.add_knowledge("document_requirements", keyword, doc_requirements)
            print(f"Knowledge graph updated - Added requirements: '{keyword}' → '{doc_requirements}'")
            prompt = (
                f"Query: '{query}'\n"
                f"Document Type: {keyword}\n"
                f"Requirements: {doc_requirements}\n"
                "Provide professional document requirements guidance with appropriate disclaimers."
            )
        else:
            prompt = (
                f"Query: '{query}'\n"
                f"Document Type: {keyword}\n"
                f"Requirements: {', '.join(requirements)}\n"
                "Provide professional document requirements guidance with appropriate disclaimers."
            )
    elif intent == "court_jurisdiction" and keyword:
        jurisdictions = rag.get_court_jurisdiction(keyword)
        if not jurisdictions:
            court_info = generate_knowledge_response(query, intent, keyword, llm)
            rag.add_knowledge("court_jurisdiction", keyword, court_info)
            print(f"Knowledge graph updated - Added jurisdiction: '{keyword}' → '{court_info}'")
            prompt = (
                f"Query: '{query}'\n"
                f"Case Type: {keyword}\n"
                f"Jurisdiction: {court_info}\n"
                "Provide professional court jurisdiction guidance with appropriate disclaimers."
            )
        else:
            prompt = (
                f"Query: '{query}'\n"
                f"Case Type: {keyword}\n"
                f"Jurisdiction: {', '.join(jurisdictions)}\n"
                "Provide professional court jurisdiction guidance with appropriate disclaimers."
            )
    
    if not prompt:
        prompt = f"Query: '{query}'\nNo specific legal info found. Provide general legal assistance with appropriate disclaimers."

    prompt += "\nFormat response as: 'Selected Question: <question>' on first line, 'Humanized Answer: <complete detailed response>' on second. Provide a complete, detailed answer."
    
    print(f"Final prompt being sent to ASI: {repr(prompt)}")
    response = llm.create_completion(prompt)
    print(f"Raw ASI response: {response}")
    
    try:
        lines = response.split('\n')
        if len(lines) >= 2:
            selected_q = lines[0].replace("Selected Question: ", "").strip()
            answer = lines[1].replace("Humanized Answer: ", "").strip()
            
            # Check if answer is incomplete (short or ends with colon)
            if len(answer) < 100 or answer.endswith(':'):
                print(f"Answer seems incomplete: {answer}")
                # Use the knowledge we found directly from the prompt
                if 'Steps:' in prompt:
                    # Extract the steps from the prompt
                    steps_start = prompt.find('Steps:')
                    if steps_start != -1:
                        # Get everything after "Steps:" until the next section or end
                        steps_section = prompt[steps_start:]
                        # Remove "Steps:" and get the full content
                        steps = steps_section.replace('Steps: ', '').strip()
                        # Clean up any trailing content after the steps
                        if '\n\n' in steps:
                            steps = steps.split('\n\n')[0]
                        answer = f"Here are the key steps to follow:\n\n{steps}"
                        print(f"Using steps from prompt: {answer}")
                elif 'Legal Answer:' in prompt:
                    # Use the FAQ answer directly
                    faq_start = prompt.find('Legal Answer:')
                    if faq_start != -1:
                        faq_section = prompt[faq_start:].split('\n')[0]
                        faq_answer = faq_section.replace('Legal Answer: ', '').strip()
                        answer = faq_answer
                        print(f"Using FAQ from prompt: {answer}")
            
            return {"selected_question": selected_q, "humanized_answer": answer}
        else:
            print("Response format unexpected, using raw response")
            return {"selected_question": query, "humanized_answer": response}
    except IndexError:
        print("Index error, using raw response")
        return {"selected_question": query, "humanized_answer": response}