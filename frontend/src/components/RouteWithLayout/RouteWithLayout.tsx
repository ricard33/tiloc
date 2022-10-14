import React from 'react';
import { Navigate, Route, RouterProps, useLocation } from "react-router-dom";
import { useSelector } from "react-redux";
import { RootState } from "../../store";

export interface Props extends RouterProps {
  layout: React.FunctionComponent<React.PropsWithChildren>,
  needAuthentication?: boolean,
}


const RouteWithLayout: React.FunctionComponent<Props> = (props: Props) => {
  const { layout: Layout, needAuthentication: _needAuthentication, ...rest } = props;
  const needAuthentication = typeof _needAuthentication === "undefined" ? true : _needAuthentication;
  const auth = useSelector<RootState>(store => store.auth) as {isLoading: boolean, isAuthenticated: boolean};
  const location = useLocation();

  const routeContent = () => {
    if(needAuthentication && auth.isLoading){
      return <em>Loading...</em>;
    } else if (needAuthentication && !auth.isAuthenticated) {
      return <Navigate to="/login" state={{from: location}} />;
    } else {
      return (
        <Layout>
          {props.children}
        </Layout>
      )
    }
  }

  return (
    <Route
      {...rest}
    >
      {routeContent()}
    </Route>
  );
};

export default RouteWithLayout;
