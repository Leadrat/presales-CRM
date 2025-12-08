import { fetchWithAuth } from "./api/fetchWithAuth";

export const API_BASE = "http://localhost:5033";

export async function signup(input: { fullName: string; email: string; password: string; phone?: string }) {
  const res = await fetch(`${API_BASE}/api/auth/signup`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ FullName: input.fullName, Email: input.email, Password: input.password, Phone: input.phone ?? null }),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data?.error?.message || "Signup failed");
  }
  return data;
}

export async function login(input: { email: string; password: string }) {
  const res = await fetch(`${API_BASE}/api/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ Email: input.email, Password: input.password }),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data?.error?.message || "Login failed");
  }
  return data as { data: { accessToken: string; refreshToken: string } };
}

export async function me() {
  const res = await fetchWithAuth(`${API_BASE}/api/me`, {
    method: "GET",
    cache: "no-store",
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data?.error?.message || "Unauthorized");
  }
  return data;
}

// Accounts API helpers

export type AccountDto = {
  id: string;
  companyName: string;
  // Legacy scalar fields
  website?: string | null;
  accountTypeId: string;
  accountSizeId: string;
  currentCrmId: string;
  numberOfUsers?: number | null;
  crmExpiry: string;
  createdByUserId: string;
  createdAt: string;
  updatedAt: string;
  isDeleted: boolean;
  accountTypeName: string;
  accountSizeName: string;
  crmProviderName: string;
  // Enriched profile fields (Spec 11)
  websiteUrl?: string | null;
  decisionMakers?: string | null;
  instagramUrl?: string | null;
  linkedinUrl?: string | null;
  phone?: string | null;
  email?: string | null;
  city?: string | null;
  // Spec 014: pipeline metadata
  leadSource?: string | null;
  dealStage?: string | null;
  // Computed account size label
  accountSize?: string | null;
  // Spec 17: Created By attribution
  createdByUserDisplayName?: string | null;
  assignedToUserId?: string | null;
  assignedToUserDisplayName?: string | null;
};

export type AccountCreateInput = {
  companyName: string;
  website?: string;
  accountTypeId: string;
  accountSizeId?: string;
  currentCrmId?: string;
  currentCrmName?: string; // Text input for CRM name
  numberOfUsers?: number;
  crmExpiry?: string; // MM/YY
  // Spec 014: pipeline metadata
  leadSource?: string;
  dealStage?: string;
  // Enriched profile fields (Spec 11)
  decisionMakers?: string;
  instagramUrl?: string;
  linkedinUrl?: string;
  phone?: string;
  email?: string;
  city?: string;
  createdByUserId?: string;
  assignedToUserId?: string;
  // Optional nested contacts to create with the account (Spec 12)
  contacts?: ContactCreateInput[];
};

export type AccountUpdateInput = {
  companyName: string;
  websiteUrl?: string | null;
  accountTypeId?: string | null;
  accountSizeId?: string | null;
  currentCrmId?: string | null;
  currentCrmName?: string | null; // Text input for CRM name
  crmProviderName?: string | null; // Alias for currentCrmName
  numberOfUsers?: number | null;
  crmExpiry?: string | null; // ISO date
  // Spec 014: pipeline metadata
  leadSource?: string | null;
  dealStage?: string | null;
  closedDate?: string | null;
  // Enriched profile fields (Spec 11)
  decisionMakers?: string | null;
  instagramUrl?: string | null;
  linkedinUrl?: string | null;
  phone?: string | null;
  email?: string | null;
  city?: string | null;
  createdByUserId?: string | null;
  assignedToUserId?: string | null;
  // Optional nested contacts to create with the account (Spec 12)
  contacts?: ContactCreateInput[];
};

// Users lookup
export type UserSummary = { id: string; fullName?: string | null; email: string };

export async function getUsers(): Promise<UserSummary[]> {
  const res = await fetchWithAuth(`${API_BASE}/api/Users`, {
    method: "GET",
    cache: "no-store",
  });
  const payload = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(payload?.error?.message || "Failed to load users");
  }
  const items = (payload?.data ?? payload ?? []) as any[];
  return items.map((u) => ({ id: u.id, fullName: u.fullName ?? null, email: u.email })) as UserSummary[];
}

export type TeamUser = {
  id: string;
  fullName?: string | null;
  email: string;
  phone?: string | null;
  isActive: boolean;
  roleName?: string | null;
  deactivatedAt?: string | null;
};

export type TeamUsersPage = {
  items: TeamUser[];
  totalCount: number;
  page: number;
  pageSize: number;
};

export async function getTeamUsers(params?: {
  status?: "all" | "active" | "inactive";
  page?: number;
  pageSize?: number;
}): Promise<TeamUsersPage> {
  const search = new URLSearchParams();
  if (params?.status) search.set("status", params.status);
  if (typeof params?.page === "number") search.set("page", String(params.page));
  if (typeof params?.pageSize === "number") search.set("pageSize", String(params.pageSize));

  const url = `${API_BASE}/api/Users/management${search.toString() ? `?${search.toString()}` : ""}`;

  const res = await fetchWithAuth(url, {
    method: "GET",
    cache: "no-store",
  });

  const payload = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(payload?.error?.message || "Failed to load team users");
  }

  const data = (payload?.data ?? payload ?? {}) as any;
  const rawItems = (data.items ?? []) as any[];

  const items: TeamUser[] = rawItems.map((u) => {
    const isActive = Boolean(u.isActive);
    const deactivatedAt: string | null =
      // Prefer an explicit deactivatedAt from the API if present
      (u.deactivatedAt as string | null | undefined) ??
      // Otherwise, if the user is inactive, fall back to updatedAt as a best-effort approximation
      (!isActive ? ((u.updatedAt as string | null | undefined) ?? null) : null);

    return {
      id: String(u.id),
      fullName: u.fullName ?? null,
      email: String(u.email ?? ""),
      phone: u.phone ?? null,
      isActive,
      roleName: u.roleName ?? null,
      deactivatedAt,
    };
  });

  return {
    items,
    totalCount: Number(data.totalCount ?? items.length),
    page: Number(data.page ?? (params?.page ?? 1)),
    pageSize: Number(data.pageSize ?? (params?.pageSize ?? (items.length || 20))),
  };
}

export type UserDetail = {
  id: string;
  email: string;
  fullName?: string | null;
  phone?: string | null;
  roleId?: string | null;
  roleName?: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
};

export type UserUpdateInput = {
  fullName?: string | null;
  email?: string | null;
  phone?: string | null;
  roleId?: string | null;
  isActive?: boolean | null;
};

export async function getUser(id: string): Promise<UserDetail> {
  const res = await fetchWithAuth(`${API_BASE}/api/Users/${id}`, {
    method: "GET",
    cache: "no-store",
  });

  const payload = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(payload?.error?.message || "Failed to load user");
  }

  const raw = (payload?.data ?? payload ?? {}) as any;
  return {
    id: String(raw.id),
    email: String(raw.email ?? ""),
    fullName: raw.fullName ?? null,
    phone: raw.phone ?? null,
    roleId: raw.roleId ? String(raw.roleId) : null,
    roleName: raw.roleName ?? null,
    isActive: Boolean(raw.isActive),
    createdAt: raw.createdAt ?? new Date().toISOString(),
    updatedAt: raw.updatedAt ?? new Date().toISOString(),
  };
}

export async function deleteUser(id: string): Promise<void> {
  const res = await fetchWithAuth(`${API_BASE}/api/Users/${id}`, {
    method: "DELETE",
  });
  if (!res.ok) {
    const payload = await res.json().catch(() => ({}));
    throw new Error(payload?.error?.message || "Failed to delete user");
  }
}

export type RoleOption = { id: string; name: string };

export async function getUserRoles(): Promise<RoleOption[]> {
  const res = await fetchWithAuth(`${API_BASE}/api/Users/roles`, {
    method: "GET",
    cache: "no-store",
  });
  const payload = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(payload?.error?.message || "Failed to load roles");
  }
  const items = (payload?.data ?? payload ?? []) as any[];
  return items.map((r) => ({ id: String(r.id), name: String(r.name || "") }));
}

export async function updateUser(id: string, input: UserUpdateInput): Promise<UserDetail> {
  const res = await fetchWithAuth(`${API_BASE}/api/Users/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      fullName: input.fullName ?? undefined,
      email: input.email ?? undefined,
      phone: input.phone ?? undefined,
      roleId: input.roleId ?? undefined,
      isActive: typeof input.isActive === "boolean" ? input.isActive : undefined,
    }),
  });

  const payload = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(payload?.error?.message || "Failed to update user");
  }

  const raw = (payload?.data ?? payload ?? {}) as any;
  return {
    id: String(raw.id),
    email: String(raw.email ?? ""),
    fullName: raw.fullName ?? null,
    phone: raw.phone ?? null,
    roleId: raw.roleId ? String(raw.roleId) : null,
    roleName: raw.roleName ?? null,
    isActive: Boolean(raw.isActive),
    createdAt: raw.createdAt ?? new Date().toISOString(),
    updatedAt: raw.updatedAt ?? new Date().toISOString(),
  };
}

