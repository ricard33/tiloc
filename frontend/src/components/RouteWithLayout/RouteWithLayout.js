import React from 'react';
import { Redirect, Route, useLocation } from "react-router-dom";
import PropTypes from 'prop-types';
import { useSelector } from "react-redux";

const RouteWithLayout = props => {
  const { layout: Layout, component: Component, needAuthentication, ...rest } = props;
  const auth = useSelector(store => store.auth);
  const location = useLocation();

  return (
    <Route
      {...rest}
      render={matchProps => {
        if(needAuthentication && auth.isLoading){
          return <em>Loading...</em>;
        } else if (needAuthentication && !auth.isAuthenticated) {
          return <Redirect to={{pathname: "/login", state: {from: location}}}/>;
        } else {
          return (
            <Layout>
              <Component {...matchProps} />
            </Layout>
          )
        }
      }}
    />
  );
};

RouteWithLayout.defaultProps = {
  needAuthentication: true,
};

RouteWithLayout.propTypes = {
  component: PropTypes.any.isRequired,
  layout: PropTypes.any.isRequired,
  needAuthentication: PropTypes.bool,
  path: PropTypes.string,
};

export default RouteWithLayout;
