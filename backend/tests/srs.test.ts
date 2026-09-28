import { SRSService } from '../src/services/srs.service';

function runSRSTests() {
  console.log('Running test suite: SuperMemo SM-2 Spaced Repetition Algorithm');

  // Test 1: First successful review (repetition 0 -> 1, interval 1)
  const step1 = SRSService.calculateNextReview({
    repetition: 0,
    interval: 0,
    easeFactor: 2.5,
    grade: 4, // "Good"
  });

  if (step1.repetition !== 1 || step1.interval !== 1) {
    throw new Error(`Step 1 failed: rep=${step1.repetition}, int=${step1.interval}`);
  }

  // Test 2: Second successful review (repetition 1 -> 2, interval 6)
  const step2 = SRSService.calculateNextReview({
    repetition: step1.repetition,
    interval: step1.interval,
    easeFactor: step1.easeFactor,
    grade: 4, // "Good"
  });

  if (step2.repetition !== 2 || step2.interval !== 6) {
    throw new Error(`Step 2 failed: rep=${step2.repetition}, int=${step2.interval}`);
  }

  // Test 3: Third review with "Easy" (grade 5, interval increases by EF)
  const step3 = SRSService.calculateNextReview({
    repetition: step2.repetition,
    interval: step2.interval,
    easeFactor: step2.easeFactor,
    grade: 5, // "Easy"
  });

  const expectedInterval = Math.round(6 * step3.easeFactor);
  if (step3.repetition !== 3 || step3.interval !== expectedInterval) {
    throw new Error(`Step 3 failed: rep=${step3.repetition}, int=${step3.interval}`);
  }

  // Test 4: Failed review (grade 0 "Again" resets repetition count)
  const stepFail = SRSService.calculateNextReview({
    repetition: step3.repetition,
    interval: step3.interval,
    easeFactor: step3.easeFactor,
    grade: 0, // "Again"
  });

  if (stepFail.repetition !== 0 || stepFail.interval !== 1) {
    throw new Error(`Step Fail failed: rep=${stepFail.repetition}, int=${stepFail.interval}`);
  }

  // Test 5: Ease Factor floor clamp (must not fall below 1.3)
  const lowEF = SRSService.calculateNextReview({
    repetition: 0,
    interval: 1,
    easeFactor: 1.3,
    grade: 0, // severe penalty
  });

  if (lowEF.easeFactor < 1.3) {
    throw new Error(`Ease factor fell below 1.3 floor: ${lowEF.easeFactor}`);
  }

  // Test 6: Rating string to grade mapping
  if (
    SRSService.mapRatingToGrade('again') !== 0 ||
    SRSService.mapRatingToGrade('hard') !== 3 ||
    SRSService.mapRatingToGrade('good') !== 4 ||
    SRSService.mapRatingToGrade('easy') !== 5
  ) {
    throw new Error('Rating string mapping produced incorrect grade');
  }

  console.log('[Test Suite] SuperMemo SM-2 Spaced Repetition tests passed successfully.');
}

runSRSTests();
