"""Central registry of all supported legal document types and their fields.

This module is the single source of truth for document type metadata,
field definitions, and system prompt configuration used by the chat endpoint.
"""

from __future__ import annotations

import json
import logging
from dataclasses import dataclass, field
from pathlib import Path

logger = logging.getLogger(__name__)

def _find_project_root() -> Path:
    """Find project root by locating catalog.json, works both locally and in Docker."""
    # Try from backend/app/ -> backend/ -> project root (local dev)
    candidate = Path(__file__).resolve().parent.parent.parent
    if (candidate / "catalog.json").is_file():
        return candidate
    # Docker: /app is workdir, catalog.json is at /app/catalog.json
    candidate = Path(__file__).resolve().parent.parent
    if (candidate / "catalog.json").is_file():
        return candidate
    # Fallback
    return Path(__file__).resolve().parent.parent.parent


_PROJECT_ROOT = _find_project_root()


@dataclass(frozen=True)
class FieldDef:
    """Definition of a single fillable field in a legal document."""

    key: str
    label: str
    hint: str = ""
    optional: bool = False
    allowed_values: list[str] = field(default_factory=list)


@dataclass(frozen=True)
class DocumentType:
    """Complete configuration for one legal document type."""

    doc_id: str
    display_name: str
    description: str
    template_filename: str
    fields: tuple[FieldDef, ...]
    system_intro: str


# ── Shared field builders ────────────────────────────────────────────────────


def _party_fields(role: str, label: str) -> tuple[FieldDef, ...]:
    """Generate standard party fields (company, signatory name, title)."""
    return (
        FieldDef(f"{role}_company", f"{label} Company Name"),
        FieldDef(f"{role}_signatory_name", f"{label} Signatory Name"),
        FieldDef(f"{role}_signatory_title", f"{label} Signatory Title"),
        FieldDef(f"{role}_notice_address", f"{label} Notice Address (email or postal)", optional=True),
    )


_EFFECTIVE_DATE = FieldDef("effective_date", "Effective Date", "Use YYYY-MM-DD format")
_GOVERNING_LAW = FieldDef("governing_law", "Governing Law", "State or jurisdiction name")
_JURISDICTION = FieldDef("jurisdiction", "Jurisdiction", "City/county and state for courts")


# ── Document type definitions ────────────────────────────────────────────────


MUTUAL_NDA = DocumentType(
    doc_id="mutual_nda",
    display_name="Mutual Non-Disclosure Agreement",
    description="Bilateral confidentiality agreement for two parties sharing sensitive information.",
    template_filename="templates/Mutual-NDA.md",
    fields=(
        FieldDef("purpose", "Purpose", "How Confidential Information may be used"),
        _EFFECTIVE_DATE,
        FieldDef("mnda_term_type", "MNDA Term Type", "expires or until_terminated",
                 allowed_values=["expires", "until_terminated"]),
        FieldDef("mnda_term_years", "MNDA Term Years", "Number of years, e.g. 1"),
        FieldDef("confidentiality_term_type", "Confidentiality Term Type", "expires or perpetuity",
                 allowed_values=["expires", "perpetuity"]),
        FieldDef("confidentiality_term_years", "Confidentiality Term Years", "Number of years, e.g. 1"),
        _GOVERNING_LAW,
        _JURISDICTION,
        FieldDef("modifications", "Modifications to standard terms", optional=True),
        FieldDef("party1_company", "Party 1 Company Name"),
        FieldDef("party1_print_name", "Party 1 Signatory Name"),
        FieldDef("party1_title", "Party 1 Signatory Title"),
        FieldDef("party1_notice_address", "Party 1 Notice Address (email or postal)"),
        FieldDef("party1_date", "Party 1 Signing Date", "Use YYYY-MM-DD format"),
        FieldDef("party2_company", "Party 2 Company Name"),
        FieldDef("party2_print_name", "Party 2 Signatory Name"),
        FieldDef("party2_title", "Party 2 Signatory Title"),
        FieldDef("party2_notice_address", "Party 2 Notice Address (email or postal)"),
        FieldDef("party2_date", "Party 2 Signing Date", "Use YYYY-MM-DD format"),
    ),
    system_intro=(
        "You are helping the user create a Mutual Non-Disclosure Agreement (MNDA) "
        "based on the Common Paper MNDA Standard Terms v1.0. This is a bilateral "
        "confidentiality agreement for two parties sharing sensitive information."
    ),
)


