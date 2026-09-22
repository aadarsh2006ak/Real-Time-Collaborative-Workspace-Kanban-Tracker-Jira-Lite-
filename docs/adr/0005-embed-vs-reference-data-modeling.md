# ADR 0005: Embed vs Reference Strategy for MongoDB

## Status
Accepted

## Context
MongoDB supports both embedding documents and referencing across collections. Deciding between embedding and referencing dictates read performance, write scalability, and document size boundaries.

## Decision
We establish explicit criteria for Schema Modeling:
1. **Embed when**:
   - The child dataset is **bounded and small** (e.g. Columns in a Project, maximum 10-15 items).
   - The data is **always read together** with the parent (Project details always include Column configurations and Member roles).
   - The data does not require independent high-throughput writes.
2. **Reference when**:
   - The dataset has **unbounded growth** (Tasks, Comments, Activity Logs, Notifications).
   - The data requires independent pagination, filtering, and indexing.
   - The documents need to stay well below MongoDB's 16 MB BSON size ceiling.

## Consequences
- **Positive**:
  - Eliminates 16MB document size ceiling risks for large enterprise boards.
  - Keeps query payloads lean while providing instant board loading.
