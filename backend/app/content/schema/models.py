from pydantic import BaseModel, Field
from enum import Enum
from typing import Optional, List


class ExerciseType(str, Enum):
    stress = "stress"
    linking = "linking"
    chunk = "chunk"
    shadow = "shadow"
    intonation = "intonation"


class Exercise(BaseModel):
    id: str = Field(..., description="Unique identifier for the exercise")
    type: ExerciseType = Field(..., description="Type of exercise")
    title: str = Field(..., description="Display title of the exercise")
    instruction: str = Field(..., description="Instructions for the user")
    targetText: str = Field(..., description="The sentence/text to practice")
    stressPattern: Optional[List[bool]] = Field(
        None,
        description="Array indicating stressed syllables (True) vs unstressed (False)",
    )
    chunks: Optional[List[str]] = Field(
        None, description="List of text chunks for thought group exercises"
    )
    audioUrl: Optional[str] = Field(
        None, description="URL or path to example audio file"
    )
    tips: List[str] = Field(default_factory=list, description="Tips for the user")

    class Config:
        json_schema_extra = {
            "example": {
                "id": "ex-001",
                "type": "stress",
                "title": "Word Stress Practice",
                "instruction": "Listen and repeat, emphasizing the bold syllables",
                "targetText": "Hello, how are you today?",
                "stressPattern": [False, False, True, False, False, True],
                "chunks": None,
                "audioUrl": "/audio/stress-001.mp3",
                "tips": [
                    "Keep unstressed syllables short and quiet",
                    "Pronounce stressed syllables clearly and slightly longer",
                ],
            }
        }


class Day(BaseModel):
    day: int = Field(..., description="Day number in the curriculum (1-14)")
    theme: str = Field(..., description="Theme or topic for the day")
    exercises: List[Exercise] = Field(..., description="List of exercises for the day")

    class Config:
        json_schema_extra = {
            "example": {
                "day": 1,
                "theme": "Word Stress Basics",
                "exercises": [
                    {
                        "id": "ex-001",
                        "type": "stress",
                        "title": "Basic Stress Patterns",
                        "instruction": "Practice the stress pattern",
                        "targetText": "Hello, how are you?",
                        "stressPattern": [False, False, True, False, True],
                        "audioUrl": "/audio/ex-001.mp3",
                        "tips": ["Keep unstressed syllables short"],
                    }
                ],
            }
        }


class MeetingPhrase(BaseModel):
    id: str = Field(..., description="Unique identifier for the phrase")
    category: str = Field(..., description="Category of the meeting phrase")
    text: str = Field(..., description="The phrase text")
    audioUrl: Optional[str] = Field(
        None, description="URL or path to example audio file"
    )

    class Config:
        json_schema_extra = {
            "example": {
                "id": "mp-001",
                "category": "updates",
                "text": "I'd like to provide an update on the project.",
                "audioUrl": "/audio/mp-001.mp3",
            }
        }


def generate_json_schema():
    """Generate and return the combined JSON schema for all models."""
    return {
        "$schema": "http://json-schema.org/draft-07/schema#",
        "title": "English Rhythm Coach Curriculum Schema",
        "description": "Schema for curriculum content including days, exercises, and meeting phrases",
        "definitions": {
            "Exercise": Exercise.model_json_schema(),
            "Day": Day.model_json_schema(),
            "MeetingPhrase": MeetingPhrase.model_json_schema(),
        },
    }
