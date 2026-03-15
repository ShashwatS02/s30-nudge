const API_URL = import.meta.env.VITE_API_URL || "http://localhost:4000";

export type ItemStatus = "open" | "in_progress" | "done" | "overdue" | "cancelled";

export type ItemType =
  | "task"
  | "bill"
  | "renewal"
  | "follow_up"
  | "appointment"
  | "document_request";

export type User = {
  id: string;
  fullName: string;
  email: string;
  defaultSpaceId: string;
};

export type AuthResponse = {
  accessToken: string;
  user: User;
};

type RequestOptions = RequestInit & {
  accessToken?: string | null;
};

function buildUrl(path: string, params?: Record<string, string | boolean | undefined>) {
  const url = new URL(path, API_URL);

  if (params) {
    for (const [key, value] of Object.entries(params)) {
      if (value !== undefined) {
        url.searchParams.set(key, String(value));
      }
    }
  }

  return url.toString();
}

async function readErrorMessage(response: Response) {
  let message = `Request failed with status ${response.status}`;

  try {
    const errorData = await response.json();
    if (errorData?.error) {
      message = errorData.error;
    }
  } catch {}

  return message;
}

async function request<T>(input: string, init?: RequestOptions): Promise<T> {
  const { accessToken, headers, ...rest } = init ?? {};

  const response = await fetch(input, {
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
      ...(headers ?? {})
    },
    ...rest
  });

  if (!response.ok) {
    throw new Error(await readErrorMessage(response));
  }

  if (response.status === 204) {
    return undefined as T;
  }

  return response.json() as Promise<T>;
}

export type Item = {
  id: string;
  spaceId: string;
  createdBy: string;
  title: string;
  description: string | null;
  itemType: ItemType;
  status: ItemStatus;
  priority: number;
  dueAt: string | null;
  completedAt: string | null;
  snoozedUntil: string | null;
  createdAt: string;
  updatedAt: string;
};

export type ItemsResponse = {
  items: Item[];
};

export type DashboardResponse = {
  counts: {
    overdue: number;
    today: number;
    upcoming: number;
    noDueDate: number;
    totalOpen: number;
  };
  groups: {
    overdue: Item[];
    today: Item[];
    upcoming: Item[];
    noDueDate: Item[];
  };
};

export async function signUp(input: {
  fullName: string;
  email: string;
  password: string;
}) {
  return request<AuthResponse>(buildUrl("/auth/signup"), {
    method: "POST",
    body: JSON.stringify(input)
  });
}

export async function login(input: {
  email: string;
  password: string;
}) {
  return request<AuthResponse>(buildUrl("/auth/login"), {
    method: "POST",
    body: JSON.stringify(input)
  });
}

export async function refreshSession(): Promise<AuthResponse | null> {
  const response = await fetch(buildUrl("/auth/refresh"), {
    method: "POST",
    credentials: "include",
    headers: {
      "Content-Type": "application/json"
    }
  });

  if (response.status === 204) {
    return null;
  }

  if (!response.ok) {
    throw new Error(await readErrorMessage(response));
  }

  return response.json() as Promise<AuthResponse>;
}

export async function logout() {
  return request<void>(buildUrl("/auth/logout"), {
    method: "POST"
  });
}

export async function logoutAll(accessToken: string) {
  return request<void>(buildUrl("/auth/logout-all"), {
    method: "POST",
    accessToken
  });
}


export async function getMe(accessToken: string) {
  return request<{ user: User }>(buildUrl("/auth/me"), {
    method: "GET",
    accessToken
  });
}

export async function getItems(params?: {
  spaceId?: string;
  status?: ItemStatus;
  sort?: "oldest" | "latest";
  snoozed?: boolean;
}) {
  return request<ItemsResponse>(buildUrl("/items", params));
}

export async function createItem(input: {
  spaceId: string;
  createdBy: string;
  title: string;
  description?: string;
  itemType: ItemType;
  priority?: number;
  dueAt?: string;
}) {
  return request<Item>(buildUrl("/items"), {
    method: "POST",
    body: JSON.stringify(input)
  });
}

export async function updateItemStatus(id: string, status: ItemStatus) {
  return request<Item>(buildUrl(`/items/${id}/status`), {
    method: "PATCH",
    body: JSON.stringify({ status })
  });
}

export async function snoozeItem(id: string, snoozedUntil: string | null) {
  return request<Item>(buildUrl(`/items/${id}/snooze`), {
    method: "PATCH",
    body: JSON.stringify({ snoozedUntil })
  });
}

export async function getDashboard(spaceId: string) {
  return request<DashboardResponse>(buildUrl("/dashboard", { spaceId }));
}

export async function forgotPassword(email: string) {
  return request<{ message: string }>(buildUrl("/auth/forgot-password"), {
    method: "POST",
    body: JSON.stringify({ email })
  });
}

export async function resetPassword(input: { token: string; password: string }) {
  return request<{ message: string }>(buildUrl("/auth/reset-password"), {
    method: "POST",
    body: JSON.stringify(input)
  });
}

export async function changePassword(
  accessToken: string,
  input: { currentPassword: string; newPassword: string }
) {
  return request<{ message: string }>(buildUrl("/auth/change-password"), {
    method: "POST",
    accessToken,
    body: JSON.stringify(input)
  });
}


export async function updateItem(
  id: string,
  input: {
    title?: string;
    description?: string;
    itemType?: ItemType;
    dueAt?: string | null;
  }
) {
  return request<Item>(buildUrl(`/items/${id}`), {
    method: "PATCH",
    body: JSON.stringify(input)
  });
}

export async function deleteItem(id: string) {
  return request<void>(buildUrl(`/items/${id}`), {
    method: "DELETE"
  });
}

export async function googleLogin(idToken: string) {
  return request<AuthResponse>(buildUrl("/auth/google"), {
    method: "POST",
    body: JSON.stringify({ idToken })
  });
}

