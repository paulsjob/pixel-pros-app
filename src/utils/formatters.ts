/**
 * Utility functions for formatting player names and team badges
 */

export function formatPlayerInitialLastName(fullName: string): string {
  if (!fullName) return '';
  const trimmed = fullName.trim();
  const parts = trimmed.split(/\s+/);
  if (parts.length <= 1) return trimmed;
  const initial = parts[0][0].toUpperCase() + '.';
  const lastName = parts.slice(1).join(' ');
  return `${initial} ${lastName}`;
}

export function formatTeamPosSubtitle(teamCode: string, position?: string): string {
  const team = (teamCode || 'NFL').toUpperCase();
  const pos = (position || 'STAR').toUpperCase();
  return `${team} · ${pos}`;
}
