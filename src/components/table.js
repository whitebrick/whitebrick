import React, { useEffect, useState } from 'react';
import * as gql from 'gql-query-builder';

import { connect } from 'react-redux';
import { bindActionCreators } from 'redux';
import { actions } from '../actions/index';

import { AgGridColumn, AgGridReact } from 'ag-grid-react';
import 'ag-grid-enterprise';

import { useSubscription } from 'graphql-hooks';
import Pagination from 'rc-pagination';

import graphQLFetch from '../utils/GraphQLFetch';
import Modal from 'react-modal';
import SidePanel from './sidePanel';

const customStyles = {
  content: {
    top: '50%',
    left: '50%',
    right: 'auto',
    bottom: 'auto',
    marginRight: '-50%',
    transform: 'translate(-50%, -50%)',
  },
};

const Table = ({
  table,
  rows,
  fields,
  rowCount,
  current,
  orderBy,
  limit,
  offset,
  views,
  defaultView,
  actions,
}) => {
  const [columnAPI, setColumnAPI] = useState(null);
  const [changedValues, setChangedValues] = useState([]);
  const [popup, setPopup] = useState(false);
  const [name, setName] = useState('');
  const [type, setType] = useState('');
  const [formData, setFormData] = useState({});
  const [show, setShow] = useState(false);
  const [column, setColumn] = useState('');
  const [columns, setColumns] = useState(
    rows.length > 0 ? Object.keys(rows[0]) : [],
  );

  useEffect(() => {
    const handleTableChange = async () => {
      if (fields.length > 0) {
        let orderByParameter = fields.includes(orderBy) ? orderBy : fields[0];
        actions.setOrderBy(orderByParameter);
        let orderByType = table.concat('_order_by!');
        const operation = gql.query({
          operation: table,
          variables: {
            limit,
            offset,
            order_by: {
              value: { [orderByParameter]: `asc` },
              type: `[${orderByType}]`,
            },
          },
          fields,
        });
        const operationAgg = gql.query({
          operation: table.concat('_aggregate'),
          fields: [{ aggregate: ['count'] }],
        });
        const fetchData = async () => await graphQLFetch(operation);
        fetchData().then(({ data }) => {
          actions.setRows(data[table]);
          setColumns(Object.keys(data[table][0]));
        });
        const fetchCount = async () => await graphQLFetch(operationAgg);
        fetchCount().then(({ data }) =>
          actions.setRowCount(data[table + '_aggregate'].aggregate.count),
        );
      }
    };
    handleTableChange();
  }, [table, fields, limit, offset, orderBy, actions]);

  useEffect(() => {
    actions.setOffset(0);
    actions.setCurrent(1);
  }, [table]);

  const handlePagination = (current, pageSize) => {
    actions.setOffset(Math.ceil((current - 1) * pageSize));
    actions.setCurrent(current);
  };

  const doMutation = variables => {
    const operation = gql.mutation({
      operation: ''.concat('update_', table),
      variables: {
        where: {
          value: variables.where,
          type: `${table}_bool_exp`,
          required: true,
        },
        _set: { value: variables['_set'], type: `${table}_set_input` },
      },
      fields: ['affected_rows'],
    });
    const fetchData = async () =>
      await graphQLFetch({
        query: operation.query,
        variables: operation.variables,
      });
    fetchData();
  };

  const editValues = values => {
    values = [...new Set(values)];
    values.map((params, index) => {
      let filteredParams = values.filter(
        value => params.rowIndex === value.rowIndex,
      );
      let data = params.data;
      data[params.colDef?.field] = params.oldValue;
      filteredParams.map(param => {
        data[param.colDef?.field] = param.oldValue;
      });
      let variables = { where: {}, _set: {} };
      for (let key in data) {
        variables.where[key] = {
          _eq: parseInt(data[key]) ? parseInt(data[key]) : data[key],
        };
      }
      variables['_set'][params.colDef.field] = parseInt(params.newValue)
        ? parseInt(params.newValue)
        : params.newValue;
      filteredParams.map(param => {
        variables['_set'][param.colDef.field] = parseInt(param.newValue)
          ? parseInt(param.newValue)
          : param.newValue;
      });
      values.splice(index, 1);
      values = values.filter(el => !filteredParams.includes(el));
      setChangedValues(values);
      doMutation(variables);
    });
  };

  const onCellValueChanged = params => {
    let values = changedValues;
    values.push(params);
    setChangedValues(values);
    setTimeout(() => editValues(values), 500);
  };

  let orderByParameter = fields.includes(orderBy) ? orderBy : fields[0];
  const subscription = gql.subscription({
    operation: table,
    variables: {
      limit,
      offset,
      order_by: {
        value: { [orderByParameter]: `asc` },
        type: `[${table.concat('_order_by!')}]`,
      },
    },
    fields,
  });

  const saveView = (defaultView = null) => {
    if (defaultView) {
      let viewObj = views.filter(
        view => view.table === table && view.name === defaultView,
      )[0];
      let index = views.indexOf(viewObj);
      if (index !== -1) {
        viewObj = {
          table,
          name: defaultView,
          state: columnAPI.getColumnState(),
          orderBy,
          limit,
        };
        views[index] = viewObj;
        actions.setViews(views);
      }
    } else {
      let viewObj = {
        table,
        name,
        state: columnAPI.getColumnState(),
        orderBy,
        limit,
      };
      actions.setView(viewObj);
      actions.setDefaultView(name);
      setPopup(false);
      setName('');
    }
  };

  const getContextMenuItems = params => {
    setFormData({});
    return [
      {
        name: 'Add Column',
        action: () => {
          setType('add');
          setShow(true);
          setColumn(params.column.colId);
        },
      },
      {
        name: 'Edit Column',
        action: () => {
          setType('edit');
          setShow(true);
          setFormData({ name: params.column.colId });
          setColumn(params.column.colId);
        },
      },
      {
        name: 'Remove Column',
        action: () => onRemove(params.column.colId),
      },
      'separator',
      'copy',
      'copyWithHeaders',
      'paste',
      'export',
    ];
  };

  const onSave = () => {
    let col = columns.filter(c => c === column)[0];
    let index = columns.indexOf(col);
    columns.splice(index, 0, formData.name);
    setColumns(columns);
    setShow(false);
  };

  const onEdit = () => {
    let col = columns.filter(c => c === column)[0];
    let index = columns.indexOf(col);
    columns.splice(index, 1, formData.name);
    setColumns(columns);
    setShow(false);
  };

  const onRemove = colID => {
    let col = columns.filter(c => c === colID)[0];
    let index = columns.indexOf(col);
    columns.splice(index, 1);
    setColumns(columns);
  };

  useSubscription(subscription, ({ data, errors }) => {
    if (errors && errors.length > 0) {
      console.log(errors);
      return;
    }
    actions.setRows(data[table]);
  });

  return (
    <div className="ag-theme-alpine">
      {table !== '' && rows.length > 0 ? (
        <React.Fragment>
          <div className="my-3">
            <div style={{ padding: `1rem` }}>
              <h3 style={{ margin: 0 }}>{table}</h3>
              <p className="p-1">Total {rowCount} records</p>
              <div>
                {views &&
                  views.map(view => {
                    if (view.table === table)
                      return (
                        <div
                          onClick={() => {
                            columnAPI.applyColumnState({
                              state: view.state,
                              applyOrder: true,
                            });
                            actions.setLimit(view.limit);
                            actions.setOrderBy(view.orderBy);
                            actions.setDefaultView(view.name);
                          }}
                          className={`badge badge-pill mr-1 p-2 ${
                            defaultView === view.name
                              ? 'badge-primary'
                              : 'badge-secondary'
                          }`}
                          style={{ cursor: 'pointer' }}>
                          {view.name}
                        </div>
                      );
                  })}
                <div
                  onClick={() => setPopup(true)}
                  className="badge badge-pill badge-dark p-2"
                  style={{ cursor: 'pointer' }}>
                  + Create a view
                </div>
                <div className="float-right">
                  <div
                    onClick={() => saveView(defaultView)}
                    className="badge badge-dark p-2 mr-2"
                    style={{ cursor: 'pointer' }}>
                    Save to {defaultView}
                  </div>
                </div>
              </div>
            </div>
          </div>
          <AgGridReact
            rowData={rows}
            sideBar
            enableRangeSelection
            enableFillHandle
            undoRedoCellEditing
            undoRedoCellEditingLimit={20}
            defaultColDef={{
              flex: 1,
              minWidth: 100,
              editable: true,
              resizable: true,
              sortable: true,
              filter: true,
            }}
            sortingOrder={['desc', 'asc', null]}
            onCellValueChanged={onCellValueChanged}
            domLayout={'autoHeight'}
            animateRows={true}
            allowContextMenuWithControlKey={true}
            getContextMenuItems={getContextMenuItems}
            onGridReady={params => {
              setColumnAPI(params.columnApi);
              if (
                views.filter(
                  view => view.name === 'Default View' && view.table === table,
                ).length <= 0
              ) {
                let viewObj = {
                  table,
                  name: 'Default View',
                  state: params.columnApi.getColumnState(),
                  orderBy,
                  limit,
                };
                actions.setView(viewObj);
              }
            }}>
            {columns.map(key => (
              <AgGridColumn field={key} key={key} />
            ))}
          </AgGridReact>
          <Modal
            isOpen={popup}
            style={customStyles}
            onRequestClose={() => setPopup(false)}
            ariaHideApp={false}>
            <div style={{ padding: '1rem' }}>
              <div className="form-group">
                <label>Name of the view</label>
                <input
                  type="text"
                  className="form-control"
                  placeholder="Enter Name"
                  value={name}
                  onChange={e => setName(e.target.value)}
                />
              </div>
              <button
                onClick={() => setPopup(false)}
                className="btn btn-danger float-left">
                Cancel
              </button>
              <button
                onClick={() => saveView()}
                className="btn btn-primary float-right">
                Save
              </button>
            </div>
          </Modal>
        </React.Fragment>
      ) : (
        <p>Please select a table to render</p>
      )}
      {table !== '' && rows.length > 0 && (
        <div className="p-4">
          <select
            value={limit}
            onChange={e => actions.setLimit(parseInt(e.target.value))}>
            <option>5</option>
            <option>10</option>
            <option>20</option>
            <option>50</option>
            <option>100</option>
            <option>500</option>
          </select>{' '}
          records per page
          <div className="float-right px-2">
            <select
              value={orderBy}
              onChange={e => actions.setOrderBy(e.target.value)}>
              {fields.map(f => (
                <option key={f} value={f}>
                  {f}
                </option>
              ))}
            </select>
          </div>
          <div className="float-right">
            <Pagination
              total={rowCount}
              pageSize={limit}
              current={current}
              onChange={(current, pageSize) =>
                handlePagination(current, pageSize)
              }
            />
          </div>
        </div>
      )}
      <SidePanel
        show={show}
        setShow={setShow}
        onSave={onSave}
        onEdit={onEdit}
        type={type}
        name={
          type === 'add'
            ? `Add column to '${table.split('_').pop()}'`
            : `Edit column '${column}'`
        }>
        <div className="mt-3">
          <label>Column Name</label>
          <input
            className="form-control"
            value={formData?.name}
            onChange={e =>
              setFormData({ ...formData, name: e.target.value })
            }
          />
        </div>
        <div className="mt-3">
          <label>Column Type</label>
          <select
            className="form-control"
            value={formData?.type}
            onChange={e =>
              setFormData({ ...formData, type: e.target.value })
            }>
            <option value="string">String</option>
            <option value="integer">Integer</option>
            <option value="date">Date</option>
            <option value="timestamp">Timestamp</option>
          </select>
        </div>
      </SidePanel>
    </div>
  );
};

const mapStateToProps = state => ({
  rows: state.rowData,
  table: state.table,
  fields: state.fields,
  rowCount: state.rowCount,
  current: state.current,
  orderBy: state.orderBy,
  limit: state.limit,
  offset: state.offset,
  views: state.views,
  defaultView: state.defaultView,
});

const mapDispatchToProps = dispatch => ({
  actions: bindActionCreators(actions, dispatch),
});

export default connect(mapStateToProps, mapDispatchToProps)(Table);
