"""Tests for the chat module (prompt building, model creation)."""

from pydantic import BaseModel

from app.chat import (
    _build_field_prompt,
    _build_selection_prompt,
    _get_response_model,
    _parse_fields_from_response,
)
from app.document_registry import REGISTRY


class TestBuildSelectionPrompt:
    def test_contains_all_doc_ids(self):
        prompt = _build_selection_prompt()
        for doc_id in REGISTRY:
            assert doc_id in prompt, f"{doc_id} not found in selection prompt"

    def test_contains_instructions(self):
        prompt = _build_selection_prompt()
        assert "selected_document_type" in prompt
        assert "clarifying question" in prompt


class TestBuildFieldPrompt:
    def test_shows_empty_fields(self):
        dt = REGISTRY["mutual_nda"]
        prompt = _build_field_prompt(dt, {})
        assert "[EMPTY]" in prompt
        assert "Purpose" in prompt

    def test_shows_filled_fields(self):
        dt = REGISTRY["mutual_nda"]
        prompt = _build_field_prompt(dt, {"purpose": "Testing things"})
        assert '"Testing things" [FILLED]' in prompt

    def test_includes_follow_on_question_instruction(self):
        dt = REGISTRY["cloud_service_agreement"]
        prompt = _build_field_prompt(dt, {})
        assert "follow-on question" in prompt.lower()

    def test_includes_allowed_values_guidelines(self):
        dt = REGISTRY["mutual_nda"]
        prompt = _build_field_prompt(dt, {})
        assert '"expires"' in prompt
        assert '"until_terminated"' in prompt


class TestGetResponseModel:
    def test_creates_model_with_reply_and_fields(self):
        dt = REGISTRY["pilot_agreement"]
        model = _get_response_model(dt)
        assert issubclass(model, BaseModel)
        assert "reply" in model.model_fields
        for f in dt.fields:
            assert f.key in model.model_fields, f"Field {f.key} not in model"

    def test_nda_model_has_literal_types_for_enums(self):
        dt = REGISTRY["mutual_nda"]
        model = _get_response_model(dt)
        # The mnda_term_type field should accept "expires" or "until_terminated"
        instance = model(reply="test", mnda_term_type="expires")
        assert instance.mnda_term_type == "expires"

    def test_model_is_cached(self):
        dt = REGISTRY["mutual_nda"]
        model1 = _get_response_model(dt)
        model2 = _get_response_model(dt)
        assert model1 is model2


class TestParseFieldsFromResponse:
    def test_extracts_fields_from_response(self):
        dt = REGISTRY["pilot_agreement"]
        model = _get_response_model(dt)
        response = model(
            reply="Here you go",
            provider_company="Acme Corp",
            customer_company="Beta Inc",
            effective_date="2026-01-15",
        )
        fields = _parse_fields_from_response(response, dt)
        assert fields["provider_company"] == "Acme Corp"
        assert fields["customer_company"] == "Beta Inc"
        assert fields["effective_date"] == "2026-01-15"
        # Unfilled fields should be None
        assert fields["pilot_period"] is None
