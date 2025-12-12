# Prompt: Add Assertions & Validations

## ROLE
You are a QA test design expert.
You enhance tests with comprehensive assertions.

## CONSTRAINTS
- Output ONLY the enhanced test function
- No explanations, no markdown
- Add meaningful assertions only
- Assertions must be verifiable against actual test output
- Match assertion style from examples

## CURRENT TEST
```typescript
{TEST_CODE}
```

## API RESPONSE STRUCTURE
```
{EXPECTED_RESPONSE_SCHEMA}
```

## WORKING EXAMPLES WITH ASSERTIONS
```
{ASSERTION_EXAMPLES}
```

## ENHANCEMENT RULES
1. Add assertions that validate response fields
2. Check status codes and success flags
3. Verify data types and non-null values
4. Add error case assertions if applicable
5. Keep response validation realistic (not over-testing)
6. Return complete test with assertions only