export async function listAccounts() {
  const res = await fetchWithAuth(`${API_BASE}/api/Accounts`, {
    method: "GET",
    cache: "no-store",
  });
  const payload = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(payload?.error?.message || "Failed to load accounts");
  }
  return (payload?.data ?? []) as AccountDto[];
}

export type DashboardSummary = {
  totalAccountsCreated: number;
  demosScheduled: number;
  demosCompleted: number;
};

export async function getDashboardSummary(params?: { userIds?: string[] | null }): Promise<DashboardSummary> {
  const search = new URLSearchParams();
  if (params?.userIds && params.userIds.length > 0) {
    search.set("userIds", params.userIds.join(","));
  }

  const url = `${API_BASE}/api/Accounts/dashboard-summary${search.toString() ? `?${search.toString()}` : ""}`;
  const res = await fetchWithAuth(url, {
    method: "GET",
    cache: "no-store",
  });
  const payload = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(payload?.error?.message || "Failed to load dashboard summary");
  }
  const data = payload?.data ?? payload ?? {};
  return {
    totalAccountsCreated: Number(data.totalAccountsCreated ?? 0),
    demosScheduled: Number(data.demosScheduled ?? 0),
    demosCompleted: Number(data.demosCompleted ?? 0),
  };
}

// Spec 019: Analytics dashboard helpers

