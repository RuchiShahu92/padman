import React, { Component } from 'react';
import MenuBar from '../MenuBar';
import UserTable from '../Tables/user_table';
import { sematicUI } from '../../app/constants';
import { Icon, Loader } from 'semantic-ui-react';
import { setAWSConfiguration, docClient } from '../../app/common';
import UserModal from '../Modals/user_modal';
import DeleteConfirmationModal from '../Modals/delete_confirmation_modal';
import CompanyModal from '../Modals/company_modal';

class Users extends Component {
	constructor(props) {
		super(props);
		this._companyDetails = this.props.location.state.companyDetails;
		this.state = {
			userList: [],
			user_modal_open: false,
			delete_modal_open: false,
			company_modal_open: false,
			userObj: {
				permissions: [
					{access_controll_device: true},
					{access_measure_meter: true},
					{access_soil_watcher: true},
					{access_chatterbox_tnt: true}
				]
			},
			btnLoading: false,
			listLoading: true,
			deleteLoadingStatus: false,
			_email: '',
			_userId: '',
			editMode: false,
			btnLoading: false,
			companyObj: {
				company_name: this._companyDetails.companyName,
				company_email: this._companyDetails.email,
				company_phone: this._companyDetails.phone,
				company_address: this._companyDetails.address,
				person_contact_name: this._companyDetails.personContactName,
				bp_code: this._companyDetails.bpCode,
				notes: this._companyDetails.notes,
				is_web_access: this._companyDetails.hasWebAccess
			}
		};
		this._companyId = this._companyDetails.companyId;
		this._companyName = this._companyDetails.companyName;

	}

	componentWillMount() {
		setAWSConfiguration()		
	}

	componentDidMount() {
		this.getUserList();
		// this.updateVersion();
	}	

	userModalOpen = user_modal_dimmer => () => {
		let userObj = {
			permissions: [
				{access_controll_device: true},
				{access_measure_meter: true},
				{access_soil_watcher: true},
				{access_chatterbox_tnt: true}
			]
		}
		this.setState({
			user_modal_dimmer,
			user_modal_open: true,
			editMode: false,
			userObj
		})
	}

	userModalClose = () => {
		this.setState({
			user_modal_open: false
		})
	}

	deleteModalOpen = delete_modal_dimmer => () => {
		this.setState({
			delete_modal_dimmer,
			delete_modal_open: true
		})
	}

	deleteModalClose = () => {
		this.setState({
			delete_modal_open: false
		})
	}

	companyModalOpen = company_modal_dimmer => () => {
		this.setState({
			company_modal_dimmer,
			company_modal_open: true
		})
	}

	companyModalClose = () => {
		this.setState({
			company_modal_open: false
		})
	}

	getUserList = () => {
		let params = {
			TableName: 'SMSGateway_User',
			IndexName: 'companyId-createdAt-index',
			KeyConditionExpression: "companyId = :company_id",
    		ExpressionAttributeValues: {
    			":company_id": this._companyId
        	}
		};

		docClient.query(params, (err, data) => {
			if (!err) {
				let userList = [];
				let permissions = [];		
				data.Items.forEach((dataItem, index) => {					
					userList.push({
						'userId': dataItem.userEmail,
						'username': dataItem.userFullName,
						'userType': dataItem.userType,
						'accessControllDevice': '-',
						'accessToMeasureMeter': '-',
						'accessToSoilWatcher': '-',
						'accessToChatterboxAndTnT': '-',
						'Action': dataItem.userId
					});
					if (dataItem.userPermissions) {
						permissions = JSON.parse(dataItem.userPermissions)
						userList[index]['accessControllDevice'] = permissions[0]['access_controll_device'];
						userList[index]['accessToMeasureMeter'] = permissions[1]['access_measure_meter'];
						userList[index]['accessToSoilWatcher'] = permissions[2]['access_soil_watcher'];
						userList[index]['accessToChatterboxAndTnT'] = permissions[3]['access_chatterbox_tnt'];
					}
				});
				this.setState({
					userList,
					listLoading: false
				})
			}
			else {
				this.setState({					
					listLoading: false
				})
			}
			// this.getCompanyList();
		})
	}

