import React, { Component } from 'react';
import { getUserPool, getCognitoUser, verifyAuthenticationDetails } from '../../app/common';
import './index.css';
import { Button } from 'semantic-ui-react';

const logo = require ('../../logo.jpg');

var userPool;

class Login extends Component {
	constructor(props) {
		super(props);
		this.state = {
			username: '',
			password: '',
			loading: false
		}

	}
	componentWillMount() {
		userPool = getUserPool();
		console.log(userPool)
		if (userPool.getCurrentUser()) {
			this.props.history.push('/home');
		}
	}

	handleChange = (event) => {
		var name = event.target.name;
		this.setState({
			[name]: event.target.value
		})
	}

	handleSubmit = (event) => {
		event.preventDefault();
		this.setState({
			loading: true
		})
		const { history } = this.props;
		var authenticationData = {
			Username : this.state.username,
			Password : this.state.password
		};

		var authenticationDetails = verifyAuthenticationDetails(authenticationData);


		var cognitoUser = getCognitoUser(this.state.username, userPool);

		var docRef = this;

		cognitoUser.authenticateUser(authenticationDetails, {
	        onSuccess: (result) => {	            	            
	            /*Use the idToken for Logins Map when Federating User Pools with identity pools or when passing through an Authorization Header to an API Gateway Authorizer*/	           	            
	            var idToken = result.idToken.jwtToken;
	            localStorage.setItem('idToken', idToken);
	            localStorage.setItem('username', this.state.username);
	            history.push('/home');
	        },

	        onFailure: function(err) {
	        	docRef.setState({
					loading: false
				})
	        	if (err.code === "UnknownError") {
	        		history.push('/home')
	        	}
	        	alert(err.message)	        		     
	        }
    	});	
	}
	render() {
		return (
			<div className="login-form">
				<div className='ui center aligned middle aligned grid login-container'>
					<div className='column login-box'>
						<div className="ui teal center aligned">
							<img src={logo} width="100%" alt="Padman-Stops-logo" />
						</div>
						<form className='ui large form' onSubmit={this.handleSubmit}>
							<div className='ui piled segment'>
								<div className='field'>									
									<div className="ui fluid left icon input">
										<input type="text" placeholder="E-mail address" 
										name="username" value={this.state.username} 
										onChange={this.handleChange}
										/>
										<i aria-hidden="true" className="user icon"></i>
									</div>
								</div>
								<div className='field'>									
									<div className="ui fluid left icon input">
										<input type="password" placeholder="Password" 
										name="password" value={this.state.password} 
										onChange={this.handleChange}/>
										<i aria-hidden="true" className="lock icon"></i>
									</div>
								</div>								
				                <Button loading={this.state.loading} type='submit' className='ui positive large fluid button' role='button'>
				                	Submit
				                </Button>
		              		</div>
		            	</form>
		            </div>
		        </div>
		    </div>
		);
	}
}

export default Login;