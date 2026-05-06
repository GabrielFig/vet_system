export function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

export function paginate<T>(items: T[], page: number, limit: number) {
  const total = items.length;
  const data = items.slice((page - 1) * limit, page * limit);
  return { data, total, page, limit, totalPages: Math.ceil(total / limit) };
}
