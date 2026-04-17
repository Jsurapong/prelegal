"""Tests for the template router endpoints."""

from starlette.testclient import TestClient

from app.main import app

client = TestClient(app)


class TestCatalogEndpoint:
    def test_returns_list_of_document_types(self):
        resp = client.get("/api/templates/catalog")
        assert resp.status_code == 200
        data = resp.json()
        assert isinstance(data, list)
        assert len(data) == 11
        for entry in data:
            assert "doc_id" in entry
            assert "display_name" in entry
            assert "description" in entry


class TestTemplateEndpoint:
    def test_returns_markdown_for_valid_doc_id(self):
        resp = client.get("/api/templates/mutual_nda")
        assert resp.status_code == 200
        assert "text/markdown" in resp.headers["content-type"]
        assert "Mutual Non-Disclosure Agreement" in resp.text

    def test_returns_404_for_unknown_doc_id(self):
        resp = client.get("/api/templates/nonexistent_doc")
        assert resp.status_code == 404

    def test_all_registered_templates_are_servable(self):
        catalog = client.get("/api/templates/catalog").json()
        for entry in catalog:
            resp = client.get(f"/api/templates/{entry['doc_id']}")
            assert resp.status_code == 200, f"Failed for {entry['doc_id']}"
            assert len(resp.text) > 100, f"Template too short for {entry['doc_id']}"
