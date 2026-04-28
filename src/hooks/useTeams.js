// Re-export from centralized TeamsContext
// All components now share the same teams state — no stale data
export { useTeams } from '../contexts/TeamsContext';
