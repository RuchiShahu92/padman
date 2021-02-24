import React, { Component } from 'react';
import MenuBar from '../MenuBar';
import { setAWSConfiguration, docClient, getFormatedDate, formateMessageBody } from '../../app/common';
import { sematicUI,
  toggleColumnItems,
  deviceTypeOptions,
  headers,
  filterDeviceTypeOptions,
  filterOperatorWiseOption,
  getPaths,
  versionOptions
} from '../../app/constants';

import SmartDataTable from 'react-smart-data-table';
import { Form, Input, Select, Button, Loader } from 'semantic-ui-react';
import ReactExport from "react-data-export";

const ExcelFile = ReactExport.ExcelFile;
const ExcelSheet = ReactExport.ExcelFile.ExcelSheet;
const ExcelColumn = ReactExport.ExcelFile.ExcelColumn;

const options = [
	{key: 'a', text: 'All', value: 'all'},
	{key: 'r', text: 'Received', value: 'received'},
	{key: 's', text: 'Sent', value: 'sent'}
];

class LegacyDevice extends Component {
	constructor(props) {
		super(props);

		this.state = {
			deviceData: [],
			loading: true
		}

		this._start_date = 0;
		this._end_date = 0;
		this._message_type = 'received';
		this._deviceId = this.props.match.params.id;
		this._deviceInfo = [];		
		this._params = {
			'KeyConditionExpression': "deviceId = :device_id",
			'ExpressionAttributeValues': {}
		};
		this._typeConfig = {
			'tableName': {
				'sent': 'SMS_Gateway_Device_Request',
				'received': 'SMSGateway_Message'
			},
			'indexName': {
				'sent': 'deviceId-createdOn-device-reques-tindex',
				'received': 'deviceId-index'
			}
		}
	}

	componentWillMount() {
		setAWSConfiguration();		
	}

	componentDidMount() {		
		this.filterData();
	}

	filterData = () => {
    	this._params['TableName'] = this._typeConfig['tableName'][this._message_type];
    	this._params['IndexName'] = this._typeConfig['indexName'][this._message_type];
    	this._params['ExpressionAttributeValues'][':device_id'] = this._deviceId;

    	if (this._start_date > 0 && this._end_date > 0) {
    		if (this._start_date > this._end_date) {
    			alert("start date cannot be bigger than end date");
    			return false;
    		}
    		this._params['FilterExpression'] = "createdOn BETWEEN :date1 and :date2";
    		this._params['ExpressionAttributeValues'][":date1"] = this._start_date;
    		this._params['ExpressionAttributeValues'][":date2"] = this._end_date;
    	} else {
    		delete this._params['FilterExpression'];
    		delete this._params['ExpressionAttributeValues'][":date1"];
    		delete this._params['ExpressionAttributeValues'][":date2"];
    	}
    	this._deviceInfo = [];
    	this.setState({
    		deviceData: [],
    		loading: true
    	})
    	if (this._message_type === "all") {
    		this.getDevices();
    	} else {    		
    		this.getDeviceInfo(this._params);
    	}
    	
    }

    getDevices = () => {
		this._smsParams = {
	        TableName : "SMSGateway_Message",
	        IndexName: 'deviceId-index',
	        KeyConditionExpression: "deviceId = :device_id",
	        ExpressionAttributeValues: {
	            ":device_id": this._deviceId
	        }
    	};

    	if (this._start_date > 0 && this._end_date > 0) {
    		this._smsParams['FilterExpression'] = "createdOn BETWEEN :date1 and :date2";
    		this._smsParams['ExpressionAttributeValues'][":date1"] = this._start_date;
    		this._smsParams['ExpressionAttributeValues'][":date2"] = this._end_date;
    	}
    	docClient.query(this._smsParams, (err, data) => {
	        if (!err) {	      	
				this.getMessages(data.Items);
	        }
	    });
	}

