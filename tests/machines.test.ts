import { describe, it, expect } from 'vitest';
import machinesData from '../src/data/machines.json';
import workoutsData from '../src/data/workouts.json';
import {
  MachineReviewSchema,
  type MachineReview,
  type Workout,
  SITE_CONFIG,
  buildMachineProductJsonLd,
  buildMachineBreadcrumbJsonLd,
} from '../src/config/site';

const machines = machinesData as MachineReview[];
const workouts = workoutsData as Workout[];

describe('EllipticalWorkouts Machines Catalog & Schema Integrity', () => {
  it('contains 8 normalized machines with unique slugs', () => {
    expect(machines.length).toBe(8);
    const seen = new Set<string>();
    for (const machine of machines) {
      expect(seen.has(machine.slug), `Duplicate slug: ${machine.slug}`).toBe(false);
      seen.add(machine.slug);
    }
  });

  it('validates every machine against MachineReviewSchema', () => {
    for (const machine of machines) {
      const parsed = MachineReviewSchema.safeParse(machine);
      expect(parsed.success, `Schema validation failed for ${machine.slug}`).toBe(true);
      expect(machine.rating).toBeGreaterThanOrEqual(4.0);
      expect(machine.rating).toBeLessThanOrEqual(5.0);
      expect(machine.pros.length).toBeGreaterThanOrEqual(2);
      expect(machine.cons.length).toBeGreaterThanOrEqual(1);
    }
  });

  it('enforces bi-directional linking between machines and workouts', () => {
    const workoutSlugs = new Set(workouts.map((w) => w.slug));
    const machineSlugs = new Set(machines.map((m) => m.slug));

    // Every machine's compatible workouts must exist in workouts.json
    for (const machine of machines) {
      for (const wSlug of machine.compatibleWorkoutSlugs) {
        expect(
          workoutSlugs.has(wSlug),
          `Machine ${machine.slug} references non-existent workout: ${wSlug}`
        ).toBe(true);
      }
    }

    // Every workout's recommendedMachine.slug must exist in machines.json
    for (const workout of workouts) {
      expect(workout.recommendedMachine.slug, `Workout ${workout.slug} missing machine slug`).toBeDefined();
      expect(
        machineSlugs.has(workout.recommendedMachine.slug!),
        `Workout ${workout.slug} references non-existent machine: ${workout.recommendedMachine.slug}`
      ).toBe(true);
    }
  });

  it('generates valid Schema.org Product and BreadcrumbList JSON-LD for equipment', () => {
    const sample = machines[0];
    const canonical = `${SITE_CONFIG.url}/equipment/${sample.slug}`;
    const productJson = buildMachineProductJsonLd(sample, canonical);
    const breadcrumbJson = buildMachineBreadcrumbJsonLd(sample, canonical);

    expect(productJson['@context']).toBe('https://schema.org');
    expect(productJson['@type']).toBe('Product');
    expect(productJson.offers.price).toBe(sample.price);
    expect(productJson.aggregateRating.ratingValue).toBe(sample.rating);

    expect(breadcrumbJson['@type']).toBe('BreadcrumbList');
    expect(breadcrumbJson.itemListElement).toHaveLength(2);
    expect(breadcrumbJson.itemListElement[0].name).toBe('Equipment Reviews');
  });
});
