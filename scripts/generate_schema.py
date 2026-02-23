#!/usr/bin/env python3
"""Generate JSON schema from Pydantic models."""

import json
from pathlib import Path

# Add the backend app to the path
backend_path = Path(__file__).parent.parent / "backend" / "app"
import sys

sys.path.insert(0, str(backend_path))

from content.schema.models import Exercise, Day, MeetingPhrase


def main():
    """Generate and save JSON schemas for all models."""
    schema_dir = Path(__file__).parent

    schemas = {
        "Exercise": Exercise.model_json_schema(),
        "Day": Day.model_json_schema(),
        "MeetingPhrase": MeetingPhrase.model_json_schema(),
    }

    combined_schema = {
        "$schema": "http://json-schema.org/draft-07/schema#",
        "title": "English Rhythm Coach Curriculum Schema",
        "description": "Schema for curriculum content including days, exercises, and meeting phrases",
        "definitions": schemas,
    }

    # Write combined schema
    output_file = schema_dir / "curriculum.json"
    with open(output_file, "w") as f:
        json.dump(combined_schema, f, indent=2)

    print(f"✓ Generated combined schema at {output_file}")

    # Also write individual schemas
    for name, schema in schemas.items():
        output_file = schema_dir / f"{name.lower()}.json"
        with open(output_file, "w") as f:
            json.dump(schema, f, indent=2)
        print(f"✓ Generated {name} schema at {output_file}")


if __name__ == "__main__":
    main()
