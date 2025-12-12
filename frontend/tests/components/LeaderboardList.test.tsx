import React from "react";
import { render, screen } from "@testing-library/react";
import { LeaderboardList } from "@/app/(protected)/leaderboard/LeaderboardList";
import type { LeaderboardUserRow } from "@/lib/api";

// Mock component to avoid Next.js Image issues in tests
jest.mock("next/image", () => ({
  __esModule: true,
  default: (props: any) => {
    return <img {...props} />;
  },
}));

describe("LeaderboardList", () => {
  it("renders nothing when there are no users", () => {
    const { container } = render(<LeaderboardList users={[]} />);
    expect(container.querySelector(".empty-state")).not.toBeNull();
    expect(screen.getByText(/No leaderboard data/i)).toBeInTheDocument();
  });

  it("renders leaderboard entries with correct ranking, names, and points", () => {
    const users: LeaderboardUserRow[] = [
      {
        userId: "user-1",
        name: "Alice Smith",
        points: 15,
        accountsCreated: 3,
        demos: {
          small: 1,
          medium: 1,
          enterprise: 1,
        },
      },
      {
        userId: "user-2",
        name: "Bob Johnson",
        points: 10,
        accountsCreated: 2,
        demos: {
          small: 1,
          medium: 1,
          enterprise: 0,
        },
      },
      {
        userId: "user-3",
        name: "Carol Williams",
        points: 7,
        accountsCreated: 1,
        demos: {
          small: 0,
          medium: 0,
          enterprise: 1,
        },
      },
      {
        userId: "user-4",
        name: "Dave Brown",
        points: 4,
        accountsCreated: 2,
        demos: {
          small: 0,
          medium: 0,
          enterprise: 0,
        },
      },
    ];

    render(<LeaderboardList users={users} />);

    // Check for user names
    expect(screen.getByText("Alice Smith")).toBeInTheDocument();
    expect(screen.getByText("Bob Johnson")).toBeInTheDocument();
    expect(screen.getByText("Carol Williams")).toBeInTheDocument();
    expect(screen.getByText("Dave Brown")).toBeInTheDocument();

    // Check for points
    expect(screen.getByText("15")).toBeInTheDocument();
    expect(screen.getByText("10")).toBeInTheDocument();
    expect(screen.getByText("7")).toBeInTheDocument();
    expect(screen.getByText("4")).toBeInTheDocument();

    // Check for account counts
    expect(screen.getByText(/Accounts: 3/i)).toBeInTheDocument();
    expect(screen.getByText(/Accounts: 2/i)).toBeInTheDocument();
    expect(screen.getByText(/Accounts: 1/i)).toBeInTheDocument();

    // Check for demo counts
    expect(screen.getByText(/Demos: 3/i)).toBeInTheDocument();
    expect(screen.getByText(/Demos: 2/i)).toBeInTheDocument();
    expect(screen.getByText(/Demos: 1/i)).toBeInTheDocument();
    expect(screen.getByText(/Demos: 0/i)).toBeInTheDocument();

    // Check for ranking badges (1, 2, 3, 4)
    const rankBadges = screen.getAllByTestId("rank-badge");
    expect(rankBadges).toHaveLength(4);
    expect(rankBadges[0]).toHaveTextContent("1");
    expect(rankBadges[1]).toHaveTextContent("2");
    expect(rankBadges[2]).toHaveTextContent("3");
    expect(rankBadges[3]).toHaveTextContent("4");

    // Check for top-3 special styling
    const topRanks = screen.getAllByTestId("top-rank");
    expect(topRanks).toHaveLength(3); // Only top 3 should have special styling
  });

  it("handles demo breakdown display correctly", () => {
    const users: LeaderboardUserRow[] = [
      {
        userId: "user-1",
        name: "Alice Smith",
        points: 15,
        accountsCreated: 3,
        demos: {
          small: 2,
          medium: 2,
          enterprise: 1,
        },
      },
    ];

    render(<LeaderboardList users={users} />);

    // Check for demo breakdown
    expect(screen.getByText(/2 small/i)).toBeInTheDocument();
    expect(screen.getByText(/2 medium/i)).toBeInTheDocument();
    expect(screen.getByText(/1 enterprise/i)).toBeInTheDocument();
  });
});
