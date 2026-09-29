import { z } from 'zod';

export const GeneratedProjectSchema = z.object({
  name: z.string().min(2),
  tagline: z.string().min(5),
  oneLineDescription: z.string().min(10),
  detailedDescription: z.string().min(20),
  problemStatement: z.string().min(10),
  targetUsers: z.array(z.string()).min(1),
  existingPainPoints: z.array(z.string()).min(1),
  proposedSolution: z.string().min(15),
  keyDifferentiator: z.string().min(5),
  expectedImpact: z.string().min(10),
  features: z.object({
    mvp: z.array(z.string()).min(2),
    phase2: z.array(z.string()).min(1),
    advanced: z.array(z.string()).min(1),
  }),
  techStack: z.object({
    frontend: z.array(z.string()).min(1),
    backend: z.array(z.string()).min(1),
    database: z.array(z.string()).min(1),
    ai: z.array(z.string()).default([]),
    authentication: z.array(z.string()).min(1),
    storage: z.array(z.string()).default([]),
    hosting: z.array(z.string()).min(1),
    monitoring: z.array(z.string()).default([]),
  }),
  complexity: z.object({
    difficulty: z.enum(['beginner', 'intermediate', 'advanced']),
    estimatedDuration: z.string(),
    teamSize: z.string(),
    requiredSkills: z.array(z.string()).min(1),
  }),
  learningOpportunities: z.array(z.string()).min(2),
  category: z.string(),
  domain: z.string(),
});

export const ValidationReportSchema = z.object({
  feasibilityScore: z.number().min(0).max(100),
  complexityVerdict: z.enum(['manageable', 'challenging', 'high_risk', 'ideal']),
  strengths: z.array(z.string()).min(1),
  risks: z.array(z.string()).min(1),
  missingSkills: z.array(z.string()),
  scopeProblems: z.array(z.string()),
  recommendedChanges: z.array(z.string()).min(1),
  mvpRecommendation: z.string().min(10),
  skillCompatibilityAnalysis: z.string().min(10),
  deploymentFeasibility: z.string().min(10),
});

export const RequirementsSchema = z.object({
  functional: z.array(z.object({
    id: z.string(),
    code: z.string(),
    title: z.string(),
    description: z.string(),
    priority: z.enum(['must_have', 'should_have', 'could_have']),
    module: z.string(),
  })).min(3),
  nonFunctional: z.array(z.object({
    id: z.string(),
    category: z.enum(['performance', 'security', 'scalability', 'availability', 'accessibility']),
    description: z.string(),
    metric: z.string(),
  })).min(2),
  userStories: z.array(z.object({
    id: z.string(),
    asA: z.string(),
    iWant: z.string(),
    soThat: z.string(),
    acceptanceCriteria: z.array(z.string()).min(1),
  })).min(2),
});

export const ArchitectureSchema = z.object({
  beginnerArchitecture: z.object({
    overview: z.string(),
    diagramMermaid: z.string(),
    components: z.array(z.object({
      name: z.string(),
      type: z.enum(['client', 'gateway', 'service', 'database', 'storage', 'external']),
      description: z.string(),
      tech: z.string(),
      responsibilities: z.array(z.string()),
    })).min(2),
    dataFlow: z.array(z.string()).min(2),
  }),
  productionArchitecture: z.object({
    overview: z.string(),
    diagramMermaid: z.string(),
    components: z.array(z.object({
      name: z.string(),
      type: z.enum(['client', 'gateway', 'service', 'database', 'storage', 'external']),
      description: z.string(),
      tech: z.string(),
      responsibilities: z.array(z.string()),
    })).min(2),
    dataFlow: z.array(z.string()).min(2),
    authFlow: z.array(z.string()).min(1),
    aiPipelineFlow: z.array(z.string()).default([]),
    deploymentTopology: z.array(z.string()).min(1),
  }),
});

export const DatabaseSchema = z.object({
  databaseType: z.enum(['mongodb', 'postgresql', 'mysql']),
  tables: z.array(z.object({
    name: z.string(),
    description: z.string(),
    fields: z.array(z.object({
      name: z.string(),
      type: z.string(),
      isPrimary: z.boolean().optional(),
      isForeign: z.boolean().optional(),
      references: z.string().optional(),
      required: z.boolean(),
      description: z.string().optional(),
    })).min(2),
    indexes: z.array(z.string()),
    sampleRecords: z.array(z.record(z.any())).min(1),
  })).min(2),
  relationships: z.array(z.object({
    from: z.string(),
    to: z.string(),
    type: z.enum(['one_to_one', 'one_to_many', 'many_to_one', 'many_to_many']),
    description: z.string(),
  })),
  diagramMermaid: z.string(),
});