	getCompanyList = () => {
        let params = {
            TableName: 'SMSGateway_Company'
        };
        docClient.scan(params, (err, data) => {
            if (!err) {
            	data.Items.forEach((dataResponse) => {

            	})                
            }
        })
    }

	deleteUser = (value) => {
		this.setState({
			deleteLoadingStatus: true
		}, () => {
			let userParameter = {
				"email": value
			};
			let header = new Headers({
				'Content-Type': 'application/json',
				//'Authorization': idToken
			});

		  	let requestObj = {
		  		method: 'POST',	  		
				headers: header,		
				body: JSON.stringify(userParameter)
		  	};

	  		let requestForAddUser = new Request(' https://p0azedh632.execute-api.ap-southeast-2.amazonaws.com/Production/delete-user', requestObj)

	  		fetch(requestForAddUser)
	  		.then(response => {
	  			return response.json()
	  		})
	  		.then(responseData => {
	  			if (responseData.statusCode === 200) {
	  				alert(responseData.body.message);
	  				let userList = this.state.userList;
	  				let pos = userList.map(item => { return item.userId; }).indexOf(value)
	  				userList.splice(pos, 1);
	  				this.setState({
	  					userList,
	  					deleteLoadingStatus: false
	  				});
	  				this.deleteModalClose();
	  			}
	  		})
	  		.catch((err) => {
	  			alert(err.message + "\n" + "Please try again.");
	  			this.setState({
	  				deleteLoadingStatus: false
	  			})
	  		});
		});
	}

	handleUserInputChange = (event, data) => {
		let userObj = this.state.userObj;		
		userObj[data.name] = data.value;
		/*if (data.name === 'user_type' && data.value === 'Admin') {
			for (let i = 0; i < userObj['permissions'].length; i++) {
				console.log(Object.keys(userObj['permissions'][i])[0])
				Object.keys(userObj['permissions'][i])[0] = true;
			}
		}*/
		if (data.type === "checkbox") {
			userObj['permissions'][data.index][data.name] = data.checked;
		}		
		this.setState({
			userObj
		})
	}

	handleCompanyInputChange = (event, data) => {
		const companyObj = this.state.companyObj;		
		companyObj[data.name] = data.value;
		this.setState({
			companyObj
		})
	}

	getHeaders = () => {
		return {
			'Action': {
				'sorting': false,
				transform: (value, idx, row) => {					
					return (
						<div>
							<Icon name="trash" 					
							style={{color: 'red', cursor: 'pointer'}} 
							onClick={() => this.askForDelete(value, row['userId'])} 
							/>
							<Icon name="pencil"
							style={{marginLeft: '20px', color: 'green', cursor: 'pointer'}}
							onClick={() => this.editUser(value, row)}
							/>
						</div>
					)
				}
			}
		}
	}

	editUser = (userId, row) => {
		console.log(row)	
		let userObj = this.state.userObj;
		userObj['email'] = row['userId'];
		userObj['user_type'] = row['userType']
		userObj['username'] = row['username'];
		userObj['phone'] = row['phone'];
		userObj['permissions'][0]['access_controll_device'] = row['accessControllDevice'] === "-" ? true : row['accessControllDevice']
		userObj['permissions'][1]['access_measure_meter'] = row['accessToMeasureMeter'] === "-" ? true : row['accessToMeasureMeter']
		userObj['permissions'][2]['access_soil_watcher'] = row['accessToSoilWatcher'] === "-" ? true : row['accessToSoilWatcher']
		userObj['permissions'][3]['access_chatterbox_tnt'] = row['accessToChatterboxAndTnT'] === "-" ? true : row['accessToChatterboxAndTnT']
		this.setState({
			userObj,
			editMode: true,			
			_userId: userId,
			user_modal_dimmer: 'blurring',
			user_modal_open: true,
		})
	}

