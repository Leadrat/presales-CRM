"use client";

import React, { useEffect, useState, useCallback, useMemo } from "react";
import { useParams, useRouter, usePathname } from "next/navigation";
import { ArrowLeft, Plus, Download, Circle, Trash2, FileEdit, CalendarDays, CheckCircle2, Pencil, FileText, Phone, Mail, MapPin, ExternalLink, Clock4, UserRound, Users, NotebookPen, XCircle, Building2 } from "lucide-react";
import { getAccountDetail, type AccountDetailDto, updateAccount, getAccountLookups, getAccountContacts, getAccountDemos, getAccountActivity, createAccountDemo, updateDemo, deleteDemo, softDeleteAccount, deleteContact, type AccountContactSummary, type AccountDemoSummary, type AccountActivityEntry, getUsers, type UserSummary, type DemoStatus } from "@/lib/api";
import { computeSizeLabel, accountSizeTagClass } from "@/lib/account-utils";
import { AddContactModal } from "@/components/contacts/AddContactModal";
import DateTimePicker from "@/components/form/date-time-picker";
import { useAuth } from "@/context/AuthContext";
import PlaceholderSelect from "@/components/form/PlaceholderSelect";
import PlaceholderInput from "@/components/form/PlaceholderInput";
import PhoneNumberInput from "@/components/form/PhoneNumberInput";
import CrmProviderSelect from "@/components/form/CrmProviderSelect";
import CrmProviderMultiSelect from "@/components/form/CrmProviderMultiSelect";

const DEMO_CARD_THEME: Record<string, string> = {
  // All demo cards use the same neutral card styling; status is indicated only by the badge
  Scheduled: "border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-900/80",
  Completed: "border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-900/80",
  Cancelled: "border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-900/80",
  NoShow: "border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-900/80",
};

const DEMO_BADGE_THEME: Record<string, string> = {
  // Simple rectangular pill badge with subtle neutral colors for all statuses
  Scheduled: "bg-gray-100 text-gray-800 border border-gray-200 dark:bg-gray-800 dark:text-gray-100 dark:border-gray-600",
  Completed: "bg-gray-100 text-gray-800 border border-gray-200 dark:bg-gray-800 dark:text-gray-100 dark:border-gray-600",
  Cancelled: "bg-gray-100 text-gray-800 border border-gray-200 dark:bg-gray-800 dark:text-gray-100 dark:border-gray-600",
  NoShow: "bg-gray-100 text-gray-800 border border-gray-200 dark:bg-gray-800 dark:text-gray-100 dark:border-gray-600",
};

const DEMO_ICON_THEME: Record<string, string> = {
  Scheduled: "text-blue-500",
  Completed: "text-green-500",
  Cancelled: "text-red-500",
  NoShow: "text-amber-500",
};

type DemoCardModel = {
  id: string;
  status: DemoStatus;
  headerText?: string | null;
  scheduledLabel: string;
  scheduledBy: string;
  demoBy: string;
  updatedLabel: string;
  attendees: string[];
  doneByBadge?: string | null;
  notes: string;
  original: AccountDemoSummary;
};

// Helper: format lead source for display
function formatLeadSourceLabel(src: string | null | undefined): string {
  if (!src) return "";
  const map: Record<string, string> = {
    LINKEDIN: "LinkedIn", INSTAGRAM: "Instagram", WEBSITE: "Website",
    COLD_CALL: "Cold call", FACEBOOK: "Facebook", GOOGLE_ADS: "Google Ads", REFERRAL: "Referral"
  };
  return map[src] || src;
}

// Helper: format deal stage for display
function formatDealStageLabel(stage: string | null | undefined): string {
  if (!stage) return "";
  const map: Record<string, string> = {
    NEW_LEAD: "New Lead",
    QUALIFIED: "Qualification",
    QUALIFICATION: "Qualification",
    DEMO_SCHEDULED: "Demo Scheduled",
    DEMO_DONE: "Demo Done",
    PROPOSAL_SENT: "Proposal Sent",
    NEGOTIATION: "Negotiation",
    WON: "Closed Won",
    LOST: "Closed Lost",
    // Backwards compatibility for older codes
    CONTACTED: "Qualification",
    IN_PROGRESS: "Negotiation",
    PROSPECTING: "New Lead",
    PROPOSAL: "Proposal Sent",
  };
  return map[stage] || stage;
}

// Helper: format CRM provider for display; hide sentinel values
function formatCrmProviderDisplay(name: string | null | undefined): string {
  if (!name) return "";
  const trimmed = name.trim();
  if (trimmed === "None" || trimmed === "None/Unknown") {
    return "";
  }
  return trimmed;
}

// Helper: format CRM expiry for display (MM/YY)
function formatCrmExpiryDisplay(val: string | null | undefined): string {
  if (!val) return "";
  if (/^\d{2}\/\d{2}$/.test(val)) return val;
  const d = new Date(val);
  if (isNaN(d.getTime())) return val;
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const yy = String(d.getFullYear()).slice(-2);
  return `${mm}/${yy}`;
}

// Helper: format activity title
function formatActivityTitle(eventType: string | null | undefined): string {
  if (!eventType) return "Activity";
  const map: Record<string, string> = {
    ACCOUNT_CREATED: "Account Created", ACCOUNT_UPDATED: "Account Updated",
    CONTACT_ADDED: "Contact Added", CONTACT_DELETED: "Contact Deleted",
    DEMO_SCHEDULED: "Demo Scheduled", DEMO_COMPLETED: "Demo Completed",
    DEMO_UPDATED: "Demo Updated", DEMO_DELETED: "Demo Deleted"
  };
  return map[eventType] || eventType.replace(/_/g, " ");
}

// Helper: normalize demo notes
function normalizeDemoNotes(note?: string | null): string {
  if (!note) return "";
  const trimmed = note.trim();
  if (!trimmed) return "";

  if (trimmed.startsWith("{") && trimmed.endsWith("}")) {
    try {
      const parsed = JSON.parse(trimmed);
      if (parsed && typeof parsed === "object") {
        const parts = Object.values(parsed)
          .map((value) => (typeof value === "string" ? value.trim() : ""))
          .filter((value) => value.length > 0);
        if (parts.length > 0) {
          return parts.join("\n");
        }
      }
    } catch {
      // Ignore JSON parse errors and fall through to trimmed text
    }
  }

  return trimmed;
}

function formatDateTime(value?: string | null): string {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value ?? "—";
  }

  return date.toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

function parseAttendees(value?: string | null): string[] {
  if (!value) return [];
  return value
    .split(",")
    .map((token) => token.trim())
    .filter((token) => token.length > 0);
}

