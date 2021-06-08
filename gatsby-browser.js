/**
 * Implement Gatsby's Browser APIs in this file.
 *
 * See: https://www.gatsbyjs.com/docs/browser-apis/
 */

// You can delete this file if you're not using it

import React from 'react';
import { Provider } from 'react-redux';
import { Auth0Provider } from '@auth0/auth0-react';
import { navigate } from 'gatsby';

import store from './src/store';

const onRedirectCallback = appState => navigate(appState?.returnTo || '/');

export const wrapRootElement = ({ element }) => {
  return (
    <Provider store={store}>
      <Auth0Provider
        domain={process.env.AUTH0_DOMAIN}
        clientId={process.env.AUTH0_CLIENTID}
        responseType="token id_token"
        scope="openid profile email"
        redirectUri={process.env.AUTH0_CALLBACK}
        onRedirectCallback={onRedirectCallback}>
        {element}
      </Auth0Provider>
    </Provider>
  );
};
