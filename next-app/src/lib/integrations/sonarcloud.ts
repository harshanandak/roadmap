/**
 * SonarCloud API Integration
 *
 * Provides typed access to SonarCloud API for pulling issues, metrics,
 * quality gates, and analysis data.
 *
 * @example
 * const client = new SonarCloudClient({
 *   token: process.env.SONARCLOUD_TOKEN!,
 *   organization: 'my-org'
 * });
 *
 * const issues = await client.getIssues('my-project', { types: ['BUG', 'VULNERABILITY'] });
 * const metrics = await client.getMetrics('my-project');
 * const gateStatus = await client.getQualityGateStatus('my-project');
 */

// ============================================================================
// Types
// ============================================================================

export interface SonarCloudConfig {
  token: string;
  organization: string;
  baseUrl?: string;
}

export type IssueSeverity = 'BLOCKER' | 'CRITICAL' | 'MAJOR' | 'MINOR' | 'INFO';
export type IssueType = 'BUG' | 'VULNERABILITY' | 'CODE_SMELL' | 'SECURITY_HOTSPOT';
export type IssueStatus = 'OPEN' | 'CONFIRMED' | 'REOPENED' | 'RESOLVED' | 'CLOSED';
export type IssueResolution = 'FALSE-POSITIVE' | 'WONTFIX' | 'FIXED' | 'REMOVED';
export type HotspotStatus = 'TO_REVIEW' | 'REVIEWED';
export type HotspotResolution = 'FIXED' | 'SAFE' | 'ACKNOWLEDGED';
export type QualityGateStatus = 'OK' | 'WARN' | 'ERROR' | 'NONE';

export interface Issue {
  key: string;
  rule: string;
  severity: IssueSeverity;
  component: string;
  project: string;
  line?: number;
  startLine?: number;
  endLine?: number;
  startOffset?: number;
  endOffset?: number;
  message: string;
  type: IssueType;
  status: IssueStatus;
  resolution?: IssueResolution;
  effort?: string;
  debt?: string;
  tags: string[];
  author?: string;
  assignee?: string;
  creationDate: string;
  updateDate: string;
  closeDate?: string;
  textRange?: {
    startLine: number;
    endLine: number;
    startOffset: number;
    endOffset: number;
  };
  flows?: Array<{
    locations: Array<{
      component: string;
      textRange: {
        startLine: number;
        endLine: number;
        startOffset: number;
        endOffset: number;
      };
      msg: string;
    }>;
  }>;
}

export interface IssuesSearchParams {
  types?: IssueType[];
  severities?: IssueSeverity[];
  statuses?: IssueStatus[];
  resolutions?: IssueResolution[];
  resolved?: boolean;
  branch?: string;
  pullRequest?: string;
  createdAfter?: string;
  createdBefore?: string;
  tags?: string[];
  languages?: string[];
  rules?: string[];
  assignees?: string[];
  authors?: string[];
  scopes?: ('MAIN' | 'TEST')[];
  sinceLeakPeriod?: boolean;
  inNewCodePeriod?: boolean;
  facets?: string[];
  page?: number;
  pageSize?: number;
  sort?: string;
  ascending?: boolean;
}

export interface IssuesSearchResult {
  total: number;
  p: number;
  ps: number;
  paging: {
    pageIndex: number;
    pageSize: number;
    total: number;
  };
  issues: Issue[];
  components: Array<{
    key: string;
    qualifier: string;
    name: string;
    longName?: string;
    path?: string;
  }>;
  rules: Array<{
    key: string;
    name: string;
    lang?: string;
    status: string;
  }>;
  facets?: Array<{
    property: string;
    values: Array<{ val: string; count: number }>;
  }>;
}

export interface Measure {
  metric: string;
  value?: string;
  period?: {
    value: string;
    bestValue?: boolean;
  };
  bestValue?: boolean;
}

export interface ComponentMeasures {
  key: string;
  name: string;
  qualifier: string;
  measures: Measure[];
}

export interface MeasuresResult {
  component: ComponentMeasures;
  metrics?: Array<{
    key: string;
    name: string;
    description: string;
    domain: string;
    type: string;
    higherValuesAreBetter: boolean;
    qualitative: boolean;
    hidden: boolean;
  }>;
  periods?: Array<{
    index: number;
    mode: string;
    date: string;
    parameter?: string;
  }>;
}

export interface MeasureHistoryPoint {
  date: string;
  value?: string;
}

