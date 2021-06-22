import React from 'react';
import { bindActionCreators } from 'redux';
import { actions } from '../../actions';
import { connect } from 'react-redux';
import { withAuthenticationRequired } from '@auth0/auth0-react';
import Avatar from 'react-avatar';
import { navigate } from 'gatsby';
import { FaCog } from 'react-icons/fa';

const Databases = ({ organization, schemas, setType, setShow, actions }) => {
  return (
    <div className="card my-4">
      <div className="card-header d-flex justify-content-between align-items-center">
        <h4>{organization.label}</h4>
        <button
          className="btn btn-light"
          onClick={() => navigate(`/organization/${organization.name}`)}>
          <FaCog />
        </button>
      </div>
      <div className="card-body">
        <div className="row">
          {schemas
            .filter(
              schema => schema['organizationOwnerName'] === organization.name,
            )
            .map(schema => (
              <div
                className="col-md-2 text-center btn"
                aria-hidden="true"
                onClick={() => navigate(`/database/${schema.name}`)}>
                <Avatar name={schema.label} size="75" round="12px" />
                <p className="mt-2">{schema.label}</p>
              </div>
            ))}
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
        </div>
      </div>
    </div>
  );
};

const mapStateToProps = state => ({
  schemas: state.schemas,
});

const mapDispatchToProps = dispatch => ({
  actions: bindActionCreators(actions, dispatch),
});

export default connect(
  mapStateToProps,
  mapDispatchToProps,
)(withAuthenticationRequired(Databases));