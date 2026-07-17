// Static, read-only sample workspace shown to every user as a display case.
// It never touches the API, so it renders identically for everyone and cannot
// be mutated. `/dashboard/demo` renders this instead of fetching.

export const DEMO_ID = "demo";

export interface DemoBug {
  id: string;
  title: string;
  description: string;
  severity: "High" | "Normal" | "Low";
  status: "OPEN" | "RESOLVED";
  comments: {
    id: string;
    text: string;
    user: { name: string; avatarUrl: string };
  }[];
}

const avatar = (name: string) =>
  `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=1a66ff&color=fff&bold=true`;

const MEMBERS = [
  { id: "d-u1", name: "Aarav Sharma", avatarUrl: avatar("Aarav Sharma") },
  { id: "d-u2", name: "Priya Nair", avatarUrl: avatar("Priya Nair") },
  { id: "d-u3", name: "Rohan Iyer", avatarUrl: avatar("Rohan Iyer") },
];

export const DEMO_DASHBOARD = {
  id: DEMO_ID,
  name: "Sample Workspace",
  accessKey: "SAMPLE",
  members: MEMBERS,
  activities: [
    { id: "d-a1", text: "Aarav Sharma reported 'Checkout deadlock under load'", createdAt: "2026-07-17T09:12:00.000Z" },
    { id: "d-a2", text: "Triage AI classified 3 incidents as High severity", createdAt: "2026-07-17T09:14:00.000Z" },
    { id: "d-a3", text: "Priya Nair resolved 'Avatar upload rotates images'", createdAt: "2026-07-17T10:02:00.000Z" },
    { id: "d-a4", text: "Rohan Iyer commented on 'Session token refresh loop'", createdAt: "2026-07-17T10:41:00.000Z" },
    { id: "d-a5", text: "Triage AI re-scored 'Search returns stale results' to Normal", createdAt: "2026-07-17T11:20:00.000Z" },
  ],
};

export const DEMO_BUGS: DemoBug[] = [
  {
    id: "d-1",
    title: "Checkout deadlock under concurrent load",
    description:
      "Two transactions grab `orders` and `inventory` in opposite order and deadlock past ~200 RPS. Postgres kills one every few seconds.\n\n**Impact:** ~3% of checkouts fail at peak.",
    severity: "High",
    status: "OPEN",
    comments: [
      { id: "d-c1", text: "Reproduced on staging with 250 RPS. Consistent lock ordering should fix it.", user: MEMBERS[1] },
      { id: "d-c2", text: "Patch is up for review — takes locks alphabetically now.", user: MEMBERS[0] },
    ],
  },
  {
    id: "d-2",
    title: "Session token refresh loop signs users out",
    description:
      "When a refresh lands within 5s of expiry, the client retries with the stale token and gets a 401 loop, forcing a re-login.",
    severity: "High",
    status: "OPEN",
    comments: [
      { id: "d-c3", text: "Only reproduces across timezones — suspect a clock skew assumption.", user: MEMBERS[2] },
    ],
  },
  {
    id: "d-3",
    title: "Payment webhook retries double-charge customers",
    description:
      "The provider retries on timeout, but the handler is not idempotent. A slow response creates a second charge for the same order.",
    severity: "High",
    status: "RESOLVED",
    comments: [
      { id: "d-c4", text: "Fixed by keying on the provider's event ID. Backfilled 14 refunds.", user: MEMBERS[0] },
    ],
  },
  {
    id: "d-4",
    title: "Search returns stale results after re-index",
    description: "The index alias swaps before the new index finishes warming, so queries hit a partial index for ~30s.",
    severity: "Normal",
    status: "OPEN",
    comments: [],
  },
  {
    id: "d-5",
    title: "CSV export truncates rows beyond 10,000",
    description: "The exporter streams a fixed page size and silently drops the tail. No warning is surfaced to the user.",
    severity: "Normal",
    status: "OPEN",
    comments: [
      { id: "d-c5", text: "Worth surfacing a row count in the UI so truncation is obvious.", user: MEMBERS[1] },
    ],
  },
  {
    id: "d-6",
    title: "Dashboard chart mislabels empty severity buckets",
    description: "A severity with zero bugs renders a 0-width slice that still claims a tooltip target.",
    severity: "Normal",
    status: "OPEN",
    comments: [],
  },
  {
    id: "d-7",
    title: "Email notifications ignore the user's timezone",
    description: "Digest emails render timestamps in UTC regardless of the profile setting, confusing non-UTC teams.",
    severity: "Normal",
    status: "RESOLVED",
    comments: [
      { id: "d-c6", text: "Now formats per-recipient using their stored IANA zone.", user: MEMBERS[2] },
    ],
  },
  {
    id: "d-8",
    title: "Avatar upload rotates portrait images",
    description: "EXIF orientation is stripped on resize, so portrait photos land sideways.",
    severity: "Low",
    status: "RESOLVED",
    comments: [
      { id: "d-c7", text: "Sharp's `.rotate()` respects EXIF before resize. Shipped.", user: MEMBERS[1] },
    ],
  },
  {
    id: "d-9",
    title: "Tooltip clips at the right viewport edge",
    description: "Tooltips on the last table column overflow instead of flipping to the left.",
    severity: "Low",
    status: "OPEN",
    comments: [],
  },
  {
    id: "d-10",
    title: "Kanban column header pluralizes '1 bugs'",
    description: "Copy uses a hardcoded plural instead of branching on the count.",
    severity: "Low",
    status: "OPEN",
    comments: [],
  },
];
