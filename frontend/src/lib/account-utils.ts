/**
 * Account Size Classification Utilities
 * Spec 018 – Auto-mark accounts as Little / Small / Medium / Enterprise
 * 
 * Classification Logic:
 * - 4–9 users: Little Account
 * - 10–24 users: Small Account
 * - 25–49 users: Medium Account
 * - 50+ users: Enterprise
 * - <4 or null/undefined: No label (empty string)
 */

/**
 * Compute account size label from numberOfUsers
 * @param n - Number of users (can be null, undefined, or any number)
 * @returns Size label string or empty string if not classifiable
 */
export function computeSizeLabel(n: number | null | undefined): string {
  // Updated logic: hide size label for very small accounts (< 10 users)
  // 10–24: Small Account, 25–49: Medium Account, 50+: Enterprise
  if (n == null || n < 10) return "";
  if (n <= 24) return "Small Account";
  if (n <= 49) return "Medium Account";
  return "Enterprise";
}

/**
 * Get Tailwind CSS classes for account size badge (detail page style)
 * @param label - Size label from computeSizeLabel
 * @returns Tailwind class string
 */
export function accountSizeTagClass(label: string): string {
  const base = "inline-flex items-center justify-center rounded-lg px-5 py-1.5 text-base font-medium border";
  if (label.includes("Little")) return `${base} border-cyan-400 bg-cyan-50 text-cyan-600 dark:border-cyan-600 dark:bg-cyan-900/30 dark:text-cyan-400`;
  // Small: blue
  if (label.includes("Small")) return `${base} border-blue-400 bg-blue-50 text-blue-600 dark:border-blue-600 dark:bg-blue-900/30 dark:text-blue-400`;
  // Medium: purple
  if (label.includes("Medium")) return `${base} border-purple-400 bg-purple-50 text-purple-600 dark:border-purple-600 dark:bg-purple-900/30 dark:text-purple-400`;
  // Enterprise: green
  if (label.includes("Enterprise")) return `${base} border-emerald-400 bg-emerald-50 text-emerald-600 dark:border-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400`;
  return `${base} border-gray-400 bg-gray-50 text-gray-600 dark:border-gray-600 dark:bg-gray-900/30 dark:text-gray-400`;
}

/**
 * Get Tailwind CSS classes for account size badge (table/list style - compact)
 * @param label - Size label from computeSizeLabel
 * @returns Tailwind class string
 */
export function accountSizeBadgeClass(label: string): string {
  const base = "inline-flex items-center rounded-md border px-3 py-1 text-xs font-semibold leading-none";
  if (label === "Little" || label === "Little Account") return `${base} border-cyan-200 bg-cyan-50 text-cyan-700 dark:border-cyan-800 dark:bg-cyan-900/25 dark:text-cyan-300`;
  // Small: blue
  if (label === "Small" || label === "Small Account") return `${base} border-blue-200 bg-blue-50 text-blue-700 dark:border-blue-800 dark:bg-blue-900/25 dark:text-blue-300`;
  // Medium: purple
  if (label === "Medium" || label === "Medium Account") return `${base} border-purple-200 bg-purple-50 text-purple-700 dark:border-purple-800 dark:bg-purple-900/25 dark:text-purple-300`;
  // Enterprise: green
  if (label === "Enterprise") return `${base} border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-800 dark:bg-emerald-900/25 dark:text-emerald-300`;
  return "text-gray-400";
}
