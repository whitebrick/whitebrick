import React from 'react';
import { bindActionCreators } from 'redux';
import { actions } from '../../state/actions';
import { connect } from 'react-redux';
import { withAuthenticationRequired } from '@auth0/auth0-react';
import Avatar from 'react-avatar';
import { navigate } from 'gatsby';

type MyDatabasesPropsType = {
  schemas: any[];
  user: any;
  setType: (value: string) => void;
  setShow: (value: boolean) => void;
  actions: any;
  name?: string;
};

const MyDatabases = ({
  schemas,
  user,
  setShow,
  setType,
  actions,
  name = 'My Databases',
}: MyDatabasesPropsType) => {
  let filteredSchemas: any[] = schemas.filter(schema =>
    name === 'My Databases'
      ? schema['userOwnerEmail'] === user.email
      : schema['userOwnerEmail'] !== user.email &&
        schema['organizationOwnerName'] === null,
  );
  return (
    filteredSchemas.length > 0 && (
      <div className="card my-4">
        <div className="card-header">
          <h4>{name}</h4>
        </div>
        <div className="card-body">
          <div className="row">
            {filteredSchemas.map(schema => (
              <div
                className="col-md-2 text-center btn"
                aria-hidden="true"
                onClick={() => navigate(`/db/${schema.name}`)}>
                <Avatar name={schema.label} size="75" round="12px" />
                <p className="mt-2">{schema.label}</p>
              </div>
            ))}
            {name === 'My Databases' && (
              <div
                className="col-md-2 text-center btn"
                aria-hidden="true"
                onClick={() => {
                  actions.setFormData({});
                  setType('database');
                  setShow(true);
                }}>
                <Avatar name="+" size="75" round="12px" />
                <p className="mt-2">Add database</p>
              </div>
            )}
          </div>
        </div>
      </div>
    )
  );
};

const mapStateToProps = state => ({
  schemas: state.schemas,
  user: state.user,
});

const mapDispatchToProps = dispatch => ({
  actions: bindActionCreators(actions, dispatch),
});

export default connect(
  mapStateToProps,
  mapDispatchToProps,
)(withAuthenticationRequired(MyDatabases));