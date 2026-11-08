export async function apiRequest<T>(
  path: string,
  options: RequestInit = {},
): Promise<T> {
  const response = await fetch(path, {
    ...options,
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      ...(options.headers || {}),
    },
  });

  if (!response.ok) {
    let errorMessage = `Lỗi máy chủ (${response.status})`;
    try {
      const errJson = (await response.json()) as {
        message?: string | string[];
      };
      if (Array.isArray(errJson.message)) {
        errorMessage = errJson.message[0] || errorMessage;
      } else if (typeof errJson.message === 'string') {
        errorMessage = errJson.message;
      }
    } catch {
      // Ignore JSON parse fallback
    }
    throw new Error(errorMessage);
  }

  return (await response.json()) as T;
}
