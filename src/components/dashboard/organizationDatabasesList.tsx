import React, { useState } from 'react';
import { bindActionCreators } from 'redux';
import { connect } from 'react-redux';
import { withAuthenticationRequired } from '@auth0/auth0-react';
import Avatar from 'react-avatar';
import { navigate } from 'gatsby';
import { TrashIcon, IconButton } from 'evergreen-ui';
import { useMutation } from 'graphql-hooks';
import { actions } from '../../state/actions';
import { OrganizationItemType, SchemaItemType } from '../../types';
import NoData from '../common/noData';
import { DELETE_ORGANIZATION_MUTATION } from '../../graphql/mutations/wb';
import AddData from '../common/addData';
import DeleteModal from '../common/deleteModal';

type DatabasesPropsType = {
  organization: OrganizationItemType;
  schemas: Array<SchemaItemType>;
  actions: any;
  renderTitle?: boolean;
};

const defaultProps = {
  renderTitle: true,
};

const OrganizationDatabasesList = ({
  organization,
  schemas,
  actions,
  renderTitle = true,
}: DatabasesPropsType) => {
  const [deleteOrganizationMutation] = useMutation(
    DELETE_ORGANIZATION_MUTATION,
  );

  const [showDelete, setShowDelete] = useState(false);

  const deleteOrganization = () => {
    setShowDelete(true);
  };

  return (
    <div className="card my-4">
      {renderTitle && (
        <div className="card-header d-flex justify-content-between align-items-center">
          <h6>{organization.label}</h6>
          {organization?.role?.name === 'organization_administrator' && (
            <div>
              <IconButton
                appearance="minimal"
                icon={TrashIcon}
                onClick={() => deleteOrganization()}
              />
              {showDelete && (
                <DeleteModal
                  show={showDelete}
                  setShow={setShowDelete}
                  type="organization"
                  org={organization}
                />
              )}
            </div>
          )}
        </div>
      )}
      <div className="card-body">
        {schemas.filter(
          schema => schema.organizationOwnerName === organization.name,
        ).length > 0 ? (
          <div className="row">
            {schemas
              .filter(
                schema => schema.organizationOwnerName === organization.name,
              )
              .map(schema => (
                <div
                  key={schema.name}
                  className="col-md-2 col-sm-6 text-center btn"
                  aria-hidden="true"
                  onClick={() =>
                    navigate(`/${organization.name}/${schema.name}`)
                  }>
                  <Avatar name={schema.label} size="75" round="12px" />
                  <p className="mt-2">{schema.label}</p>
                </div>
              ))}
            <AddData name="database" type="createDatabase" />
          </div>
        ) : (
          <NoData type="createDatabase" name="database" />
        )}
      </div>
    </div>
  );
};

OrganizationDatabasesList.defaultProps = defaultProps;
const mapStateToProps = state => ({
  schemas: state.schemas,
});

const mapDispatchToProps = dispatch => ({
  actions: bindActionCreators(actions, dispatch),
});

export default connect(
  mapStateToProps,
  mapDispatchToProps,
)(withAuthenticationRequired(OrganizationDatabasesList));
