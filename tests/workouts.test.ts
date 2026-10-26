import { describe, it, expect } from 'vitest';
import workoutsData from '../src/data/workouts.json';
import {
  WorkoutSchema,
  type Workout,
  SITE_CONFIG,
  resolveAffiliateUrl,
  computeWorkoutStats,
  formatIntervalDuration,
  buildExercisePlanJsonLd,
  buildBreadcrumbJsonLd,
  getRelatedWorkouts,
} from '../src/config/site';

const workouts = workoutsData as Workout[];

describe('EllipticalWorkouts Catalog & Schema Integrity', () => {
  it('contains 8 realistic workouts including all 4 required PRD slugs and difficulties', () => {
    expect(workouts.length).toBeGreaterThanOrEqual(8);

    const required = [
      { slug: '20-minute-hiit-elliptical-burn', difficulty: 'Intermediate', duration: 20 },
      { slug: '30-minute-low-impact-knee-rehab', difficulty: 'Beginner', duration: 30 },
      { slug: '45-minute-pyramid-glute-climb', difficulty: 'Advanced', duration: 45 },
      { slug: '15-minute-express-fat-shred', difficulty: 'Beginner', duration: 15 },
    ];

    for (const req of required) {
      const match = workouts.find((w) => w.slug === req.slug);
      expect(match, `Missing required workout slug: ${req.slug}`).toBeDefined();
      expect(match?.difficulty).toBe(req.difficulty);
      expect(match?.durationMinutes).toBe(req.duration);
    }
  });

  it('validates every workout against WorkoutSchema and enforces unique slugs', () => {
    const seenSlugs = new Set<string>();
    for (const workout of workouts) {
      const parsed = WorkoutSchema.safeParse(workout);
      expect(parsed.success, `Schema validation failed for ${workout.slug}`).toBe(true);
      expect(seenSlugs.has(workout.slug)).toBe(false);
      seenSlugs.add(workout.slug);
    }
  });

  it('ensures interval durations sum exactly to durationMinutes * 60 for every workout', () => {
    for (const workout of workouts) {
      const stats = computeWorkoutStats(workout);
      expect(
        stats.totalSeconds,
        `Interval sum mismatch on ${workout.slug}: got ${stats.totalSeconds}s, expected ${workout.durationMinutes * 60}s`
      ).toBe(workout.durationMinutes * 60);
    }
  });

  it('builds tracked affiliate URLs via resolveAffiliateUrl', () => {
    const resolved = resolveAffiliateUrl(
      'https://example.com/affiliate/sole-e25',
      '20-minute-hiit-elliptical-burn'
    );
    const url = new URL(resolved);
    expect(url.searchParams.get('tag')).toBe(SITE_CONFIG.affiliateTag);
    expect(url.searchParams.get('utm_source')).toBe(SITE_CONFIG.utmSource);
    expect(url.searchParams.get('utm_campaign')).toBe('20-minute-hiit-elliptical-burn');
  });

  it('generates valid Schema.org ExercisePlan and BreadcrumbList JSON-LD', () => {
    const sample = workouts[0];
    const canonical = `${SITE_CONFIG.url}/workouts/${sample.slug}`;
    const exercisePlan = buildExercisePlanJsonLd(sample, canonical);
    const breadcrumb = buildBreadcrumbJsonLd(sample, canonical);

    expect(exercisePlan['@context']).toBe('https://schema.org');
    expect(exercisePlan['@type']).toBe('ExercisePlan');
    expect(exercisePlan.timeRequired).toBe(`PT${sample.durationMinutes}M`);
    expect(exercisePlan.estimatedEnergyBurn).toBe(sample.caloriesBurned);

    expect(breadcrumb['@type']).toBe('BreadcrumbList');
    expect(breadcrumb.itemListElement).toHaveLength(2);
  });

  it('formats interval durations and selects related workouts excluding current slug', () => {
    expect(formatIntervalDuration(180)).toBe('3m');
    expect(formatIntervalDuration(75)).toBe('1m 15s');
    expect(formatIntervalDuration(45)).toBe('45s');

    const related = getRelatedWorkouts(workouts[0].slug, workouts, 3);
    expect(related).toHaveLength(3);
    expect(related.every((w) => w.slug !== workouts[0].slug)).toBe(true);
  });
});
