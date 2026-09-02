import { JobDisposition, TeamMember } from '../types';

/**
 * Priority weighting in terms of capacity points / load:
 * - URGENT: 30% load (critical SLA, high cognitive & audit attention)
 * - HIGH: 20% load
 * - MEDIUM: 15% load
 * - LOW: 10% load
 */
export const PRIORITY_LOAD_WEIGHT: Record<string, number> = {
  URGENT: 30,
  HIGH: 20,
  MEDIUM: 15,
  LOW: 10,
};

export interface MemberTaskStats {
  activeDispositions: JobDisposition[];
  completedDispositions: JobDisposition[];
  activeCount: number;
  completedCount: number;
  urgentCount: number;
  highCount: number;
  mediumCount: number;
  lowCount: number;
  capacityPercentage: number;
  capacityStatus: 'AVAILABLE' | 'BALANCED' | 'OPTIMAL' | 'OVERLOADED';
  capacityStatusLabel: string;
  capacityColor: string;
  badgeBg: string;
}

/**
 * Computes exact real-time workload capacity dynamically linked to the member's assigned tasks.
 * Formula:
 * - Base capacity: derived from sum of weighted active task priority loads.
 * - Active tasks are dispositions where status !== 'COMPLETED'.
 * - If checklist items exist, uncompleted sub-items also accurately scale the load.
 * - If no active tasks exist, capacity is 0% (Fully Available).
 */
export function calculateMemberWorkload(
  memberId: string,
  dispositions: JobDisposition[],
  baseCompletedCount: number = 0
): MemberTaskStats {
  const memberDispositions = dispositions.filter((d) => d.assignedToId === memberId);
  const activeDispositions = memberDispositions.filter((d) => d.status !== 'COMPLETED');
  const completedDispositions = memberDispositions.filter((d) => d.status === 'COMPLETED');

  let urgentCount = 0;
  let highCount = 0;
  let mediumCount = 0;
  let lowCount = 0;
  let totalCalculatedLoad = 0;

  activeDispositions.forEach((d) => {
    const baseWeight = PRIORITY_LOAD_WEIGHT[d.priority] || 15;
    
    // If the task has checklist sub-items, factor in checklist completion percentage
    let taskFactor = 1.0;
    if (d.checklist && d.checklist.length > 0) {
      const remainingItems = d.checklist.filter((c) => !c.done).length;
      const progressRatio = (d.checklist.length - remainingItems) / d.checklist.length;
      // Task load reduces as checklist gets checked off, min 40% until marked COMPLETED
      taskFactor = Math.max(0.4, 1.0 - progressRatio * 0.6);
    } else if (d.status === 'UNDER_REVIEW') {
      taskFactor = 0.5;
    }

    if (d.priority === 'URGENT') urgentCount++;
    else if (d.priority === 'HIGH') highCount++;
    else if (d.priority === 'MEDIUM') mediumCount++;
    else lowCount++;

    totalCalculatedLoad += Math.round(baseWeight * taskFactor);
  });

  const capacityPercentage = Math.min(100, Math.max(0, totalCalculatedLoad));

  let capacityStatus: MemberTaskStats['capacityStatus'] = 'AVAILABLE';
  let capacityStatusLabel = 'Available';
  let capacityColor = 'text-emerald-700';
  let badgeBg = 'bg-emerald-50 text-emerald-700 border-emerald-200';

  if (capacityPercentage > 85) {
    capacityStatus = 'OVERLOADED';
    capacityStatusLabel = 'Overloaded (>85%)';
    capacityColor = 'text-red-700';
    badgeBg = 'bg-red-50 text-red-700 border-red-200';
  } else if (capacityPercentage > 60) {
    capacityStatus = 'OPTIMAL';
    capacityStatusLabel = 'High Load (60-85%)';
    capacityColor = 'text-amber-700';
    badgeBg = 'bg-amber-50 text-amber-700 border-amber-200';
  } else if (capacityPercentage > 25) {
    capacityStatus = 'BALANCED';
    capacityStatusLabel = 'Moderate (25-60%)';
    capacityColor = 'text-blue-700';
    badgeBg = 'bg-blue-50 text-blue-700 border-blue-200';
  } else {
    capacityStatus = 'AVAILABLE';
    capacityStatusLabel = 'Optimal / Available (<25%)';
    capacityColor = 'text-emerald-700';
    badgeBg = 'bg-emerald-50 text-emerald-700 border-emerald-200';
  }

  return {
    activeDispositions,
    completedDispositions,
    activeCount: activeDispositions.length,
    completedCount: completedDispositions.length + baseCompletedCount,
    urgentCount,
    highCount,
    mediumCount,
    lowCount,
    capacityPercentage,
    capacityStatus,
    capacityStatusLabel,
    capacityColor,
    badgeBg,
  };
}

/**
 * Augment a list of team members with their real-time dynamically linked task stats
 */
export function getTeamMembersWithWorkload(
  members: TeamMember[],
  dispositions: JobDisposition[]
): (TeamMember & { workloadStats: MemberTaskStats })[] {
  return members.map((m) => {
    const stats = calculateMemberWorkload(m.id, dispositions, m.completedTaskCount || 0);
    return {
      ...m,
      activeTaskCount: stats.activeCount,
      completedTaskCount: stats.completedCount,
      capacityPercentage: stats.capacityPercentage,
      workloadStats: stats,
    };
  });
}
