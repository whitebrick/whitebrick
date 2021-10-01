import React, { useState } from 'react';
import { bindActionCreators } from 'redux';
import { connect } from 'react-redux';
import { withAuthenticationRequired } from '@auth0/auth0-react';
import * as Yup from 'yup';
import { useMutation } from 'graphql-hooks';
import { GridApi } from 'ag-grid-community';
import { actions } from '../../../state/actions';
import { ColumnItemType, SchemaItemType, TableItemType } from '../../../types';
import FormMaker from '../../elements/formMaker';
import {
  ADD_OR_CREATE_COLUMN_MUTATION,
  ADD_OR_REMOVE_COLUMN_SEQUENCE,
  CREATE_OR_ADD_FOREIGN_KEY,
  CREATE_OR_DELETE_PRIMARY_KEYS,
  UPDATE_COLUMN_MUTATION,
} from '../../../graphql/mutations/wb';

type ColumnFormPropsType = {
  table: TableItemType;
  tables: TableItemType[];
  schema: SchemaItemType;
  type: 'addColumn' | 'editColumn';
  column: any;
  columns: ColumnItemType[];
  cloudContext: any;
  formData: any;
  gridAPI: GridApi;
  actions: any;
};

const parseColumnTypes = (types: any) => {
  const opts = [];
  Object.keys(types).map(label =>
    opts.push({ key: types[label], value: label }),
  );
  return opts;
};

const columnForm = (
  type: 'addColumn' | 'editColumn',
  tables: TableItemType[],
  cloudContext: any,
  formData: any = null,
) => {
  return {
    fields: [
      { name: 'name', label: 'Column Name', type: 'text', required: true },
      { name: 'label', label: 'Column Label', type: 'text', required: true },
      {
        name: 'type',
        label: 'Column Type',
        type: 'select',
        options: parseColumnTypes(cloudContext?.defaultColumnTypes),
        required: true,
      },
      {
        name: 'isPrimaryKey',
        label: 'Primary key?',
        type: 'checkbox',
      },
      {
        name: 'autoIncrement',
        label: 'Auto Increment?',
        type: 'checkbox',
        render: { variable: 'type', equalsTo: 'integer', type: 'comparison' },
      },
      {
        name: 'startSequenceNumber',
        label: 'Start sequence at (optional)',
        type: 'text',
        render: {
          variable: 'autoIncrement',
          equalsTo: true,
          type: 'comparison',
        },
      },
      {
        name: 'foreignKey',
        label: 'Add a foreign key relation',
        type: 'foreignKeyButton',
      },
    ],
    initialValues: type === 'editColumn' ? formData : {},
    validationSchema: Yup.object(),
  };
};

const getValues = (type, formData, table, tables, cloudContext) => {
  if (type === 'addColumn')
    return {
      name: `Add new column to ${table.label}`,
      ...columnForm(type, tables, cloudContext, formData),
    };
  return {
    name: `Edit column in ${table.label}`,
    ...columnForm(type, tables, cloudContext, formData),
  };
};