export type AnalyticsAccountsSummary = {
  created: number;
  modified: number;
  booked: number;
  lost: number;
};

export type DemosBySizeSummary = {
  little: number;
  small: number;
  medium: number;
  enterprise: number;
};

export async function getAnalyticsAccounts(params: {
  from?: string;
  to?: string;
  userId?: string | null;
  userIds?: string[] | null;
} = {}): Promise<AnalyticsAccountsSummary> {
  const search = new URLSearchParams();
  if (params.from) search.set("from", params.from);
  if (params.to) search.set("to", params.to);
  if (params.userIds && params.userIds.length > 0) {
    search.set("userIds", params.userIds.join(","));
  } else if (params.userId) {
    search.set("userId", params.userId);
  }

  const url = `${API_BASE}/api/analytics/accounts${search.toString() ? `?${search.toString()}` : ""}`;
  const res = await fetchWithAuth(url, {
    method: "GET",
    cache: "no-store",
  });

  const payload = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(payload?.error?.message || "Failed to load account analytics");
  }

  const data = payload?.data ?? payload ?? {};
  return {
    created: Number(data.created ?? 0),
    modified: Number(data.modified ?? 0),
    booked: Number(data.booked ?? 0),
    lost: Number(data.lost ?? 0),
  };
}

export async function getDemosBySize(params: {
  from?: string;
  to?: string;
  userId?: string | null;
  userIds?: string[] | null;
} = {}): Promise<DemosBySizeSummary> {
  const search = new URLSearchParams();
  if (params.from) search.set("from", params.from);
  if (params.to) search.set("to", params.to);
  if (params.userIds && params.userIds.length > 0) {
    search.set("userIds", params.userIds.join(","));
  } else if (params.userId) {
    search.set("userId", params.userId);
  }

  const url = `${API_BASE}/api/analytics/demos-by-size${search.toString() ? `?${search.toString()}` : ""}`;
  const res = await fetchWithAuth(url, {
    method: "GET",
    cache: "no-store",
  });

  const payload = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(payload?.error?.message || "Failed to load demos by size");
  }

  const data = payload?.data ?? payload ?? {};
  return {
    little: Number(data.little ?? 0),
    small: Number(data.small ?? 0),
    medium: Number(data.medium ?? 0),
    enterprise: Number(data.enterprise ?? 0),
  };
}