	updateUserDetails = () => {
		this.setState({
			btnLoading: true			
		});
		let params = {
			TableName: 'SMSGateway_User',
			Key: {
				userId: this.state._userId
			},
			UpdateExpression: "set userEmail = :email, userFullName = :username, userType = :user_type, userPermissions = :user_permissions",
			ExpressionAttributeValues: {
				':email': this.state.userObj.email,
				':user_type': this.state.userObj.user_type,
				':username': this.state.userObj.username,
				':user_permissions': JSON.stringify(this.state.userObj.permissions)
			}
		}
		docClient.update(params, (err, data) => {
			if (!err) {
				alert('Updated Successfully');
				this.setState({
					btnLoading: false
				})
				this.userModalClose();
				this.getUserList();
			}
		})	
	}

	askForDelete = (userId, email) => {		
		this.setState({
			_email: email,
			_userId: userId,
			delete_modal_dimmer: 'blurring',
			delete_modal_open: true
		})
	}

	addUser = () => {		
		this.setState({
			btnLoading: true			
		}, () => {			
			let userParameter = {
				userFullName: this.state.userObj.username,
				email: this.state.userObj.email,
				phone: this.state.userObj.phone,
				companyId: this.props.location.state.companyId,
				userType: this.state.userObj.user_type,
				password: 'Padman@123',
				userPermissions: JSON.stringify(this.state.userObj.permissions)
			};
			let idToken = localStorage.getItem('idToken');
			let header = new Headers({
				'Content-Type': 'application/json',
				'Authorization': idToken
			});

		  	let requestObj = {
		  		method: 'POST',	  		
				headers: header,		
				body: JSON.stringify(userParameter)
		  	};

	  		let requestForAddUser = new Request('https://r1trze4ygk.execute-api.ap-southeast-2.amazonaws.com/prod/addNewUserWebAdmin', requestObj)

	  		fetch(requestForAddUser)
	  		.then(response => {
	  			return response.json()
	  		})
	  		.then((responseData) => {	  			
	  			if (responseData.statusCode === 200) {
	  				let userList = this.state.userList;
	  				let body = JSON.parse(responseData.body);
	  				alert(body.message);
	  				userList.push({	  					
						'userId': this.state.userObj.email,
						// 'phone': this.state.userObj.phone,
						'username':this.state.userObj.username,
						'userType': this.state.userObj.user_type,
						'Action': this.state.userObj.email,
						'accessControllDevice': this.state.userObj.permissions[0]['access_controll_device'],
						'accessToMeasureMeter': this.state.userObj.permissions[1]['access_measure_meter'],
						'accessToSoilWatcher': this.state.userObj.permissions[2]['access_soil_watcher'],
						'accessToChatterboxAndTnT': this.state.userObj.permissions[3]['access_chatterbox_tnt']
	  				})
	  				this.setState({
		  				userObj: {
		  					username: '',		  			
			  				email: '',
			  				phone: '',
			  				permissions: [
								{access_controll_device: false},
								{access_measure_meter: false},
								{access_soil_watcher: false},
								{access_chatterbox_tnt: false}
							]
			  			},
			  			btnLoading: false,
			  			userList
			  		}, () => {
			  			this.userModalClose();			  			
			  		});
	  			}	  				  			
	  		})
	  		.catch((err) => {
	  			alert(err.message + "\n" + "Please try again.")	  		
	  		});
		})
	}

	deleteUserV2 = (value) => {
		var params = {
			TableName: "SMSGateway_User",
			Key: {
				"userId": value
			}
		}
		docClient.delete(params, (err, data) => {
			if (!err) {
				alert('User deleted successfully');
				let userList = this.state.userList;
  				let pos = userList.map(item => { return item.userId; }).indexOf(value)
  				userList.splice(pos, 1);
  				this.setState({
  					userList,
  					deleteLoadingStatus: false
  				});
  				this.deleteModalClose();
			}
		});
	}

