---
name: sql
description: Write, optimize, or explain SQL queries with best practices
---

# /sql

Help write, optimize, or explain SQL queries.

## Instructions

When the user provides a SQL query or describes what they need:

1. **Writing SQL**: Generate clean, readable SQL with:
   - Proper indentation and capitalization
   - CTEs over nested subqueries when complex
   - Comments for non-obvious logic

2. **Optimizing SQL**: Look for:
   - Missing indexes (suggest based on WHERE/JOIN columns)
   - N+1 patterns
   - Unnecessary SELECT \*
   - Subqueries that could be JOINs
   - Opportunities for window functions

3. **Explaining SQL**: Break down the query step by step, explaining what each part does

Ask for the database type (PostgreSQL, MySQL, BigQuery, etc.) if not specified.