CLOUD_SERVICE_AGREEMENT = DocumentType(
    doc_id="cloud_service_agreement",
    display_name="Cloud Service Agreement",
    description="Standard SaaS/cloud subscription agreement covering access rights, acceptable use, IP, confidentiality, payment, and liability.",
    template_filename="templates/CSA.md",
    fields=(
        *_party_fields("provider", "Provider"),
        *_party_fields("customer", "Customer"),
        _EFFECTIVE_DATE,
        _GOVERNING_LAW,
        _JURISDICTION,
        FieldDef("subscription_period", "Subscription Period", "e.g. 1 year"),
        FieldDef("payment_process", "Payment Process", "e.g. invoicing, net-30"),
        FieldDef("technical_support", "Technical Support", "Description of support provided"),
        FieldDef("use_limitations", "Use Limitations", "Any usage restrictions", optional=True),
        FieldDef("general_cap_amount", "General Cap Amount", "Liability cap, e.g. $100,000 or 12 months of fees"),
        FieldDef("increased_cap_amount", "Increased Cap Amount", "Higher liability cap for certain claims", optional=True),
        FieldDef("dpa", "Data Processing Agreement", "Yes/No or N/A", optional=True),
        FieldDef("additional_warranties", "Additional Warranties", optional=True),
    ),
    system_intro=(
        "You are helping the user create a Cloud Service Agreement (CSA) "
        "based on Common Paper standards. This covers SaaS subscriptions including "
        "access rights, acceptable use, IP, confidentiality, payment, and liability."
    ),
)


DESIGN_PARTNER_AGREEMENT = DocumentType(
    doc_id="design_partner_agreement",
    display_name="Design Partner Agreement",
    description="Agreement for early-stage/beta product customers providing feedback, with limited access, confidentiality, and feedback IP provisions.",
    template_filename="templates/design-partner-agreement.md",
    fields=(
        *_party_fields("provider", "Provider"),
        *_party_fields("partner", "Partner"),
        _EFFECTIVE_DATE,
        FieldDef("term", "Term", "Duration of the agreement, e.g. 6 months"),
        FieldDef("program", "Program", "Description of the design partner program"),
        FieldDef("fees", "Fees", "Any fees, or None", optional=True),
        _GOVERNING_LAW,
        FieldDef("chosen_courts", "Chosen Courts", "Courts for dispute resolution"),
        FieldDef("dpa", "Data Processing Agreement", "Yes/No or N/A", optional=True),
        FieldDef("additional_warranties", "Additional Warranties", optional=True),
    ),
    system_intro=(
        "You are helping the user create a Design Partner Agreement. "
        "This is for early-stage or beta product customers who provide feedback, "
        "with limited access rights, confidentiality obligations, and feedback IP provisions."
    ),
)


SERVICE_LEVEL_AGREEMENT = DocumentType(
    doc_id="service_level_agreement",
    display_name="Service Level Agreement",
    description="Defines uptime commitments, incident response procedures, service credit calculations, and measurement methodology.",
    template_filename="templates/sla.md",
    fields=(
        *_party_fields("provider", "Provider"),
        *_party_fields("customer", "Customer"),
        _EFFECTIVE_DATE,
        FieldDef("subscription_period", "Subscription Period", "e.g. 1 year"),
        FieldDef("target_uptime", "Target Uptime", "e.g. 99.9%"),
        FieldDef("target_response_time", "Target Response Time", "e.g. 4 hours for critical issues"),
        FieldDef("support_channel", "Support Channel", "e.g. email, phone, portal URL"),
        FieldDef("scheduled_downtime", "Scheduled Downtime", "Maintenance window details", optional=True),
        FieldDef("uptime_credit", "Uptime Credit", "Service credit for uptime failures", optional=True),
        FieldDef("response_time_credit", "Response Time Credit", "Service credit for slow response", optional=True),
    ),
    system_intro=(
        "You are helping the user create a Service Level Agreement (SLA). "
        "This defines uptime commitments, incident response times, service credit "
        "calculations, and measurement methodology for cloud/SaaS services."
    ),
)


