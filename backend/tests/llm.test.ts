import { llmService } from '../src/services/llm.service';

async function runLLMTests() {
  console.log('Running test suite: LLM & Academic Term Extraction Service');

  const sampleAcademicText =
    'Уважаемые студенты! Напоминаем, что курсовая работа и лабораторная работа должны быть сданы до пятницы. Научный руководитель ждёт ваши отчеты.';

  const result = await llmService.analyzeAcademicText(sampleAcademicText, 'en');

  console.log('Result extracted terms count:', result.terms.length);
  if (result.terms.length === 0) {
    throw new Error('Expected at least 1 academic term to be extracted, got 0');
  }

  const termsFound = result.terms.map((t) => t.originalTerm);
  console.log('Extracted terms:', termsFound);

  const hasCoursework = termsFound.includes('курсовая работа');
  const hasLab = termsFound.includes('лабораторная работа');
  const hasAdvisor = termsFound.includes('научный руководитель');

  if (!hasCoursework || !hasLab || !hasAdvisor) {
    throw new Error('Key university terms were not detected accurately');
  }

  // Verify context sentence extraction
  const courseworkTerm = result.terms.find((t) => t.originalTerm === 'курсовая работа');
  if (!courseworkTerm?.contextSentenceRu?.includes('курсовая работа')) {
    throw new Error('Context sentence Ru missing or incorrect for курсовая работа');
  }

  console.log('[Test Suite] LLM & Academic Term Extraction tests passed successfully.');
}

runLLMTests().catch((err) => {
  console.error('LLM test failed:', err);
  process.exit(1);
});
