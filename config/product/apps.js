import {
  AGE,
  STATE,
  CHART,
  NAMESPACE_NAME,
  NAME as NAME_COL,
  RESOURCES,
} from '@/config/table-headers';

import { CATALOG } from '@/config/types';
import { DSL } from '@/store/type-map';

export const NAME = 'apps';

export function init(store) {
  const {
    product,
    basicType,
    headers,
    virtualType,
    weightType,
    uncreatableType,
    immutableType,
  } = DSL(store, NAME);

  product({
    removable:   false,
    weight:      2,
    ifHaveGroup: 'catalog.cattle.io',
    icon:        'marketplace',
  });

  virtualType({
    label:       'Charts',
    icon:       'compass',
    namespaced:  false,
    name:        'charts',
    weight:      100,
    route:       { name: 'c-cluster-apps-charts' },
  });

  weightType(CATALOG.RELEASE, 99, true);

  basicType([
    'charts',
    CATALOG.RELEASE,
    CATALOG.OPERATION,
    CATALOG.CLUSTER_REPO,
    CATALOG.REPO,
  ]);

  uncreatableType(CATALOG.RELEASE);
  uncreatableType(CATALOG.OPERATION);
  immutableType(CATALOG.RELEASE);
  immutableType(CATALOG.OPERATION);

  headers(CATALOG.RELEASE, [STATE, NAMESPACE_NAME, CHART, RESOURCES, AGE]);

  const repoType = {
    name:     'type',
    labelKey: 'tableHeaders.type',
    sort:     'typeDisplay',
    value:    'typeDisplay'
  };

  const repoUrl = {
    name:     'url',
    labelKey: 'tableHeaders.url',
    sort:     'urlDisplay',
    value:    'urlDisplay'
  };

  const repoBranch = {
    name:        'branch',
    labelKey:    'tableHeaders.branch',
    sort:        'spec.gitBranch',
    value:       'spec.gitBranch',
    dashIfEmpty: true,
  };

  headers(CATALOG.REPO, [STATE, NAMESPACE_NAME, repoType, repoUrl, repoBranch, AGE]);
  headers(CATALOG.CLUSTER_REPO, [STATE, NAME_COL, repoType, repoUrl, repoBranch, AGE]);

  headers(CATALOG.OPERATION, [
    STATE,
    NAMESPACE_NAME,
    {
      name:  'action',
      label: 'Action',
      sort:  'status.action',
      value: 'status.action',
    },
    {
      name:  'releaseNamespace',
      label: 'Tgt Namepsace',
      sort:  'status.namespace',
      value: 'status.namespace',
    },
    {
      name:  'releaseName',
      label: 'Tgt Release',
      sort:  'status.releaseName',
      value: 'status.releaseName',
    },
    AGE
  ]);
}

//   name:      'cpu',
//   labelKey:  'tableHeaders.cpu',
//   sort:      'cpu',
//   value:     'cpuUsagePercentage',
//   formatter: 'PercentageBar'
// };