export interface MeasuresHistoryResult {
  paging: {
    pageIndex: number;
    pageSize: number;
    total: number;
  };
  measures: Array<{
    metric: string;
    history: MeasureHistoryPoint[];
  }>;
}

export interface QualityGateCondition {
  status: QualityGateStatus;
  metricKey: string;
  comparator: 'GT' | 'LT' | 'EQ' | 'NE';
  errorThreshold?: string;
  actualValue: string;
}

export interface QualityGateResult {
  projectStatus: {
    status: QualityGateStatus;
    conditions: QualityGateCondition[];
    periods?: Array<{
      index: number;
      mode: string;
      date: string;
      parameter?: string;
    }>;
    ignoredConditions: boolean;
  };
}

export interface SecurityHotspot {
  key: string;
  component: string;
  project: string;
  securityCategory: string;
  vulnerabilityProbability: 'HIGH' | 'MEDIUM' | 'LOW';
  status: HotspotStatus;
  resolution?: HotspotResolution;
  line?: number;
  message: string;
  author?: string;
  creationDate: string;
  updateDate: string;
}

export interface HotspotsSearchResult {
  paging: {
    pageIndex: number;
    pageSize: number;
    total: number;
  };
  hotspots: SecurityHotspot[];
  components: Array<{
    key: string;
    qualifier: string;
    name: string;
    longName?: string;
    path?: string;
  }>;
}

export interface ProjectAnalysis {
  key: string;
  date: string;
  projectVersion?: string;
  buildString?: string;
  revision?: string;
  events: Array<{
    key: string;
    category: string;
    name: string;
    description?: string;
  }>;
}

export interface AnalysesSearchResult {
  paging: {
    pageIndex: number;
    pageSize: number;
    total: number;
  };
  analyses: ProjectAnalysis[];
}

export interface Project {
  key: string;
  name: string;
  qualifier: string;
  visibility: 'public' | 'private';
  lastAnalysisDate?: string;
  revision?: string;
}

export interface ProjectsSearchResult {
  paging: {
    pageIndex: number;
    pageSize: number;
    total: number;
  };
  components: Project[];
}

export interface Rule {
  key: string;
  repo: string;
  name: string;
  severity: IssueSeverity;
  status: string;
  type: IssueType;
  lang?: string;
  langName?: string;
  htmlDesc?: string;
  mdDesc?: string;
  tags: string[];
  sysTags: string[];
}

export interface RulesSearchResult {
  total: number;
  p: number;
  ps: number;
  rules: Rule[];
}

export interface ComponentTreeItem {
  key: string;
  qualifier: string;
  name: string;
  path?: string;
  language?: string;
  measures?: Measure[];
}

export interface ComponentTreeResult {
  paging: {
    pageIndex: number;
    pageSize: number;
    total: number;
  };
  baseComponent: {
    key: string;
    qualifier: string;
    name: string;
    path?: string;
  };
  components: ComponentTreeItem[];
}

// ============================================================================
// Common Metric Keys
// ============================================================================

export const METRIC_KEYS = {
  // Size
  LINES_OF_CODE: 'ncloc',
  LINES: 'lines',
  STATEMENTS: 'statements',
  FUNCTIONS: 'functions',
  CLASSES: 'classes',
  FILES: 'files',

  // Complexity
  COMPLEXITY: 'complexity',
  COGNITIVE_COMPLEXITY: 'cognitive_complexity',

  // Coverage
  COVERAGE: 'coverage',
  LINE_COVERAGE: 'line_coverage',
  BRANCH_COVERAGE: 'branch_coverage',
  TESTS: 'tests',
  TEST_SUCCESS: 'test_success_density',
  UNCOVERED_LINES: 'uncovered_lines',
  UNCOVERED_CONDITIONS: 'uncovered_conditions',

  // Duplication
  DUPLICATED_LINES: 'duplicated_lines',
  DUPLICATED_LINES_DENSITY: 'duplicated_lines_density',
  DUPLICATED_BLOCKS: 'duplicated_blocks',
  DUPLICATED_FILES: 'duplicated_files',

  // Issues
  BUGS: 'bugs',
  VULNERABILITIES: 'vulnerabilities',
  CODE_SMELLS: 'code_smells',
  SECURITY_HOTSPOTS: 'security_hotspots',

  // Ratings
  SQALE_RATING: 'sqale_rating',
  RELIABILITY_RATING: 'reliability_rating',
  SECURITY_RATING: 'security_rating',
  SECURITY_REVIEW_RATING: 'security_review_rating',

  // Technical Debt
  SQALE_INDEX: 'sqale_index',
  SQALE_DEBT_RATIO: 'sqale_debt_ratio',

  // Quality Gate
  ALERT_STATUS: 'alert_status',
  QUALITY_GATE_DETAILS: 'quality_gate_details',

  // New Code
  NEW_BUGS: 'new_bugs',
  NEW_VULNERABILITIES: 'new_vulnerabilities',
  NEW_CODE_SMELLS: 'new_code_smells',
  NEW_COVERAGE: 'new_coverage',
  NEW_DUPLICATED_LINES_DENSITY: 'new_duplicated_lines_density',
} as const;

