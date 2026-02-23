import pytest
from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)


def test_create_user(db):
    response = client.post(
        "/api/v1/users",
        json={
            "native_language": "Vietnamese",
            "english_level": "Intermediate",
            "goal": "Meetings",
        },
    )
    assert response.status_code == 201
    data = response.json()
    assert "user_id" in data
    assert isinstance(data["user_id"], int)


def test_create_progress(db):
    user_response = client.post(
        "/api/v1/users",
        json={
            "native_language": "Vietnamese",
            "english_level": "Intermediate",
            "goal": "Meetings",
        },
    )
    user_id = user_response.json()["user_id"]

    response = client.post(
        "/api/v1/progress",
        json={
            "user_id": user_id,
            "day": 1,
            "exercises_completed": 4,
            "rhythm_score": 4.5,
            "stress_score": 4.0,
            "pacing_score": 4.2,
            "intonation_score": 4.3,
        },
    )
    assert response.status_code == 201
    data = response.json()
    assert "id" in data


def test_get_progress(db):
    user_response = client.post(
        "/api/v1/users",
        json={
            "native_language": "Vietnamese",
            "english_level": "Intermediate",
            "goal": "Meetings",
        },
    )
    user_id = user_response.json()["user_id"]

    client.post(
        "/api/v1/progress",
        json={
            "user_id": user_id,
            "day": 1,
            "exercises_completed": 4,
            "rhythm_score": 4.5,
            "stress_score": 4.0,
            "pacing_score": 4.2,
            "intonation_score": 4.3,
        },
    )

    response = client.get(f"/api/v1/progress/{user_id}")
    assert response.status_code == 200
    data = response.json()
    assert len(data) == 1
    assert data[0]["day"] == 1


def test_get_progress_summary(db):
    user_response = client.post(
        "/api/v1/users",
        json={
            "native_language": "Vietnamese",
            "english_level": "Intermediate",
            "goal": "Meetings",
        },
    )
    user_id = user_response.json()["user_id"]

    for day in range(1, 4):
        client.post(
            "/api/v1/progress",
            json={
                "user_id": user_id,
                "day": day,
                "exercises_completed": 4,
                "rhythm_score": 4.0 + day * 0.1,
                "stress_score": 4.0 + day * 0.1,
                "pacing_score": 4.0 + day * 0.1,
                "intonation_score": 4.0 + day * 0.1,
            },
        )

    response = client.get(f"/api/v1/progress/{user_id}/summary")
    assert response.status_code == 200
    data = response.json()
    assert data["streak"] == 3
    assert data["total_sessions"] == 3
    assert "averages" in data
    assert "trend" in data


def test_get_progress_summary_no_data(db):
    response = client.get("/api/v1/progress/999/summary")
    assert response.status_code == 404


if __name__ == "__main__":
    import sys

    pytest.main([__file__, "-v"] + sys.argv[1:])