export async function getAccount(id: string) {
  const res = await fetchWithAuth(`${API_BASE}/api/Accounts/${id}`, {
    method: "GET",
    cache: "no-store",
  });
  const payload = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(payload?.error?.message || "Failed to load account");
  }
  return payload?.data as AccountDto;
}

// Account Detail (Specs 9 & 10)

export type AccountDetailDto = {
  id: string;
  companyName: string;

  // identifiers
  accountTypeId: string;
  accountSizeId: string;
  currentCrmId: string;

  // optional scalars
  website?: string | null;
  numberOfUsers?: number | null;

  // enriched profile fields (Spec 11)
  websiteUrl?: string | null;
  decisionMakers?: string | null;
  instagramUrl?: string | null;
  linkedinUrl?: string | null;
  phone?: string | null;
  email?: string | null;
  city?: string | null;

  // lookup display names
  accountTypeName: string;
  accountSizeName: string;
  crmProviderName: string;

  // Spec 014: pipeline metadata
  leadSource?: string | null;
  dealStage?: string | null;
  closedDate?: string | null;

  crmExpiry: string;
  createdAt: string;
  updatedAt?: string;

  // Ownership / counts
  createdByUserId?: string;
  // Optional display name for the creator
  createdByUserDisplayName?: string | null;
  assignedToUserId?: string | null;
  assignedToUserDisplayName?: string | null;

  contactCount: number;
  noteCount: number;
  demoCount: number;
  opportunityCount: number;
  activityCount: number;
};

export async function getAccountDetail(id: string): Promise<{ data: AccountDetailDto } | { error: { code: string; message: string } }> {
  const res = await fetchWithAuth(`${API_BASE}/api/Accounts/${id}/detail`, {
    method: "GET",
    cache: "no-store",
  });

  const payload = await res.json().catch(() => ({}));

  if (!res.ok) {
    // Surface error shape so caller can handle 403/404 specifically
    const code = payload?.error?.code ?? "UNKNOWN_ERROR";
    const message = payload?.error?.message ?? "Failed to load account detail";
    return { error: { code, message } };
  }

  return { data: (payload?.data as AccountDetailDto) ?? ({} as AccountDetailDto) };
}

// Child tab APIs (Spec 10)

export type AccountContactSummary = {
  id: string;
  name: string;
  email?: string | null;
  phone?: string | null; // legacy primary phone (work or personal)
  position?: string | null; // legacy designation
  // Spec 012 enriched fields
  personalPhone?: string | null;
  workPhone?: string | null;
  designation?: string | null;
  city?: string | null;
  dateOfBirth?: string | null; // ISO UTC from backend
  instagramUrl?: string | null;
  linkedinUrl?: string | null;
  createdAt: string;
  updatedAt: string;
};