PROFESSIONAL_SERVICES_AGREEMENT = DocumentType(
    doc_id="professional_services_agreement",
    display_name="Professional Services Agreement",
    description="Covers consulting, implementation, and custom development with SOW framework, deliverables, IP ownership, and payment.",
    template_filename="templates/psa.md",
    fields=(
        *_party_fields("provider", "Provider"),
        *_party_fields("customer", "Customer"),
        _EFFECTIVE_DATE,
        _GOVERNING_LAW,
        _JURISDICTION,
        FieldDef("deliverables", "Deliverables", "Description of work to be delivered"),
        FieldDef("fees", "Fees", "Payment amount or rate"),
        FieldDef("payment_period", "Payment Period", "e.g. net-30"),
        FieldDef("sow_term", "SOW Term", "Duration of the statement of work"),
        FieldDef("general_cap_amount", "General Cap Amount", "Liability cap"),
        FieldDef("increased_cap_amount", "Increased Cap Amount", optional=True),
        FieldDef("dpa", "Data Processing Agreement", "Yes/No or N/A", optional=True),
        FieldDef("security_policy", "Security Policy", "Reference to security standards", optional=True),
        FieldDef("additional_warranties", "Additional Warranties", optional=True),
    ),
    system_intro=(
        "You are helping the user create a Professional Services Agreement (PSA). "
        "This covers consulting, implementation, and custom development engagements "
        "including statement of work, deliverables, IP ownership, and payment."
    ),
)


DATA_PROCESSING_AGREEMENT = DocumentType(
    doc_id="data_processing_agreement",
    display_name="Data Processing Agreement",
    description="GDPR-compliant data processing addendum covering controller/processor roles, sub-processors, data subject rights, and international transfers.",
    template_filename="templates/DPA.md",
    fields=(
        *_party_fields("provider", "Provider"),
        *_party_fields("customer", "Customer"),
        _EFFECTIVE_DATE,
        FieldDef("agreement", "Agreement", "Reference to the master agreement this DPA is attached to"),
        FieldDef("categories_of_personal_data", "Categories of Personal Data", "Types of personal data processed"),
        FieldDef("categories_of_data_subjects", "Categories of Data Subjects", "Types of individuals whose data is processed"),
        FieldDef("nature_and_purpose_of_processing", "Nature and Purpose of Processing", "Why data is processed"),
        FieldDef("duration_of_processing", "Duration of Processing", "How long data is processed"),
        FieldDef("governing_member_state", "Governing Member State", "EEA member state for SCC clause 17"),
        FieldDef("security_policy", "Security Policy", "Reference to security standards"),
        FieldDef("provider_security_contact", "Provider Security Contact", "Email for security inquiries"),
        FieldDef("approved_subprocessors", "Approved Subprocessors", "List of approved subprocessors", optional=True),
        FieldDef("special_category_data", "Special Category Data", "Any special category data processed", optional=True),
    ),
    system_intro=(
        "You are helping the user create a Data Processing Agreement (DPA). "
        "This is a GDPR-compliant addendum covering controller/processor roles, "
        "sub-processor management, data subject rights, security measures, and "
        "international data transfers."
    ),
)


