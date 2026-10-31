import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { calculateRelevance } from '../src/lib/scoring';
import { makeAnnouncement, makeProfile } from './helpers/fixtures';

describe('personalized relevance scoring', () => {
  it('returns a deterministic score in the documented 0–100 range', () => {
    const announcement = makeAnnouncement();
    const profile = makeProfile();

    const first = calculateRelevance(announcement, profile);
    const second = calculateRelevance(announcement, profile);

    assert.equal(first.score, second.score);
    assert.ok(first.score >= 0 && first.score <= 100);
    assert.ok(['Strong Match', 'Good Match', 'Explore'].includes(first.tier));
    assert.deepEqual(first.breakdown, second.breakdown);
  });

  it('rewards matching interests, career goals, department, and academic year', () => {
    const announcement = makeAnnouncement({
      title: 'AI Research Engineer Workshop',
      description: 'Explore artificial intelligence research and model development.',
      category: 'Artificial Intelligence',
      target_departments: ['Computer Science'],
      target_years: ['3rd Year'],
    });
    const profile = makeProfile({
      interests: ['Artificial Intelligence'],
      career_goals: ['AI Research Engineer'],
    });

    const result = calculateRelevance(announcement, profile);

    assert.equal(result.breakdown.interestMatch, 40);
    assert.equal(result.breakdown.careerMatch, 20);
    assert.equal(result.breakdown.deptMatch, 15);
    assert.equal(result.breakdown.yearMatch, 15);
    assert.equal(result.score, 94);
    assert.equal(result.tier, 'Strong Match');
    assert.ok(result.reasons.length > 0);
  });

  it('provides baseline points when the student has no interests or career goals', () => {
    const result = calculateRelevance(
      makeAnnouncement(),
      makeProfile({ interests: [], career_goals: [] })
    );

    assert.equal(result.breakdown.interestMatch, 15);
    assert.equal(result.breakdown.careerMatch, 10);
    assert.equal(result.breakdown.deptMatch, 12);
    assert.equal(result.breakdown.yearMatch, 12);
    assert.equal(result.breakdown.deadlineBonus, 4);
    assert.equal(result.score, 53);
    assert.equal(result.tier, 'Good Match');
  });

  it('penalizes opportunities targeting a different department', () => {
    const result = calculateRelevance(
      makeAnnouncement({
        target_departments: ['Mechanical Engineering'],
        target_years: ['All'],
      }),
      makeProfile({
        department: 'Computer Science',
        interests: [],
        career_goals: [],
      })
    );

    assert.ok(result.score < 30);
    assert.equal(result.breakdown.deptMatch, 2);
  });

  it('treats empty target lists as open to all students', () => {
    const result = calculateRelevance(
      makeAnnouncement({
        target_departments: [],
        target_years: [],
      }),
      makeProfile()
    );

    assert.equal(result.breakdown.deptMatch, 12);
    assert.equal(result.breakdown.yearMatch, 12);
  });
});


describe('interest synonym matching', () => {
  const cases: Array<[string, string]> = [
    ['Artificial Intelligence', 'neural networks'],
    ['Machine Learning', 'PyTorch models'],
    ['Web Development', 'React frontend'],
    ['App Development', 'Android application'],
    ['Data Science', 'SQL analytics'],
    ['Cybersecurity', 'CTF security challenge'],
    ['Competitive Programming', 'LeetCode algorithms'],
    ['Hackathon', 'prize pool for builders'],
    ['Robotics', 'autonomous rover'],
    ['Design', 'Figma UI UX'],
    ['Workshops', 'hands-on bootcamp session'],
  ];

  for (const [interest, matchingPhrase] of cases) {
    it('matches ' + interest + ' using related keywords', () => {
      const result = calculateRelevance(
        makeAnnouncement({
          title: 'General Campus Activity',
          category: 'Other',
          description: matchingPhrase,
        }),
        makeProfile({ interests: [interest], career_goals: [] })
      );
      assert.equal(result.breakdown.interestMatch, 40);
    });
  }
});

describe('career goal synonym matching', () => {
  const cases: Array<[string, string]> = [
    ['Internship Applicant', 'Summer internship opportunity'],
    ['Core Placement Engineer', 'Campus job drive'],
    ['AI Research Engineer', 'Research paper from the lab'],
    ['Startup Founder', 'E-cell pitch and entrepreneurship'],
  ];

  for (const [goal, matchingPhrase] of cases) {
    it('matches ' + goal + ' using related keywords', () => {
      const result = calculateRelevance(
        makeAnnouncement({ description: matchingPhrase }),
        makeProfile({ interests: [], career_goals: [goal] })
      );
      assert.equal(result.breakdown.careerMatch, 20);
    });
  }

  it('gives zero career points when goals have no matching evidence', () => {
    const result = calculateRelevance(
      makeAnnouncement({ description: 'A general music gathering' }),
      makeProfile({ interests: [], career_goals: ['AI Research Engineer'] })
    );
    assert.equal(result.breakdown.careerMatch, 0);
  });
});

describe('eligibility and score limits', () => {
  it('applies the academic-year mismatch penalty', () => {
    const result = calculateRelevance(
      makeAnnouncement({
        target_departments: ['Computer Science'],
        target_years: ['4th Year'],
      }),
      makeProfile({ academic_year: '3rd Year', interests: [], career_goals: [] })
    );
    assert.equal(result.breakdown.yearMatch, 2);
    assert.ok(result.score <= 30);
  });

  it('caps a highly relevant opportunity at 100', () => {
    const result = calculateRelevance(
      makeAnnouncement({
        title: 'AI Research Hackathon for React Developers',
        category: 'Artificial Intelligence',
        description: 'AI research, React development, and startup founder internship.',
        tags: ['Hackathon', 'Research', 'Internship'],
        target_departments: ['Computer Science'],
        target_years: ['3rd Year'],
      }),
      makeProfile({
        interests: ['Artificial Intelligence', 'Hackathon', 'Web Development'],
        career_goals: ['AI Research Engineer', 'Startup Founder', 'Internship Applicant'],
      })
    );
    assert.ok(result.score <= 100);
    assert.equal(result.tier, 'Strong Match');
  });
});