export type AccountNoteSummary = {
  id: string;
  title: string;
  snippet: string;
  createdAt: string;
  updatedAt: string;
};

// Legacy flat activity log entry (from older /activity-log endpoint)
export type AccountActivityLogEntry = {
  id: string;
  timestamp: string;
  type: string;
  description: string;
};

// New structured activity log entry (Spec 16 Activity Log v2)
export type AccountActivityEntry = {
  id: string;
  accountId: string;
  eventType: string;
  description: string;
  timestamp: string;
  actorId?: string | null;
  actorName: string;
  relatedEntityType?: string | null;
  relatedEntityId?: string | null;
};

export type AccountActivityFilters = {
  eventTypes?: string[];
  from?: string;
  to?: string;
  actorId?: string;
  cursor?: string;
  limit?: number;
};

export type AccountActivityResult = {
  items: AccountActivityEntry[];
  nextCursor: string | null;
};

export type DemoStatus = "Scheduled" | "Completed" | "Cancelled" | "NoShow";

export type AccountDemoSummary = {
  id: string;
  accountId: string;
  scheduledAt: string;
  doneAt?: string | null;
  status: DemoStatus;
  demoAlignedByUserId: string;
  demoAlignedByName?: string | null;
  demoDoneByUserId?: string | null;
  demoDoneByName?: string | null;
  attendees?: string | null;
  notes?: string | null;
  createdAt: string;
  updatedAt: string;
};

export async function getAccountContacts(id: string): Promise<AccountContactSummary[]> {
  const res = await fetchWithAuth(`${API_BASE}/api/Accounts/${id}/contacts`, {
    method: "GET",
    cache: "no-store",
  });
  const payload = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(payload?.error?.message || "Failed to load contacts");
  }
  return (payload?.data ?? []) as AccountContactSummary[];
}

export async function getAccountDemos(id: string): Promise<AccountDemoSummary[]> {
  const res = await fetchWithAuth(`${API_BASE}/api/Accounts/${id}/demos`, {
    method: "GET",
    cache: "no-store",
  });
  
  if (!res.ok) {
    const error = await res.json().catch(() => ({}));
    throw new Error(error?.message || "Failed to load demos");
  }
  
  const data = await res.json();
  // Handle case where response is wrapped in a 'data' property or is the array directly
  return Array.isArray(data) ? data : data.data || [];
}

/**
 * Create a new demo for an account
 */
export async function createAccountDemo(
  accountId: string,
  input: {
    scheduledAt: string;
    status?: DemoStatus;
    attendees?: string;
    notes?: string;
    doneAt?: string | null;
    demoAlignedByUserId?: string | null;
    demoDoneByUserId?: string | null;
  },
  userId: string
): Promise<AccountDemoSummary> {
  try {
    // Format the payload according to the API contract
    const payload = {
      scheduledAt: input.scheduledAt,
      status: input.status || "Scheduled",
      doneAt: input.doneAt ?? null,
      demoAlignedByUserId: input.demoAlignedByUserId || userId,
      demoDoneByUserId: input.demoDoneByUserId ?? null,
      attendees: input.attendees || "",
      notes: input.notes || null,
    };
    
    const res = await fetchWithAuth(`${API_BASE}/api/Accounts/${accountId}/demos`, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      let errorData;
      try {
        errorData = await res.json();
      } catch {
        errorData = await res.text().catch(() => ({}));
      }
      
      throw new Error(
        errorData?.error?.message || errorData?.message || 
        `Failed to create demo: ${res.status} ${res.statusText}`
      );
    }

    const data = await res.json();
    // API wraps payload in { data: ... } – unwrap to return the Demo object itself
    const demo = (data as { data?: AccountDemoSummary }).data ?? data;
    return demo as AccountDemoSummary;
  } catch (error) {
    throw new Error(
      error instanceof Error ? 
      error.message : 
      'Failed to create demo. Please try again.'
    );
  }
}

