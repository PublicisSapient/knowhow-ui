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
  },
  kpiName: 'AI Usage Analytics',
};

export const MATRICS_TABLE_DUMMY_KPI = {
  issueData: 'JIRA',
  kpiId: 'kpi199',
  kpiFilter: 'table',
  kpiDetail: {
    kpiInfo: 'Info here',
    kpiSource: 'Jira',
  },
  kpiName: 'Metrics Analytics',
};

export const SELECTED_TAB_ANALYSIS_KEY = 'analysis';
