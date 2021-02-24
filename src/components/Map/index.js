import React, { Component } from 'react';
import { Form, Select, Button } from 'semantic-ui-react';
import MenuBar from '../MenuBar';
import { setAWSConfiguration, docClient, setIOTConfiguration } from '../../app/common';
import { deviceTypeOptions, getPaths } from '../../app/constants';
import MapComponent from './map_component';

const polyLineArray = [
	{lat: 19.076090, lng: 72.877426},
	{lat: 23.033863, lng: 72.585022},
	{lat: 12.715035, lng: 77.281296},
];

const deviceTypes = [
	{key: 'all', text: 'All', value: 'all'},
	...deviceTypeOptions
];

class DevicesOnMap extends Component {
	constructor(props) {
		super(props);
		this.state = {
			openMarkfer: false,
			filterObj: {
				device_type: 'all'
			},
			deviceList: [],
			mapLoading: false,
			defaultCenter: {}
		}
		this._companyListForFilter = [];		
	}

	componentWillMount() {
		setAWSConfiguration();
		this._iotData = setIOTConfiguration();
	}

	componentDidMount() {
		let params = {
			TableName: 'SMSGateway_Company'
		};
		this._companyListForFilter.push({
			'key': 'all',
			'text': 'All',
			'value': 'all'
		})
		docClient.scan(params, (err, data) => {
	    	if (!err) {
	    		data.Items.forEach((dataResponse) => {
	    			this._companyListForFilter.push({
						'key': dataResponse.companyName,
						'text': dataResponse.companyName,
						'value': dataResponse.companyId
					})
				})
			}
		});
	}

	getDevices = (company_id, device_type) => {
		this.setState({
			mapLoading: true
		})
		let params = {
            TableName: 'SMSGateway_Device',
            FilterExpression: 'not (deviceType IN (:device_type1, :device_type2, :device_type3))',
            ExpressionAttributeValues: {
            	':device_type1': 'AW',
            	':device_type2': 'CB',
            	':device_type3': 'EDT'
            }
        };
        if (company_id === 'all' && device_type !== 'all') {
        	params['FilterExpression'] = 'deviceType = :device_type';
	        params['ExpressionAttributeValues'] = {
	        	':device_type': device_type
	        }
        }
        if (company_id !== 'all' && device_type === 'all') {        
	        params['FilterExpression'] = 'companyId = :company_id';
	        params['ExpressionAttributeValues'] = {
	        	':company_id': company_id
	        }
	    }
        if (company_id !== 'all' && device_type !== 'all') {
        	params['FilterExpression'] = 'companyId = :company_id AND deviceType = :device_type';
        	params['ExpressionAttributeValues'] = {
        		':company_id': company_id,
        		':device_type': device_type
        	}
        }        

        docClient.scan(params, (err, data) => {
        	if (!err) {
        		let deviceList = [];
        		let params = {};
        		let counter = 0;        		
        		 data.Items.forEach((dataItem) => {
        		 	params['thingName'] =  dataItem.deviceId;
        		 	this.getShadowData(params).then(shadowData => {
        		 		counter++;        		 		
        		 		if (shadowData && shadowData.state.reported.lat != "0.000000") {
        		 			deviceList.push({
		        		 		deviceId: dataItem.deviceId,
		        		 		deviceType: dataItem.deviceId.replace(/\d/g, ''),
		        		 		lat: shadowData.state.reported.lat,
		        		 		lng: shadowData.state.reported.lon,
		        		 		batt: shadowData.state.reported.batt,
		        		 		rssi: shadowData.state.reported.deviceMode === "Stand-alone" ? shadowData.state.reported.catM1RSSI : shadowData.state.reported.loraRSSI,
		        		 		messageBody: shadowData.state.reported
		        		 	})
        		 		}        		 	
        		 		if (data.Items.length === counter) {        		 			
        		 			let defaultCenter = {
        		 				lat: parseFloat(deviceList[0].lat) || -26.594479,
        		 				lng: parseFloat(deviceList[0].lng) || 153.011551
        		 			}
        		 			this.setState({
        		 				deviceList,
        		 				defaultCenter,
        		 				mapLoading: false
        		 			})
        		 		}
        		 	})
        		 })        		 
        	}
        });
	}

	getShadowData = (params) => {
		return new Promise((resolve, reject) => {
			this._iotData.getThingShadow(params, (err, data) => {
				try {
					if (!err) {					
						resolve(JSON.parse(data.payload))
					} else {
						//reject(err)
						resolve(null);
					}
				} catch(exception) {
					console.log(exception)
				}
			});
		})
	}

	showSpecificDevices = () => {

	}

	handleToggle = () => {
		this.setState({
			openMarker: !this.state.openMarker
		})
	}

	inputChangeHandler = (event, data) => {
		let name = data.name;
		let value = data.value;
		let filterObj = this.state.filterObj;
		filterObj[name] = value;
		this.setState({
			filterObj
		});
	}

	showDevices = () => {
		const { company_name, device_type } = this.state.filterObj;
		this.getDevices(company_name, device_type);
	}

	rediretToSpecificationPage = (deviceId, messageBody) => {
		let params = {
	      state: {}
	    }
	    params['pathname'] = getPaths[deviceId.substring(0,2)] + deviceId;
	    params['state']['shadowState'] = messageBody;	   
	    this.props.history.push(params);
	}

	render() {
		return (
			<React.Fragment>
				<MenuBar history = { this.props.history } />
				<div className="ui container">
					<Form>
					    <Form.Group>
					    	<Form.Field
					        control={Select}
					        options={this._companyListForFilter}
					        label="Select Company"
					        placeholder='Select Company'
					        search				        			        
					        name="company_name"
					        onChange={this.inputChangeHandler}
					        type="select"				        
					      />
					      <Form.Field
					        control={Select}
					        options={deviceTypes}
					        label="Select Device Type"
					        placeholder='Select Device Type'
					        search				        			        
					        name="device_type"
					        onChange={this.inputChangeHandler}
					        type="select"
					        defaultValue="all"				        
					      />
					      <div className="field" style={{display: 'flex', alignItems: 'flex-end'}} >
					      	<Button
							positive
							content="Show Devices"
							loading={this.state.mapLoading}
							onClick={this.showDevices}				
							/>
					      </div>
					    </Form.Group>
					</Form>
				</div>
				{
					this.state.deviceList.length > 0 && 
					<MapComponent 
					 googleMapURL="https://maps.googleapis.com/maps/api/js?key=AIzaSyCaGSYPRULIF0jNb--v7xnzO86bjTxWQkE&v=3.exp&libraries=geometry,drawing,places"
					 loadingElement={<div style={{ height: `100%` }} />}
					 containerElement={<div style={{ height: `100vh` }} />}
					 mapElement={<div style={{ height: `100%` }} />}
					 data={this.state.deviceList}					 
					 handleToggle={this.handleToggle}
					 openMarker = { this.state.openMarker }	
					 defaultCenter={this.state.defaultCenter}
					 rediretToSpecificationPage = {this.rediretToSpecificationPage}
					  />
				}				
			</React.Fragment>
		);
	}
}

export default DevicesOnMap;