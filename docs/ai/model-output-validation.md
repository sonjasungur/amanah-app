# Model output validation — amanah-app

## Requirements

1. Define a schema for every machine-consumed model response.
2. Validate before persistence or side effects.
3. On validation failure: reject, safe retry, or human escalate.
4. Prefer explicit `unknown` / `evidence_missing` over invented defaults.
5. Grounded answers must carry source fields or an explicit no-evidence status.

## Suggested stack

- TypeScript: Zod or existing typed guards
- Python: Pydantic models
- Cross-language: JSON Schema

## Tests

Add unit tests for:

- valid payload accepted
- missing required fields rejected
- fabricated source IDs rejected when evidence is required
- provider errors do not become fake successful answers