export const ApiDesignSchema = z.object({
  endpoints: z.array(z.object({
    id: z.string(),
    name: z.string(),
    method: z.enum(['GET', 'POST', 'PUT', 'PATCH', 'DELETE']),
    path: z.string(),
    authRequired: z.boolean(),
    description: z.string(),
    headers: z.record(z.string()).optional(),
    parameters: z.array(z.object({
      name: z.string(),
      type: z.string(),
      in: z.enum(['path', 'query']),
      required: z.boolean(),
      description: z.string(),
    })).optional(),
    requestBody: z.record(z.any()).optional(),
    responseSuccess: z.object({
      status: z.number(),
      body: z.record(z.any()),
    }),
    responseError: z.object({
      status: z.number(),
      body: z.record(z.any()),
    }),
    curlSnippet: z.string().optional(),
  })).min(3),
});

export const UIPlanSchema = z.object({
  screens: z.array(z.object({
    id: z.string(),
    name: z.string(),
    purpose: z.string(),
    layoutType: z.enum(['mobile', 'tablet', 'responsive']),
    components: z.array(z.string()).min(1),
    userActions: z.array(z.string()).min(1),
    navigationTarget: z.string().optional(),
    apiDependencies: z.array(z.string()),
    wireframeLayout: z.object({
      header: z.string(),
      sections: z.array(z.object({
        title: z.string(),
        element: z.string(),
        details: z.string(),
      })),
      bottomNav: z.array(z.string()).optional(),
    }),
  })).min(3),
  designSystem: z.object({
    primaryColor: z.string(),
    secondaryColor: z.string(),
    fontFamily: z.string(),
    borderRadius: z.string(),
  }),
  navigationFlow: z.string(),
});

export const RoadmapSchema = z.object({
  phases: z.array(z.object({
    phaseNumber: z.number(),
    title: z.string(),
    objective: z.string(),
    estimatedDays: z.number(),
    skillsRequired: z.array(z.string()),
    tasks: z.array(z.string()),
    deliverables: z.array(z.string()),
  })).min(5),
});

export const TestCasesSchema = z.object({
  testCases: z.array(z.object({
    testId: z.string(),
    type: z.enum(['unit', 'integration', 'api', 'ui', 'security', 'edge_case']),
    feature: z.string(),
    scenario: z.string(),
    input: z.string(),
    expectedResult: z.string(),
    status: z.enum(['pass', 'fail', 'blocked', 'untested']).default('untested'),
  })).min(4),
});

// JSON extraction and safe repair helper
export function extractAndParseJson<T>(raw: string, schema: z.ZodSchema<T>): T {
  let cleaned = raw.trim();

  // Strip markdown code fences if present (```json ... ``` or ``` ...)
  if (cleaned.startsWith('```')) {
    cleaned = cleaned.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/i, '').trim();
  }

  // Find start and end brackets
  const firstBrace = cleaned.indexOf('{');
  const lastBrace = cleaned.lastIndexOf('}');
  const firstBracket = cleaned.indexOf('[');
  const lastBracket = cleaned.lastIndexOf(']');

  if (firstBrace !== -1 && (firstBracket === -1 || firstBrace < firstBracket)) {
    if (lastBrace !== -1) {
      cleaned = cleaned.substring(firstBrace, lastBrace + 1);
    }
  } else if (firstBracket !== -1 && lastBracket !== -1) {
    cleaned = cleaned.substring(firstBracket, lastBracket + 1);
  }

  // Attempt standard JSON parse
  let parsed: any;
  try {
    parsed = JSON.parse(cleaned);
  } catch (err) {
    // Attempt common repair: remove trailing commas before } or ]
    try {
      const repaired = cleaned
        .replace(/,\s*([}\]])/g, '$1')
        .replace(/[\u201C\u201D]/g, '"'); // normalize smart quotes
      parsed = JSON.parse(repaired);
    } catch (repairErr) {
      throw new Error(`Failed to parse AI output into valid JSON: ${err}`);
    }
  }

  // Validate with Zod schema
  return schema.parse(parsed);
}
