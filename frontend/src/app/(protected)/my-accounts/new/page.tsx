"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Save, ArrowLeft, Building2 } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { createAccount, getAccountLookups, type AccountLookups } from "@/lib/api";
import { CollapsibleContact, type ContactInput } from "@/components/contacts/CollapsibleContact";
import { AddContactModal } from "@/components/contacts/AddContactModal";
import PlaceholderSelect from "@/components/form/PlaceholderSelect";
import PlaceholderInput from "@/components/form/PlaceholderInput";
import PhoneNumberInput from "@/components/form/PhoneNumberInput";

export default function NewMyAccountPage() {
  const router = useRouter();
  const { user, status } = useAuth();

  const [lookups, setLookups] = useState<AccountLookups | null>(null);
  const [loadingLookups, setLoadingLookups] = useState(true);
  const [lookupError, setLookupError] = useState<string | null>(null);

  const [companyName, setCompanyName] = useState("");
  const [website, setWebsite] = useState("");
  const [decisionMakers, setDecisionMakers] = useState("");
  const [instagramUrl, setInstagramUrl] = useState("");
  const [linkedinUrl, setLinkedinUrl] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [accountTypeId, setAccountTypeId] = useState("");
  const [accountSizeId, setAccountSizeId] = useState("");
  const [crmProviderId, setCrmProviderId] = useState("");
  const [numberOfUsers, setNumberOfUsers] = useState<string>("");
  const [crmExpiry, setCrmExpiry] = useState("");
  const [leadSource, setLeadSource] = useState("");
  const [dealStage, setDealStage] = useState("NEW_LEAD");
  const [city, setCity] = useState("");

  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const [contacts, setContacts] = useState<ContactInput[]>([]);
  const [addContactOpen, setAddContactOpen] = useState(false);

  const orderedCrmProviders =
    lookups
      ? [
          ...lookups.crmProviders.filter((p) => p.name !== "None" && p.name !== "None/Unknown"),
          ...lookups.crmProviders.filter((p) => p.name === "None/Unknown"),
        ]
      : [];

  // Compute account size label from number of users
  // Updated logic: <10 no label, 10-24 Small, 25-49 Medium, 50+ Enterprise
  const computeSizeLabel = (users: string | number | null | undefined): string => {
    const numUsers = typeof users === "string" ? parseInt(users, 10) : users;
    if (typeof numUsers !== "number" || !Number.isFinite(numUsers) || numUsers < 10) {
      return "";
    }
    if (numUsers <= 24) return "Small Account";
    if (numUsers <= 49) return "Medium Account";
    return "Enterprise";
  };

  // Get badge styling based on account size label (matches detail page style)
  const accountSizeTagClass = (label: string) => {
    const base = "inline-flex items-center rounded-lg border px-6 py-2.5 text-lg font-semibold shadow";
    if (label.includes("Enterprise")) {
      return `${base} border-purple-200 bg-purple-50 text-purple-700 dark:border-purple-800 dark:bg-purple-900/25 dark:text-purple-300`;
    }
    if (label.includes("Medium")) {
      return `${base} border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-800 dark:bg-amber-900/25 dark:text-amber-300`;
    }
    if (label.includes("Small")) {
      return `${base} border-green-200 bg-green-50 text-green-700 dark:border-green-800 dark:bg-green-900/25 dark:text-green-300`;
    }
    if (label.includes("Little")) {
      return `${base} border-cyan-200 bg-cyan-50 text-cyan-700 dark:border-cyan-800 dark:bg-cyan-900/25 dark:text-cyan-300`;
    }
    return "hidden";
  };

  // Optional: if an Admin hits this route, send them to Admin create
  useEffect(() => {
    if (status === "authenticated" && user?.role === "Admin") {
      router.replace("/accounts/new");
    }
  }, [status, user, router]);

  // Redirect unauthenticated users to login
  useEffect(() => {
    if (status === "unauthenticated") {
      router.replace("/login");
    }
  }, [status, router]);

  // Load lookups
  useEffect(() => {
    let cancelled = false;
    if (status !== "authenticated") return;

    const load = async () => {
      setLoadingLookups(true);
      setLookupError(null);
      try {
        const data = await getAccountLookups();
        if (cancelled) return;
        setLookups(data);
      } catch (e: any) {
        if (cancelled) return;
        setLookupError(e?.message || "Failed to load account lookups");
      } finally {
        if (!cancelled) setLoadingLookups(false);
      }
    };
    void load();
    return () => {
      cancelled = true;
    };
  }, [status]);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitError(null);

    if (!companyName.trim()) return setSubmitError("Company name is required");
    if (!accountTypeId) return setSubmitError("Please select account type");
    // Auto-select first account size from lookups if not set (backend computes actual size from numberOfUsers)
    let finalAccountSizeId = accountSizeId;
    if (!finalAccountSizeId && lookups && lookups.accountSizes.length > 0) {
      finalAccountSizeId = lookups.accountSizes[0].id;
    }
    if (!finalAccountSizeId) return setSubmitError("Please select account size");
    if (!decisionMakers.trim()) return setSubmitError("Decision makers are required");
    if (!phone.trim()) return setSubmitError("Phone number is required");
    if (!email.trim()) return setSubmitError("Email is required");

    setSubmitting(true);
    try {
      const preparedContacts = contacts
        .map((c) => ({
          name: c.name.trim(),
          email: c.email.trim(),
          workPhone: c.workPhone.trim(),
          personalPhone: c.personalPhone.trim(),
          designation: c.designation.trim(),
          city: c.city.trim(),
          dateOfBirth: c.dateOfBirth.trim(),
          instagramUrl: c.instagramUrl.trim(),
          linkedinUrl: c.linkedinUrl.trim(),
        }))
        .filter((c) => c.name.length > 0);

      // Ensure finalAccountSizeId is set (should already be set in validation, but double-check)
      if (!finalAccountSizeId && lookups && lookups.accountSizes.length > 0) {
        finalAccountSizeId = lookups.accountSizes[0].id;
      }

      const payload = await createAccount({
        companyName: companyName.trim(),
        website: website.trim() || undefined,
        accountTypeId,
        accountSizeId: finalAccountSizeId,
        currentCrmId: crmProviderId || undefined,
        numberOfUsers: numberOfUsers ? Number(numberOfUsers) : undefined,
        crmExpiry: crmExpiry.trim() || undefined,
        leadSource: leadSource.trim() || undefined,
        dealStage: dealStage.trim() || undefined,
        decisionMakers: decisionMakers.trim(),
        instagramUrl: instagramUrl.trim() || undefined,
        linkedinUrl: linkedinUrl.trim() || undefined,
        phone: phone.trim(),
        email: email.trim(),
        city: city.trim() || undefined,
        contacts:
          preparedContacts.length > 0
            ? preparedContacts.map((c) => ({
                name: c.name,
                email: c.email || undefined,
                workPhone: c.workPhone || undefined,
                personalPhone: c.personalPhone || undefined,
                designation: c.designation || undefined,
                city: c.city || undefined,
                dateOfBirth: c.dateOfBirth ? new Date(c.dateOfBirth).toISOString() : undefined,
                instagramUrl: c.instagramUrl || undefined,
                linkedinUrl: c.linkedinUrl || undefined,
              }))
            : undefined,
      });

      if (!payload?.id) throw new Error("Account created but no ID returned");

      router.push(`/my-accounts/${payload.id}`);
    } catch (err: any) {
      setSubmitError(err?.message || "Failed to create account");
    } finally {
      setSubmitting(false);
    }
  };

  if (status === "checking") {
    return (
      <div className="min-h-screen bg-slate-50 px-4 py-6 text-gray-900 dark:bg-slate-950 dark:text-gray-100 lg:px-8 lg:py-8">
        <div className="mx-auto w-full max-w-4xl">
          <p className="text-sm text-gray-600 dark:text-gray-400">Checking access...</p>
        </div>
      </div>
    );
  }
  if (status === "unauthenticated") return null;

  return (
    <div className="min-h-screen bg-slate-50 px-4 py-6 text-gray-900 dark:bg-slate-950 dark:text-gray-100 lg:px-10 lg:py-8">
      <div className="mx-auto w-full max-w-6xl space-y-6">
        {/* Page header */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-start gap-3">
            <button
              type="button"
              onClick={() => router.back()}
              className="mt-1 inline-flex items-center justify-center rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-700 shadow-sm transition-colors hover:bg-gray-50 dark:border-gray-800 dark:bg-gray-900 dark:text-gray-200"
              aria-label="Go back"
              title="Back"
            >
              <ArrowLeft className="h-4 w-4" />
            </button>
            <div className="flex flex-col gap-1">
              <h1 className="text-3xl font-semibold text-gray-900 dark:text-gray-50">New Account</h1>
              <p className="mt-1 text-base text-gray-600 dark:text-gray-400">Create a new account</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            {(() => {
              const sizeLabel = computeSizeLabel(numberOfUsers);
              return sizeLabel ? (
                <span className={accountSizeTagClass(sizeLabel)}>{sizeLabel}</span>
              ) : null;
            })()}
          </div>
        </div>

        {/* Card */}
        <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-md dark:border-gray-800 dark:bg-gray-900/80">
          {loadingLookups && <p className="text-sm text-gray-600 dark:text-gray-400">Loading account lookups...</p>}
          {!loadingLookups && lookupError && <p className="text-sm text-red-600 dark:text-red-400">{lookupError}</p>}

          {!loadingLookups && !lookupError && lookups && (
            <>
              <form onSubmit={onSubmit} className="space-y-8">
                {/* Company Information */}
                <div>
                  <h2 className="flex items-center gap-2 text-[0.92rem] font-semibold text-gray-900 dark:text-gray-100">
                    <span className="inline-flex h-[1.84rem] w-[1.84rem] items-center justify-center rounded-lg bg-blue-600 text-white">
                      <Building2 className="h-[1.05rem] w-[1.05rem]" />
                    </span>
                    Company Information
                  </h2>
                  <div className="mt-4 grid gap-4 sm:grid-cols-3">
                    <div className="space-y-1.5">
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                        Company name<span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 outline-none ring-0 placeholder:text-gray-400 focus:border-brand-400 focus:bg-white focus:ring-1 focus:ring-brand-400 dark:border-gray-700 dark:bg-gray-900/60 dark:text-gray-100 dark:placeholder:text-gray-500 dark:focus:bg-gray-900"
                        placeholder="e.g. Acme Corp"
                        value={companyName}
                        onChange={(e) => setCompanyName(e.target.value)}
                        required
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                        Account type<span className="text-red-500">*</span>
                      </label>
                      <PlaceholderSelect
                        options={lookups.accountTypes}
                        value={accountTypeId}
                        onChange={(value) => setAccountTypeId(value)}
                        placeholder="Select Account Type"
                        className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 outline-none ring-0 focus:border-brand-400 focus:bg-white focus:ring-1 focus:ring-brand-400 dark:border-gray-700 dark:bg-gray-900/60 dark:text-gray-100 dark:focus:bg-gray-900"
                        required={true}
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Number of users</label>
                      <input
                        type="number"
                        min={1}
                        className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 outline-none ring-0 placeholder:text-gray-400 focus:border-brand-400 focus:bg-white focus:ring-1 focus:ring-brand-400 dark:border-gray-700 dark:bg-gray-900/60 dark:text-gray-100 dark:placeholder:text-gray-500 dark:focus:bg-gray-900"
                        placeholder="e.g. 25"
                        value={numberOfUsers}
                        onChange={(e) => setNumberOfUsers(e.target.value)}
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Website URL</label>
                      <input
                        type="text"
                        className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 outline-none ring-0 placeholder:text-gray-400 focus:border-brand-400 focus:bg-white focus:ring-1 focus:ring-brand-400 dark:border-gray-700 dark:bg-gray-900/60 dark:text-gray-100 dark:placeholder:text-gray-500 dark:focus:bg-gray-900"
                        placeholder="https://example.com"
                        value={website}
                        onChange={(e) => setWebsite(e.target.value)}
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                        Phone number<span className="text-red-500">*</span>
                      </label>
                      <PhoneNumberInput
                        value={phone}
                        onChange={(value) => setPhone(value)}
                        placeholder="Phone number"
                        required
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                        Email<span className="text-red-500">*</span>
                      </label>
                      <input
                        type="email"
                        className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 outline-none ring-0 placeholder:text-gray-400 focus:border-brand-400 focus:bg-white focus:ring-1 focus:ring-brand-400 dark:border-gray-700 dark:bg-gray-900/60 dark:text-gray-100 dark:placeholder:text-gray-500 dark:focus:bg-gray-900"
                        placeholder="owner@example.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                        Decision makers<span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 outline-none ring-0 placeholder:text-gray-400 focus:border-brand-400 focus:bg-white focus:ring-1 focus:ring-brand-400 dark:border-gray-700 dark:bg-gray-900/60 dark:text-gray-100 dark:placeholder:text-gray-500 dark:focus:bg-gray-900"
                        placeholder="e.g. Main owner or buying committee"
                        value={decisionMakers}
                        onChange={(e) => setDecisionMakers(e.target.value)}
                        required
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Instagram Handle</label>
                      <input
                        type="text"
                        className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 outline-none ring-0 placeholder:text-gray-400 focus:border-brand-400 focus:bg-white focus:ring-1 focus:ring-brand-400 dark:border-gray-700 dark:bg-gray-900/60 dark:text-gray-100 dark:placeholder:text-gray-500 dark:focus:bg-gray-900"
                        placeholder="https://instagram.com/..."
                        value={instagramUrl}
                        onChange={(e) => setInstagramUrl(e.target.value)}
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">LinkedIn URL</label>
                      <input
                        type="text"
                        className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 outline-none ring-0 placeholder:text-gray-400 focus:border-brand-400 focus:bg-white focus:ring-1 focus:ring-brand-400 dark:border-gray-700 dark:bg-gray-900/60 dark:text-gray-100 dark:placeholder:text-gray-500 dark:focus:bg-gray-900"
                        placeholder="https://linkedin.com/company/..."
                        value={linkedinUrl}
                        onChange={(e) => setLinkedinUrl(e.target.value)}
                      />
                    </div>
                  </div>
                </div>

                {/* Sales Information */}
                <div className="border-t border-gray-200 pt-4 dark:border-gray-800">
                  <h2 className="text-[0.92rem] font-semibold text-gray-900 dark:text-gray-100">Sales Information</h2>
                  <div className="mt-4 grid gap-4 sm:grid-cols-3">
                    <div className="space-y-1.5">
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Account created by</label>
                      <select
                        className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 outline-none ring-0 focus:border-brand-400 focus:bg-white focus:ring-1 focus:ring-brand-400 dark:border-gray-700 dark:bg-gray-900/60 dark:text-gray-100 dark:focus:bg-gray-900"
                        value={user?.id || ""}
                        disabled
                      >
                        <option value={user?.id || ""}>
                          {user?.fullName && user.fullName.trim().length > 0 ? user.fullName : user?.email || "-"}
                        </option>
                      </select>
                    </div>

                    <div className="space-y-1.5">
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Lead source</label>
                      <PlaceholderSelect
                        options={[
                          { id: "COLD_CALL", name: "Cold Call" },
                          { id: "DATA", name: "Data" },
                          { id: "DIRECT", name: "Direct" },
                          { id: "EMAIL_CAMPAIGN", name: "Email Campaign" },
                          { id: "EVENT", name: "Event" },
                          { id: "FACEBOOK", name: "Facebook" },
                          { id: "GOOGLE_ADS", name: "Google Ads" },
                          { id: "INSTAGRAM", name: "Instagram" },
                          { id: "IVR", name: "IVR" },
                          { id: "LINKEDIN", name: "LinkedIn" },
                          { id: "PARTNER", name: "Partner" },
                          { id: "REFERRAL", name: "Referral" },
                          { id: "WALK_IN", name: "Walk-in" },
                          { id: "WEBSITE", name: "Website" },
                          { id: "WHATSAPP", name: "Whatsapp" },
                          { id: "YOUTUBE", name: "YouTube" },
                          { id: "OTHERS", name: "Others" },
                        ]}
                        value={leadSource}
                        onChange={(value) => setLeadSource(value)}
                        placeholder="Select Lead Source"
                        className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 outline-none ring-0 focus:border-brand-400 focus:bg-white focus:ring-1 focus:ring-brand-400 dark:border-gray-700 dark:bg-gray-900/60 dark:text-gray-100 dark:focus:bg-gray-900"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">City</label>
                      <input
                        type="text"
                        className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 outline-none ring-0 placeholder:text-gray-400 focus:border-brand-400 focus:bg-white focus:ring-1 focus:ring-brand-400 dark:border-gray-700 dark:bg-gray-900/60 dark:text-gray-100 dark:placeholder:text-gray-500 dark:focus:bg-gray-900"
                        placeholder="Enter city name"
                        value={city}
                        onChange={(e) => setCity(e.target.value)}
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Deal stage</label>
                      <PlaceholderSelect
                        options={[
                          { id: "LOST", name: "Closed Lost" },
                          { id: "WON", name: "Closed Won" },
                          { id: "NEGOTIATION", name: "Negotiation" },
                          { id: "PROPOSAL", name: "Proposal" },
                          { id: "PROSPECTING", name: "Prospecting" },
                          { id: "QUALIFICATION", name: "Qualification" },
                          { id: "OTHERS", name: "Others" },
                        ]}
                        value={dealStage}
                        onChange={(value) => setDealStage(value)}
                        placeholder="Select Deal Stage"
                        className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 outline-none ring-0 focus:border-brand-400 focus:bg-white focus:ring-1 focus:ring-brand-400 dark:border-gray-700 dark:bg-gray-900/60 dark:text-gray-100 dark:focus:bg-gray-900"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Current CRM</label>
                      <PlaceholderSelect
                        options={orderedCrmProviders}
                        value={crmProviderId}
                        onChange={(value) => setCrmProviderId(value)}
                        placeholder="Select CRM provider"
                        className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 outline-none ring-0 focus:border-brand-400 focus:bg-white focus:ring-1 focus:ring-brand-400 dark:border-gray-700 dark:bg-gray-900/60 dark:text-gray-100 dark:focus:bg-gray-900"
                                              />
                    </div>

                    <div className="space-y-1.5">
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">CRM Expiry (MM/YY)</label>
                      <input
                        type="text"
                        className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 outline-none ring-0 placeholder:text-gray-400 focus:border-brand-400 focus:bg-white focus:ring-1 focus:ring-brand-400 dark:border-gray-700 dark:bg-gray-900/60 dark:text-gray-100 dark:placeholder:text-gray-500 dark:focus:bg-gray-900"
                        placeholder="MM/YY"
                        value={crmExpiry}
                        onChange={(e) => setCrmExpiry(e.target.value)}
                      />
                    </div>
                  </div>
                </div>

                {/* Contacts list (header and add button removed) */}
                <div className="mt-6 space-y-3 border-t border-gray-200 pt-4 dark:border-gray-800">
                  {contacts.length > 0 && (
                    <div className="space-y-3">
                      {contacts.map((c, index) => (
                        <CollapsibleContact
                          key={index}
                          contact={c}
                          index={index}
                          disabled={submitting}
                          onChange={(updated) => {
                            setContacts((prev) => prev.map((row, i) => (i === index ? updated : row)));
                          }}
                          onRemove={() => {
                            setContacts((prev) => prev.filter((_, i) => i !== index));
                          }}
                        />
                      ))}
                    </div>
                  )}
                </div>

                {submitError && <p className="text-sm text-red-600 dark:text-red-400">{submitError}</p>}

                <div className="flex items-center justify-end gap-3">
                  <button
                    type="submit"
                    className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-blue-700 disabled:opacity-60"
                    disabled={submitting}
                  >
                    <Save className="h-4 w-4" />
                    {submitting ? "Creating..." : "Create Account"}
                  </button>
                </div>
              </form>

              <AddContactModal
                open={addContactOpen}
                onClose={() => setAddContactOpen(false)}
                onCreated={(contact) => {
                  setContacts((prev) => [
                    ...prev,
                    {
                      name: contact.name ?? "",
                      email: contact.email ?? "",
                      workPhone: contact.workPhone ?? "",
                      personalPhone: contact.personalPhone ?? "",
                      designation: contact.designation ?? "",
                      city: contact.city ?? "",
                      dateOfBirth: contact.dateOfBirth ?? "",
                      instagramUrl: contact.instagramUrl ?? "",
                      linkedinUrl: contact.linkedinUrl ?? "",
                    },
                  ]);
                }}
              />
            </>
          )}
        </div>
      </div>
    </div>
  );
}
