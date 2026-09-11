export interface Pagination {
  page: number;
  limit: number;
  skip: number;
}

const DEFAULT_LIMIT = 50;
const MAX_LIMIT = 100;

function toPositiveInt(value: unknown, fallback: number) {
  const parsed =
    typeof value === "string" ? Number.parseInt(value, 10) : NaN;

  if (!Number.isFinite(parsed) || parsed < 1) {
    return fallback;
  }

  return Math.floor(parsed);
}

export function parsePagination(query: {
  page?: unknown;
  limit?: unknown;
}): Pagination {
  const page = toPositiveInt(query.page, 1);
  const limit = Math.min(
    toPositiveInt(query.limit, DEFAULT_LIMIT),
    MAX_LIMIT
  );

  return {
    page,
    limit,
    skip: (page - 1) * limit,
  };
}
