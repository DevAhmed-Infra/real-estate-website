
function encodeCursor(id) {
  return Buffer.from(id).toString("base64");
}


function decodeCursor(cursor) {
  return Buffer.from(cursor, "base64").toString("utf-8");
}


async function applyPagination(
  query,
  cursor,
  limit = 20,
  sortField = "_id",
  sortOrder = 1,
) {
  const requestedLimit = Math.min(parseInt(limit, 10) || 20, 100);

  query.sort({ [sortField]: sortOrder });

  if (cursor) {
    const decodedId = decodeCursor(cursor);
    if (sortOrder === 1) {
      query.where(sortField).gt(decodedId);
    } else {
      query.where(sortField).lt(decodedId);
    }
  }

  const results = await query.limit(requestedLimit + 1).lean();

  const hasNextPage = results.length > requestedLimit;
  const items = results.slice(0, requestedLimit);

  const nextCursor = hasNextPage ? encodeCursor(items[items.length - 1]._id.toString()) : null;

  return {
    results: items,
    nextCursor,
    hasNextPage,
    limit: requestedLimit,
  };
}

module.exports = {
  encodeCursor,
  decodeCursor,
  applyPagination,
};

