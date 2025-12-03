import React from "react";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { AccountActivityEntry } from "@/lib/api";
import MyAccountDetailPage from "@/app/(protected)/my-accounts/[id]/page";

// Mocks for Next.js navigation
jest.mock("next/navigation", () => ({
  useRouter: () => ({ replace: jest.fn() }),
  useParams: () => ({ id: "account-1" }),
}));

// Mock auth context to provide a logged-in user
jest.mock("@/context/AuthContext", () => ({
  useAuth: () => ({ user: { id: "user-1", name: "Test User" } }),
}));

const mockGetAccountDetail = jest.fn();
const mockGetAccountActivity = jest.fn();

jest.mock("@/lib/api", () => ({
  getAccountDetail: () => mockGetAccountDetail(),
  getAccountActivity: (id: string, filters?: any) => mockGetAccountActivity(id, filters),
  getAccountContacts: jest.fn().mockResolvedValue([]),
  getAccountNotes: jest.fn().mockResolvedValue([]),
  getAccountDemos: jest.fn().mockResolvedValue([]),
  getAccountLookups: jest.fn().mockResolvedValue({
    accountTypes: [],
    accountSizes: [],
    crmProviders: [],
  }),
  updateAccount: jest.fn(),
  updateContact: jest.fn(),
  deleteContact: jest.fn(),
  createAccountDemo: jest.fn(),
  updateDemo: jest.fn(),
  completeDemo: jest.fn(),
  deleteDemo: jest.fn(),
}));

describe("Account Activity tab", () => {
  beforeEach(() => {
    mockGetAccountDetail.mockReset();
    mockGetAccountActivity.mockReset();
  });

  function setupAccountDetailMock() {
    mockGetAccountDetail.mockResolvedValue({
      data: {
        id: "account-1",
        companyName: "Test Account",
        accountTypeId: "type-1",
        accountSizeId: "size-1",
        currentCrmId: "crm-1",
        website: "https://example.com",
        websiteUrl: "https://example.com",
        decisionMakers: "Alice",
        numberOfUsers: 5,
        instagramUrl: "",
        linkedinUrl: "",
        phone: "",
        email: "",
        leadSource: "LINKEDIN",
        dealStage: "NEW_LEAD",
        crmExpiry: new Date().toISOString(),
        accountTypeName: "Type",
        accountSizeName: "Size",
        crmProviderName: "CRM",
        createdAt: new Date().toISOString(),
        contactCount: 0,
        demoCount: 0,
        noteCount: 0,
        opportunityCount: 0,
      },
    });
  }

  it("loads and displays activity entries when Refresh is clicked on Activity tab", async () => {
    setupAccountDetailMock();

    const activityEntries: AccountActivityEntry[] = [
      {
        id: "a1",
        accountId: "account-1",
        eventType: "DEAL_STAGE_CHANGED",
        description: "Deal stage changed from 'New lead' to 'Qualified'",
        timestamp: new Date("2025-01-01T10:00:00Z").toISOString(),
        actorId: "user-1",
        actorName: "Alice",
        relatedEntityType: "Account",
        relatedEntityId: "account-1",
      },
    ];

    mockGetAccountActivity.mockResolvedValue({ items: activityEntries, nextCursor: null });

    render(<MyAccountDetailPage />);

    await waitFor(() => {
      expect(mockGetAccountDetail).toHaveBeenCalled();
    });

    const activityTab = screen.getByRole("button", { name: /activity log/i });
    await userEvent.click(activityTab);

    const refreshButton = await screen.findByRole("button", { name: /refresh/i });
    await userEvent.click(refreshButton);

    await screen.findByText("Deal stage changed");
    expect(
      screen.getByText("Deal stage changed from 'New lead' to 'Qualified'")
    ).toBeInTheDocument();
  });

  it("applies filters and uses cursor when loading more activity", async () => {
    setupAccountDetailMock();

    const firstPageEntries: AccountActivityEntry[] = [
      {
        id: "e1",
        accountId: "account-1",
        eventType: "DEMO_SCHEDULED",
        description: "Demo scheduled",
        timestamp: new Date("2025-01-01T11:00:00Z").toISOString(),
        actorId: "user-1",
        actorName: "Alice",
        relatedEntityType: "Account",
        relatedEntityId: "account-1",
      },
    ];
    const secondPageEntries: AccountActivityEntry[] = [
      {
        id: "e2",
        accountId: "account-1",
        eventType: "DEMO_COMPLETED",
        description: "Demo completed",
        timestamp: new Date("2025-01-02T11:00:00Z").toISOString(),
        actorId: "user-1",
        actorName: "Alice",
        relatedEntityType: "Account",
        relatedEntityId: "account-1",
      },
    ];

    mockGetAccountActivity
      .mockResolvedValueOnce({ items: firstPageEntries, nextCursor: "cursor-1" })
      .mockResolvedValueOnce({ items: secondPageEntries, nextCursor: null });

    render(<MyAccountDetailPage />);

    await waitFor(() => {
      expect(mockGetAccountDetail).toHaveBeenCalled();
    });

    const activityTab = screen.getByRole("button", { name: /activity log/i });
    await userEvent.click(activityTab);

    const refreshButton = await screen.findByRole("button", { name: /refresh/i });
    await userEvent.click(refreshButton);

    // Wait until the first page of activity has been loaded
    await waitFor(() => {
      expect(mockGetAccountActivity).toHaveBeenCalledTimes(1);
    });

    const loadMoreButton = await screen.findByRole("button", { name: /load more/i });
    await userEvent.click(loadMoreButton);

    // Second page should trigger a second API call
    await waitFor(() => {
      expect(mockGetAccountActivity).toHaveBeenCalledTimes(2);
    });

    const firstCall = mockGetAccountActivity.mock.calls[0];
    const secondCall = mockGetAccountActivity.mock.calls[1];

    expect(firstCall[0]).toBe("account-1");
    expect(secondCall[0]).toBe("account-1");
    expect(secondCall[1].cursor).toBe("cursor-1");
  });
});
