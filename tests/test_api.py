"""Tests for nonogram.api Flask Blueprint."""

import pytest

from app import create_app


@pytest.fixture()
def client():
    app = create_app()
    app.config["TESTING"] = True
    with app.test_client() as client:
        yield client


class TestGetPuzzleList:
    def test_returns_200(self, client):
        res = client.get("/api/puzzles")
        assert res.status_code == 200

    def test_response_has_puzzles_key(self, client):
        data = client.get("/api/puzzles").get_json()
        assert "puzzles" in data

    def test_arrow_in_list(self, client):
        data = client.get("/api/puzzles").get_json()
        assert any("arrow" in name for name in data["puzzles"])


class TestGetNonogram:
    def test_returns_200_for_arrow(self, client):
        res = client.get("/api/nonogram/bw/arrow_w5_h5")
        assert res.status_code == 200

    def test_response_schema(self, client):
        data = client.get("/api/nonogram/bw/arrow_w5_h5").get_json()
        assert data["width"] == 5
        assert data["height"] == 5
        assert len(data["row_hints"]) == 5
        assert len(data["col_hints"]) == 5
        assert len(data["solution"]) == 5
        assert all(len(row) == 5 for row in data["solution"])

    def test_row_hints_are_lists_of_ints(self, client):
        data = client.get("/api/nonogram/bw/arrow_w5_h5").get_json()
        for hint_list in data["row_hints"]:
            assert isinstance(hint_list, list)
            assert all(isinstance(n, int) for n in hint_list)

    def test_solution_contains_booleans(self, client):
        data = client.get("/api/nonogram/bw/arrow_w5_h5").get_json()
        for row in data["solution"]:
            for cell in row:
                assert isinstance(cell, bool)

    def test_missing_puzzle_returns_404(self, client):
        res = client.get("/api/nonogram/bw/nonexistent")
        assert res.status_code == 404
