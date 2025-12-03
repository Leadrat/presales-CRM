import React from "react";
import { render, screen } from "@testing-library/react";
import { ActivityLogList } from "@/components/activity/ActivityLogList";
import type { AccountActivityEntry } from "@/lib/api";

describe("ActivityLogList", () => {
  it("renders nothing when there are no entries", () => {
    const { container } = render(<ActivityLogList entries={[]} />);
    expect(container.firstChild).toBeNull();
  });

  it("renders activity entries with labels, categories, actor name, and description", () => {
    const entries: AccountActivityEntry[] = [
      {
        id: "1",
        accountId: "acc-1",
        eventType: "DEAL_STAGE_CHANGED",
        description: "Deal stage changed from 'New lead' to 'Qualified'",
        timestamp: new Date("2025-01-01T12:00:00Z").toISOString(),
        actorId: "user-1",
        actorName: "Alice",
        relatedEntityType: "Account",
        relatedEntityId: "acc-1",
      },
      {
        id: "2",
        accountId: "acc-1",
        eventType: "CONTACT_ADDED",
        description: "Contact added: Bob",
        timestamp: new Date("2025-01-02T12:00:00Z").toISOString(),
        actorId: "user-2",
        actorName: "Bob",
        relatedEntityType: "Account",
        relatedEntityId: "acc-1",
      },
      {
        id: "3",
        accountId: "acc-1",
        eventType: "DEMO_SCHEDULED",
        description: "Demo scheduled tomorrow",
        timestamp: new Date("2025-01-03T12:00:00Z").toISOString(),
        actorId: "user-3",
        actorName: "Carol",
        relatedEntityType: "Account",
        relatedEntityId: "acc-1",
      },
    ];

    render(<ActivityLogList entries={entries} />);

    // Pipeline event
    expect(screen.getByText("Deal stage changed")).toBeInTheDocument();
    expect(screen.getByText("Pipeline")).toBeInTheDocument();
    expect(
      screen.getByText("Deal stage changed from 'New lead' to 'Qualified'")
    ).toBeInTheDocument();
    expect(screen.getByText("Alice")).toBeInTheDocument();

    // Contact event
    expect(screen.getByText("Contact added")).toBeInTheDocument();
    expect(screen.getByText("Contact")).toBeInTheDocument();
    expect(screen.getByText("Contact added: Bob")).toBeInTheDocument();
    expect(screen.getByText("Bob")).toBeInTheDocument();

    // Demo event
    expect(screen.getByText("Demo scheduled")).toBeInTheDocument();
    expect(screen.getByText("Demo")).toBeInTheDocument();
    expect(screen.getByText("Demo scheduled tomorrow")).toBeInTheDocument();
    expect(screen.getByText("Carol")).toBeInTheDocument();
  });
});
