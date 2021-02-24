import React, { Component } from 'react';
import { Dropdown, Menu } from 'semantic-ui-react';
import { Link } from 'react-router-dom';

const logo = require('../../PA_Logo_4a-100.jpg');

var AmazonCognitoIdentity = require('amazon-cognito-identity-js');

class MenuBar extends Component {
	constructor(props) {
		super(props);
		this._date = new Date();
	}
	logout = () => {
	    const { history } = this.props;
	    var data = {
	      UserPoolId : 'ap-southeast-2_mWDRSOy4f',
	      ClientId : '68p31534v0sn898cgpa76vs16g'
	    };

	    var userPool = new AmazonCognitoIdentity.CognitoUserPool(data);
	    var userData = {
	      Username : localStorage.getItem('username'),
	      Pool : userPool
	    };

	    var cognitoUser = new AmazonCognitoIdentity.CognitoUser(userData);
	    cognitoUser.signOut();
	    localStorage.clear();

	    history.push('/');
  	}

	render() {
		
		const username = 'Welcome ' + localStorage.getItem('username');

		return (
			 <Menu>
			 	<Menu.Item>
			 		<Link to="/home"><img src={logo} style={{ width: '220px'}} alt="Padman Stops V3" /></Link>
			 	</Menu.Item>			    			   	
			    <Menu.Item className="header">
			     <Link to="/companies">Manage Companies.</Link>
			    </Menu.Item>
			    <Menu.Item className="header">
			     <Link to="/device-on-map">Devices on Map</Link>
			    </Menu.Item>
			    <Menu.Item className="header">
			     <Link to="/device-configurations">Device Configurations</Link>
			    </Menu.Item>
			    <Menu.Item position='right'>
			    	<Dropdown item text={username}>
			    		<Dropdown.Menu>
			    			<Dropdown.Item onClick={this.logout}>Logout</Dropdown.Item>
			    		</Dropdown.Menu>
					</Dropdown>
				</Menu.Item>
			</Menu>
		);
	}
}

export default MenuBar;