/**
 * Update an existing demo
 */
export async function updateDemo(
  accountId: string,
  demoId: string,
  input: {
    scheduledAt?: string;
    status?: DemoStatus;
    doneAt?: string | null;
    demoDoneByUserId?: string | null;
    attendees?: string;
    notes?: string | null;
    completionAttendees?: string;
    completionNotes?: string | null;
  }
): Promise<AccountDemoSummary> {
  const res = await fetchWithAuth(`${API_BASE}/api/Accounts/${accountId}/demos/${demoId}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });

  if (!res.ok) {
    const error = await res.json().catch(() => ({}));
    throw new Error(error?.error?.message || error?.message || "Failed to update demo");
  }

  const payload = await res.json().catch(() => ({}));
  const demo = (payload as { data?: AccountDemoSummary }).data ?? payload;
  return demo as AccountDemoSummary;
}

/**
 * Mark a demo as completed
 */
export async function completeDemo(
  accountId: string,
  demoId: string,
  doneAt?: string,
  demoDoneByUserId?: string,
  notes?: string,
  attendees?: string
): Promise<AccountDemoSummary> {
  return updateDemo(accountId, demoId, {
    status: "Completed",
    doneAt: doneAt || new Date().toISOString(),
    demoDoneByUserId: demoDoneByUserId || null,
    ...(notes && { notes }),
    ...(attendees && { attendees }),
  });
}

/**
 * Delete a demo
 */
export async function deleteDemo(accountId: string, demoId: string): Promise<void> {
  const res = await fetchWithAuth(`${API_BASE}/api/Accounts/${accountId}/demos/${demoId}`, {
    method: "DELETE",
  });

  if (!res.ok) {
    const error = await res.json().catch(() => ({}));
    throw new Error(error?.message || "Failed to delete demo");
  }
}

// Contacts create/update (Spec 012)

export type ContactCreateInput = {
  name: string;
  email?: string;
  personalPhone?: string;
  workPhone?: string;
  designation?: string;
  city?: string;
  /**
   * Optional date of birth. The backend accepts a flexible string format and stores UTC.
   * Frontend forms can send an ISO date string or a normalized value.
   */
  dateOfBirth?: string;
  instagramUrl?: string;
  linkedinUrl?: string;
  notes?: string;
};

export type ContactUpdateInput = {
  name?: string;
  email?: string;
  personalPhone?: string;
  workPhone?: string;
  designation?: string;
  city?: string;
  dateOfBirth?: string | null;
  instagramUrl?: string;
  linkedinUrl?: string;
};

export async function createContact(accountId: string, input: ContactCreateInput): Promise<AccountContactSummary> {
  const res = await fetchWithAuth(`${API_BASE}/api/Accounts/${accountId}/contacts`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      name: input.name,
      email: input.email ?? null,
      personalPhone: input.personalPhone ?? null,
      workPhone: input.workPhone ?? null,
      designation: input.designation ?? null,
      city: input.city ?? null,
      dateOfBirth: input.dateOfBirth ?? null,
      instagramUrl: input.instagramUrl ?? null,
      linkedinUrl: input.linkedinUrl ?? null,
    }),
  });
  const payload = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(payload?.error?.message || "Failed to create contact");
  }
  return (payload?.data ?? {}) as AccountContactSummary;
}

export async function deleteContact(accountId: string, contactId: string): Promise<void> {
  const res = await fetchWithAuth(`${API_BASE}/api/Accounts/${accountId}/contacts/${contactId}`, {
    method: "DELETE",
  });
  const payload = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(payload?.error?.message || "Failed to delete contact");
  }
}

export async function updateContact(
  accountId: string,
  contactId: string,
  input: ContactUpdateInput,
): Promise<AccountContactSummary> {
  const res = await fetchWithAuth(`${API_BASE}/api/Accounts/${accountId}/contacts/${contactId}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      name: input.name ?? null,
      email: input.email ?? null,
      personalPhone: input.personalPhone ?? null,
      workPhone: input.workPhone ?? null,
      designation: input.designation ?? null,
      city: input.city ?? null,
      // When dateOfBirth is explicitly null, clear it; when undefined, leave unchanged.
      dateOfBirth: input.dateOfBirth ?? undefined,
      instagramUrl: input.instagramUrl ?? null,
      linkedinUrl: input.linkedinUrl ?? null,
    }),
  });
  const payload = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(payload?.error?.message || "Failed to update contact");
  }
  return (payload?.data ?? {}) as AccountContactSummary;
}

