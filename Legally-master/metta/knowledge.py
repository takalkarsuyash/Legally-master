from hyperon import MeTTa, E, S, ValueAtom

def initialize_legal_knowledge(metta: MeTTa):
    """Initialize the MeTTa knowledge graph with legal concepts, procedures, and case precedents."""
    
    # Law Area → Legal Concepts
    metta.space().add_atom(E(S("law_area"), S("contract"), S("offer_and_acceptance")))
    metta.space().add_atom(E(S("law_area"), S("contract"), S("consideration")))
    metta.space().add_atom(E(S("law_area"), S("contract"), S("capacity_to_contract")))
    metta.space().add_atom(E(S("law_area"), S("contract"), S("breach_of_contract")))
    metta.space().add_atom(E(S("law_area"), S("criminal"), S("actus_reus")))
    metta.space().add_atom(E(S("law_area"), S("criminal"), S("mens_rea")))
    metta.space().add_atom(E(S("law_area"), S("criminal"), S("defenses")))
    metta.space().add_atom(E(S("law_area"), S("family"), S("divorce_procedures")))
    metta.space().add_atom(E(S("law_area"), S("family"), S("child_custody")))
    metta.space().add_atom(E(S("law_area"), S("property"), S("real_estate_transfers")))
    metta.space().add_atom(E(S("law_area"), S("property"), S("landlord_tenant")))
    metta.space().add_atom(E(S("law_area"), S("property"), S("mortgages")))
    
    # Legal Procedure Types → Procedures
    metta.space().add_atom(E(S("legal_procedure"), S("filing_suit"), ValueAtom("submit plaint, pay court fees, get case number")))
    metta.space().add_atom(E(S("legal_procedure"), S("appeal"), ValueAtom("file notice of appeal, submit grounds, pay fee")))
    metta.space().add_atom(E(S("legal_procedure"), S("arbitration"), ValueAtom("initiate arbitration, appoint arbitrator, exchange documents")))
    metta.space().add_atom(E(S("legal_procedure"), S("mediation"), ValueAtom("request mediation, attend sessions, reach settlement")))
    metta.space().add_atom(E(S("legal_procedure"), S("bail_application"), ValueAtom("file bail application, provide surety, attend hearing")))
    metta.space().add_atom(E(S("legal_procedure"), S("probate"), ValueAtom("file probate petition, submit will, establish authenticity")))
    
    # Case Types → Precedents
    metta.space().add_atom(E(S("case_precedent"), S("contract_dispute"), ValueAtom("Hadley v. Baxendale - remoteness of damages")))
    metta.space().add_atom(E(S("case_precedent"), S("negligence"), ValueAtom("Donoghue v. Stevenson - duty of care principle")))
    metta.space().add_atom(E(S("case_precedent"), S("murder"), ValueAtom("R v. Woollin - indirect intention standard")))
    metta.space().add_atom(E(S("case_precedent"), S("theft"), ValueAtom("R v. Hinks - appropriation definition")))
    metta.space().add_atom(E(S("case_precedent"), S("divorce"), ValueAtom("Matrimonial Causes Act - irretrievable breakdown")))
    metta.space().add_atom(E(S("case_precedent"), S("landlord_tenant"), ValueAtom("Street v. Mountford - definition of lease")))
    
    # Document Types → Requirements
    metta.space().add_atom(E(S("document_requirements"), S("rental_agreement"), ValueAtom("property details, rent amount, terms, signatures, witnesses")))
    metta.space().add_atom(E(S("document_requirements"), S("power_of_attorney"), ValueAtom("principal identity, attorney powers, duration, registration")))
    metta.space().add_atom(E(S("document_requirements"), S("will"), ValueAtom("testator details, beneficiaries, executor, witnesses, signatures")))
    metta.space().add_atom(E(S("document_requirements"), S("partnership_deed"), ValueAtom("partner details, profit sharing, duration, dissolution terms")))
    metta.space().add_atom(E(S("document_requirements"), S("sale_deed"), ValueAtom("property description, consideration, title documents, registration")))
    metta.space().add_atom(E(S("document_requirements"), S("affidavit"), ValueAtom("deponent details, facts sworn, notarization, oath")))
    
    # Case Types → Appropriate Court Jurisdiction
    metta.space().add_atom(E(S("court_jurisdiction"), S("murder"), ValueAtom("Sessions Court or High Court depending on penalty")))
    metta.space().add_atom(E(S("court_jurisdiction"), S("civil_disputes"), ValueAtom("Civil Court, High Court for constitutional issues")))
    metta.space().add_atom(E(S("court_jurisdiction"), S("contract_disputes"), ValueAtom("Commercial Courts Act, arbitral tribunal if agreed")))
    metta.space().add_atom(E(S("court_jurisdiction"), S("divorce"), ValueAtom("Family Court, District Court")))
    metta.space().add_atom(E(S("court_jurisdiction"), S("tenancy"), ValueAtom("Rent Control Court, Civil Court")))
    metta.space().add_atom(E(S("court_jurisdiction"), S("land_acquisition"), ValueAtom("Revenue Court, Land Acquisition Officer")))
    
    # Law Areas → Impact Factors
    metta.space().add_atom(E(S("impact_factors"), S("contract"), ValueAtom("capacity, free consent, lawful object, consideration")))
    metta.space().add_atom(E(S("impact_factors"), S("criminal"), ValueAtom("actus reus, mens rea, defenses, jurisdiction, statute of limitations")))
    metta.space().add_atom(E(S("impact_factors"), S("family"), ValueAtom("personal law, marriage act, child welfare, maintenance")))
    metta.space().add_atom(E(S("impact_factors"), S("property"), ValueAtom("title, registration, tax compliance, zoning regulations")))
    metta.space().add_atom(E(S("impact_factors"), S("corporate"), ValueAtom("compliance, corporate governance, shareholder rights")))
    
    # Offense Types → Penalty Ranges
    metta.space().add_atom(E(S("penalty_range"), S("theft"), ValueAtom("imprisonment up to 3 years and/or fine under IPC Section 379")))
    metta.space().add_atom(E(S("penalty_range"), S("cheating"), ValueAtom("imprisonment up to 7 years and fine under IPC Section 420")))
    metta.space().add_atom(E(S("penalty_range"), S("criminal_damage"), ValueAtom("fine or imprisonment up to 2 years under IPC Section 427")))
    metta.space().add_atom(E(S("penalty_range"), S("defamation"), ValueAtom("imprisonment up to 2 years and/or fine under IPC Section 500")))
    metta.space().add_atom(E(S("penalty_range"), S("simple_hurt"), ValueAtom("imprisonment up to 1 year and/or fine under IPC Section 323")))
    
    # Legal FAQs
    metta.space().add_atom(E(S("faq"), ValueAtom("What is a valid contract?"), ValueAtom("A valid contract requires offer, acceptance, consideration, capacity, and free consent under the Indian Contract Act 1872")))
    metta.space().add_atom(E(S("faq"), ValueAtom("How to file an FIR?"), ValueAtom("Go to the nearest police station, provide written information about the offense, police must register FIR under Section 154 CrPC")))
    metta.space().add_atom(E(S("faq"), ValueAtom("What is bail?"), ValueAtom("Bail is temporary release of an accused person awaiting trial, often requiring surety or deposit of money")))
    metta.space().add_atom(E(S("faq"), ValueAtom("Can I get bail for any offense?"), ValueAtom("Bail is granted for bailable offenses as a right, for non-bailable offenses at court's discretion")))
    metta.space().add_atom(E(S("faq"), ValueAtom("What is the difference between civil and criminal law?"), ValueAtom("Civil law addresses private rights and remedies; criminal law punishes offenses against the state")))