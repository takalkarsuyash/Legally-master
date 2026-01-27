from hyperon import MeTTa, E, S, ValueAtom

class LegalRAG:
    def __init__(self, metta_instance: MeTTa):
        self.metta = metta_instance

    def query_law_area(self, law_area):
        """Find legal concepts and procedures in a specific area of law."""
        law_area = law_area.strip('"')
        query_str = f'!(match &self (law_area {law_area} $concept) $concept)'
        results = self.metta.run(query_str)
        print(results, query_str)

        unique_concepts = list(set(str(r[0]) for r in results if r and len(r) > 0)) if results else []
        return unique_concepts

    def get_legal_procedure(self, procedure_type):
        """Find procedures for a specific legal action."""
        procedure_type = procedure_type.strip('"')
        query_str = f'!(match &self (legal_procedure {procedure_type} $procedure) $procedure)'
        results = self.metta.run(query_str)
        print(results, query_str)
        return [r[0].get_object().value for r in results if r and len(r) > 0] if results else []

    def get_case_precedent(self, case_type):
        """Find case precedents for a specific case type."""
        case_type = case_type.strip('"')
        query_str = f'!(match &self (case_precedent {case_type} $precedent) $precedent)'
        results = self.metta.run(query_str)
        print(results, query_str)

        return [r[0].get_object().value for r in results if r and len(r) > 0] if results else []

    def get_document_requirements(self, document_type):
        """Get required documents for a specific legal process."""
        document_type = document_type.strip('"')
        query_str = f'!(match &self (document_requirements {document_type} $requirements) $requirements)'
        results = self.metta.run(query_str)
        print(results, query_str)

        return [r[0].get_object().value for r in results if r and len(r) > 0] if results else []

    def get_court_jurisdiction(self, case_type):
        """Find the appropriate court jurisdiction for a case type."""
        case_type = case_type.strip('"')
        query_str = f'!(match &self (court_jurisdiction {case_type} $jurisdiction) $jurisdiction)'
        results = self.metta.run(query_str)
        print(results, query_str)

        return [r[0].get_object().value for r in results if r and len(r) > 0] if results else []

    def get_impact_factors(self, law_area):
        """Get factors that impact cases in this area of law."""
        law_area = law_area.strip('"')
        query_str = f'!(match &self (impact_factors {law_area} $factors) $factors)'
        results = self.metta.run(query_str)
        print(results, query_str)

        return [r[0].get_object().value for r in results if r and len(r) > 0] if results else []

    def get_penalty_range(self, offense_type):
        """Get the range of possible penalties for an offense."""
        offense_type = offense_type.strip('"')
        query_str = f'!(match &self (penalty_range {offense_type} $penalty) $penalty)'
        results = self.metta.run(query_str)
        print(results, query_str)

        return [r[0].get_object().value for r in results if r and len(r) > 0] if results else []

    def query_faq(self, question):
        """Retrieve legal FAQ answers."""
        query_str = f'!(match &self (faq "{question}" $answer) $answer)'
        results = self.metta.run(query_str)
        print(results, query_str)

        return results[0][0].get_object().value if results and results[0] else None

    def add_knowledge(self, relation_type, subject, object_value):
        """Add new legal knowledge dynamically."""
        if isinstance(object_value, str):
            object_value = ValueAtom(object_value)
        self.metta.space().add_atom(E(S(relation_type), S(subject), object_value))
        return f"Added {relation_type}: {subject} → {object_value}"