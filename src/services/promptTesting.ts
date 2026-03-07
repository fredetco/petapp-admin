import { supabase } from './supabase';

export interface TestPetData {
  name: string;
  species: string;
  breed: string;
  age: string;
  city: string;
  climateZone: string;
  season: string;
}

export const SAMPLE_PETS: TestPetData[] = [
  { name: 'Buddy', species: 'Dog', breed: 'Labrador Retriever', age: '3 years', city: 'Shawinigan, QC', climateZone: 'Dfb', season: 'Winter' },
  { name: 'Whiskers', species: 'Cat', breed: 'Maine Coon', age: '5 years', city: 'Montreal, QC', climateZone: 'Dfb', season: 'Summer' },
  { name: 'Slither', species: 'Corn Snake', breed: 'Corn Snake', age: '2 years', city: 'Toronto, ON', climateZone: 'Dfa', season: 'Fall' },
  { name: 'Rex', species: 'Bearded Dragon', breed: 'Central Bearded Dragon', age: '1 year', city: 'Vancouver, BC', climateZone: 'Cfb', season: 'Spring' },
  { name: 'Goldie', species: 'Fish', breed: 'Goldfish', age: '6 months', city: 'Ottawa, ON', climateZone: 'Dfb', season: 'Winter' },
];

export function interpolatePrompt(template: string, pet: TestPetData, complexity: string, language: string): string {
  return template
    .replace(/\{pet\.name\}/g, pet.name)
    .replace(/\{pet\.species\}/g, pet.species)
    .replace(/\{pet\.breed\}/g, pet.breed)
    .replace(/\{pet\.age\}/g, pet.age)
    .replace(/\{location\.city\}/g, pet.city)
    .replace(/\{location\.climateZone\}/g, pet.climateZone)
    .replace(/\{season\.current\}/g, pet.season)
    .replace(/\{complexity\}/g, complexity)
    .replace(/\{language\}/g, language);
}

export interface TestResult {
  rawOutput: string;
  taskCount: number;
  latencyMs: number;
  tokenEstimate: number;
  error?: string;
}

export async function testPrompt(
  systemPrompt: string,
  userPrompt: string,
  pet: TestPetData,
  complexity: string,
  language: string,
): Promise<TestResult> {
  const interpolatedSystem = interpolatePrompt(systemPrompt, pet, complexity, language);
  const interpolatedUser = interpolatePrompt(userPrompt, pet, complexity, language);

  const start = Date.now();

  try {
    const { data, error } = await supabase.functions.invoke('ai-proxy', {
      body: {
        messages: [
          { role: 'system', content: interpolatedSystem },
          { role: 'user', content: interpolatedUser },
        ],
        // Flag for testing — the edge function can use this to bypass caching
        test_mode: true,
      },
    });

    const latencyMs = Date.now() - start;

    if (error) {
      return {
        rawOutput: '',
        taskCount: 0,
        latencyMs,
        tokenEstimate: 0,
        error: error.message,
      };
    }

    const rawOutput = typeof data === 'string' ? data : JSON.stringify(data, null, 2);

    // Try to count tasks from the output
    let taskCount = 0;
    try {
      const parsed = typeof data === 'string' ? JSON.parse(data) : data;
      if (parsed?.tasks) taskCount = parsed.tasks.length;
      else if (parsed?.response?.tasks) taskCount = parsed.response.tasks.length;
    } catch {
      // Count lines that look like tasks
      taskCount = (rawOutput.match(/"title"/g) || []).length;
    }

    // Rough token estimate (4 chars per token)
    const tokenEstimate = Math.round((interpolatedSystem.length + interpolatedUser.length + rawOutput.length) / 4);

    return { rawOutput, taskCount, latencyMs, tokenEstimate };
  } catch (err) {
    return {
      rawOutput: '',
      taskCount: 0,
      latencyMs: Date.now() - start,
      tokenEstimate: 0,
      error: err instanceof Error ? err.message : 'Test failed',
    };
  }
}
