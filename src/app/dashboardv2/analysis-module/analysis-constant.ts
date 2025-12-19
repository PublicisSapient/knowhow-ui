export const SPRINT_FILTER_OPTIONS = [
  {
    nodeId: '2',
    nodeName: 'Last 2 Sprint',
    nodeDisplayName: 'Last 2 Sprint',
    labelName: 'sprint',
  },
  {
    nodeId: '4',
    nodeName: 'Last 4 Sprint',
    nodeDisplayName: 'Last 4 Sprint',
    labelName: 'sprint',
  },
  {
    nodeId: '6',
    nodeName: 'Last 6 Sprint',
    nodeDisplayName: 'Last 6 Sprint',
    labelName: 'sprint',
  },
  {
    nodeId: '8',
    nodeName: 'Last 8 Sprint',
    nodeDisplayName: 'Last 8 Sprint',
    labelName: 'sprint',
  },
];

export const PROJECT_FILTER_CONFIG = {
  type: 'multiSelect',
  defaultLevel: {
    labelName: 'Project',
  },
};

export const SPRINT_FILTER_CONFIG = {
  type: 'singleSelect',
  defaultLevel: {
    labelName: 'Sprint',
  },
};

export const PROJECT_KEY = 'Project';
export const SPRINT_KEY = 'Sprint';

export const AI_USES_TABLE_DUMMY_KPI = {
  issueData: 'JIRA',
  kpiId: 'kpi198',
  kpiFilter: 'table',
  kpiDetail: {
    kpiInfo: 'Info here',
    kpiSource: 'Jira',
    kpiId: 'kpi198',
  },
  kpiName: 'AI Usage Analytics',
};

export const METRICS_TABLE_DUMMY_KPI = {
  issueData: 'JIRA',
  kpiId: 'kpi199',
  kpiFilter: 'table',
  kpiDetail: {
    kpiInfo: 'Info here',
    kpiSource: 'Jira',
    kpiId: 'kpi199',
  },
  kpiName: 'Metrics Analytics',
};

export const SELECTED_TAB_ANALYSIS_KEY = 'analysis';
export const ANALYSIS_SELECTED_PROJECTS_KEY = 'analysis_selected_projects';
export const ANALYSIS_SELECTED_SPRINT_KEY = 'analysis_selected_sprint';
export const METRICS_TABLE_TITLE = 'Sprint Metrics';
export const AI_USAGE_TABLE_TITLE = 'AI Usage Analytics';

export const AI_USAGE_TOOLTIP_INFO = {
  definition:
    'The AI Usage Analytics view provides a snapshot of how projects are adopting AI assistants.\n' +
    'It helps leaders understand where AI is being used, how frequently, and by which projects -enabling data-driven strategies for scaling AI adoption across the organization.',
  details: [
    {
      type: 'link',
      kpiLinkDetail: {
        text: 'Detailed Information at',
        link: 'https://knowhow.suite.publicissapient.com/wiki/spaces/PS/pages/385908747/Analysis+of+sprint+metrics+AI+usage',
      },
    },
  ],
};

export const MATRIX_TABLE_TOOLTIP_INFO = {
  definition:
    'Offers fine-grained visibility into delivery hygiene, refinement discipline, and sprint predictability.\n' +
    'These indicators highlight the maturity of planning, grooming, and execution practices across teams, helping leaders spot inefficiencies early and ensure consistency in agile ceremonies.',
  details: [
    {
      type: 'link',
      kpiLinkDetail: {
        text: 'Detailed Information at',
        link: 'https://knowhow.suite.publicissapient.com/wiki/spaces/PS/pages/385908747/Analysis+of+sprint+metrics+AI+usage',
      },
    },
  ],
};