export async function getAccountNotes(id: string): Promise<AccountNoteSummary[]> {
  const res = await fetchWithAuth(`${API_BASE}/api/Accounts/${id}/notes`, {
    method: "GET",
    cache: "no-store",
  });
  const payload = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(payload?.error?.message || "Failed to load notes");
  }
  return (payload?.data ?? []) as AccountNoteSummary[];
}

export async function getAccountActivity(
  id: string,
  filters?: AccountActivityFilters,
): Promise<AccountActivityResult> {
  const params = new URLSearchParams();

  if (filters?.eventTypes && filters.eventTypes.length > 0) {
    params.set("eventTypes", filters.eventTypes.join(","));
  }
  if (filters?.from) {
    params.set("from", filters.from);
  }
  if (filters?.to) {
    params.set("to", filters.to);
  }
  if (filters?.actorId) {
    params.set("actorId", filters.actorId);
  }
  if (filters?.cursor) {
    params.set("cursor", filters.cursor);
  }
  if (typeof filters?.limit === "number") {
    params.set("limit", String(filters.limit));
  }

  const query = params.toString();
  const url = `${API_BASE}/api/Accounts/${id}/activity${query ? `?${query}` : ""}`;

  const res = await fetchWithAuth(url, {
    method: "GET",
    cache: "no-store",
  });
  const payload = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(payload?.error?.message || "Failed to load activity log");
  }
  const data = payload?.data ?? {};
  const items = (data?.items ?? []) as AccountActivityEntry[];
  const nextCursor = (data?.nextCursor ?? null) as string | null;
  return { items, nextCursor };
}

// Legacy helper for the older /activity-log endpoint
export async function getAccountActivityLog(id: string): Promise<AccountActivityLogEntry[]> {
  const res = await fetchWithAuth(`${API_BASE}/api/Accounts/${id}/activity-log`, {
    method: "GET",
    cache: "no-store",
  });
  const payload = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(payload?.error?.message || "Failed to load activity log");
  }
  return (payload?.data ?? []) as AccountActivityLogEntry[];
}

export async function createAccount(input: AccountCreateInput) {
  const res = await fetchWithAuth(`${API_BASE}/api/Accounts`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      companyName: input.companyName,
      website: input.website ?? null,
      accountTypeId: input.accountTypeId,
      accountSizeId: input.accountSizeId,
      currentCrmId: input.currentCrmId ?? null,
      currentCrmName: input.currentCrmName ?? null,
      numberOfUsers: input.numberOfUsers ?? null,
      crmExpiry: input.crmExpiry ?? null,
      leadSource: input.leadSource ?? null,
      dealStage: input.dealStage ?? null,
      // Spec 11 enriched profile fields
      decisionMakers: input.decisionMakers ?? null,
      instagramUrl: input.instagramUrl ?? null,
      linkedinUrl: input.linkedinUrl ?? null,
      phone: input.phone ?? null,
      email: input.email ?? null,
      city: input.city ?? null,
      contacts: input.contacts
        ? input.contacts.map((c) => ({
            name: c.name,
            email: c.email ?? null,
            personalPhone: c.personalPhone ?? null,
            workPhone: c.workPhone ?? null,
            designation: c.designation ?? null,
            city: c.city ?? null,
            dateOfBirth: c.dateOfBirth ?? null,
            instagramUrl: c.instagramUrl ?? null,
            linkedinUrl: c.linkedinUrl ?? null,
          }))
        : null,
    }),
  });
  const payload = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(payload?.error?.message || "Failed to create account");
  }
  return payload?.data as AccountDto;
}

