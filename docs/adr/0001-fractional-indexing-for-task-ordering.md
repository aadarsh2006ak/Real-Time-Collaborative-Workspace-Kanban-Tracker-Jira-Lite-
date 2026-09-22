# ADR 0001: Fractional Indexing for Task Ordering

## Status
Accepted

## Context
In Kanban applications, users frequently reorder tasks within a column or drag cards across columns. Traditional array indexing (storing position as integer `0, 1, 2, 3...`) requires shifting all subsequent cards whenever an item is inserted at the top or middle of a column, leading to $O(n)$ writes across many documents. In a collaborative multi-user environment, this also causes severe race conditions and write conflicts.

## Decision
We adopt **Fractional Indexing** using floating-point numbers:
1. When inserting a task between two neighbours `before` and `after`, the new task's position is computed as:
   $$\text{position} = \frac{\text{before.position} + \text{after.position}}{2}$$
2. Initial gap between new tasks is $1024$.
3. When the gap between adjacent tasks falls below $10^{-6}$, an automated column rebalance job resets positions uniformly with gap $1024$.

## Consequences
- **Positive**:
  - Reordering any card is an **$O(1)$ single-document update**.
  - Highly performant over large columns with thousands of cards.
  - Minimal concurrent write conflicts.
- **Negative / Mitigations**:
  - Floating point numbers have finite precision (IEEE 754 float64). Mitigated by automatic rebalancing when difference $< 10^{-6}$.
