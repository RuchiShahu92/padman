import React, { Component } from 'react';
import MenuBar from '../MenuBar';
import { Form, Select, Button, Input } from 'semantic-ui-react';

import {
    setAWSConfiguration,
    docClient,
    setIOTConfiguration,
    getdeviceInstance
} from '../../app/common';

class DeviceConfiguration extends Component {
	constructor(props) {
		super(props);
		this.state = {
			firmware_version: '',
			deviceOptions: [],
			deviceLoading: true,
			device_ids: [],
			publishLoading: false
		}
	}

	componentWillMount() {
		setAWSConfiguration();
	}

	componentDidMount() {	
		this.fetchDevices();
	}

	fetchDevices = () => {		
		let params = {
			TableName: 'SMSGateway_Device',
			FilterExpression: 'version = :version',
			ExpressionAttributeValues: {
				':version': 'iot'
			}
		};
		docClient.scan(params, (err, data) => {
			if (!err) {
				let deviceOptions = this.state.deviceOptions;
				data.Items.forEach((dataItem) => {
					deviceOptions.push({
						text: dataItem.deviceId,
						value: dataItem.deviceId
					})
				});
				this.setState({
					deviceOptions,
					deviceLoading: false
				})
			}
		})
	}

	inputChangeHandler = (event, data) => {
		let name = data ? data.name : event.target.name;
		let value = data ? data.value : event.target.value;
		this.setState({
			[name]: value
		})
	}

	publishToShadow = () => {
		this.setState({
			publishLoading: true
		});
		var publishCount = 0;				
		getdeviceInstance().then((deviceInstance) => {
			this.state.device_ids.forEach((deviceId) => {
				deviceInstance.publish('$aws/things/' + deviceId + '/shadow/update', JSON.stringify({
	                state: {
	                    desired: {
	                        "FW": this.state.firmware_version
	                    }
	                }
	            }));
			});
			this.setState({
				publishLoading: false
			}, () => {
				alert('Successfully Published');
			})
		});		
	}
	render() {
		return (
			<React.Fragment>
				<MenuBar history = { this.props.history } />
				<div className="ui container">
					<Form>
						<Form.Group>
							<Form.Field>
								<label>
									Select Device
								</label>
								<Select
								options={this.state.deviceOptions}
                    			placeholder='Select Device'
                    			search
                    			multiple
                    			searchInput={{id: 'device_id'}}                    			
                    			name="device_ids"                    			
                    			onChange={this.inputChangeHandler}
                    			loading={this.state.deviceLoading}
                    			/>
                    		</Form.Field>

							<Form.Field
				                id='firmware_version'
				                control={Input}
				                label='Firmware Version*'
				                placeholder='Firmware Version e.g., 2.3'
				                name='firmware_version'
				                value={this.state.firmware_version}
				                onChange={this.inputChangeHandler}
				                maxLength="4"
				            />

				            <div className="field" style={{display: 'flex', alignItems: 'flex-end'}} >
						      	<Button
								positive
								content="Publish To Shadow"
								loading={this.state.publishLoading}
								onClick={this.publishToShadow}				
								/>
					      </div>
						</Form.Group>
					</Form>
				</div>
			</React.Fragment>
		);
	}
}

export default DeviceConfiguration;