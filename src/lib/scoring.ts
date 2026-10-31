import { CampusAnnouncement, RelevanceScoreResult, StudentProfile } from '../types';
import { calculateAnnouncementStatus } from './dates';

/**
 * Calculates a deterministic personalized relevance score (0-100)
 * for a student against a campus announcement.
 */
export function calculateRelevance(
  announcement: CampusAnnouncement,
  profile: StudentProfile
): RelevanceScoreResult {
  const reasons: string[] = [];

  // 1. Interest match (up to 40 points)
  let interestScore = 0;
  const matchedInterests: string[] = [];
  
  const announcementText = `${announcement.title} ${announcement.category} ${announcement.description} ${(announcement.tags || []).join(' ')}`.toLowerCase();

  for (const interest of profile.interests) {
    const term = interest.toLowerCase();
    // Direct category match or textual appearance
    if (
      announcement.category.toLowerCase().includes(term) ||
      term.includes(announcement.category.toLowerCase()) ||
      announcementText.includes(term) ||
      (term.includes('artificial intelligence') && (announcementText.includes('ai') || announcementText.includes('neural') || announcementText.includes('deep learning') || announcementText.includes('ml') || announcementText.includes('model'))) ||
      (term.includes('machine learning') && (announcementText.includes('ml') || announcementText.includes('model') || announcementText.includes('dataset') || announcementText.includes('pytorch'))) ||
      (term.includes('web development') && (announcementText.includes('react') || announcementText.includes('fullstack') || announcementText.includes('frontend') || announcementText.includes('backend') || announcementText.includes('tailwind'))) ||
      (term.includes('app development') && (announcementText.includes('mobile') || announcementText.includes('android') || announcementText.includes('flutter') || announcementText.includes('ios') || announcementText.includes('app'))) ||
      (term.includes('data science') && (announcementText.includes('analytics') || announcementText.includes('dataset') || announcementText.includes('sql') || announcementText.includes('python'))) ||
      (term.includes('cybersecurity') && (announcementText.includes('security') || announcementText.includes('crypto') || announcementText.includes('network') || announcementText.includes('ctf'))) ||
      (term.includes('competitive programming') && (announcementText.includes('dsa') || announcementText.includes('leetcode') || announcementText.includes('codeforces') || announcementText.includes('algorithm'))) ||
      (term.includes('hackathon') && (announcementText.includes('hackathon') || announcementText.includes('sprint') || announcementText.includes('prize'))) ||
      (term.includes('robotics') && (announcementText.includes('robot') || announcementText.includes('hardware') || announcementText.includes('rover') || announcementText.includes('iot'))) ||
      (term.includes('design') && (announcementText.includes('ui') || announcementText.includes('ux') || announcementText.includes('figma') || announcementText.includes('product design'))) ||
      (term.includes('workshops') && (announcementText.includes('hands-on') || announcementText.includes('bootcamp') || announcementText.includes('session')))
    ) {
      matchedInterests.push(interest);
    }
  }

  if (profile.interests.length > 0) {
    const matchRatio = matchedInterests.length / Math.min(profile.interests.length, 3);
    interestScore = Math.min(40, Math.round(matchRatio * 40));
  } else {
    // Default baseline if no interests selected
    interestScore = 15;
  }

  if (matchedInterests.length > 0) {
    reasons.push(`Matches your interest in ${matchedInterests.slice(0, 2).join(' & ')}`);
  }

  // 2. Career goal match (up to 20 points)
  let careerScore = 0;
  const matchedGoals: string[] = [];
  for (const goal of profile.career_goals || []) {
    const gTerm = goal.toLowerCase();
    if (announcementText.includes(gTerm) ||
        (gTerm.includes('intern') && announcementText.includes('intern')) ||
        (gTerm.includes('placement') && (announcementText.includes('placement') || announcementText.includes('job') || announcementText.includes('drive'))) ||
        (gTerm.includes('research') && (announcementText.includes('research') || announcementText.includes('paper') || announcementText.includes('lab'))) ||
        (gTerm.includes('startup') && (announcementText.includes('e-cell') || announcementText.includes('pitch') || announcementText.includes('entrepreneur')))
    ) {
      matchedGoals.push(goal);
    }
  }

  if (profile.career_goals && profile.career_goals.length > 0) {
    const goalRatio = matchedGoals.length / profile.career_goals.length;
    careerScore = Math.min(20, Math.round(goalRatio * 20));
  } else {
    careerScore = 10;
  }

  if (matchedGoals.length > 0) {
    reasons.push(`Aligns with career focus on ${matchedGoals[0]}`);
  }

  // 3. Department match (up to 15 points)
  let deptScore = 0;
  const targetDepts = (announcement.target_departments || []).map(d => d.toLowerCase());
  const studentDept = (profile.department || '').toLowerCase();

  const isAllDepts = targetDepts.length === 0 || targetDepts.some(d => d.includes('all') || d.includes('open'));
  const isDirectDeptMatch = targetDepts.some(d => d.includes(studentDept) || studentDept.includes(d));

  if (isDirectDeptMatch) {
    deptScore = 15;
    reasons.push(`Targeted directly at ${profile.department} students`);
  } else if (isAllDepts) {
    deptScore = 12;
    // Don't add a reason for open to all unless no specific match
  } else {
    // Explicit department list that does not include student's dept
    deptScore = 2; // Penalty
  }

  // 4. Academic year and eligibility match (up to 15 points)
  let yearScore = 0;
  const targetYears = (announcement.target_years || []).map(y => y.toLowerCase());
  const studentYear = (profile.academic_year || '').toLowerCase();

  const isAllYears = targetYears.length === 0 || targetYears.some(y => y.includes('all') || y.includes('open'));
  const isDirectYearMatch = targetYears.some(y => y.includes(studentYear) || studentYear.includes(y));

  if (isDirectYearMatch) {
    yearScore = 15;
    reasons.push(`Open to ${profile.academic_year}`);
  } else if (isAllYears) {
    yearScore = 12;
    if (reasons.length < 2) {
      reasons.push('Open to all academic years');
    }
  } else {
    yearScore = 2; // Ineligible or not targeted
  }

  // 5. Deadline relevance bonus (up to 10 points)
  let deadlineBonus = 0;
  const status = calculateAnnouncementStatus(announcement);
  if (status.urgency === 'urgent') {
    deadlineBonus = 10;
  } else if (status.urgency === 'upcoming') {
    deadlineBonus = 7;
  } else if (status.urgency === 'active') {
    deadlineBonus = 4;
  } else {
    deadlineBonus = 0;
  }

  // Calculate total and normalize
  let rawScore = interestScore + careerScore + deptScore + yearScore + deadlineBonus;
  
  // Severe mismatch penalty: if announcement targets specific departments and student is not in it
  if (!isAllDepts && !isDirectDeptMatch && targetDepts.length > 0) {
    rawScore = Math.max(10, rawScore - 25);
  }
  if (!isAllYears && !isDirectYearMatch && targetYears.length > 0) {
    rawScore = Math.max(10, rawScore - 25);
  }

  const finalScore = Math.min(100, Math.max(5, rawScore));

  let tier: 'Strong Match' | 'Good Match' | 'Explore' = 'Explore';
  if (finalScore >= 75) {
    tier = 'Strong Match';
  } else if (finalScore >= 52) {
    tier = 'Good Match';
  }

  if (reasons.length === 0) {
    reasons.push('General campus opportunity open to your college cohort');
  }

  return {
    score: finalScore,
    tier,
    reasons,
    breakdown: {
      interestMatch: interestScore,
      careerMatch: careerScore,
      deptMatch: deptScore,
      yearMatch: yearScore,
      deadlineBonus,
    },
  };
}
