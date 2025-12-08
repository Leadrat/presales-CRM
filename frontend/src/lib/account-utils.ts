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
  if (label.includes("Small")) return `${base} border-green-400 bg-green-50 text-green-600 dark:border-green-600 dark:bg-green-900/30 dark:text-green-400`;
  if (label.includes("Medium")) return `${base} border-amber-400 bg-amber-50 text-amber-600 dark:border-amber-600 dark:bg-amber-900/30 dark:text-amber-400`;
  if (label.includes("Enterprise")) return `${base} border-purple-400 bg-purple-50 text-purple-600 dark:border-purple-600 dark:bg-purple-900/30 dark:text-purple-400`;
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
  if (label === "Small" || label === "Small Account") return `${base} border-green-200 bg-green-50 text-green-700 dark:border-green-800 dark:bg-green-900/25 dark:text-green-300`;
  if (label === "Medium" || label === "Medium Account") return `${base} border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-800 dark:bg-amber-900/25 dark:text-amber-300`;
  if (label === "Enterprise") return `${base} border-purple-200 bg-purple-50 text-purple-700 dark:border-purple-800 dark:bg-purple-900/25 dark:text-purple-300`;
  return "text-gray-400";
}