// Default metrics for common use cases
export const DEFAULT_METRICS = [
  METRIC_KEYS.BUGS,
  METRIC_KEYS.VULNERABILITIES,
  METRIC_KEYS.CODE_SMELLS,
  METRIC_KEYS.SECURITY_HOTSPOTS,
  METRIC_KEYS.COVERAGE,
  METRIC_KEYS.DUPLICATED_LINES_DENSITY,
  METRIC_KEYS.LINES_OF_CODE,
  METRIC_KEYS.SQALE_RATING,
  METRIC_KEYS.RELIABILITY_RATING,
  METRIC_KEYS.SECURITY_RATING,
];

export const SECURITY_METRICS = [
  METRIC_KEYS.VULNERABILITIES,
  METRIC_KEYS.SECURITY_HOTSPOTS,
  METRIC_KEYS.SECURITY_RATING,
  METRIC_KEYS.SECURITY_REVIEW_RATING,
];

export const COVERAGE_METRICS = [
  METRIC_KEYS.COVERAGE,
  METRIC_KEYS.LINE_COVERAGE,
  METRIC_KEYS.BRANCH_COVERAGE,
  METRIC_KEYS.TESTS,
  METRIC_KEYS.TEST_SUCCESS,
  METRIC_KEYS.UNCOVERED_LINES,
  METRIC_KEYS.UNCOVERED_CONDITIONS,
];

export const DEBT_METRICS = [
  METRIC_KEYS.CODE_SMELLS,
  METRIC_KEYS.SQALE_INDEX,
  METRIC_KEYS.SQALE_DEBT_RATIO,
  METRIC_KEYS.SQALE_RATING,
  METRIC_KEYS.COMPLEXITY,
  METRIC_KEYS.COGNITIVE_COMPLEXITY,
];

// ============================================================================
// Client Implementation
// ============================================================================

export class SonarCloudClient {
  private readonly token: string;
  private readonly organization: string;
  private readonly baseUrl: string;

  constructor(config: SonarCloudConfig) {
    this.token = config.token;
    this.organization = config.organization;
    this.baseUrl = config.baseUrl || 'https://sonarcloud.io/api';
  }

