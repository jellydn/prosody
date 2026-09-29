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
    assert "average_score" in data
    assert data["average_score"] == pytest.approx(4.2, abs=1e-6)
    assert "trend" in data


def test_get_progress_summary_no_data(db):
    response = client.get("/api/v1/progress/999/summary")
    assert response.status_code == 404


def test_progress_submission_replay_and_conflict(db):
    user = {
        "native_language": "Vietnamese",
        "english_level": "Intermediate",
        "goal": "Meetings",
    }
    first_user = client.post("/api/v1/users", json=user).json()["user_id"]
    second_user = client.post("/api/v1/users", json=user).json()["user_id"]
    payload = {
        "user_id": first_user,
        "submission_id": "fb431cb1-f8e9-428a-a84f-c71f5c89a61c",
        "day": 2,
        "exercises_completed": 3,
        "rhythm_score": 2.3,
        "stress_score": 3.4,
        "pacing_score": 4.1,
        "intonation_score": 1.5,
    }
    first = client.post("/api/v1/progress", json=payload)
    replay = client.post("/api/v1/progress", json=payload)
    assert first.status_code == replay.status_code == 201
    assert first.json()["id"] == replay.json()["id"]
    assert (
        client.post("/api/v1/progress", json={**payload, "day": 3}).status_code == 409
    )
    other = client.post("/api/v1/progress", json={**payload, "user_id": second_user})
    assert other.status_code == 201
    assert other.json()["id"] != first.json()["id"]
    assert len(client.get(f"/api/v1/progress/{first_user}").json()) == 1


if __name__ == "__main__":
    import sys

    pytest.main([__file__, "-v"] + sys.argv[1:])
