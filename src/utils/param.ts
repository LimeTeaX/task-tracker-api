export function getParamId(params: Record<string, any>): string {
  const id = params.id;
  if (Array.isArray(id)) return id[0];
  return id;
}

export function getParamUserId(params: Record<string, any>): string {
  const userId = params.userId;
  if (Array.isArray(userId)) return userId[0];
  return userId;
}