PARTNERSHIP_AGREEMENT = DocumentType(
    doc_id="partnership_agreement",
    display_name="Partnership Agreement",
    description="Reseller, channel, and referral partnership covering partner tiers, co-selling, revenue share, marketing rights, and program terms.",
    template_filename="templates/Partnership-Agreement.md",
    fields=(
        *_party_fields("company", "Company"),
        *_party_fields("partner", "Partner"),
        _EFFECTIVE_DATE,
        FieldDef("end_date", "End Date", "Agreement end date, YYYY-MM-DD", optional=True),
        _GOVERNING_LAW,
        _JURISDICTION,
        FieldDef("obligations", "Obligations", "What each party is responsible for"),
        FieldDef("territory", "Territory", "Geographic territory for the partnership"),
        FieldDef("payment_process", "Payment Process", "How payments are made"),
        FieldDef("payment_schedule", "Payment Schedule", "When payments are due"),
        FieldDef("general_cap_amount", "General Cap Amount", "Liability cap"),
        FieldDef("brand_guidelines", "Brand Guidelines", "Reference to brand usage rules", optional=True),
        FieldDef("dpa", "Data Processing Agreement", "Yes/No or N/A", optional=True),
        FieldDef("additional_warranties", "Additional Warranties", optional=True),
    ),
    system_intro=(
        "You are helping the user create a Partnership Agreement. "
        "This covers reseller, channel, and referral partnerships including "
        "partner tiers, co-selling arrangements, revenue share, and marketing rights."
    ),
)


SOFTWARE_LICENSE_AGREEMENT = DocumentType(
    doc_id="software_license_agreement",
    display_name="Software License Agreement",
    description="On-premise or perpetual software licensing covering license grant, use restrictions, maintenance, support, IP ownership, and warranty.",
    template_filename="templates/Software-License-Agreement.md",
    fields=(
        *_party_fields("provider", "Provider"),
        *_party_fields("customer", "Customer"),
        _EFFECTIVE_DATE,
        _GOVERNING_LAW,
        _JURISDICTION,
        FieldDef("subscription_period", "Subscription Period", "e.g. 1 year"),
        FieldDef("permitted_uses", "Permitted Uses", "How the software may be used"),
        FieldDef("license_limits", "License Limits", "e.g. number of seats or instances"),
        FieldDef("payment_process", "Payment Process", "How payments are made"),
        FieldDef("warranty_period", "Warranty Period", "e.g. 90 days"),
        FieldDef("general_cap_amount", "General Cap Amount", "Liability cap"),
        FieldDef("increased_cap_amount", "Increased Cap Amount", optional=True),
        FieldDef("additional_warranties", "Additional Warranties", optional=True),
    ),
    system_intro=(
        "You are helping the user create a Software License Agreement. "
        "This covers on-premise or perpetual software licensing including license grant, "
        "use restrictions, maintenance and support, IP ownership, and warranty terms."
    ),
)


PILOT_AGREEMENT = DocumentType(
    doc_id="pilot_agreement",
    display_name="Pilot Agreement",
    description="Time-limited trial and proof-of-concept agreement with defined scope, success criteria, data handling, and conversion terms.",
    template_filename="templates/Pilot-Agreement.md",
    fields=(
        *_party_fields("provider", "Provider"),
        *_party_fields("customer", "Customer"),
        _EFFECTIVE_DATE,
        FieldDef("pilot_period", "Pilot Period", "Duration of the pilot, e.g. 30 days"),
        _GOVERNING_LAW,
        _JURISDICTION,
        FieldDef("general_cap_amount", "General Cap Amount", "Liability cap"),
    ),
    system_intro=(
        "You are helping the user create a Pilot Agreement. "
        "This is a time-limited trial and proof-of-concept agreement with defined "
        "pilot scope, success criteria, data handling provisions, and conversion terms."
    ),
)