const ColumnForm = ({
  table,
  tables,
  schema,
  type,
  formData,
  cloudContext,
  column,
  columns,
  gridAPI,
  actions,
}: ColumnFormPropsType) => {
  const [isLoading, setLoading] = useState(false);
  const [errors, setErrors] = useState(null);

  const [addOrCreateColumn] = useMutation(ADD_OR_CREATE_COLUMN_MUTATION);
  const [createOrDeletePrimaryKeys] = useMutation(
    CREATE_OR_DELETE_PRIMARY_KEYS,
  );
  const [updateColumn] = useMutation(UPDATE_COLUMN_MUTATION);
  const [addOrRemoveColumnSequence] = useMutation(
    ADD_OR_REMOVE_COLUMN_SEQUENCE,
  );
  const [createOrAddForeignKey] = useMutation(CREATE_OR_ADD_FOREIGN_KEY);

  const value = getValues(type, formData, table, tables, cloudContext);

  const onSave = async values => {
    setErrors(null);
    setLoading(true);
    if (type === 'addColumn') {
      const { loading, error } = await addOrCreateColumn({
        variables: {
          schemaName: schema.name,
          tableName: table.name,
          create: true,
          columnName: values.name,
          columnLabel: values.label,
          columnType: values.type,
        },
      });
      if (!loading) {
        if (error) setErrors(error);
        const columnNames = [];
        columns
          .filter(column => column.isPrimaryKey === true)
          .map(c => columnNames.push(c.name));
        if (formData.isPrimaryKey) {
          const { loading: deleteLoading, error: deleteError } =
            await createOrDeletePrimaryKeys({
              variables: {
                schemaName: schema.name,
                tableName: table.name,
                del: true,
                columnNames,
              },
            });
          if (!deleteLoading && !deleteError) {
            await createOrDeletePrimaryKeys({
              variables: {
                schemaName: schema.name,
                tableName: table.name,
                columnNames: [values.name],
              },
            });
          }
        }
        if (formData.table && formData.column) {
          const { loading, error } = await createOrAddForeignKey({
            variables: {
              schemaName: schema.name,
              tableName: table.name,
              columnNames: [values.name],
              parentTableName: values.table,
              parentColumnNames: [values.column],
              create: true,
            },
          });
          if (!loading && !error) {
            gridAPI.refreshCells({ force: true });
            actions.setShow(false);
          }
        } else actions.setShow(false);
      }
    } else {
      const variables: any = {
        schemaName: schema.name,
        tableName: table.name,
        columnName: column,
      };
      const col = columns.filter(c => c.name === column)[0];
      if (values.name !== col.name) variables.newColumnName = values.name;
      if (values.label !== col.label) variables.newColumnLabel = values.label;
      if (values.type !== col.type) variables.newType = values.type;
      if (
        variables.newColumnName ||
        variables.newColumnLabel ||
        variables.newType
      ) {
        const { loading, error } = await updateColumn({
          variables,
        });
        if (!loading) {
          if (error) setErrors(error);
          if (values.autoIncrement) {
            const vars: any = {
              schemaName: schema.name,
              tableName: table.name,
              columnName: values.name,
            };
            if (formData.startSequenceNumber)
              vars.nextSeqNumber = parseInt(values.startSequenceNumber, 10);
            await addOrRemoveColumnSequence({ variables: vars });
          } else if (values.default) {
            await addOrRemoveColumnSequence({
              variables: {
                schemaName: schema.name,
                tableName: table.name,
                columnName: values.name,
                remove: true,
              },
            });
          }
          if (
            values.table !== formData.table &&
            values.column !== formData.column
          ) {
            await createOrAddForeignKey({
              variables: {
                schemaName: schema.name,
                tableName: table.name,
                columnNames: [values.name],
                parentTableName: values.table,
                parentColumnNames: [values.column],
                create: true,
              },
            });
          }
          gridAPI.refreshCells({ force: true });
          actions.setShow(false);
        }
      }
    }
  };

  return (
    <FormMaker
      key={value.name + type}
      errors={errors}
      isLoading={isLoading}
      name={value.name}
      fields={value.fields}
      initialValues={value.initialValues}
      validationSchema={value.validationSchema}
      onSubmit={onSave}
    />
  );
};

const mapStateToProps = state => ({
  type: state.type,
  formData: state.formData,
  schema: state.schema,
  table: state.table,
  tables: state.tables,
  column: state.column,
  columns: state.columns,
  cloudContext: state.cloudContext,
  gridAPI: state.gridAPI,
});

const mapDispatchToProps = dispatch => ({
  actions: bindActionCreators(actions, dispatch),
});

export default connect(
  mapStateToProps,
  mapDispatchToProps,
)(withAuthenticationRequired(ColumnForm));
