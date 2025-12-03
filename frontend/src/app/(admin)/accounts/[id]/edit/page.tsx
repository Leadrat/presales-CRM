"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import {
  getAccountDetail,
  getAccountLookups,
  updateAccount,
  createContact,
  type AccountLookups,
  type AccountUpdateInput,
  type AccountDetailDto,
  type ContactCreateInput,
} from "@/lib/api";
import { CollapsibleContact, type ContactInput } from "@/components/contacts/CollapsibleContact";
import { AddContactModal } from "@/components/contacts/AddContactModal";

export default function AdminEditAccountPage() {
  const router = useRouter();
  const params = useParams();
  const accountId = params?.id as string | undefined;

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

  const [loadingAccount, setLoadingAccount] = useState(true);
  const [accountError, setAccountError] = useState<string | null>(null);

  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const [contacts, setContacts] = useState<ContactInput[]>([]);
  const [addContactOpen, setAddContactOpen] = useState(false);

  useEffect(() => {
    if (!accountId) {
      setAccountError("Missing account id.");
      setLoadingAccount(false);
      return;
    }

    let cancelled = false;

    const load = async () => {
      try {
        setLoadingAccount(true);
        setAccountError(null);

        const [detailResult, lookupData] = await Promise.all([
          getAccountDetail(accountId),
          getAccountLookups(),
        ]);

        if (cancelled) return;

        if ("error" in detailResult) {
          const { message } = detailResult.error;
          setAccountError(message || "Failed to load account");
          return;
        }

        const account: AccountDetailDto = detailResult.data;

        setCompanyName(account.companyName ?? "");
        setWebsite(account.websiteUrl ?? account.website ?? "");
        setDecisionMakers(account.decisionMakers ?? "");
        setInstagramUrl(account.instagramUrl ?? "");
        setLinkedinUrl(account.linkedinUrl ?? "");
        setPhone(account.phone ?? "");
        setEmail(account.email ?? "");
        setAccountTypeId(account.accountTypeId);
        setAccountSizeId(account.accountSizeId);
        setCrmProviderId(account.currentCrmId);
        setNumberOfUsers(account.numberOfUsers ? String(account.numberOfUsers) : "");

        if (account.crmExpiry) {
          const d = new Date(account.crmExpiry);
          const month = String(d.getUTCMonth() + 1).padStart(2, "0");
          const year = String(d.getUTCFullYear()).slice(-2);
          setCrmExpiry(`${month}/${year}`);
        } else {
          setCrmExpiry("");
        }

        setLookups(lookupData);
        setLookupError(null);
      } catch (e: any) {
        if (cancelled) return;
        setAccountError(e?.message || "Failed to load account");
      } finally {
        if (!cancelled) {
          setLoadingAccount(false);
          setLoadingLookups(false);
        }
      }
    };

    load();

    return () => {
      cancelled = true;
    };
  }, [accountId]);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!accountId) return;

    setSubmitError(null);

    if (!companyName.trim()) {
      setSubmitError("Company name is required");
      return;
    }
    if (!accountTypeId || !accountSizeId) {
      setSubmitError("Please select account type and size");
      return;
    }
    if (!decisionMakers.trim()) {
      setSubmitError("Decision makers are required");
      return;
    }
    if (!phone.trim()) {
      setSubmitError("Phone number is required");
      return;
    }
    if (!email.trim()) {
      setSubmitError("Email is required");
      return;
    }

    const payload: AccountUpdateInput = {
      companyName: companyName.trim(),
      website: website.trim() || undefined,
      accountTypeId,
      accountSizeId,
      currentCrmId: crmProviderId || undefined,
      numberOfUsers: numberOfUsers ? Number(numberOfUsers) : undefined,
      crmExpiry: crmExpiry.trim() || undefined,
      decisionMakers: decisionMakers.trim(),
      instagramUrl: instagramUrl.trim() || undefined,
      linkedinUrl: linkedinUrl.trim() || undefined,
      phone: phone.trim(),
      email: email.trim(),
    };

    const preparedContacts: ContactCreateInput[] = contacts
      .map((c) => ({
        name: c.name.trim(),
        email: c.email.trim() || undefined,
        workPhone: c.workPhone.trim() || undefined,
        personalPhone: c.personalPhone.trim() || undefined,
        designation: c.designation.trim() || undefined,
        city: c.city.trim() || undefined,
        dateOfBirth: c.dateOfBirth ? new Date(c.dateOfBirth).toISOString() : undefined,
        instagramUrl: c.instagramUrl.trim() || undefined,
        linkedinUrl: c.linkedinUrl.trim() || undefined,
      }))
      .filter((c) => c.name.length > 0);

    try {
      setSubmitting(true);
      await updateAccount(accountId, payload);

      if (preparedContacts.length > 0) {
        for (const c of preparedContacts) {
          await createContact(accountId, c);
        }
      }

      router.push(`/accounts/${accountId}`);
    } catch (e: any) {
      setSubmitError(e?.message || "Failed to update account or add contacts");
    } finally {
      setSubmitting(false);
    }
  };

  if (loadingAccount) {
    return (
      <div className="min-h-screen bg-slate-950 px-4 py-6 lg:px-8 lg:py-8">
        <div className="mx-auto w-full max-w-5xl">
          <h1 className="mb-4 text-3xl font-semibold text-gray-50">Edit account</h1>
          <p className="text-base text-gray-400">Loading account...</p>
        </div>
      </div>
    );
  }

  if (accountError) {
    return (
      <div className="min-h-screen bg-slate-950 px-4 py-6 lg:px-8 lg:py-8">
        <div className="mx-auto w-full max-w-5xl">
          <h1 className="mb-4 text-3xl font-semibold text-gray-50">Edit account</h1>
          <p className="text-base text-red-400">{accountError}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 px-4 py-6 lg:px-8 lg:py-8">
      <div className="mx-auto w-full max-w-5xl space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-semibold text-gray-50">Edit account</h1>
            <p className="mt-1 text-base text-gray-400">
              Update the details for this account.
            </p>
          </div>
          <button
            type="button"
            className="inline-flex items-center rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm transition-colors hover:bg-gray-50"
            onClick={() => router.push(`/accounts/${accountId}`)}
            disabled={submitting}
          >
            Cancel
          </button>
        </div>

        <div className="rounded-2xl border border-gray-800 bg-gray-900/80 p-6 shadow-sm">
          {loadingLookups && (
            <p className="text-sm text-gray-400">Loading account lookups...</p>
          )}

          {!loadingLookups && lookupError && (
            <p className="text-sm text-red-400">{lookupError}</p>
          )}

          {lookups && (
            <>
            <form onSubmit={onSubmit} className="space-y-6">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="sm:col-span-2 space-y-1.5">
                  <label className="block text-sm font-medium text-gray-300">
                    Company name<span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    className="w-full rounded-lg border border-gray-700 bg-gray-900/60 px-3 py-2 text-sm text-gray-100 outline-none ring-0 placeholder:text-gray-500 focus:border-brand-400 focus:ring-1 focus:ring-brand-400"
                    value={companyName}
                    onChange={(e) => setCompanyName(e.target.value)}
                    required
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="block text-sm font-medium text-gray-300">Website</label>
                  <input
                    type="text"
                    className="w-full rounded-lg border border-gray-700 bg-gray-900/60 px-3 py-2 text-sm text-gray-100 outline-none ring-0 placeholder:text-gray-500 focus:border-brand-400 focus:ring-1 focus:ring-brand-400"
                    value={website}
                    onChange={(e) => setWebsite(e.target.value)}
                  />
                </div>

                <div className="space-y-1.5 sm:col-span-2">
                  <label className="block text-sm font-medium text-gray-300">
                    Decision makers<span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    className="w-full rounded-lg border border-gray-700 bg-gray-900/60 px-3 py-2 text-sm text-gray-100 outline-none ring-0 placeholder:text-gray-500 focus:border-brand-400 focus:ring-1 focus:ring-brand-400"
                    value={decisionMakers}
                    onChange={(e) => setDecisionMakers(e.target.value)}
                    required
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="block text-sm font-medium text-gray-300">Number of users</label>
                  <input
                    type="number"
                    min={1}
                    className="w-full rounded-lg border border-gray-700 bg-gray-900/60 px-3 py-2 text-sm text-gray-100 outline-none ring-0 placeholder:text-gray-500 focus:border-brand-400 focus:ring-1 focus:ring-brand-400"
                    value={numberOfUsers}
                    onChange={(e) => setNumberOfUsers(e.target.value)}
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="block text-sm font-medium text-gray-300">
                    Account type<span className="text-red-500">*</span>
                  </label>
                  <select
                    className="w-full rounded-lg border border-gray-700 bg-gray-900/60 px-3 py-2 text-sm text-gray-100 outline-none ring-0 focus:border-brand-400 focus:ring-1 focus:ring-brand-400"
                    value={accountTypeId}
                    onChange={(e) => setAccountTypeId(e.target.value)}
                    required
                  >
                    {lookups.accountTypes.map((t) => (
                      <option key={t.id} value={t.id}>
                        {t.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="block text-sm font-medium text-gray-300">
                    Account size<span className="text-red-500">*</span>
                  </label>
                  <select
                    className="w-full rounded-lg border border-gray-700 bg-gray-900/60 px-3 py-2 text-sm text-gray-100 outline-none ring-0 focus:border-brand-400 focus:ring-1 focus:ring-brand-400"
                    value={accountSizeId}
                    onChange={(e) => setAccountSizeId(e.target.value)}
                    required
                  >
                    {lookups.accountSizes.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="block text-sm font-medium text-gray-300">
                    Current CRM provider
                  </label>
                  <select
                    className="w-full rounded-lg border border-gray-700 bg-gray-900/60 px-3 py-2 text-sm text-gray-100 outline-none ring-0 focus:border-brand-400 focus:ring-1 focus:ring-brand-400"
                    value={crmProviderId}
                    onChange={(e) => setCrmProviderId(e.target.value)}
                  >
                    <option value="">
                      Select CRM provider
                    </option>
                    {lookups.crmProviders.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="block text-sm font-medium text-gray-300">
                    CRM expiry (MM/YY)
                  </label>
                  <input
                    type="text"
                    className="w-full rounded-lg border border-gray-700 bg-gray-900/60 px-3 py-2 text-sm text-gray-100 outline-none ring-0 placeholder:text-gray-500 focus:border-brand-400 focus:ring-1 focus:ring-brand-400"
                    placeholder="MM/YY"
                    value={crmExpiry}
                    onChange={(e) => setCrmExpiry(e.target.value)}
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="block text-sm font-medium text-gray-300">Instagram URL</label>
                  <input
                    type="text"
                    className="w-full rounded-lg border border-gray-700 bg-gray-900/60 px-3 py-2 text-sm text-gray-100 outline-none ring-0 placeholder:text-gray-500 focus:border-brand-400 focus:ring-1 focus:ring-brand-400"
                    value={instagramUrl}
                    onChange={(e) => setInstagramUrl(e.target.value)}
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="block text-sm font-medium text-gray-300">LinkedIn URL</label>
                  <input
                    type="text"
                    className="w-full rounded-lg border border-gray-700 bg-gray-900/60 px-3 py-2 text-sm text-gray-100 outline-none ring-0 placeholder:text-gray-500 focus:border-brand-400 focus:ring-1 focus:ring-brand-400"
                    value={linkedinUrl}
                    onChange={(e) => setLinkedinUrl(e.target.value)}
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="block text-sm font-medium text-gray-300">
                    Phone number<span className="text-red-500">*</span>
                  </label>
                  <input
                    type="tel"
                    className="w-full rounded-lg border border-gray-700 bg-gray-900/60 px-3 py-2 text-sm text-gray-100 outline-none ring-0 placeholder:text-gray-500 focus:border-brand-400 focus:ring-1 focus:ring-brand-400"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    required
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="block text-sm font-medium text-gray-300">
                    Email ID<span className="text-red-500">*</span>
                  </label>
                  <input
                    type="email"
                    className="w-full rounded-lg border border-gray-700 bg-gray-900/60 px-3 py-2 text-sm text-gray-100 outline-none ring-0 placeholder:text-gray-500 focus:border-brand-400 focus:ring-1 focus:ring-brand-400"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>
              </div>

              {/* Additional contacts to add for this existing account (Admin) */}
              <div className="mt-6 border-t border-gray-800 pt-4 space-y-3">
                <div className="flex items-center justify-between">
                  <h2 className="text-sm font-semibold text-gray-100">Contacts</h2>
                  <button
                    type="button"
                    className="inline-flex items-center rounded-lg bg-brand-500 px-3 py-1.5 text-xs font-medium text-white shadow-sm transition-colors hover:bg-brand-600 disabled:opacity-60"
                    onClick={() => setAddContactOpen(true)}
                    disabled={submitting}
                  >
                    + Add Contact
                  </button>
                </div>

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

              {submitError && (
                <p className="text-sm text-red-600">{submitError}</p>
              )}

              <div className="flex items-center justify-end gap-3">
                <button
                  type="button"
                  className="inline-flex items-center rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm transition-colors hover:bg-gray-50"
                  onClick={() => router.push(`/accounts/${accountId}`)}
                  disabled={submitting}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="inline-flex items-center rounded-lg bg-brand-500 px-4 py-2 text-sm font-medium text-white shadow-sm transition-colors hover:bg-brand-600 disabled:opacity-60"
                  disabled={submitting}
                >
                  {submitting ? "Saving..." : "Save changes"}
                </button>
              </div>
            </form>

            <AddContactModal
              isOpen={addContactOpen}
              onClose={() => setAddContactOpen(false)}
              onCreated={(contact) => {
                setContacts((prev) => [...prev, contact]);
              }}
            />
            </>
          )}
        </div>
      </div>
    </div>
  );
}