export default function AdminAccountDetailPage() {
  const router = useRouter();
  const params = useParams();
  const pathname = usePathname();
  const id = params?.id as string | undefined;
  const { user } = useAuth();

  // Data state
  const [detail, setDetail] = useState<AccountDetailDto | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lookups, setLookups] = useState<any>(null);
  const [teamMembers, setTeamMembers] = useState<UserSummary[]>([]);

  const orderedCrmProviders =
    lookups && lookups.crmProviders
      ? [
          ...lookups.crmProviders.filter((p: any) => p.name !== "None" && p.name !== "None/Unknown"),
          ...lookups.crmProviders.filter((p: any) => p.name === "None/Unknown"),
        ]
      : [];

  // Contacts, demos, activity
  const [contacts, setContacts] = useState<AccountContactSummary[]>([]);
  const [contactsLoading, setContactsLoading] = useState(false);
  const [demos, setDemos] = useState<AccountDemoSummary[]>([]);
  const [demosLoading, setDemosLoading] = useState(false);
  const [activityLog, setActivityLog] = useState<AccountActivityEntry[]>([]);
  const [activityLoading, setActivityLoading] = useState(false);

  // Editing state
  const [isEditingCompany, setIsEditingCompany] = useState(false);
  const [companySaving, setCompanySaving] = useState(false);
  const [companyForm, setCompanyForm] = useState({
    companyName: "", accountTypeId: "", accountSizeId: "", numberOfUsers: "", websiteUrl: "", phoneNumber: "", email: "",
    decisionMakers: "", instagramHandle: "", linkedinUrl: "", createdByUserId: "", assignedToUserId: "",
    leadSource: "", city: "", dealStage: "", crmProviderId: "",
    crmProviderName: "",
    crmProviders: [] as Array<{id: string | null; name: string}>,
    crmExpiry: "", closedDate: ""
  });

  // Modals
  const [addContactOpen, setAddContactOpen] = useState(false);
  const [addDemoOpen, setAddDemoOpen] = useState(false);
  const [editDemoOpen, setEditDemoOpen] = useState(false);
  const [editingDemo, setEditingDemo] = useState<AccountDemoSummary | null>(null);

  // Demo form state
  const [demoForm, setDemoForm] = useState({ 
    scheduledAt: "", 
    scheduledById: "", 
    status: "Scheduled" as DemoStatus, 
    doneAt: "",
    doneById: "",
    attendees: "", 
    notes: "",
    completionAttendees: "",
    completionNotes: ""
  });
  const [demoSaving, setDemoSaving] = useState(false);
  
  // Edit demo form state
  const [editDemoForm, setEditDemoForm] = useState({
    scheduledAt: "",
    scheduledById: "",
    status: "Scheduled" as DemoStatus,
    doneAt: "",
    doneById: "",
    attendees: "",
    notes: "",
    completionAttendees: "",
    completionNotes: ""
  });

  // Styling classes
  const labelClass = "mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300";
  const inputClass = "block w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 placeholder-gray-400 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 dark:border-gray-700 dark:bg-white dark:text-gray-900 dark:placeholder-gray-500";

  const bucketedDemos = useMemo<DemoCardModel[]>(() => {
    if (!demos?.length) {
      return [];
    }

    const sorted = [...demos].sort((a, b) => {
      // Use the actual demo date for ordering so edits do not move cards.
      const aBase = a.doneAt ?? a.scheduledAt ?? a.createdAt ?? a.updatedAt;
      const bBase = b.doneAt ?? b.scheduledAt ?? b.createdAt ?? b.updatedAt;

      const aTime = new Date(aBase ?? 0).getTime();
      const bTime = new Date(bBase ?? 0).getTime();
      return bTime - aTime; // newest demo date first
    });

    return sorted.map((demo) => {
      const scheduledLabel = formatDateTime(demo.scheduledAt);
      const updatedLabel = formatDateTime(demo.updatedAt);
      const attendees = parseAttendees(demo.attendees);
      const doneLabel = formatDateTime(demo.doneAt);
      const scheduledBy = demo.demoAlignedByName ?? "—";
      const demoBy = demo.demoDoneByName ?? "—";
      const notes = normalizeDemoNotes(demo.notes);

      let headerText: string | null = null;
      if (demo.status === "Completed") {
        headerText = doneLabel !== "—" ? `Completed on ${doneLabel}` : "Completed";
      } else if (demo.status === "Cancelled") {
        headerText = updatedLabel !== "—" ? `Cancelled on ${updatedLabel}` : "Cancelled";
      } else if (demo.status === "NoShow") {
        headerText = "No Show";
      }

      return {
        id: demo.id,
        status: demo.status,
        headerText,
        scheduledLabel,
        scheduledBy,
        demoBy,
        updatedLabel,
        attendees,
        doneByBadge: demo.status !== "Completed" && demo.demoDoneByName ? `Done by ${demo.demoDoneByName}` : null,
        notes,
        original: demo,
      } satisfies DemoCardModel;
    });
  }, [demos]);

  // Load account detail
  const loadDetail = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    setError(null);
    try {
      const data = await getAccountDetail(id);
      console.log("Account detail response:", data);
      // Handle case where API returns nested object
      const detail = (data as any)?.data || (data as any)?.account || data;
      setDetail(detail);
    } catch (e: any) {
      console.error("Failed to load account:", e);
      setError(e?.message || "Failed to load account");
    } finally {
      setLoading(false);
    }
  }, [id]);

  // Load contacts
  const loadContacts = useCallback(async () => {
    if (!id) return;
    setContactsLoading(true);
    try {
      const data = await getAccountContacts(id);
      const items = Array.isArray(data) ? data : ((data as any)?.items || (data as any)?.data || []);
      setContacts(items);
    } catch {
      setContacts([]);
    } finally {
      setContactsLoading(false);
    }
  }, [id]);

  // Load demos
  const loadDemos = useCallback(async () => {
    if (!id) return;
    setDemosLoading(true);
    try {
      const data = await getAccountDemos(id);
      const items = Array.isArray(data) ? data : ((data as any)?.items || (data as any)?.data || []);
      setDemos(items.map((demo: AccountDemoSummary) => ({
        ...demo,
        notes: normalizeDemoNotes(demo.notes),
        attendees: demo.attendees?.trim() || null,
      })));
    } catch {
      setDemos([]);
    } finally {
      setDemosLoading(false);
    }
  }, [id]);

  // Load activity
  const loadActivity = useCallback(async () => {
    if (!id) return;
    setActivityLoading(true);
    try {
      const data = await getAccountActivity(id);
      // Handle case where API returns object with items property or direct array
      const items = Array.isArray(data) ? data : ((data as any)?.items || (data as any)?.data || []);
      setActivityLog(items);
    } catch {
      setActivityLog([]);
    } finally {
      setActivityLoading(false);
    }
  }, [id]);

  // Refresh all dashboard data
  const refreshDashboardData = useCallback(async () => {
    await Promise.all([loadContacts(), loadDemos(), loadActivity()]);
  }, [loadContacts, loadDemos, loadActivity]);

  // Initial load
  useEffect(() => {
    loadDetail();
    loadContacts();
    loadDemos();
    loadActivity();
  }, [loadDetail, loadContacts, loadDemos, loadActivity]);

  // Load lookups
  const loadLookups = useCallback(async () => {
    try {
      const data = await getAccountLookups();
      setLookups(data);
      return data;
    } catch (error) {
      console.error("Error loading lookups:", error);
      return null;
    }
  }, []);

  // Refresh CRM providers after a new one is created
  const refreshCrmProviders = useCallback(async () => {
    const data = await loadLookups();
    return data?.crmProviders || [];
  }, [loadLookups]);

  // Load lookups and team members
  useEffect(() => {
    loadLookups();
    getUsers().then(setTeamMembers).catch(() => setTeamMembers([]));
  }, [loadLookups]);

  // Enter edit mode
  const enterCompanyEditMode = useCallback(() => {
    if (!detail) return;
    setCompanyForm({
      companyName: detail.companyName || "",
      accountTypeId: detail.accountTypeId || "",
      accountSizeId: detail.accountSizeId || "",
      numberOfUsers: detail.numberOfUsers != null ? String(detail.numberOfUsers) : "",
      websiteUrl: detail.websiteUrl || detail.website || "",
      phoneNumber: detail.phone || "",
      email: detail.email || "",
      decisionMakers: detail.decisionMakers || "",
      instagramHandle: detail.instagramUrl || "",
      linkedinUrl: detail.linkedinUrl || "",
      createdByUserId: detail.createdByUserId || "",
      assignedToUserId: detail.assignedToUserId || "",
      leadSource: detail.leadSource || "",
      city: detail.city || "",
      dealStage: detail.dealStage || "",
      crmProviderId: detail.currentCrmId || "", // Ensure empty string if null
      crmProviderName: formatCrmProviderDisplay(detail.crmProviderName),
      crmProviders: detail.currentCrmId ? 
        [{ id: detail.currentCrmId, name: formatCrmProviderDisplay(detail.crmProviderName) }] : 
        (detail.crmProviderName ? [{ id: null, name: formatCrmProviderDisplay(detail.crmProviderName) }] : []),
      crmExpiry: formatCrmExpiryDisplay(detail.crmExpiry) || "",
      closedDate: detail.closedDate ? detail.closedDate.split("T")[0] : ""
    });
    setIsEditingCompany(true);
  }, [detail]);

  // Cancel editing
  const handleCancelCompany = useCallback(() => {
    setIsEditingCompany(false);
  }, []);

  // Save company changes
  const handleSaveCompany = useCallback(async () => {
    if (!id || !detail) return;
    // Permission check
    const isAdmin = user?.role === "Admin";
    const isAssigned = detail.assignedToUserId === user?.id;
    if (!isAdmin && !isAssigned) {
      alert("You don't have permission to edit this account.");
      return;
    }
    setCompanySaving(true);
    try {
      // Convert crmExpiry from MM/YY to ISO if needed
      let crmExpiryIso: string | null = null;
      if (companyForm.crmExpiry && /^\d{2}\/\d{2}$/.test(companyForm.crmExpiry)) {
        const [mm, yy] = companyForm.crmExpiry.split("/");
        const year = 2000 + parseInt(yy, 10);
        crmExpiryIso = new Date(year, parseInt(mm, 10) - 1, 1).toISOString();
      } else if (companyForm.crmExpiry) {
        crmExpiryIso = companyForm.crmExpiry;
      } else if (companyForm.crmExpiry === "") {
        // Explicit empty string signals the backend to clear CrmExpiry
        crmExpiryIso = "";
      }
      await updateAccount(id, {
        companyName: companyForm.companyName,
        accountTypeId: companyForm.accountTypeId || null,
        accountSizeId: companyForm.accountSizeId || null,
        numberOfUsers: companyForm.numberOfUsers ? parseInt(companyForm.numberOfUsers, 10) : null,
        websiteUrl: companyForm.websiteUrl || null,
        phone: companyForm.phoneNumber || null,
        email: companyForm.email || null,
        decisionMakers: companyForm.decisionMakers || null,
        instagramUrl: companyForm.instagramHandle || null,
        linkedinUrl: companyForm.linkedinUrl || null,
        createdByUserId: companyForm.createdByUserId || null,
        assignedToUserId: companyForm.assignedToUserId || null,
        leadSource: companyForm.leadSource || null,
        city: companyForm.city || null,
        dealStage: companyForm.dealStage || null,
        // Send the primary CRM (first in the list) as the main CRM
        currentCrmId: companyForm.crmProviders.length > 0 && companyForm.crmProviders[0].id ? companyForm.crmProviders[0].id : null,
        currentCrmName: companyForm.crmProviders.length > 0 && !companyForm.crmProviders[0].id ? companyForm.crmProviders[0].name : null,
        // In the future, we'll update the API to accept multiple CRMs
        // crmProviders: companyForm.crmProviders,
        crmExpiry: crmExpiryIso,
        closedDate: companyForm.closedDate || null
      });
      await loadDetail();
      setIsEditingCompany(false);
    } catch (e: any) {
      alert(e?.message || "Failed to save changes");
    } finally {
      setCompanySaving(false);
    }
  }, [id, detail, user, companyForm, loadDetail]);

  // Delete demo handler
  const handleDeleteDemo = useCallback(async (demoId: string) => {
    if (!id) return;
    const confirmed = typeof window === "undefined" ? true : window.confirm("Delete this demo?");
    if (!confirmed) return;
    try {
      await deleteDemo(id, demoId);
      await refreshDashboardData();
    } catch (e: any) {
      alert(e?.message || "Failed to delete demo");
    }
  }, [id, refreshDashboardData]);

  // Edit demo handler
  const handleEditDemo = useCallback((demo: AccountDemoSummary) => {
    setEditingDemo(demo);
    setEditDemoForm({
      scheduledAt: demo.scheduledAt || "",
      scheduledById: demo.demoAlignedByUserId || "",
      status: demo.status || "Scheduled",
      doneAt: demo.doneAt || "",
      doneById: demo.demoDoneByUserId || "",
      attendees: demo.attendees || "",
      notes: normalizeDemoNotes(demo.notes),
      completionAttendees: "",
      completionNotes: ""
    });
    setEditDemoOpen(true);
  }, []);

  // Update demo handler
  const handleUpdateDemo = useCallback(async () => {
    if (!id || !editingDemo) return;
    setDemoSaving(true);
    try {
      const trimmedNotes = editDemoForm.notes.trim();
      const isConvertingToCompleted = editingDemo.status === "Scheduled" && editDemoForm.status === "Completed";

      const basePayload: any = {
        scheduledAt: editDemoForm.scheduledAt ? new Date(editDemoForm.scheduledAt).toISOString() : undefined,
        status: editDemoForm.status,
        doneAt: editDemoForm.status === "Completed" && editDemoForm.doneAt ? new Date(editDemoForm.doneAt).toISOString() : null,
        demoDoneByUserId: editDemoForm.status === "Completed" ? (editDemoForm.doneById || user?.id || null) : null,
        attendees: editDemoForm.attendees.trim() || "",
      };

      if (isConvertingToCompleted) {
        // On conversion, treat the notes field as completion notes for the new completed demo.
        // Do NOT send notes for the original scheduled demo so its notes remain unchanged.
        basePayload.completionAttendees = editDemoForm.attendees.trim() || undefined;
        basePayload.completionNotes = trimmedNotes === "" ? undefined : trimmedNotes;
      } else {
        // Normal edit: update this demo's notes.
        basePayload.notes = trimmedNotes === "" ? null : trimmedNotes;
      }

      await updateDemo(id, editingDemo.id, basePayload);
      setEditDemoOpen(false);
      setEditingDemo(null);
      await refreshDashboardData();
    } catch (e: unknown) {
      const errorMessage = e instanceof Error ? e.message : "Failed to update demo";
      alert(errorMessage);
    } finally {
      setDemoSaving(false);
    }
  }, [id, editingDemo, editDemoForm, user?.id, refreshDashboardData]);

  // Create demo handler
  const handleCreateDemo = useCallback(async () => {
    if (!id || !user?.id) return;
    if (!demoForm.scheduledAt) {
      alert("Please select a scheduled date/time");
      return;
    }
    setDemoSaving(true);
    try {
      await createAccountDemo(id, {
        scheduledAt: new Date(demoForm.scheduledAt).toISOString(),
        status: demoForm.status,
        attendees: demoForm.attendees.trim() || "",
        notes: demoForm.notes.trim() || undefined,
        demoAlignedByUserId: demoForm.scheduledById || user.id,
        doneAt: demoForm.status === "Completed" && demoForm.doneAt ? new Date(demoForm.doneAt).toISOString() : null,
        demoDoneByUserId: demoForm.status === "Completed" ? (demoForm.doneById || user.id) : null,
      }, user.id);
      setDemoForm({ scheduledAt: "", scheduledById: "", status: "Scheduled", doneAt: "", doneById: "", attendees: "", notes: "", completionAttendees: "", completionNotes: "" });
      setAddDemoOpen(false);
      await refreshDashboardData();
    } catch (e: any) {
      alert(e?.message || "Failed to create demo");
    } finally {
      setDemoSaving(false);
    }
  }, [id, user, demoForm, refreshDashboardData]);

  // Timeline events
  const getTimelineEvents = useCallback(() => {
    const events: { kind: string; title: string; timestamp: string }[] = [];
    if (detail?.createdAt) {
      events.push({ kind: "ACCOUNT_CREATED", title: "Account Created", timestamp: detail.createdAt });
    }
    demos.forEach((d) => {
      if (d.scheduledAt) {
        events.push({ kind: "DEMO_SCHEDULED", title: "Demo Scheduled", timestamp: d.scheduledAt });
      }
      if (d.doneAt) {
        events.push({ kind: "DEMO_COMPLETED", title: "Demo Completed", timestamp: d.doneAt });
      }
    });
    if (detail?.dealStage === "WON" && detail.closedDate) {
      events.push({ kind: "DEAL_WON", title: "Deal Closed Won", timestamp: detail.closedDate });
    } else if (detail?.dealStage === "LOST") {
      const closedLostTimestamp = detail.closedDate ?? detail.updatedAt ?? detail.createdAt;
      if (closedLostTimestamp) {
        events.push({ kind: "DEAL_LOST", title: "Deal Closed Lost", timestamp: closedLostTimestamp });
      }
    }
    events.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
    return events;
  }, [detail, demos]);

  // Early returns
  if (!id) {
    return (
      <div className="p-6">
        <h1 className="text-2xl font-semibold mb-4">Account Detail</h1>
        <p className="text-gray-600 text-sm">Missing account id.</p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="p-6">
        <p className="text-gray-600 dark:text-gray-400">Loading account...</p>
      </div>
    );
  }

  if (error || !detail) {
    return (
      <div className="p-6">
        <p className="text-red-600 dark:text-red-400">{error || "Account not found"}</p>
      </div>
    );
  }

  // Dynamic size label - updates when editing numberOfUsers
  const sizeLabel = isEditingCompany 
    ? computeSizeLabel(companyForm.numberOfUsers ? parseInt(companyForm.numberOfUsers, 10) : null) 
    : (computeSizeLabel(detail.numberOfUsers) || detail.accountSizeName || "");

  return (
    <div className="min-h-screen bg-slate-50 p-6 text-gray-900 dark:bg-slate-950 dark:text-gray-100">
      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => {
              if (pathname?.startsWith("/my-accounts/")) {
                router.push("/my-accounts");
              } else {
                router.push("/accounts");
              }
            }}
            className="inline-flex items-center justify-center rounded-lg border border-gray-200 bg-white p-2 text-gray-600 shadow-sm transition-colors hover:bg-gray-50 dark:border-gray-800 dark:bg-gray-900 dark:text-gray-300"
            aria-label="Go back"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
          <div>
            <h1 className="text-3xl font-bold text-slate-900 dark:text-gray-50">{detail.companyName || "Account"}</h1>
            <p className="text-slate-500 mt-1 dark:text-gray-400">View and manage account details</p>
          </div>
        </div>
        {sizeLabel && <span className={accountSizeTagClass(sizeLabel)}>{sizeLabel}</span>}
      </div>

      {/* Company Information Card */}
      <div className="mb-6 rounded-2xl border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-800 dark:bg-gray-900/80">
        <div className="mb-5">
          <h2 className="flex items-center gap-2 text-[0.92rem] font-semibold text-gray-900 dark:text-gray-100">
            <span className="inline-flex h-[1.84rem] w-[1.84rem] items-center justify-center rounded-lg bg-blue-600 text-white">
              <Building2 className="h-[1.05rem] w-[1.05rem]" />
            </span>
            Company Information
          </h2>
        </div>
        <div className="grid gap-4 sm:grid-cols-3">
          {/* Company Name */}
          <div>
            <label className={labelClass}>Company Name <span className="text-red-500">*</span></label>
            {isEditingCompany ? (
              <input className={inputClass} placeholder="e.g. Acme Corp" value={companyForm.companyName} onChange={(e) => setCompanyForm((p) => ({ ...p, companyName: e.target.value }))} />
            ) : (
              <input className={inputClass} value={detail.companyName || ""} placeholder="e.g. Acme Corp" disabled />
            )}
          </div>
          {/* Account Type */}
          <div>
            <label className={labelClass}>Account Type <span className="text-red-500">*</span></label>
            {isEditingCompany && lookups ? (
              <PlaceholderSelect
                options={lookups.accountTypes}
                value={companyForm.accountTypeId}
                onChange={(value) => setCompanyForm((p) => ({ ...p, accountTypeId: value }))}
                placeholder="Select type"
                className={inputClass}
              />
            ) : (
              <PlaceholderInput
                value={detail.accountTypeName}
                placeholder="Select type"
                className={inputClass}
              />
            )}
          </div>
          {/* Number of Users */}
          <div>
            <label className={labelClass}>Number of Users</label>
            {isEditingCompany ? (
              <input className={inputClass} placeholder="e.g. 25" value={companyForm.numberOfUsers} onChange={(e) => setCompanyForm((p) => ({ ...p, numberOfUsers: e.target.value }))} />
            ) : (
              <PlaceholderInput
                value={detail.numberOfUsers != null && detail.numberOfUsers > 0 ? String(detail.numberOfUsers) : null}
                placeholder="e.g. 25"
                className={inputClass}
              />
            )}
          </div>
          {/* Website URL */}
          <div>
            <label className={labelClass}>Website URL</label>
            {isEditingCompany ? (
              <input className={inputClass} placeholder="https://example.com" value={companyForm.websiteUrl} onChange={(e) => setCompanyForm((p) => ({ ...p, websiteUrl: e.target.value }))} />
            ) : (
              <PlaceholderInput
                value={detail.websiteUrl || detail.website}
                placeholder="https://example.com"
                className={inputClass}
              />
            )}
          </div>
          {/* Phone Number */}
          <div>
            <label className={labelClass}>Phone Number</label>
            {isEditingCompany ? (
              <PhoneNumberInput
                className={inputClass}
                placeholder="Phone number"
                value={companyForm.phoneNumber}
                onChange={(value) => setCompanyForm((p) => ({ ...p, phoneNumber: value }))}
              />
            ) : (
              <PlaceholderInput
                value={detail.phone}
                placeholder="+1 (555) 123-4567"
                className={inputClass}
              />
            )}
          </div>
          {/* Email */}
          <div>
            <label className={labelClass}>Email</label>
            {isEditingCompany ? (
              <input className={inputClass} placeholder="contact@example.com" value={companyForm.email} onChange={(e) => setCompanyForm((p) => ({ ...p, email: e.target.value }))} />
            ) : (
              <PlaceholderInput
                value={detail.email}
                placeholder="contact@example.com"
                className={inputClass}
              />
            )}
          </div>
          {/* Decision Makers */}
          <div>
            <label className={labelClass}>Decision Makers</label>
            {isEditingCompany ? (
              <input className={inputClass} placeholder="e.g. CEO, CTO" value={companyForm.decisionMakers} onChange={(e) => setCompanyForm((p) => ({ ...p, decisionMakers: e.target.value }))} />
            ) : (
              <PlaceholderInput
                value={detail.decisionMakers}
                placeholder="e.g. CEO, CTO"
                className={inputClass}
              />
            )}
          </div>
          {/* Instagram Handle */}
          <div>
            <label className={labelClass}>Instagram Handle</label>
            {isEditingCompany ? (
              <input className={inputClass} placeholder="https://instagram.com/..." value={companyForm.instagramHandle} onChange={(e) => setCompanyForm((p) => ({ ...p, instagramHandle: e.target.value }))} />
            ) : (
              <PlaceholderInput
                value={detail.instagramUrl}
                placeholder="https://instagram.com/..."
                className={inputClass}
              />
            )}
          </div>
          {/* LinkedIn URL */}
          <div>
            <label className={labelClass}>LinkedIn URL</label>
            {isEditingCompany ? (
              <input className={inputClass} placeholder="https://linkedin.com/in/..." value={companyForm.linkedinUrl} onChange={(e) => setCompanyForm((p) => ({ ...p, linkedinUrl: e.target.value }))} />
            ) : (
              <PlaceholderInput
                value={detail.linkedinUrl}
                placeholder="https://linkedin.com/in/..."
                className={inputClass}
              />
            )}
          </div>
        </div>

        {/* Sales Information */}
        <div className="mt-6 border-t border-gray-200 pt-6 dark:border-gray-800">
          <h3 className="mb-4 text-base font-semibold text-gray-900 dark:text-gray-100">Sales Information</h3>
          <div className="grid gap-4 sm:grid-cols-3">
            {/* Account Created By */}
            <div>
              <label className={labelClass}>Account Created By</label>
              {isEditingCompany ? (
                <PlaceholderSelect
                  options={teamMembers.map(u => ({ id: u.id, name: u.fullName || u.email }))}
                  value={companyForm.createdByUserId}
                  onChange={(value) => setCompanyForm((p) => ({ ...p, createdByUserId: value }))}
                  placeholder="Select team member"
                  className={inputClass}
                />
              ) : (
                <input
                  className={inputClass}
                  value={detail.createdByUserDisplayName || ""}
                  placeholder="Select"
                  disabled
                />
              )}
            </div>

            {/* Assigned To */}
            <div>
              <label className={labelClass}>Assigned To</label>
              {isEditingCompany ? (
                <PlaceholderSelect
                  options={teamMembers.map(u => ({ id: u.id, name: u.fullName || u.email }))}
                  value={companyForm.assignedToUserId}
                  onChange={(value) => setCompanyForm((p) => ({ ...p, assignedToUserId: value }))}
                  placeholder="Select team member"
                  className={inputClass}
                />
              ) : (
                <input
                  className={inputClass}
                  value={detail.assignedToUserDisplayName || ""}
                  placeholder="Select"
                  disabled
                />
              )}
            </div>

            {/* Lead Source */}
            <div>
              <label className={labelClass}>Lead Source</label>
              {isEditingCompany ? (
                <PlaceholderSelect
                  options={[
                    { id: "LINKEDIN", name: "LinkedIn" },
                    { id: "INSTAGRAM", name: "Instagram" },
                    { id: "WEBSITE", name: "Website" },
                    { id: "COLD_CALL", name: "Cold call" },
                    { id: "FACEBOOK", name: "Facebook" },
                    { id: "GOOGLE_ADS", name: "Google Ads" },
                    { id: "REFERRAL", name: "Referral" }
                  ]}
                  value={companyForm.leadSource}
                  onChange={(value) => setCompanyForm((p) => ({ ...p, leadSource: value }))}
                  placeholder="Select source"
                  className={inputClass}
                />
              ) : (
                <input
                  className={inputClass}
                  value={formatLeadSourceLabel(detail.leadSource)}
                  placeholder="Select"
                  disabled
                />
              )}
            </div>

            {/* City */}
            <div>
              <label className={labelClass}>City</label>
              {isEditingCompany ? (
                <input
                  className={inputClass}
                  placeholder="Enter city name"
                  value={companyForm.city}
                  onChange={(e) => setCompanyForm((p) => ({ ...p, city: e.target.value }))}
                />
              ) : (
                <PlaceholderInput
                  value={detail.city}
                  placeholder="Enter city name"
                  className={inputClass}
                />
              )}
            </div>

            {/* Deal Stage */}
            <div>
              <label className={labelClass}>Deal Stage</label>
              {isEditingCompany ? (
                <PlaceholderSelect
                  options={[
                    { id: "NEW_LEAD", name: "New Lead" },
                    { id: "CONTACTED", name: "Contacted" },
                    { id: "QUALIFIED", name: "Qualified" },
                    { id: "IN_PROGRESS", name: "In progress" },
                    { id: "WON", name: "Closed Won" },
                    { id: "LOST", name: "Closed Lost" }
                  ]}
                  value={companyForm.dealStage}
                  onChange={(value) => setCompanyForm((p) => ({ ...p, dealStage: value }))}
                  placeholder="Select stage"
                  className={inputClass}
                                  />
              ) : (
                <PlaceholderInput
                  value={formatDealStageLabel(detail.dealStage)}
                  placeholder="Select stage"
                  className={inputClass}
                />
              )}
            </div>

            {/* Current CRM */}
            <div>
              <label className={labelClass}>Current CRM</label>
              {isEditingCompany && lookups ? (
                <CrmProviderMultiSelect
                  options={orderedCrmProviders}
                  values={companyForm.crmProviders}
                  onChange={({ providers }) =>
                    setCompanyForm((p) => ({
                      ...p,
                      crmProviders: providers,
                      // For backward compatibility, also set the first CRM as the primary one
                      crmProviderId: providers.length > 0 && providers[0].id ? providers[0].id : "",
                      crmProviderName: providers.length > 0 && !providers[0].id ? providers[0].name : "",
                    }))
                  }
                  onRefreshOptions={refreshCrmProviders}
                  placeholder="Select or type CRM providers"
                  className={inputClass}
                />
              ) : (
                <PlaceholderInput
                  value={formatCrmProviderDisplay(detail.crmProviderName)}
                  placeholder="Select CRM provider"
                  className={inputClass}
                />
              )}
            </div>

            {/* CRM Expiry */}
            <div>
              <label className={labelClass}>CRM Expiry (MM/YY)</label>
              {isEditingCompany ? (
                <input
                  className={inputClass}
                  placeholder="MM/YY"
                  value={companyForm.crmExpiry}
                  onChange={(e) => setCompanyForm((p) => ({ ...p, crmExpiry: e.target.value }))}
                />
              ) : (
                <PlaceholderInput
                  value={formatCrmExpiryDisplay(detail.crmExpiry)}
                  placeholder="MM/YY"
                  className={inputClass}
                />
              )}
            </div>

            {/* Closed Date - Only shown when Deal Stage is Won or Lost */}
            {((isEditingCompany && (companyForm.dealStage === "WON" || companyForm.dealStage === "LOST")) ||
              (!isEditingCompany && (detail.dealStage === "WON" || detail.dealStage === "LOST"))) && (
              <div>
                <label className={labelClass}>Closed Date</label>
                {isEditingCompany ? (
                  <DateTimePicker
                    id="closed-date-picker"
                    value={companyForm.closedDate}
                    onChange={(val) => setCompanyForm((p) => ({ ...p, closedDate: val }))}
                    placeholder="Select closed date"
                    enableTime={false}
                  />
                ) : (
                  <input className={inputClass} value={detail.closedDate ? detail.closedDate.split("T")[0] : ""} placeholder="Select closed date" disabled />
                )}
              </div>
            )}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="mt-6 flex items-center justify-between border-t border-gray-200 pt-6 dark:border-gray-800">
          <button
            type="button"
            className="inline-flex items-center gap-2 rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-red-700"
            onClick={async () => {
              const confirmed = typeof window === "undefined" ? true : window.confirm("Are you sure you want to delete this account?");
              if (!confirmed) return;
              try {
                await softDeleteAccount(id);
                if (pathname?.startsWith("/my-accounts/")) router.push("/my-accounts");
                else router.push("/accounts");
              } catch (e: any) {
                alert(e?.message || "Failed to delete account");
              }
            }}
          >
            <Trash2 className="h-4 w-4" />
            Delete Account
          </button>
          <div className="flex items-center gap-2">
            {isEditingCompany ? (
              <>
                <button type="button" className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-200" onClick={handleCancelCompany} disabled={companySaving}>Cancel</button>
                <button type="button" className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-60" onClick={handleSaveCompany} disabled={companySaving}>{companySaving ? "Saving..." : "Save Changes"}</button>
              </>
            ) : (
              <button type="button" className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700" onClick={enterCompanyEditMode}>
                <FileEdit className="h-4 w-4" />
                Update Account
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Dashboard Grid - 2x2 Cards */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Contact Persons Card */}
        <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-800 dark:bg-gray-900/80">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Contact Persons</h2>
            <div className="flex items-center gap-2">
              <button type="button" className="inline-flex items-center gap-1.5 rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-200">
                <Download className="h-4 w-4" />
                Export
              </button>
              <button type="button" className="inline-flex items-center gap-1.5 rounded-lg bg-blue-600 px-3 py-1.5 text-sm font-semibold text-white hover:bg-blue-700" onClick={() => setAddContactOpen(true)}>
                <Plus className="h-4 w-4" />
                Add
              </button>
            </div>
          </div>
          {contactsLoading ? (
            <p className="text-sm text-gray-600 dark:text-gray-400">Loading contacts...</p>
          ) : contacts.length === 0 ? (
            <p className="text-center text-sm text-gray-400 dark:text-gray-500 py-8">No contacts added yet</p>
          ) : (
            <div className="space-y-4">
              {contacts.map((contact) => {
                const personalPhone = contact.personalPhone || "";
                const workPhone = contact.workPhone || contact.phone || "";
                const workEmail = contact.email || "";
                const designation = contact.designation || contact.position || "";
                const city = contact.city || "";
                const linkedinUrl = contact.linkedinUrl || "";
                const instagramUrl = contact.instagramUrl || "";

                return (
                  <div
                    key={contact.id}
                    className="rounded-2xl border border-gray-200 bg-white/80 p-5 shadow-sm backdrop-blur-sm transition hover:-translate-y-[1px] hover:shadow-md dark:border-gray-700 dark:bg-gray-900/70"
                  >
                    <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="text-lg font-semibold text-gray-900 dark:text-gray-50">{contact.name}</p>
                        {designation && (
                          <span className="mt-2 inline-flex items-center rounded-full bg-blue-100 px-3 py-0.5 text-xs font-semibold text-blue-700 dark:bg-blue-900/30 dark:text-blue-300">
                            {designation}
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-gray-200 bg-white text-gray-600 transition hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-200"
                          title="Edit contact"
                        >
                          <Pencil className="h-4 w-4" />
                        </button>
                        <button
                          type="button"
                          className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-red-100 bg-red-50 text-red-600 transition hover:bg-red-100 dark:border-red-500/40 dark:bg-red-900/40 dark:text-red-300"
                          title="Delete contact"
                          onClick={async () => {
                            const confirmed = typeof window === "undefined" ? true : window.confirm("Delete this contact?");
                            if (!confirmed) return;
                            try {
                              await deleteContact(id, contact.id);
                              await refreshDashboardData();
                            } catch (e: any) {
                              alert(e?.message || "Failed to delete contact");
                            }
                          }}
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>

                    <div className="space-y-3 text-sm text-gray-700 dark:text-gray-300">
                      <div className="flex flex-wrap gap-3">
                        {personalPhone && (
                          <a
                            href={`tel:${personalPhone}`}
                            className="group inline-flex items-center gap-2 rounded-xl bg-gray-50 px-3 py-2 text-gray-700 transition hover:bg-blue-50 hover:text-blue-700 dark:bg-gray-800/70 dark:text-gray-200 dark:hover:bg-blue-900/30 dark:hover:text-blue-300"
                          >
                            <Phone className="h-4 w-4 text-gray-400 transition group-hover:text-blue-500" />
                            <span className="font-medium">Personal:</span>
                            <span className="font-normal">{personalPhone}</span>
                          </a>
                        )}
                        {workPhone && (
                          <a
                            href={`tel:${workPhone}`}
                            className="group inline-flex items-center gap-2 rounded-xl bg-gray-50 px-3 py-2 text-gray-700 transition hover:bg-blue-50 hover:text-blue-700 dark:bg-gray-800/70 dark:text-gray-200 dark:hover:bg-blue-900/30 dark:hover:text-blue-300"
                          >
                            <Phone className="h-4 w-4 text-gray-400 transition group-hover:text-blue-500" />
                            <span className="font-medium">Work:</span>
                            <span className="font-normal">{workPhone}</span>
                          </a>
                        )}
                        {workEmail && (
                          <a
                            href={`mailto:${workEmail}`}
                            className="group inline-flex max-w-full items-center gap-2 rounded-xl bg-gray-50 px-3 py-2 text-gray-700 transition hover:bg-blue-50 hover:text-blue-700 dark:bg-gray-800/70 dark:text-gray-200 dark:hover:bg-blue-900/30 dark:hover:text-blue-300"
                            title={workEmail}
                          >
                            <Mail className="h-4 w-4 text-gray-400 transition group-hover:text-blue-500" />
                            <span className="font-medium">Email:</span>
                            <span className="truncate font-normal">{workEmail}</span>
                          </a>
                        )}
                        {city && (
                          <div className="inline-flex items-center gap-2 rounded-xl bg-gray-50 px-3 py-2 text-gray-700 dark:bg-gray-800/70 dark:text-gray-200">
                            <MapPin className="h-4 w-4 text-gray-400" />
                            <span className="font-normal">{city}</span>
                          </div>
                        )}
                      </div>

                      {(linkedinUrl || instagramUrl) && (
                        <div className="flex flex-wrap gap-4 pt-1 text-sm font-medium">
                          {linkedinUrl && (
                            <a
                              href={linkedinUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1 text-blue-600 transition hover:text-blue-700 hover:underline dark:text-blue-400 dark:hover:text-blue-300"
                            >
                              LinkedIn <ExternalLink className="h-3.5 w-3.5" />
                            </a>
                          )}
                          {instagramUrl && (
                            <a
                              href={instagramUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1 text-pink-500 transition hover:text-pink-600 hover:underline dark:text-pink-300 dark:hover:text-pink-200"
                            >
                              Instagram <ExternalLink className="h-3.5 w-3.5" />
                            </a>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Demo History Card */}
        <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-800 dark:bg-gray-900/80">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Demo History</h2>
            <button type="button" className="inline-flex items-center gap-1.5 rounded-lg bg-blue-600 px-3 py-1.5 text-sm font-semibold text-white hover:bg-blue-700" onClick={() => setAddDemoOpen(true)}>
              <Plus className="h-4 w-4" />
              Add Demo
            </button>
          </div>
          {demosLoading ? (
            <p className="text-sm text-gray-600 dark:text-gray-400">Loading demos...</p>
          ) : demos.length === 0 ? (
            <p className="text-center text-sm text-gray-400 dark:text-gray-500 py-8">No demos scheduled yet</p>
          ) : (
            <div className="space-y-4">
              {bucketedDemos.map((demo) => (
                <div
                  key={demo.id}
                  className={`rounded-2xl border p-5 shadow-sm transition hover:-translate-y-[1px] hover:shadow-md dark:border-gray-700/80 ${DEMO_CARD_THEME[demo.status] ?? DEMO_CARD_THEME.Scheduled}`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex flex-col gap-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${DEMO_BADGE_THEME[demo.status] ?? DEMO_BADGE_THEME.Scheduled}`}>
                          {demo.status === "NoShow" ? "No Show" : demo.status}
                        </span>
                        {demo.headerText && (
                          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">{demo.headerText}</span>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-gray-200 bg-white text-gray-600 transition hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-200"
                        onClick={() => handleEditDemo(demo.original)}
                        title="Edit demo"
                      >
                        <Pencil className="h-3.5 w-3.5" />
                      </button>
                      <button
                        type="button"
                        className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-red-200 bg-red-50 text-red-600 transition hover:bg-red-100 dark:border-red-500/40 dark:bg-red-900/40 dark:text-red-300"
                        onClick={() => handleDeleteDemo(demo.original.id)}
                        title="Delete demo"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>

                  <div className="mt-4 space-y-3 text-sm text-gray-700 dark:text-gray-300">
                    <div className="flex items-start gap-3">
                      <CalendarDays className="mt-0.5 h-4 w-4 text-blue-500" />
                      <div>
                        <p className="text-xs uppercase tracking-wide text-gray-500 dark:text-gray-400">Scheduled</p>
                        <p className="font-medium text-gray-900 dark:text-gray-100">{demo.scheduledLabel}</p>
                      </div>
                    </div>

                    <div className="flex items-start gap-3">
                      <UserRound className="mt-0.5 h-4 w-4 text-indigo-500" />
                      <div>
                        <p className="text-xs uppercase tracking-wide text-gray-500 dark:text-gray-400">Scheduled by</p>
                        <p className="font-medium text-gray-900 dark:text-gray-100">{demo.scheduledBy}</p>
                      </div>
                    </div>

                    {demo.status === "Completed" && (
                      <div className="flex items-start gap-3">
                        <UserRound className="mt-0.5 h-4 w-4 text-emerald-500" />
                        <div>
                          <p className="text-xs uppercase tracking-wide text-gray-500 dark:text-gray-400">Demo by</p>
                          <p className="font-medium text-gray-900 dark:text-gray-100">{demo.demoBy}</p>
                        </div>
                      </div>
                    )}

                    {demo.attendees.length > 0 && (
                      <div className="flex items-start gap-3">
                        <Users className="mt-0.5 h-4 w-4 text-purple-500" />
                        <div>
                          <p className="text-xs uppercase tracking-wide text-gray-500 dark:text-gray-400">Attendees</p>
                          <p className="font-medium text-gray-900 dark:text-gray-100">{demo.attendees.join(", ")}</p>
                        </div>
                      </div>
                    )}

                    {/* Updated timestamp is only relevant for Cancelled / NoShow */}
                    {(demo.status === "Cancelled" || demo.status === "NoShow") && (
                      <div className="flex items-start gap-3">
                        <Clock4 className="mt-0.5 h-4 w-4 text-amber-500" />
                        <div>
                          <p className="text-xs uppercase tracking-wide text-gray-500 dark:text-gray-400">Updated</p>
                          <p className="font-medium text-gray-900 dark:text-gray-100">{demo.updatedLabel}</p>
                        </div>
                      </div>
                    )}

                    {demo.notes && (
                      <div className="flex items-start gap-3">
                        <NotebookPen className="mt-0.5 h-4 w-4 text-sky-500" />
                        <div className="flex-1">
                          <p className="text-xs uppercase tracking-wide text-gray-500 dark:text-gray-400">Notes</p>
                          <div className="mt-1 rounded-xl bg-gray-50 px-3 py-2 text-sm text-gray-700 dark:bg-gray-800 dark:text-gray-200 whitespace-pre-line">
                            {demo.notes}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                  {demo.doneByBadge && (
                    <div className="mt-4 inline-flex items-center gap-2 rounded-xl bg-gray-100 px-3 py-1 text-sm font-medium text-gray-700 dark:bg-gray-800 dark:text-gray-200">
                      <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                      <span>{demo.doneByBadge}</span>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Account Timeline Card */}
        <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-800 dark:bg-gray-900/80">
          <h2 className="mb-4 text-lg font-semibold text-gray-900 dark:text-gray-100">Account Timeline</h2>
          <div className="relative">
            <div className="absolute left-5 top-0 bottom-0 w-px bg-gray-200 dark:bg-gray-700" />
            <div className="space-y-6">
              {getTimelineEvents().map((event, idx) => {
                const date = new Date(event.timestamp);
                const formatted = date.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric", hour: "numeric", minute: "2-digit" });
                const isDealWon = event.kind === "DEAL_WON";
                const isDealLost = event.kind === "DEAL_LOST";
                const isCompleted = event.kind === "DEMO_COMPLETED" || isDealWon;
                const isScheduled = event.kind === "DEMO_SCHEDULED";
                const iconBg = isDealWon
                  ? "bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400"
                  : isDealLost
                  ? "bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400"
                  : isScheduled
                  ? "bg-purple-100 text-purple-600 dark:bg-purple-900/30 dark:text-purple-400"
                  : "bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400";
                return (
                  <div key={`${event.kind}-${idx}`} className="relative flex items-start gap-4 pl-12">
                    <div className="absolute left-0">
                      <div className={`flex h-10 w-10 items-center justify-center rounded-full ${iconBg}`}>
                        {isDealWon ? (
                          <CheckCircle2 className="h-5 w-5" />
                        ) : isDealLost ? (
                          <XCircle className="h-5 w-5" />
                        ) : isScheduled ? (
                          <CalendarDays className="h-5 w-5" />
                        ) : isCompleted ? (
                          <CheckCircle2 className="h-5 w-5" />
                        ) : (
                          <Circle className="h-5 w-5" />
                        )}
                      </div>
                    </div>
                    <div>
                      <p className="font-medium text-gray-900 dark:text-gray-100">{event.title}</p>
                      <p className="text-sm text-gray-500 dark:text-gray-400">{formatted}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Activity Log Card */}
        <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-800 dark:bg-gray-900/80">
          <h2 className="mb-4 text-lg font-semibold text-gray-900 dark:text-gray-100">Activity Log</h2>
          {activityLoading ? (
            <p className="text-sm text-gray-600 dark:text-gray-400">Loading activity...</p>
          ) : activityLog.length === 0 ? (
            <p className="text-sm text-gray-600 dark:text-gray-400 py-8 text-center">No activity yet</p>
          ) : (
            <div className="space-y-4">
              {activityLog.map((activity) => {
                const when = activity.timestamp ? new Date(activity.timestamp).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric", hour: "numeric", minute: "2-digit" }) : "";
                const title = formatActivityTitle(activity.eventType);
                return (
                  <div key={activity.id} className="flex items-start gap-3 border-b border-gray-100 pb-4 last:border-b-0 dark:border-gray-800">
                    <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-slate-100 text-blue-600 dark:bg-slate-800 dark:text-blue-400">
                      <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M3 12h4l2-7 4 14 2-7h4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-gray-900 dark:text-gray-100">{title}</p>
                      {activity.description && <p className="text-sm text-gray-600 dark:text-gray-400">{activity.description}</p>}
                      <p className="mt-0.5 text-xs text-gray-500 dark:text-gray-500">{activity.actorName || "System"} • {when}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Add Contact Modal */}
      <AddContactModal
        open={addContactOpen}
        onClose={() => setAddContactOpen(false)}
        accountId={id}
        onContactAdded={refreshDashboardData}
      />

      {/* Add Demo Modal */}
      {addDemoOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-xl dark:bg-gray-900">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Schedule Demo</h3>
              <button
                type="button"
                className="rounded-lg p-1 text-gray-500 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-800"
                onClick={() => {
                  setAddDemoOpen(false);
                  setDemoForm({ scheduledAt: "", scheduledById: "", status: "Scheduled", doneAt: "", doneById: "", attendees: "", notes: "", completionAttendees: "", completionNotes: "" });
                }}
              >
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="space-y-4">
              {/* Row 1: Date & Time + Scheduled By */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className={labelClass}>Demo Scheduled Date & Time</label>
                  <DateTimePicker
                    id="demo-scheduled-picker"
                    value={demoForm.scheduledAt}
                    onChange={(val) => setDemoForm((p) => ({ ...p, scheduledAt: val }))}
                    placeholder="dd-mm-yyyy --:--"
                    enableTime={true}
                  />
                </div>
                <div>
                  <label className={labelClass}>Demo Scheduled By</label>
                  <PlaceholderSelect
                    options={teamMembers.map(tm => ({ id: tm.id, name: tm.fullName || tm.email }))}
                    value={demoForm.scheduledById}
                    onChange={(value) => setDemoForm((p) => ({ ...p, scheduledById: value }))}
                    placeholder="Select user"
                    className={inputClass}
                                      />
                </div>
              </div>
              {/* Demo Status */}
              <div>
                <label className={labelClass}>Demo Status</label>
                <PlaceholderSelect
                  options={[
                    { id: "Scheduled", name: "Scheduled" },
                    { id: "Completed", name: "Completed" },
                    { id: "Cancelled", name: "Cancelled" },
                    { id: "NoShow", name: "No Show" }
                  ]}
                  value={demoForm.status}
                  onChange={(value) => setDemoForm((p) => ({ ...p, status: value as DemoStatus }))}
                  placeholder="Select status"
                  className={inputClass}
                                  />
              </div>
              {/* Completed fields - only show when status is Completed */}
              {demoForm.status === "Completed" && (
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className={labelClass}>Demo Done Date & Time</label>
                    <DateTimePicker
                      id="demo-done-picker"
                      value={demoForm.doneAt}
                      onChange={(val) => setDemoForm((p) => ({ ...p, doneAt: val }))}
                      placeholder="dd-mm-yyyy --:--"
                      enableTime={true}
                    />
                  </div>
                  <div>
                    <label className={labelClass}>Demo Done By</label>
                    <PlaceholderSelect
                      options={teamMembers.map(tm => ({ id: tm.id, name: tm.fullName || tm.email }))}
                      value={demoForm.doneById}
                      onChange={(value) => setDemoForm((p) => ({ ...p, doneById: value }))}
                      placeholder="Select user"
                      className={inputClass}
                                          />
                  </div>
                </div>
              )}
              {/* POCs Attended */}
              <div>
                <label className={labelClass}>POCs Attended (comma-separated)</label>
                <input
                  type="text"
                  className={inputClass}
                  placeholder="John Doe, Jane Smith"
                  value={demoForm.attendees}
                  onChange={(e) => setDemoForm((p) => ({ ...p, attendees: e.target.value }))}
                />
              </div>
              {/* Notes */}
              <div>
                <label className={labelClass}>Scheduled Notes</label>
                <textarea
                  className={`${inputClass} min-h-[100px] resize-y`}
                  placeholder="Add notes for the scheduled demo..."
                  value={demoForm.notes}
                  onChange={(e) => setDemoForm((p) => ({ ...p, notes: e.target.value }))}
                />
              </div>
            </div>
            <div className="mt-6 flex justify-end gap-3">
              <button
                type="button"
                className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-200 dark:hover:bg-gray-700"
                onClick={() => {
                  setAddDemoOpen(false);
                  setDemoForm({ scheduledAt: "", scheduledById: "", status: "Scheduled", doneAt: "", doneById: "", attendees: "", notes: "", completionAttendees: "", completionNotes: "" });
                }}
                disabled={demoSaving}
              >
                Cancel
              </button>
              <button
                type="button"
                className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-60"
                onClick={handleCreateDemo}
                disabled={demoSaving}
              >
                {demoSaving ? "Adding..." : "Add Demo"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Demo Modal */}
      {editDemoOpen && editingDemo && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-xl dark:bg-gray-900">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Edit Demo</h3>
              <button
                type="button"
                className="rounded-lg p-1 text-gray-500 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-800"
                onClick={() => {
                  setEditDemoOpen(false);
                  setEditingDemo(null);
                }}
              >
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="space-y-4">
              {/* Row 1: Date & Time + Scheduled By */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className={labelClass}>Demo Scheduled Date & Time</label>
                  <DateTimePicker
                    id="edit-demo-scheduled-picker"
                    value={editDemoForm.scheduledAt}
                    onChange={(val) => setEditDemoForm((p) => ({ ...p, scheduledAt: val }))}
                    placeholder="dd-mm-yyyy --:--"
                    enableTime={true}
                  />
                </div>
                <div>
                  <label className={labelClass}>Demo Scheduled By</label>
                  <div className="relative">
                    <select
                      className={inputClass}
                      value={editDemoForm.scheduledById}
                      onChange={(e) => setEditDemoForm((p) => ({ ...p, scheduledById: e.target.value }))}
                    >
                      <option value=""></option>
                      {teamMembers.map((tm) => (
                        <option key={tm.id} value={tm.id}>{tm.fullName || tm.email}</option>
                      ))}
                    </select>
                    {!editDemoForm.scheduledById && (
                      <span className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-sm text-gray-400 dark:text-gray-500">
                        Select user
                      </span>
                    )}
                  </div>
                </div>
              </div>
              {/* Demo Status */}
              <div>
                <label className={labelClass}>Demo Status</label>
                <select
                  className={inputClass}
                  value={editDemoForm.status}
                  onChange={(e) => setEditDemoForm((p) => ({ ...p, status: e.target.value as DemoStatus }))}
                >
                  <option value="Scheduled">Scheduled</option>
                  <option value="Completed">Completed</option>
                  <option value="Cancelled">Cancelled</option>
                  <option value="NoShow">No Show</option>
                </select>
              </div>
              {/* Completed fields - only show when status is Completed */}
              {editDemoForm.status === "Completed" && (
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className={labelClass}>Demo Done Date & Time</label>
                    <DateTimePicker
                      id="edit-demo-done-picker"
                      value={editDemoForm.doneAt}
                      onChange={(val) => setEditDemoForm((p) => ({ ...p, doneAt: val }))}
                      placeholder="dd-mm-yyyy --:--"
                      enableTime={true}
                    />
                  </div>
                  <div>
                    <label className={labelClass}>Demo Done By</label>
                    <div className="relative">
                      <select
                        className={inputClass}
                        value={editDemoForm.doneById}
                        onChange={(e) => setEditDemoForm((p) => ({ ...p, doneById: e.target.value }))}
                      >
                        <option value=""></option>
                        {teamMembers.map((tm) => (
                          <option key={tm.id} value={tm.id}>{tm.fullName || tm.email}</option>
                        ))}
                      </select>
                      {!editDemoForm.doneById && (
                        <span className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-sm text-gray-400 dark:text-gray-500">
                          Select user
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              )}
              {/* POCs Attended */}
              <div>
                <label className={labelClass}>POCs Attended (comma-separated)</label>
                <input
                  type="text"
                  className={inputClass}
                  placeholder="John Doe, Jane Smith"
                  value={editDemoForm.attendees}
                  onChange={(e) => setEditDemoForm((p) => ({ ...p, attendees: e.target.value }))}
                />
              </div>
              {/* Notes */}
              <div>
                <label className={labelClass}>Scheduled Notes</label>
                <textarea
                  className={`${inputClass} min-h-[100px] resize-y`}
                  placeholder="Update scheduled demo notes..."
                  value={editDemoForm.notes}
                  onChange={(e) => setEditDemoForm((p) => ({ ...p, notes: e.target.value }))}
                />
              </div>
            </div>
            <div className="mt-6 flex justify-end gap-3">
              <button
                type="button"
                className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-200 dark:hover:bg-gray-700"
                onClick={() => {
                  setEditDemoOpen(false);
                  setEditingDemo(null);
                }}
                disabled={demoSaving}
              >
                Cancel
              </button>
              <button
                type="button"
                className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-60"
                onClick={handleUpdateDemo}
                disabled={demoSaving}
              >
                {demoSaving ? "Saving..." : "Save Changes"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
