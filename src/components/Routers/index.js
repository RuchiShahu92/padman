import React from 'react';
import { withRouter } from 'react-router';
import { Switch, Route, Redirect } from 'react-router-dom';
import Login from '../Login';
import Home from '../Home';
import DeviceSpecific from '../Home/device_specification';
import TalkingTowerSpecification from '../Home/talking_tower_specification';
import SoilWatcherSpecification from '../Home/soil_watcher_specification';
import AutowinchSpecification from '../Home/autowinch_specification';
import LegacyDevice from '../LegacyDevice';
import Companies from '../Company';
import Users from '../Users';
import DevicesOnMap from '../Map';
import DeviceConfiguration from '../DeviceConfiguration';



const PublicRoutes = () => (
	<React.Fragment>
		<Route exact path="/" component={ Login } />
		<Route exact path="/home" component={ Home } />
		<Route exact path="/water-watcher/:device_id" component = { DeviceSpecific } />
		<Route exact path="/talking-tower/:device_id"  component = { TalkingTowerSpecification } />
		<Route exact path="/soil-watcher/:device_id" component = { SoilWatcherSpecification } />
		<Route exact path="/autowinch/:device_id" component = { AutowinchSpecification } />
		<Route exact path="/companies" component = { Companies } />
		<Route exact path="/legacy-device/:id" component = { LegacyDevice } />
		<Route exact path="/users" component = { Users } />
		<Route exact path="/device-on-map" component = { DevicesOnMap } />
		<Route exact path="/device-configurations" component = { DeviceConfiguration } />
		</React.Fragment>
	)

const Routes = () => {
	const isAuthenticated = localStorage.getItem("username");
	return (
	<Switch>
		<Route exact path="/" component={ Login } />
		<Route render={() => (
			!isAuthenticated ? ( <Redirect to="/" />): (<PublicRoutes />)
			) } />
	</Switch>

	)}

export default Routes;