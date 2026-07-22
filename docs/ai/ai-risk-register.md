# AI risk register — amanah-app

| Field | Content |
| --- | --- |
| AI usage | present |
| Components | src/lib/ai/*, src/lib/knowledge/* |
| Providers | OpenAI (optional), mock/rules fallbacks |
| Data categories | public / internal / personal (minimize); no secrets in prompts |
| Tool access | read-only by default; write requires explicit approval |
| Structured validation | required for machine-consumed outputs |
| Source obligation | required for grounded/RAG answers |
| Prompt-injection protection | treat external content as untrusted |
| Risk level | **AI_HIGH** |
| Open actions | Enforce `AI_POLICY.md`; keep CI secret gates; validate model outputs; avoid RED autonomous actions |

## Summary

OpenAI-backed knowledge/chat assistive features with grounded retrieval and structured type guards.

## Notes

- Do not store raw secrets or unnecessary personal data in this register.
- Update this file when AI providers, tools, or automation scope change.
