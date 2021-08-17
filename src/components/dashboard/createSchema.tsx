import React from 'react';
import { bindActionCreators } from 'redux';
import { connect } from 'react-redux';
import { withAuthenticationRequired } from '@auth0/auth0-react';
import { Button } from 'evergreen-ui';
import { actions } from '../../state/actions';
import { OrganizationItemType, SchemaItemType } from '../../types';

type CreateSchemaType = {
  cloudContext: any;
  actions: any;
  schemas: SchemaItemType[];
  organizations: OrganizationItemType[];
};

const CreateSchema = ({
  cloudContext,
  actions,
  schemas,
  organizations,
}: CreateSchemaType) => {
  return (
    schemas.length < 1 &&
    organizations.length < 1 && (
      <div className="d-flex align-items-center" style={{ marginTop: '30vh' }}>
        <div className="container text-center">
          <div>
            <p>{cloudContext?.userMessages?.WB_NO_SCHEMAS_FOUND}</p>
            <div
              className="text-center btn"
              aria-hidden="true"
              onClick={() => {
                actions.setFormData({});
                actions.setType('createDatabase');
                actions.setShow(true);
              }}>
              <Button appearance="primary" size="large">
                + Create new database
              </Button>
            </div>
          </div>
        </div>
      </div>
    )
  );
};

const mapStateToProps = state => ({
  cloudContext: state.cloudContext,
  schemas: state.schemas,
  organizations: state.organizations,
});

const mapDispatchToProps = dispatch => ({
  actions: bindActionCreators(actions, dispatch),
});

export default connect(
  mapStateToProps,
  mapDispatchToProps,
)(withAuthenticationRequired(CreateSchema));