BUSINESS_ASSOCIATE_AGREEMENT = DocumentType(
    doc_id="business_associate_agreement",
    display_name="Business Associate Agreement",
    description="HIPAA-compliant agreement for a business associate handling PHI on behalf of a covered entity.",
    template_filename="templates/BAA.md",
    fields=(
        *_party_fields("provider", "Provider (Business Associate)"),
        *_party_fields("company", "Company (Covered Entity)"),
        FieldDef("baa_effective_date", "BAA Effective Date", "Use YYYY-MM-DD format"),
        FieldDef("agreement", "Agreement", "Reference to the master services agreement"),
        FieldDef("limitations", "Limitations", "Restrictions on subcontractors, offshoring, de-identification", optional=True),
        FieldDef("breach_notification_period", "Breach Notification Period", "e.g. 72 hours"),
    ),
    system_intro=(
        "You are helping the user create a Business Associate Agreement (BAA). "
        "This is a HIPAA-compliant agreement defining the obligations of a business "
        "associate handling Protected Health Information (PHI) on behalf of a covered entity."
    ),
)


AI_ADDENDUM = DocumentType(
    doc_id="ai_addendum",
    display_name="AI Addendum",
    description="Contractual addendum addressing AI/ML product usage, data training restrictions, output ownership, bias obligations, and AI-specific liability.",
    template_filename="templates/AI-Addendum.md",
    fields=(
        *_party_fields("provider", "Provider"),
        *_party_fields("customer", "Customer"),
        _EFFECTIVE_DATE,
        FieldDef("training_data", "Training Data", "What data can be used for training", optional=True),
        FieldDef("training_purposes", "Training Purposes", "Permitted training purposes", optional=True),
        FieldDef("training_restrictions", "Training Restrictions", "Limitations on training", optional=True),
        FieldDef("improvement_restrictions", "Improvement Restrictions", "Limitations on non-training improvement", optional=True),
    ),
    system_intro=(
        "You are helping the user create an AI Addendum. "
        "This addendum addresses AI and ML product usage, data training restrictions, "
        "output ownership, bias and fairness obligations, and AI-specific liability."
    ),
)


# ── Registry ─────────────────────────────────────────────────────────────────

REGISTRY: dict[str, DocumentType] = {
    dt.doc_id: dt
    for dt in (
        MUTUAL_NDA,
        CLOUD_SERVICE_AGREEMENT,
        DESIGN_PARTNER_AGREEMENT,
        SERVICE_LEVEL_AGREEMENT,
        PROFESSIONAL_SERVICES_AGREEMENT,
        DATA_PROCESSING_AGREEMENT,
        PARTNERSHIP_AGREEMENT,
        SOFTWARE_LICENSE_AGREEMENT,
        PILOT_AGREEMENT,
        BUSINESS_ASSOCIATE_AGREEMENT,
        AI_ADDENDUM,
    )
}


def get_catalog_summary() -> list[dict[str, str]]:
    """Return a lightweight list of all document types for the selection prompt."""
    return [
        {
            "doc_id": dt.doc_id,
            "display_name": dt.display_name,
            "description": dt.description,
        }
        for dt in REGISTRY.values()
    ]


def get_template_content(doc_id: str) -> str | None:
    """Read and return the markdown template for a document type."""
    dt = REGISTRY.get(doc_id)
    if dt is None:
        return None
    path = _PROJECT_ROOT / dt.template_filename
    if not path.is_file():
        logger.warning("Template file not found: %s", path)
        return None
    return path.read_text(encoding="utf-8")


def validate_registry() -> None:
    """Log warnings for any registry entries whose template file is missing."""
    catalog_path = _PROJECT_ROOT / "catalog.json"
    if catalog_path.is_file():
        catalog = json.loads(catalog_path.read_text(encoding="utf-8"))
        catalog_names = {item["name"] for item in catalog}
        registry_names = {dt.display_name for dt in REGISTRY.values()}
        missing = catalog_names - registry_names
        if missing:
            logger.warning("Catalog entries without registry definitions: %s", missing)

    for dt in REGISTRY.values():
        path = _PROJECT_ROOT / dt.template_filename
        if not path.is_file():
            logger.warning("Template file missing for %s: %s", dt.doc_id, path)