  private async fetch<T>(endpoint: string, params: Record<string, unknown> = {}): Promise<T> {
    // Filter out undefined/null values and convert to strings for URL params
    const cleanParams: Record<string, string> = {};
    for (const [key, value] of Object.entries(params)) {
      if (value !== undefined && value !== null) {
        if (Array.isArray(value)) {
          cleanParams[key] = value.join(',');
        } else if (typeof value === 'object') {
          // Objects need JSON serialization for URL params
          cleanParams[key] = JSON.stringify(value);
        } else {
          // Primitives (string, number, boolean) can be safely converted
          cleanParams[key] = String(value);
        }
      }
    }

    const url = new URL(`${this.baseUrl}${endpoint}`);
    url.search = new URLSearchParams(cleanParams).toString();

    const response = await fetch(url.toString(), {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${this.token}`,
        Accept: 'application/json',
      },
    });

    if (!response.ok) {
      const error = await response.text();
      throw new SonarCloudError(
        `SonarCloud API error: ${response.status} ${response.statusText}`,
        response.status,
        error
      );
    }

    return response.json();
  }

  // -------------------------------------------------------------------------
  // Issues
  // -------------------------------------------------------------------------

  /**
   * Search for issues (bugs, vulnerabilities, code smells)
   */
  async getIssues(
    projectKey: string,
    params: IssuesSearchParams = {}
  ): Promise<IssuesSearchResult> {
    return this.fetch<IssuesSearchResult>('/issues/search', {
      organization: this.organization,
      componentKeys: projectKey,
      types: params.types,
      severities: params.severities,
      statuses: params.statuses,
      resolutions: params.resolutions,
      resolved: params.resolved,
      branch: params.branch,
      pullRequest: params.pullRequest,
      createdAfter: params.createdAfter,
      createdBefore: params.createdBefore,
      tags: params.tags,
      languages: params.languages,
      rules: params.rules,
      assignees: params.assignees,
      authors: params.authors,
      scopes: params.scopes,
      sinceLeakPeriod: params.sinceLeakPeriod,
      inNewCodePeriod: params.inNewCodePeriod,
      facets: params.facets,
      p: params.page,
      ps: params.pageSize,
      s: params.sort,
      asc: params.ascending,
    });
  }

  /**
   * Get all issues with automatic pagination
   */
  async getAllIssues(
    projectKey: string,
    params: Omit<IssuesSearchParams, 'page' | 'pageSize'> = {}
  ): Promise<Issue[]> {
    const allIssues: Issue[] = [];
    let page = 1;
    const pageSize = 500;
    let total = 0;

    do {
      const result = await this.getIssues(projectKey, {
        ...params,
        page,
        pageSize,
      });
      allIssues.push(...result.issues);
      total = result.total;
      page++;
    } while (allIssues.length < total);

    return allIssues;
  }

  /**
   * Get issue summary with facets
   */
  async getIssueSummary(
    projectKey: string,
    params: Omit<IssuesSearchParams, 'facets' | 'pageSize'> = {}
  ): Promise<{
    total: number;
    bySeverity: Record<IssueSeverity, number>;
    byType: Record<IssueType, number>;
    byRule: Array<{ rule: string; count: number }>;
  }> {
    const result = await this.getIssues(projectKey, {
      ...params,
      facets: ['severities', 'types', 'rules'],
      pageSize: 1,
    });

    const bySeverity: Record<string, number> = {};
    const byType: Record<string, number> = {};
    const byRule: Array<{ rule: string; count: number }> = [];

    for (const facet of result.facets || []) {
      if (facet.property === 'severities') {
        for (const v of facet.values) {
          bySeverity[v.val] = v.count;
        }
      } else if (facet.property === 'types') {
        for (const v of facet.values) {
          byType[v.val] = v.count;
        }
      } else if (facet.property === 'rules') {
        for (const v of facet.values) {
          byRule.push({ rule: v.val, count: v.count });
        }
      }
    }

    return {
      total: result.total,
      bySeverity: bySeverity as Record<IssueSeverity, number>,
      byType: byType as Record<IssueType, number>,
      byRule,
    };
  }

  // -------------------------------------------------------------------------
  // Metrics
  // -------------------------------------------------------------------------

  /**
   * Get component measures/metrics
   */
  async getMetrics(
    projectKey: string,
    metricKeys: string[] = DEFAULT_METRICS,
    options: { branch?: string; pullRequest?: string; additionalFields?: string[] } = {}
  ): Promise<MeasuresResult> {
    return this.fetch<MeasuresResult>('/measures/component', {
      component: projectKey,
      metricKeys,
      branch: options.branch,
      pullRequest: options.pullRequest,
      additionalFields: options.additionalFields,
    });
  }

  /**
   * Get metrics as a simple key-value map
   */
  async getMetricsMap(
    projectKey: string,
    metricKeys: string[] = DEFAULT_METRICS,
    options: { branch?: string; pullRequest?: string } = {}
  ): Promise<Record<string, string | undefined>> {
    const result = await this.getMetrics(projectKey, metricKeys, options);
    const map: Record<string, string | undefined> = {};

    for (const measure of result.component.measures) {
      map[measure.metric] = measure.value;
    }

    return map;
  }

  /**
   * Get metrics history over time
   */
  async getMetricsHistory(
    projectKey: string,
    metricKeys: string[],
    options: { from?: string; to?: string; branch?: string; page?: number; pageSize?: number } = {}
  ): Promise<MeasuresHistoryResult> {
    return this.fetch<MeasuresHistoryResult>('/measures/search_history', {
      component: projectKey,
      metrics: metricKeys,
      from: options.from,
      to: options.to,
      branch: options.branch,
      p: options.page,
      ps: options.pageSize,
    });
  }

  // -------------------------------------------------------------------------
  // Quality Gates
  // -------------------------------------------------------------------------

  /**
   * Get quality gate status for a project
   */
  async getQualityGateStatus(
    projectKey: string,
    options: { branch?: string; pullRequest?: string } = {}
  ): Promise<QualityGateResult> {
    return this.fetch<QualityGateResult>('/qualitygates/project_status', {
      projectKey,
      branch: options.branch,
      pullRequest: options.pullRequest,
    });
  }

  /**
   * Check if quality gate passed
   */
  async isQualityGatePassed(
    projectKey: string,
    options: { branch?: string; pullRequest?: string } = {}
  ): Promise<boolean> {
    const result = await this.getQualityGateStatus(projectKey, options);
    return result.projectStatus.status === 'OK';
  }

  /**
   * Get failed quality gate conditions
   */
  async getFailedConditions(
    projectKey: string,
    options: { branch?: string; pullRequest?: string } = {}
  ): Promise<QualityGateCondition[]> {
    const result = await this.getQualityGateStatus(projectKey, options);
    return result.projectStatus.conditions.filter(
      (c) => c.status === 'ERROR' || c.status === 'WARN'
    );
  }

  // -------------------------------------------------------------------------
  // Security Hotspots
  // -------------------------------------------------------------------------

  /**
   * Search for security hotspots
   */
  async getHotspots(
    projectKey: string,
    options: {
      branch?: string;
      pullRequest?: string;
      status?: HotspotStatus;
      resolution?: HotspotResolution;
      sinceLeakPeriod?: boolean;
      inNewCodePeriod?: boolean;
      page?: number;
      pageSize?: number;
    } = {}
  ): Promise<HotspotsSearchResult> {
    return this.fetch<HotspotsSearchResult>('/hotspots/search', {
      projectKey,
      branch: options.branch,
      pullRequest: options.pullRequest,
      status: options.status,
      resolution: options.resolution,
      sinceLeakPeriod: options.sinceLeakPeriod,
      inNewCodePeriod: options.inNewCodePeriod,
      p: options.page,
      ps: options.pageSize,
    });
  }

  /**
   * Get hotspots that need review
   */
  async getHotspotsToReview(
    projectKey: string,
    options: { branch?: string; pullRequest?: string } = {}
  ): Promise<SecurityHotspot[]> {
    const result = await this.getHotspots(projectKey, {
      ...options,
      status: 'TO_REVIEW',
    });
    return result.hotspots;
  }

  // -------------------------------------------------------------------------
  // Projects & Analyses
  // -------------------------------------------------------------------------

  /**
   * Search for projects in the organization
   */
  async getProjects(options: { query?: string; page?: number; pageSize?: number } = {}): Promise<ProjectsSearchResult> {
    return this.fetch<ProjectsSearchResult>('/projects/search', {
      organization: this.organization,
      q: options.query,
      p: options.page,
      ps: options.pageSize,
    });
  }

  /**
   * Get analysis history for a project
   */
  async getAnalyses(
    projectKey: string,
    options: { branch?: string; from?: string; to?: string; page?: number; pageSize?: number } = {}
  ): Promise<AnalysesSearchResult> {
    return this.fetch<AnalysesSearchResult>('/project_analyses/search', {
      project: projectKey,
      branch: options.branch,
      from: options.from,
      to: options.to,
      p: options.page,
      ps: options.pageSize,
    });
  }

  /**
   * Get the latest analysis for a project
   */
  async getLatestAnalysis(
    projectKey: string,
    options: { branch?: string } = {}
  ): Promise<ProjectAnalysis | null> {
    const result = await this.getAnalyses(projectKey, {
      ...options,
      pageSize: 1,
    });
    return result.analyses[0] || null;
  }

  // -------------------------------------------------------------------------
  // Components
  // -------------------------------------------------------------------------

  /**
   * Get component tree (files/directories) with optional metrics
   */
  async getComponentTree(
    projectKey: string,
    options: {
      branch?: string;
      qualifiers?: ('FIL' | 'DIR' | 'UTS')[];
      metricKeys?: string[];
      strategy?: 'children' | 'leaves' | 'all';
      query?: string;
      page?: number;
      pageSize?: number;
      sort?: string;
      ascending?: boolean;
      metricSort?: string;
    } = {}
  ): Promise<ComponentTreeResult> {
    return this.fetch<ComponentTreeResult>('/components/tree', {
      component: projectKey,
      branch: options.branch,
      qualifiers: options.qualifiers,
      metricKeys: options.metricKeys,
      strategy: options.strategy,
      q: options.query,
      p: options.page,
      ps: options.pageSize,
      s: options.sort,
      asc: options.ascending,
      metricSort: options.metricSort,
    });
  }

  /**
   * Get files with the most issues
   */
  async getWorstFiles(
    projectKey: string,
    metric: string = 'bugs',
    options: { branch?: string; limit?: number } = {}
  ): Promise<ComponentTreeItem[]> {
    const result = await this.getComponentTree(projectKey, {
      branch: options.branch,
      qualifiers: ['FIL'],
      metricKeys: [metric],
      sort: 'metric',
      metricSort: metric,
      ascending: false,
      pageSize: options.limit || 20,
    });
    return result.components;
  }

  // -------------------------------------------------------------------------
  // Rules
  // -------------------------------------------------------------------------

  /**
   * Search for coding rules
   */
  async getRules(options: {
    languages?: string[];
    severities?: IssueSeverity[];
    types?: IssueType[];
    tags?: string[];
    query?: string;
    page?: number;
    pageSize?: number;
  } = {}): Promise<RulesSearchResult> {
    return this.fetch<RulesSearchResult>('/rules/search', {
      languages: options.languages,
      severities: options.severities,
      types: options.types,
      tags: options.tags,
      q: options.query,
      p: options.page,
      ps: options.pageSize,
    });
  }

  // -------------------------------------------------------------------------
  // Convenience Methods
  // -------------------------------------------------------------------------

  /**
   * Get a comprehensive project health report
   */
  async getProjectHealth(
    projectKey: string,
    options: { branch?: string } = {}
  ): Promise<{
    qualityGate: QualityGateResult;
    metrics: Record<string, string | undefined>;
    issueSummary: {
      total: number;
      bySeverity: Record<IssueSeverity, number>;
      byType: Record<IssueType, number>;
    };
    hotspotCount: number;
    latestAnalysis: ProjectAnalysis | null;
  }> {
    const [qualityGate, metrics, issueSummary, hotspots, latestAnalysis] = await Promise.all([
      this.getQualityGateStatus(projectKey, options),
      this.getMetricsMap(projectKey, DEFAULT_METRICS, options),
      this.getIssueSummary(projectKey, { ...options, resolved: false }),
      this.getHotspots(projectKey, { ...options, status: 'TO_REVIEW', pageSize: 1 }),
      this.getLatestAnalysis(projectKey, options),
    ]);

    return {
      qualityGate,
      metrics,
      issueSummary: {
        total: issueSummary.total,
        bySeverity: issueSummary.bySeverity,
        byType: issueSummary.byType,
      },
      hotspotCount: hotspots.paging.total,
      latestAnalysis,
    };
  }

  /**
   * Get PR-specific analysis data
   */
  async getPRAnalysis(projectKey: string, prNumber: string): Promise<{
    qualityGate: QualityGateResult;
    newIssues: Issue[];
    metrics: Record<string, string | undefined>;
  }> {
    const [qualityGate, issues, metrics] = await Promise.all([
      this.getQualityGateStatus(projectKey, { pullRequest: prNumber }),
      this.getIssues(projectKey, { pullRequest: prNumber, resolved: false }),
      this.getMetricsMap(
        projectKey,
        [
          METRIC_KEYS.NEW_BUGS,
          METRIC_KEYS.NEW_VULNERABILITIES,
          METRIC_KEYS.NEW_CODE_SMELLS,
          METRIC_KEYS.NEW_COVERAGE,
          METRIC_KEYS.NEW_DUPLICATED_LINES_DENSITY,
        ],
        { pullRequest: prNumber }
      ),
    ]);

    return {
      qualityGate,
      newIssues: issues.issues,
      metrics,
    };
  }
}

// ============================================================================
// Error Class
// ============================================================================

export class SonarCloudError extends Error {
  constructor(
    message: string,
    public readonly statusCode: number,
    public readonly responseBody: string
  ) {
    super(message);
    this.name = 'SonarCloudError';
  }
}

// ============================================================================
// Factory Function
// ============================================================================

/**
 * Create a SonarCloud client from environment variables
 */
export function createSonarCloudClient(organization?: string): SonarCloudClient {
  const token = process.env.SONARCLOUD_TOKEN;
  if (!token) {
    throw new Error('SONARCLOUD_TOKEN environment variable is required');
  }

  const org = organization || process.env.SONARCLOUD_ORG;
  if (!org) {
    throw new Error('Organization is required (pass as argument or set SONARCLOUD_ORG)');
  }

  return new SonarCloudClient({
    token,
    organization: org,
  });
}