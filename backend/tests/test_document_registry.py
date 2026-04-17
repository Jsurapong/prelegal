"""Tests for the document registry and template router."""

from app.document_registry import (
    REGISTRY,
    get_catalog_summary,
    get_template_content,
    validate_registry,
)


class TestRegistry:
    def test_registry_has_11_document_types(self):
        assert len(REGISTRY) == 11

    def test_all_document_types_have_fields(self):
        for doc_id, dt in REGISTRY.items():
            assert len(dt.fields) > 0, f"{doc_id} has no fields"

    def test_all_document_types_have_system_intro(self):
        for doc_id, dt in REGISTRY.items():
            assert dt.system_intro, f"{doc_id} has no system_intro"

    def test_all_document_types_have_template_file(self):
        for doc_id, dt in REGISTRY.items():
            assert dt.template_filename, f"{doc_id} has no template_filename"

    def test_mutual_nda_has_19_fields(self):
        nda = REGISTRY["mutual_nda"]
        assert len(nda.fields) == 19

    def test_field_keys_are_unique_per_document(self):
        for doc_id, dt in REGISTRY.items():
            keys = [f.key for f in dt.fields]
            assert len(keys) == len(set(keys)), (
                f"{doc_id} has duplicate field keys: "
                f"{[k for k in keys if keys.count(k) > 1]}"
            )

    def test_allowed_values_are_set_for_nda_enums(self):
        nda = REGISTRY["mutual_nda"]
        term_type = next(f for f in nda.fields if f.key == "mnda_term_type")
        assert term_type.allowed_values == ["expires", "until_terminated"]
        conf_type = next(f for f in nda.fields if f.key == "confidentiality_term_type")
        assert conf_type.allowed_values == ["expires", "perpetuity"]


class TestCatalogSummary:
    def test_returns_all_document_types(self):
        summary = get_catalog_summary()
        assert len(summary) == 11

    def test_entries_have_required_keys(self):
        for entry in get_catalog_summary():
            assert "doc_id" in entry
            assert "display_name" in entry
            assert "description" in entry


class TestTemplateContent:
    def test_returns_content_for_valid_doc_id(self):
        content = get_template_content("mutual_nda")
        assert content is not None
        assert "Mutual Non-Disclosure Agreement" in content

    def test_returns_none_for_unknown_doc_id(self):
        assert get_template_content("nonexistent_doc") is None

    def test_templates_exist_for_all_registry_entries(self):
        for doc_id in REGISTRY:
            content = get_template_content(doc_id)
            assert content is not None, f"Template missing for {doc_id}"
            assert len(content) > 100, f"Template too short for {doc_id}"


class TestValidateRegistry:
    def test_validate_does_not_raise(self):
        # Should log warnings but not raise
        validate_registry()