export async function updateAccount(id: string, input: AccountUpdateInput) {
  // Convert crmExpiry from ISO to MM/YY format if it's an ISO date
  let crmExpiryFormatted: string | null = null;
  if (input.crmExpiry === "") {
    // Explicit empty string means: clear CrmExpiry on the backend
    crmExpiryFormatted = "";
  } else if (input.crmExpiry) {
    // Check if it's already in MM/YY format
    if (/^\d{2}\/\d{2}$/.test(input.crmExpiry)) {
      crmExpiryFormatted = input.crmExpiry;
    } else {
      // Assume ISO format, convert to MM/YY
      try {
        const date = new Date(input.crmExpiry);
        const mm = String(date.getMonth() + 1).padStart(2, "0");
        const yy = String(date.getFullYear()).slice(-2);
        crmExpiryFormatted = `${mm}/${yy}`;
      } catch {
        crmExpiryFormatted = null;
      }
    }
  }

  const res = await fetchWithAuth(`${API_BASE}/api/Accounts/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      companyName: input.companyName,
      website: input.websiteUrl ?? null, // Backend expects 'website' not 'websiteUrl'
      accountTypeId: input.accountTypeId || "00000000-0000-0000-0000-000000000000", // Required Guid
      accountSizeId: input.accountSizeId || "00000000-0000-0000-0000-000000000000", // Required Guid
      currentCrmId: input.currentCrmId ?? null,
      currentCrmName: input.currentCrmName ?? input.crmProviderName ?? null,
      numberOfUsers: input.numberOfUsers ?? null,
      crmExpiry: crmExpiryFormatted, // Must be MM/YY format
      leadSource: input.leadSource ?? null,
      dealStage: input.dealStage ?? null,
      closedDate: input.closedDate ?? null,
      // Spec 11 enriched profile fields (partial update semantics)
      decisionMakers: input.decisionMakers ?? null,
      instagramUrl: input.instagramUrl ?? null,
      linkedinUrl: input.linkedinUrl ?? null,
      phone: input.phone ?? null,
      email: input.email ?? null,
      city: input.city ?? null,
      createdByUserId: input.createdByUserId || undefined,
      assignedToUserId: input.assignedToUserId || undefined,
    }),
  });
  const payload = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(payload?.error?.message || "Failed to update account");
  }
  return payload?.data as AccountDto;
}

export async function softDeleteAccount(id: string) {
  const res = await fetchWithAuth(`${API_BASE}/api/Accounts/${id}`, {
    method: "DELETE",
  });
  if (!res.ok) {
    const payload = await res.json().catch(() => ({}));
    throw new Error(payload?.error?.message || "Failed to delete account");
  }
}

// Lookup helpers for Accounts

export type AccountTypeOption = { id: string; name: string };
export type AccountSizeOption = { id: string; name: string; minUsers?: number | null; maxUsers?: number | null };
export type CrmProviderOption = { id: string; name: string; website?: string | null };

export type AccountLookups = {
  accountTypes: AccountTypeOption[];
  accountSizes: AccountSizeOption[];
  crmProviders: CrmProviderOption[];
};

export async function getAccountLookups(): Promise<AccountLookups> {
  const res = await fetchWithAuth(`${API_BASE}/api/Accounts/lookups`, {
    method: "GET",
    cache: "no-store",
  });
  const payload = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(payload?.error?.message || "Failed to load account lookups");
  }
  return (payload?.data ?? {
    accountTypes: [],
    accountSizes: [],
    crmProviders: [],
  }) as AccountLookups;
}
