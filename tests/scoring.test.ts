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
