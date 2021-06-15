import { createStore } from 'redux';
import gridReducer from '../reducers/gridReducers';

const initialState = {
  user: '',
  accessToken: '',
  tokenClaims: {},
  formData: {},
  schema: '',
  tables: [],
  table: '',
  isNewTable: false,
  columns: [],
  fields: [],
  rowData: [],
  rowCount: 0,
  current: 1,
  orderBy: '',
  limit: 10,
  offset: 0,
  views: [],
  cloudContext: {},
  defaultView: 'Default View',
};

export default createStore(gridReducer, initialState);
