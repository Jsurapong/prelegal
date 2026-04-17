"""Tests for the documents CRUD endpoints."""

import json

import pytest
from starlette.testclient import TestClient

from app.auth import get_current_user
from app.database import init_db
from app.main import app

# Ensure tables exist before any test runs
init_db()


def _override_user(email: str):
    """Return a dependency override that always returns the given email."""
    def _dep():
        return email
    return _dep


class TestDocumentsUnauthenticated:
    def test_list_returns_401(self):
        client = TestClient(app)
        resp = client.get("/api/documents/")
        assert resp.status_code == 401

    def test_save_returns_401(self):
        client = TestClient(app)
        resp = client.post(
            "/api/documents/",
            json={
                "title": "Test",
                "document_type": "mutual_nda",
                "doc_fields": {},
                "messages": [],
            },
        )
        assert resp.status_code == 401

    def test_load_returns_401(self):
        client = TestClient(app)
        resp = client.get("/api/documents/1")
        assert resp.status_code == 401

    def test_delete_returns_401(self):
        client = TestClient(app)
        resp = client.delete("/api/documents/1")
        assert resp.status_code == 401


class TestDocumentsCRUD:
    """Test documents CRUD with auth dependency overridden."""

    def setup_method(self):
        app.dependency_overrides[get_current_user] = _override_user("test@example.com")
        self.client = TestClient(app)

    def teardown_method(self):
        app.dependency_overrides.clear()

    def test_create_document(self):
        resp = self.client.post(
            "/api/documents/",
            json={
                "title": "My NDA",
                "document_type": "mutual_nda",
                "doc_fields": {"party1_company": "Acme"},
                "messages": [{"role": "user", "content": "I need an NDA"}],
            },
        )
        assert resp.status_code == 200
        data = resp.json()
        assert data["title"] == "My NDA"
        assert data["document_type"] == "mutual_nda"
        assert data["doc_fields"]["party1_company"] == "Acme"
        assert len(data["messages"]) == 1
        assert "id" in data

    def test_list_documents(self):
        # Create two documents
        for i in range(2):
            self.client.post(
                "/api/documents/",
                json={
                    "title": f"Doc {i}",
                    "document_type": "mutual_nda",
                    "doc_fields": {},
                    "messages": [],
                },
            )
        resp = self.client.get("/api/documents/")
        assert resp.status_code == 200
        data = resp.json()
        assert len(data) >= 2

    def test_load_document(self):
        create_resp = self.client.post(
            "/api/documents/",
            json={
                "title": "Load Test",
                "document_type": "sla",
                "doc_fields": {"uptime": "99.9%"},
                "messages": [{"role": "assistant", "content": "Here is your SLA"}],
            },
        )
        doc_id = create_resp.json()["id"]

        resp = self.client.get(f"/api/documents/{doc_id}")
        assert resp.status_code == 200
        data = resp.json()
        assert data["title"] == "Load Test"
        assert data["doc_fields"]["uptime"] == "99.9%"

    def test_update_document(self):
        create_resp = self.client.post(
            "/api/documents/",
            json={
                "title": "Original",
                "document_type": "mutual_nda",
                "doc_fields": {},
                "messages": [],
            },
        )
        doc_id = create_resp.json()["id"]

        resp = self.client.post(
            "/api/documents/",
            json={
                "id": doc_id,
                "title": "Updated",
                "document_type": "mutual_nda",
                "doc_fields": {"party1_company": "NewCo"},
                "messages": [{"role": "user", "content": "update"}],
            },
        )
        assert resp.status_code == 200
        assert resp.json()["title"] == "Updated"
        assert resp.json()["doc_fields"]["party1_company"] == "NewCo"

    def test_delete_document(self):
        create_resp = self.client.post(
            "/api/documents/",
            json={
                "title": "To Delete",
                "document_type": "mutual_nda",
                "doc_fields": {},
                "messages": [],
            },
        )
        doc_id = create_resp.json()["id"]

        resp = self.client.delete(f"/api/documents/{doc_id}")
        assert resp.status_code == 204

        # Verify it's gone
        resp = self.client.get(f"/api/documents/{doc_id}")
        assert resp.status_code == 404

    def test_cannot_access_other_users_document(self):
        # Create document as user A
        create_resp = self.client.post(
            "/api/documents/",
            json={
                "title": "Private",
                "document_type": "mutual_nda",
                "doc_fields": {},
                "messages": [],
            },
        )
        doc_id = create_resp.json()["id"]

        # Switch to user B
        app.dependency_overrides[get_current_user] = _override_user("other@example.com")
        client_b = TestClient(app)

        # User B cannot load User A's document
        resp = client_b.get(f"/api/documents/{doc_id}")
        assert resp.status_code == 404

        # User B cannot delete User A's document
        resp = client_b.delete(f"/api/documents/{doc_id}")
        assert resp.status_code == 404

    def test_list_returns_newest_first(self):
        # Use a unique user to avoid interference from other tests
        unique_user = f"order_{id(self)}@example.com"
        app.dependency_overrides[get_current_user] = _override_user(unique_user)
        client = TestClient(app)

        # Create documents in order
        for title in ["First", "Second", "Third"]:
            client.post(
                "/api/documents/",
                json={
                    "title": title,
                    "document_type": "mutual_nda",
                    "doc_fields": {},
                    "messages": [],
                },
            )
        resp = client.get("/api/documents/")
        data = resp.json()
        titles = [d["title"] for d in data]
        # Most recently created should come first (id DESC tiebreaker)
        assert titles == ["Third", "Second", "First"]
