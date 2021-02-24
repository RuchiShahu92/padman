import React, { Component } from 'react';
import MenuBar from '../MenuBar';
import CompanyTable from '../Tables/company_table';
import { sematicUI } from '../../app/constants';
import { Icon, Loader } from 'semantic-ui-react';
import { setAWSConfiguration, docClient, getFormatedDate } from '../../app/common';
import { Link } from 'react-router-dom';
import CompanyModal from '../Modals/company_modal';
import DeleteConfirmationModal from '../Modals/delete_confirmation_modal';

class Companies extends Component {
	constructor(props) {
		super(props);
		this.state = {
			companyArray: [],
			company_modal_open: false,
			filterValue: '',
			listLoading: true,
			companyObj: {},
			btnLoading: false,
			delete_modal_open: false,
			_companyId: '',
			_companyName: ''
		}
	}

	componentWillMount() {
		setAWSConfiguration()
	}

	componentDidMount() {
		this.getCompanyList();		
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

	deleteModalOpen = (value, companyName) => {
		this.setState({
			delete_modal_dimmer: 'blurring',
			delete_modal_open: true,
			_companyId: value,
			_companyName: companyName
		})
	}

	deleteModalClose = () => {
		this.setState({
			delete_modal_open: false
		})
	}

	handleCompanyInputChange = (event, data) => {
		const companyObj = this.state.companyObj;		
		companyObj[data.name] = data.value;
		if (data.type === "checkbox") { 
			companyObj[data.name] = data.checked;
		}
		this.setState({
			companyObj
		})
	}

	guid = () => {
		return this.s4() + this.s4() + '-' + this.s4() + '-' + 
	  	this.s4() + '-' + this.s4() + '-' + this.s4() + this.s4() + this.s4();
	}

	s4 = () => {
	    return Math.floor((1 + Math.random()) * 0x10000)
	      .toString(16)
	      .substring(1);
	}

	checkIfSameEmailExist = () => {
		this.setState({
			btnLoading: true
		});
		let params = {
			TableName: 'SMSGateway_Company',
			FilterExpression: 'companyEmail = :company_email',
			ExpressionAttributeValues: {
				':company_email': this.state.companyObj.company_email
			}
		};
		docClient.scan(params, (err, data) => {
			if (!err) {
				if (data.Items.length > 0) {
					alert("It seems this email is already been registered into our system!");
					this.setState({
						btnLoading: false
					});
				} else {
					this.addCompany();
				}
			}
		})
	}

	addCompany = () => {		
		let companyParameter = this.state.companyObj;		
		var params = {
	  		TableName: 'SMSGateway_Company',
	  		Item: {
	  			"companyId": this.guid(),
	  			"companyName": companyParameter.company_name,
	  			"companyPhone": companyParameter.company_phone,
	  			"companyAddress": companyParameter.company_address,
	  			"companyEmail": companyParameter.company_email,
	  			"personContactName": companyParameter.person_contact_name,
	  			"notes": companyParameter.notes,
	  			"isWebAccess": companyParameter.is_web_access,
	  			"bpCode": companyParameter.bp_code,
	  			"createdAt": new Date().valueOf()	  			
	  		}
	  	};
	  	docClient.put(params, (err, data) => {
	  		if (!err) {
	  			alert("Company Added Successfully");
	  			this.setState({
	  				btnLoading: false
	  			})	  			
	  			this.companyModalClose();
	  			this.getCompanyList();
	  		}
	  	})
	}

	getCompanyList = () => {
		let params = {
			TableName: 'SMSGateway_Company'
		};

		docClient.scan(params, (err, data) => {
			if (!err) {
				let companyArray = [];
				data.Items.forEach((dataItem) => {
					companyArray.push({
						'companyName': dataItem.companyName,
						'address': dataItem.companyAddress,
						'phone': dataItem.companyPhone,
						'email': dataItem.companyEmail,
						'bpCode': dataItem.bpCode,
						'personContactName': dataItem.personContactName,
						'createdAt': getFormatedDate(dataItem.createdAt),
						'companyId': dataItem.companyId,
						'hasWebAccess': dataItem.isWebAccess || 'False',
						'Action': dataItem.companyId
					});
				})				
				this.setState({
					companyArray,
					listLoading: false
				})
			} else {
				this.setState({
					listLoading: false
				})
			}
		})
	}

	handleDeleteCompany = (event, value, idx, row) => {
		event.preventDefault()
    	event.stopPropagation();
    	this.deleteModalOpen(value, row['companyName']);	
	}

	deleteCompany = () => {
		let idToken = localStorage.getItem('idToken');
	  	let header = new Headers({	  		
	  		'Content-Type': 'application/json',
	  		'Authorization': idToken	
	  	});
	  	var userParameter = {
	  		companyId: this.state._companyId
	  	}
	  	let requestObj = {
	  		method: 'POST',	  		
			headers: header,		
			body: JSON.stringify(userParameter)
	  	};
	  	let requestForAddUser = new Request('https://mt29k1jkde.execute-api.ap-southeast-2.amazonaws.com/production/deleteCompany', requestObj)
	  	fetch(requestForAddUser)
	  	.then(response => {
	  		return response.json()
	  	})
	  	.then((responseData) => {
	  		if (responseData.statusCode === 200) {
	  			let parseResponse = JSON.parse(responseData.body)
	  			alert(parseResponse.message)
	  			if (this.state.filterValue.length > 0)
	  				this.setState({filterValue: ''})

	  			let companyArray = this.state.companyArray;
	  			let index = this.state.companyArray.map(item => { return item.companyId; }).indexOf(this.state._companyId);
	  			companyArray.splice(index, 1);	  			
	  			this.setState({
	  				companyArray
	  			}, () => {
	  				this.deleteModalClose();
	  			})
	  		}
	  	})
	  	.catch((err) => {	  		
	  		alert(err.message + "\n" + "Please try again.")
	  		// localStorage.clear();
	  		// this.props.history.push('/');
	  	})
	}

	getHeaders = () => {
		return {
			'companyId': {
				'invisible': true
			},
			'companyName': {
				transform: (value, idx) => (
					<a href="javascript:void(0);"> { value } </a>
				)
			},
			'Action': {
				transform: (value, idx, row) => (
					<Icon name="trash" onClick={e => this.handleDeleteCompany(e, value, idx, row)} style={{color: 'red', cursor: 'pointer'}} />
				)
			}
		}
	}

	onRowClick = (event, { rowData, rowIndex, tableData }) => {
		event.preventDefault();		
		let paramObj = {
    		pathname: '/users',
    		state: {
    			'companyId': rowData.companyId,
    			'companyName': rowData.companyName,
    			'companyDetails': rowData
    		}
    	};
    	this.props.history.push(paramObj)	
	};

	handleFilterChange = ({ target: { name, value } }) => {
		this.setState({
		 [name]: value 
		})
	};

	render() {
		const headers = this.getHeaders();
		const { 
			company_modal_open, 
			company_modal_dimmer, 
			delete_modal_open, 
			delete_modal_dimmer } = this.state;
		return (
			<React.Fragment>
				<MenuBar history = { this.props.history } />
				<div className='ui grid'>
					<div className="row">
						<div className="column" style={{marginLeft: '0.25em'}}>
							<button 
								type='button' 
								className='ui positive button'
								onClick={this.companyModalOpen('blurring')}
								>
									Add Company
							</button>
							<div className={sematicUI.input} >
					            <input
					              type='text'
					              name='filterValue'
					              value={this.state.filterValue}
					              placeholder='Filter results...'
					              onChange={this.handleFilterChange}
					            />
					            <i className={sematicUI.searchIcon} />
					        </div>
						</div>
					</div>
					<div className="row">
						<div className="column">
						{
							this.state.listLoading ?
							<Loader active>Loading</Loader>
							:
							<CompanyTable
								companyList = { this.state.companyArray}
								className={sematicUI.table}
								headers={headers}
								rowClickHandler={this.onRowClick}
								filterValue={this.state.filterValue}
							/>
						}						
							
						</div>
					</div>
				</div>

				<CompanyModal
			        visible={company_modal_open}
			        dimmer={company_modal_dimmer}
			        open={company_modal_open}
			        onCloseHandler={this.companyModalClose}
			        stateObj={this.state.companyObj}
			        inputChangeHandler={this.handleCompanyInputChange}
			        btnState={this.state.btnLoading}
			        companyFormSubmitHandler={this.checkIfSameEmailExist}
			    />

			    <DeleteConfirmationModal
			    	visible={delete_modal_open}
			    	dimmer={delete_modal_dimmer}
			    	open={delete_modal_open}
			    	onCloseHandler={this.deleteModalClose}			    	
			    	btnState={this.state.deleteLoadingStatus}
			    	value={this.state._companyId}
			    	name={this.state._companyName}			    	
			    	isCompany={true}
			    	handleDelete={this.deleteCompany}
			    />

			</React.Fragment>
		);
	}
}

export default Companies;