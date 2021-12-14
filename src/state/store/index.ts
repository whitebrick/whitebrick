import { createStore } from 'redux';
import gridReducer from '../reducers/gridReducers';

const initialState = {
  user: '',
  accessToken: '',
  tokenClaims: {},
  formData: {},
  schema: {},
  schemas: [],
  users: [],
  tables: [],
  table: '',
  isNewTable: false,
  columns: [],
  foreignKeyColumns: [],
  referencedByColumns: [],
  column: {},
  filters: [],
  fields: [],
  rowData: [],
  rowCount: 0,
  current: 1,
  orderBy: '',
  limit: 10,
  offset: 0,
  views: [],
  columnFields: 1,
  cloudContext: {},
  organization: {},
  organizations: [],
  defaultView: 'Default View',
  sendAdminSecret: false,
  isTableBuilding: false,
  columnAPI: null,
  gridAPI: null,
  gridParams: null,
  show: false,
  type: '',
  params: {},
};

export default createStore(gridReducer, initialState);
