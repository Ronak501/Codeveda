async function apiRequest(url, options = {}) {
  const response = await fetch(url, {
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      ...(options.headers || {}),
    },
    ...options,
  });

  const contentType = response.headers.get("content-type") || "";
  const data = contentType.includes("application/json")
    ? await response.json()
    : null;

  if (!response.ok) {
    const message = data?.message || "Request failed";
    const details = data?.errors?.length ? `: ${data.errors.join(", ")}` : "";
    throw new Error(message + details);
  }

  return data;
}

export const authApi = {
  signup: (payload) =>
    apiRequest("/api/auth/signup", {
      method: "POST",
      body: JSON.stringify(payload),
    }),
  login: (payload) =>
    apiRequest("/api/auth/login", {
      method: "POST",
      body: JSON.stringify(payload),
    }),
  logout: () => apiRequest("/api/auth/logout", { method: "POST" }),
  me: () => apiRequest("/api/auth/me"),
};

export const productApi = {
  list: (params = {}) => {
    const query = new URLSearchParams();

    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== "") {
        query.set(key, String(value));
      }
    });

    const suffix = query.toString() ? `?${query.toString()}` : "";
    return apiRequest(`/api/products${suffix}`);
  },
  create: (payload) =>
    apiRequest("/api/products", {
      method: "POST",
      body: JSON.stringify(payload),
    }),
  update: (id, payload) =>
    apiRequest(`/api/products/${id}`, {
      method: "PUT",
      body: JSON.stringify(payload),
    }),
  remove: (id) => apiRequest(`/api/products/${id}`, { method: "DELETE" }),
};