	getMessages = (deviceInfo) => {    	
		this._messageParams = {
	        TableName : "SMS_Gateway_Device_Request",
	        IndexName: 'deviceId-createdOn-device-reques-tindex',
	        KeyConditionExpression: "deviceId = :device_id",
	        ExpressionAttributeValues: {
	            ":device_id": this._deviceId
	        }
    	};

    	if (this._start_date > 0 && this._end_date > 0) {
    		this._messageParams['FilterExpression'] = "createdOn BETWEEN :date1 and :date2";
    		this._messageParams['ExpressionAttributeValues'][":date1"] = this._start_date;
    		this._messageParams['ExpressionAttributeValues'][":date2"] = this._end_date;
    	}

    	docClient.query(this._messageParams, (err, data) => {
	        if (!err) {
	        	console.log(data)
	        	data.Items.forEach((deviceData, index) => {
	        		if (deviceInfo[index] === undefined) {
	        			return false;
	        		}
	        		let messageBody = deviceInfo[index]['messageBody'] !== undefined ? (' ' + deviceInfo[index]['messageBody']) : ''
	        		if (index % 2 === 0) {
	        			this._deviceInfo.push({	        			
		        			'createdOn': getFormatedDate(deviceInfo[index].createdOn),	    				
		    				'messageBody': formateMessageBody(messageBody)
    					})
	        		} else {
	        			this._deviceInfo.push({	        			
		        			'createdOn': getFormatedDate(deviceData.createdOn),	    				
		    				'messageBody': formateMessageBody(deviceData.messageBody)
	    				})
	        		}	        		
	        	})        		

				this.setState({
					deviceData: this._deviceInfo,
					loading: false
				})
	        }
	    });

    }

    getDeviceInfo = (params) => {
    	docClient.query(params, (err, data) => {
    		if (data.Items) {     			
    		let messageBody;
    			data.Items.forEach((deviceData, index) => {
    				messageBody = deviceData['messageBody'] !== undefined ? deviceData['messageBody'] : ''
	        		this._deviceInfo.push({	        			
	        			'createdOn': getFormatedDate(deviceData.createdOn),	    				
	    				'messageBody': formateMessageBody(messageBody)
					})
		        })
    		}
    		
    		this.setState({
    			deviceData: this._deviceInfo,
    			loading: false
    		})
    	});
    }

    inputChangeHandler = (event, data) => {    	
    	let name = data ? data.name : event.target.name;
    	let type = data ? data.type : event.target.type;
    	let value = data ? data.value : event.target.value;
    	if (value) { 
	    	this['_' + name] = (type === "date" ? new Date(value).valueOf()
	    		: value);
	    	if (this._end_date !== 0 && name === 'end_date') {
	    		var dt = new Date(value)    		
	    		this._end_date = dt.setDate(dt.getDate() + 1);
	    	}
	    } else {
    		this._start_date = 0;
    		this._end_date = 0;
    	}    	
    }

    xlsxButton = () => (<Button positive disabled={this.state.deviceData.length === 0} style={{ float: 'right'}}>Export To Excel</Button>)

    render() {
    	const file_name = this._deviceId + "-" + this._message_type + "-messages-Report"
    	return (
    		<React.Fragment>
				<MenuBar history = { this.props.history } />						
				<div className="ui container">
					<Form>
				    <Form.Group widths="4">
				    	<div className="field">
				    		<label>Start Date</label>
					      	<div className="ui input">					      		
					      		<input 
								    type='date'
								    name='start_date'
								    id="start_date"								    
								    onChange={this.inputChangeHandler}						    
								    />
					      	</div>
					    </div>
					    <div className="field">
					    	<label>End Date</label>
					      	<div className="ui input">
					      		<input 
								    type='date'
								    name='end_date'
								    id="end_date"
								    onChange={this.inputChangeHandler}					    
								    />
					      	</div>
					    </div>
				      <Form.Field
				        control={Select}
				        options={options}
				        label="Message Type"				        
				        placeholder='Message Type'
				        search				        			        
				        name="message_type"
				        onChange={this.inputChangeHandler}
				        type="select"
				        defaultValue="received"
				      />
				      <div className="field" style={{alignSelf: 'flex-end'}} >
				      	<ExcelFile element={this.xlsxButton()} filename={file_name}>
							<ExcelSheet data={this.state.deviceData} name="Device Information">
								<ExcelColumn label="Date" value="createdOn"/>
								<ExcelColumn label="Messages" value="messageBody"/>	
							</ExcelSheet>
                		</ExcelFile>
				      	<Button
						positive
						content="Search"
						onClick={this.filterData}				
						/>
				      </div>
				    </Form.Group>				    
				</Form>
				{
					this.state.loading ?
					<Loader active>Loading</Loader>
					:
					<SmartDataTable
					data={this.state.deviceData}
					name='device-report-table'
					className={sematicUI.table}					
					sortable
					dynamic
					emptyTable={(
				        <div className={sematicUI.message}>
				          No data found.
				        </div>
				      )}
					perPage={10}
					/>
				}
				</div>
			</React.Fragment>
    	);
    }
}

export default LegacyDevice;