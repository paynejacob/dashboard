import { DSL } from '@/store/type-map';
import { FLEET } from '@/config/types';
import { STATE, NAME as NAME_COL, AGE } from '@/config/table-headers';

export const NAME = 'fleet';
export const CHART_NAME = 'fleet';

export function init(store) {
  const {
    product,
    basicType,
    weightType,
    uncreatableType,
    headers,
    // mapType,
    // virtualType,
    // immutableType,
  } = DSL(store, NAME);

  product({
    ifHaveGroup:         /^(.*\.)*fleet\.cattle\.io$/,
    icon:                'compass',
    inStore:             'management',
    removable:           false,
    weight:              3,
    showClusterSwitcher: false,
  });

  /*
  virtualType({
    label:       'Overview',
    group:      'Root',
    namespaced:  false,
    name:        'istio-overview',
    weight:      100,
    route:       { name: 'c-cluster-istio' },
    exact:       true,
  });
*/

  // basicType('istio-overview');

  // uncreatableType('fleet.cattle.io.cluster');
  // immutableType('fleet.cattle.io.cluster');

  basicType([
    FLEET.CLUSTER,
    FLEET.CLUSTER_GROUP,
    FLEET.WORKSPACE,
    FLEET.GIT_REPO,
  ]);

  uncreatableType(FLEET.CLUSTER);

  weightType(FLEET.WORKSPACE, 110);
  weightType(FLEET.CLUSTER, 109);
  weightType(FLEET.GIT_REPO, 108);
  weightType(FLEET.CLUSTER_GROUP, 107);

  basicType([
    'fleet.cattle.io.bundledeployment',
    'fleet.cattle.io.bundle',
    'fleet.cattle.io.clusterregistrationtoken',
  ], 'Advanced');

  headers(FLEET.WORKSPACE, [
    STATE,
    NAME_COL,
    {
      name:      'gitRepos',
      labelKey:  'tableHeaders.gitRepos',
      value:     'counts.gitRepos',
      sort:      'counts.gitRepos',
      formatter: 'Number',
    },
    {
      name:      'clusters',
      labelKey:  'tableHeaders.clusters',
      value:     'counts.clusters',
      sort:      'counts.clusters',
      formatter: 'Number',
    },
    {
      name:      'clusterGroups',
      labelKey:  'tableHeaders.clusterGroups',
      value:     'counts.clusterGroups',
      sort:      'counts.clusterGroups',
      formatter: 'Number',
    },
    AGE
  ]);
}