	editCompany = () => {
		this.setState({
			btnLoading: true
		})
		let companyParameter = this.state.companyObj;
		let params = {
			TableName: 'SMSGateway_Company',
			Key: {
				companyId: this._companyId
			},
			UpdateExpression: "set companyName = :company_name, companyEmail = :email, companyPhone = :phone, companyAddress = :address, bpCode = :bpCode, personContactName = :contact_name, isWebAccess = :is_web_access",
			ExpressionAttributeValues: {
				':company_name': companyParameter.company_name,
				':email': companyParameter.company_email,
				':phone': companyParameter.company_phone,
				':address': companyParameter.company_address,
				':contact_name': companyParameter.person_contact_name,
				':bpCode': companyParameter.bp_code,
				':is_web_access': companyParameter.is_web_access				
			}
		}
		docClient.update(params, (err, data) => {
			if (!err) {
				alert('Updated Successfully');
				this.companyModalClose();
			}
		})
	}

	render() {
		const headers = this.getHeaders();
		const { 
			user_modal_open, 
			user_modal_dimmer,
			delete_modal_open,
			delete_modal_dimmer,
			company_modal_open, 
			company_modal_dimmer
		} = this.state;
		return (
			<React.Fragment>
				<MenuBar history = { this.props.history } />				
				<div className='ui grid'>
					<div className="row">
						<div className="column" style={{ paddingLeft: '20px'}}>
							<button
								type='button' 
								className='ui positive button'
								onClick={this.userModalOpen('blurring')}
								>
								Add User
							</button>
							<button
								type='button' 
								className='ui positive button'
								onClick={this.companyModalOpen('blurring')}
								>
								Edit Company Details
							</button>
						</div>
					</div>
					<div className="row">
						<div className="column">
							<h2 style={{textAlign: 'center'}}>Users of  {this._companyName} </h2>
							{ 
								this.state.listLoading ?
								<Loader active>Loading</Loader>
								:
								<React.Fragment>
									{
										this.state.userList.length === 0 && 
										<h5 style={{ textAlign: 'center'}}> No Users Found</h5>
									}

									<UserTable
										userList = { this.state.userList } 
										className={sematicUI.table}
										headers={headers}
									/>
								</React.Fragment>
							}
						</div>
					</div>
				</div>

				<UserModal
			        visible={user_modal_open}
			        dimmer={user_modal_dimmer}
			        open={user_modal_open}
			        onCloseHandler={this.userModalClose}
			        stateObj={this.state.userObj}
			        inputChangeHandler={this.handleUserInputChange}
			        btnState={this.state.btnLoading}
			        userFormSubmitHandler={this.addUser}
			        editMode={this.state.editMode}
			        updateUserDetails={this.updateUserDetails}
			    />
			    <DeleteConfirmationModal
			    	visible={delete_modal_open}
			    	dimmer={delete_modal_dimmer}
			    	open={delete_modal_open}
			    	onCloseHandler={this.deleteModalClose}
			    	value={this.state._userId}
			    	name={this.state._email}
			    	btnState={this.state.deleteLoadingStatus}
			    	handleDelete={this.deleteUserV2}
			    	isCompany={false}
			    />
			    <CompanyModal
			        visible={company_modal_open}
			        dimmer={company_modal_dimmer}
			        open={company_modal_open}
			        onCloseHandler={this.companyModalClose}
			        stateObj={this.state.companyObj}
			        inputChangeHandler={this.handleCompanyInputChange}
			        btnState={this.state.btnLoading}
			        companyFormSubmitHandler={this.editCompany}
			        isForEdit={true}
			    />
			</React.Fragment>
		);
	}
}

export default Users;