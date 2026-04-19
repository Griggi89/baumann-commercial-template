// ───────────────────────────────────────────────────────────────────────────
// /demo — renders DashboardClient against a fully-populated in-memory
// fixture (lib/demoPropertyData). No Master Index, no CF sheet, no
// pipeline needed. Purpose: let prospective clients and internal
// reviewers see a finished commercial dashboard at a glance.
// ───────────────────────────────────────────────────────────────────────────

import DashboardClient from '../[slug]/DashboardClient';
import { demoPropertyData } from '@/lib/demoPropertyData';

export const metadata = {
  title: 'Demo Dashboard | Baumann Commercial',
  description: 'Demonstration commercial investment dashboard populated with synthetic data.',
};

export default function DemoPage() {
  return <DashboardClient initialData={demoPropertyData} />;
}
