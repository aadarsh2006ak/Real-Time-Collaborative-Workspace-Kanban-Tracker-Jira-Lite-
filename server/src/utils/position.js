// server/src/utils/position.js
const GAP = 1024;
const MIN_GAP_THRESHOLD = 1e-6;

/**
 * Computes fractional position for a card between two neighbors.
 * @param {string|null} beforeId - Task directly ABOVE the drop target
 * @param {string|null} afterId - Task directly BELOW the drop target
 * @param {object} taskModel - Mongoose Task Model instance (optional for pure unit testing)
 */
async function computePosition(beforeId, afterId, taskModel) {
  if (!taskModel) {
    // If numbers are directly passed (helper mode)
    const beforePos = typeof beforeId === 'number' ? beforeId : null;
    const afterPos = typeof afterId === 'number' ? afterId : null;

    if (beforePos !== null && afterPos !== null) return (beforePos + afterPos) / 2;
    if (beforePos !== null) return beforePos + GAP;
    if (afterPos !== null) return afterPos / 2;
    return GAP;
  }

  const [before, after] = await Promise.all([
    beforeId ? taskModel.findById(beforeId).select('position').lean() : null,
    afterId ? taskModel.findById(afterId).select('position').lean() : null,
  ]);

  if (before && after) return (before.position + after.position) / 2;
  if (before) return before.position + GAP;
  if (after) return after.position / 2;
  return GAP;
}

/**
 * Rebalances all task positions in a column when gaps become excessively small (< 1e-6)
 */
async function rebalance(projectId, columnId, taskModel) {
  const tasks = await taskModel
    .find({ project: projectId, columnId, deletedAt: null })
    .sort({ position: 1 })
    .select('_id')
    .lean();

  if (!tasks.length) return;

  await taskModel.bulkWrite(
    tasks.map((t, i) => ({
      updateOne: {
        filter: { _id: t._id },
        update: { $set: { position: (i + 1) * GAP } },
      },
    }))
  );
}

module.exports = { computePosition, rebalance, GAP, MIN_GAP_THRESHOLD };
