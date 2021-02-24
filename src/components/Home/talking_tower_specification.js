import React, { Component } from 'react';
import MenuBar from '../MenuBar';
import { Grid, Card, Header, Divider, Form, Input, Icon, Checkbox, Loader, Select, Button } from 'semantic-ui-react';

import { setAWSConfiguration, getdeviceInstance, docClient, getFormatedDate, formateMessageBody, errorCodes } from '../../app/common';

import {Timeline, TimelineEvent} from 'react-event-timeline';
import SmartDataTable from 'react-smart-data-table';
import { sematicUI } from '../../app/constants';
import NumberFormat from 'react-number-format';

const stateList = [
	{key: 'open_10', text: 'Open 10%', value: '10'},
	{key: 'open_20', text: 'Open 20%', value: '20'},
	{key: 'open_40', text: 'Open 40%', value: '40'},
	{key: 'open_80', text: 'Open 80%', value: '80'},
	{key: 'open_100', text: 'Open 100%', value: '100'},
	{key: 'close_0', text: 'Close 0%', value: '0'},
	{key: 'custom', text: 'Custom', value: 'custom'}
];

class TalkingTowerSpecification extends Component {
	constructor(props) {
		super(props);	
		console.log(typeof(this.props.location.state.shadowState.deviceSpecific))	
		this.state = {			
			sensor_update_count: 0,
			timeLineData: [],
			disabledOpenCloseDeviceInput: this.props.location.state.shadowState.paired == "YES" ? true : false,
			open_device_on_threshold: typeof(this.props.location.state.shadowState.deviceSpecific) == 'string' ? JSON.parse(this.props.location.state.shadowState.deviceSpecific)['open'] : this.props.location.state.shadowState.deviceSpecific['open'],
			close_device_on_threshold: typeof(this.props.location.state.shadowState.deviceSpecific) == 'string' ? JSON.parse(this.props.location.state.shadowState.deviceSpecific)['close'] : this.props.location.state.shadowState.deviceSpecific['close'],
			timeLineLoader: true,
			alias: this.props.location.state.shadowState.alias,
			editLoader: false,
			deviceData: [],
			loading: true,
			pairedLoading: false,
			pairSequence: this.props.location.state.shadowState.pairedDevices != null ? JSON.parse(this.props.location.state.shadowState.pairedDevices) : [
				{device_id: '', gate_state: '', duration: ''}
			]
		}
		this._autowinchDevices = this.props.location.state.autowinchDevices || [];
		this._signalStrength = this.props.location.state.shadowState.deviceMode === "Stand-alone" ? 
		this.props.location.state.shadowState.catM1RSSI : this.props.location.state.shadowState.loraRSSI
		this._start_date = 0;
		this._end_date = 0;		
		this._deviceId = this.props.match.params.device_id;
		this._deviceInfo = [];				
		this._params = {
			TableName: 'Talking_tower_sensor_tracker',
			FilterExpression: 'deviceId = :device_id',
			ExpressionAttributeValues: {}
		}
		this._devicesForPairing = [];
		for (let i = 0; i < this._autowinchDevices.length; i++) {
			this._devicesForPairing.push({
				key: 'autowinch' + i,
				text: this._autowinchDevices[i]['deviceId'],
				value: this._autowinchDevices[i]['deviceId']
			})
		}
	}

	componentWillMount() {
		setAWSConfiguration();
		this.getSensorUpdateCount();
	}

	showTimeLine = () => {
		return this.state.timeLineData.map((data, index) => (
			<TimelineEvent
						key={index}						
                        createdAt={data.createdAt}

                        bubbleStyle={{backgroundColor: data.title == 'wet' ? '#AE8D70': '#c2b280', borderColor: data.title == 'wet' ? '#AE8D70': '#c2b280'}}
                        contentStyle={{color: '#fff', backgroundColor: data.title == 'wet' ? '#AE8D70': '#c2b280'}}
            >
            Sensor {data.title}
            </TimelineEvent>			
			))	
	}

	getSensorUpdateCount = () => {
		let dt = new Date();
		let midNightEpocTime = dt.setHours(0,0,0,0);
		let currentEpocTime = new Date().valueOf();
		let params = {
			TableName: 'Talking_tower_sensor_tracker',			
			FilterExpression: 'lastSeen BETWEEN :date1 and :date2 AND (deviceId = :device_id)',
			ExpressionAttributeValues: {							
				':device_id': this._deviceId,
				':date1': parseInt(midNightEpocTime),
				':date2': parseInt(currentEpocTime)
			},
			Select: 'COUNT'
		};

		docClient.scan(params, (error, data) => {
			console.log(data)
			this.setState({
				sensor_update_count: data.Count
			});
			this.getSensorUpdates();
		})
	}

	getSensorUpdates = () => {
		let params = {
			TableName: 'Talking_tower_sensor_tracker',
			FilterExpression: 'deviceId = :device_id',
			ExpressionAttributeValues: {
				':device_id': this._deviceId
			}
		};

		docClient.scan(params, (error, data) => {
			if (!error) {
				let timeLineData = [];
				let sortTimeLineData = data.Items.sort((obj1, obj2) => {
					return obj1.lastSeen - obj2.lastSeen;
				});

				let reverseMessageData = data.Items.sort((obj1, obj2) => {
					return obj2.lastSeen - obj1.lastSeen;
				});
				sortTimeLineData.forEach((sensorObj) => {
					timeLineData.push({
						title: sensorObj.sensor,
						createdAt: getFormatedDate(sensorObj.lastSeen)									
					})
				});
				this.setState({
					timeLineData
				})
				setTimeout(() => {
					var element = document.getElementById('threshold-alerts').childNodes[1];
					element.scrollTop = element.scrollHeight;
					this.prepareMessageBody(reverseMessageData);
				}, 1000);
			}
			this.setState({
				timeLineLoader: false
			}, () => {
				this.showErrorLogs();
			})			
		});
	}

	showErrorLogs = () => {
		let params = {
			TableName: 'ERR_LOGS',
			FilterExpression: 'deviceId = :device_id',
			ExpressionAttributeValues: {
				':device_id': this._deviceId
			}
		};
		docClient.scan(params, (err, data) => {
			let errorLogs = [];
			let sortedData = data.Items.sort((obj1, obj2) => {
				return obj2.lastSeen - obj1.lastSeen;
			})
			sortedData.forEach((dataItem) => {
				errorLogs.push({
					'errorTime': dataItem.errorTime,
					'errorStatus': dataItem.error,
					'errorDescription': errorCodes[parseInt(dataItem.error)],					
				})
			})
			this.setState({
				errorLogs
			})
		})
	}

	filterData = () => {
    	this._params['ExpressionAttributeValues'][':device_id'] = this._deviceId;
    	if (this._start_date > 0 && this._end_date > 0) {
    		if (this._start_date > this._end_date) {
    			alert("start date cannot be bigger than end date");
    			return false;
    		}
    		this._params['FilterExpression'] = "lastSeen BETWEEN :date1 and :date2 and deviceId = :device_id";
    		this._params['ExpressionAttributeValues'][":date1"] = this._start_date;
    		this._params['ExpressionAttributeValues'][":date2"] = this._end_date;    		
    	} else {
    		this._params['FilterExpression'] = "deviceId = :device_id";
    		delete this._params['ExpressionAttributeValues'][":date1"];
    		delete this._params['ExpressionAttributeValues'][":date2"];    		
    	}
    	this._deviceInfo = [];
    	this.setState({
    		deviceData: [],
    		loading: true
    	}, () => {
    		this.getDeviceShadowMessage(this._params);
    	})
    }

    getDeviceShadowMessage = (params) => {    	
    	docClient.scan(params, (err, data) => {    		
    		if (data.Items) {     			
    			this.prepareMessageBody(data.Items);
    		}    		    		
    	});
    }

    prepareMessageBody = (messageBodyData) => {
    	let messageBody;
		messageBodyData.forEach((deviceData, index) => {
			messageBody = deviceData['messageBody'] !== undefined ? deviceData['messageBody'] : ''
    		this._deviceInfo.push({	        			
    			'createdOn': getFormatedDate(deviceData.createdOn),
    			'deviceInfo': deviceData.deviceInfo,
    			'batt': deviceData.batteryInfo,
    			'signalStrength': deviceData.rssi,				
				'messageBody': formateMessageBody(messageBody),
			})
        })
        this.setState({
			deviceData: this._deviceInfo,
			loading: false
		})
    }

    filterInputChangeHandler = (event, data) => {    	
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

	toggleEditPairingDevice = () => {
		getdeviceInstance().then((deviceInstance) => {
			let pairedInput = !this.state.disabledOpenCloseDeviceInput;
			let device_id = this.props.match.params.device_id;
			deviceInstance.publish('$aws/things/' + device_id + '/shadow/update', JSON.stringify({
				state: {
      				reported: {      														         
				        ['paired']: pairedInput ? "YES" : "NO"
				    }
				}				
				
			}))
			this.setState({
				disabledOpenCloseDeviceInput: !this.state.disabledOpenCloseDeviceInput
			})
		})		
	}

	inputChangeHandler = (event, data) => {
		this.setState({
			[data.name] : data.value
		})	
	}

	editOpenCloseValues = (event) => {
		this.setState({
			pairedLoading: true
		})
		this.configurePairedDeviceWithAutowinch();
		/*getdeviceInstance().then((deviceInstance) => {
			let device_id = this.props.match.params.device_id;
			deviceInstance.publish('$aws/things/' + device_id + '/shadow/update', JSON.stringify({
				state: {
      				reported: {
						"deviceSpecific": {				          
				          "open": this.state.open_device_on_threshold,
				          "close": this.state.close_device_on_threshold
				        }
				    }
				}
			}))			
			alert('Device paired successfully');			
		})*/
	}

	configurePairedDeviceWithAutowinch = () => {
		// let pairedDevices = [this.state.open_device_on_threshold, this.state.close_device_on_threshold];
		let params = {
			TableName: 'SMSGateway_Device',
			Key: {
				deviceId: this.props.match.params.device_id
			},
			UpdateExpression: 'set pairedDevices = :paired_devices',
			ExpressionAttributeValues: {						
				':paired_devices': JSON.stringify(this.state.pairSequence)
			}
		};
		docClient.update(params, (err, data) => {
			if (!err) {
				alert('Autowinch devices paired successfully');
				this.setState({
					pairedLoading: false
				})
			}
		})
	}

	editAlias = () => {
		this.setState({
			editLoader: true
		})
		let params = {
			TableName: 'SMSGateway_Device',
			Key: {
				deviceId: this.props.match.params.device_id
			},
			UpdateExpression: 'set deviceTag = :alias',
			ExpressionAttributeValues: {
				':alias': this.state.alias
			}
		};
		docClient.update(params, (err, data) => {
			if (!err) {
				alert('Updated Successfully');
				this.setState({
					editLoader: false
				})
			}
		});
	}

	incrementPairOption = () => {
		let pairSequence = this.state.pairSequence;    	
    	pairSequence.push({
    		device_id: '',
    		state: '',
    		duration: ''
    	})
    	this.setState({
    		pairSequence
    	})
	}

	decrementPairOption = (index) => {
		let pairSequence = this.state.pairSequence;    	
    	pairSequence.splice(index, 1);
    	this.setState({
    		pairSequence
    	})
	}

	pairingInputHandler = (event, data) => {					
		let pairSequence = this.state.pairSequence;		
		let index = data.id.split('_')[1];		
		pairSequence[index][data.name] = data.value;
		this.setState({
			pairSequence
		})
	}

	numberInputHandler = ({formattedValue, value}, index) => {
		if (formattedValue.search('m') === -1) {
			console.log(formattedValue)
			let pairSequence = this.state.pairSequence;				
			pairSequence[index]['duration'] = formattedValue;
			this.setState({
				pairSequence
			})
		}
	}

	render() {
		const { device_id } = this.props.match.params;
		const { mac, deviceType, deviceMode, batt } = this.props.location.state.shadowState;
		return (
			<React.Fragment>
				<MenuBar history = { this.props.history } />
				<div className="ui container" >					
					<Grid>
					 	<Grid.Row>
					 		<Grid.Column width={7}>
		    				<Card style={{width: '100%'}}>
								<Card.Content extra>
									<div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center'}}>
										<div style={{width: '100px',
										    height: '100px',
										    borderRadius: '50%',
										    border: '1px solid',
										    textAlign: 'center',
										    display: 'flex',
										    justifyContent: 'center',
										    alignItems: 'center'
										}}>{ deviceType }</div>
										<div>
											<Header as='h2'>{this.props.match.params.device_id}</Header>
											<Card.Meta>{ mac }</Card.Meta>
										</div>
										<Form>
										<label>Alias</label>
											<Icon
										name='check circle'
										disabled={!this.state.alias}
										loading={this.state.editLoader}
										style={{cursor: !this.state.alias ? 'not-allowed' : 'pointer', fontSize: '1.3em', float: 'right'}}
										onClick={() => !this.state.alias ? null : this.editAlias()}
						        		/>
						       				<Form.Field						        
									        control={Input}													        
									        value={this.state.alias}
									        name="alias"
									        onChange={this.inputChangeHandler}
									      	/>
									      	<Form.Field						        
									        control={Input}
									        label='Device Mode'
									        value={deviceMode}
									        readOnly={true}									        
									      	/>
									    </Form>
								    </div>
								</Card.Content>
							</Card>
    						</Grid.Column>
					 		<Grid.Column width={3}>
					 			<Card>
									<Card.Content>
										<Card.Header>
											Sensor Updates					        		
							        	</Card.Header>				       
						      		</Card.Content>
						       		<Card.Content extra style={{textAlign: 'center', paddingTop: '17px', paddingBottom: '17px'}}>
							       		<Header as="h2">{this.state.sensor_update_count} Times/day</Header>
						       		</Card.Content>
			    				</Card>
			    			</Grid.Column>
			    			<Grid.Column className="battery-container" width={3}>
			    				<div className="battery">
			    					<div className="battery-level" style={{height: batt + '%', background: batt > 50 ? '#30b455' : batt >= 30 && batt <= 50 ? '#FFFF00' : '#FF0000'}}>
			    					</div>
			    				</div>
			    				<div>
			    					{batt + "%"}
			    				</div>
			    			</Grid.Column>
			    			<Grid.Column className="signal-strength" width={3}>
			    				<Card>
									<Card.Content>
										<Card.Header>
											Signal Strength
							        	</Card.Header>
							       	</Card.Content>
							       	<Card.Content extra style={{ textAlign: 'center'}}>
							       		<Icon name="signal" style={{ fontSize: '2em', marginRight: '10px', 
							       		color: this._signalStrength >= 20 && this._signalStrength <= 30 ? '#3FAE49' : this._signalStrength >= 10 ? '#FFFF00' : '#FF0000'}} />
							       		{ this._signalStrength }
							       	</Card.Content>
							    </Card>
			    			</Grid.Column>
			    		</Grid.Row>

			    		<Grid.Row>
			    			<Grid.Column width={12}>
								<Card style={{width: '100%'}}>
									<Card.Content>
										<Card.Header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center'}}>
											Paired Device
											<Checkbox slider
											onChange={this.toggleEditPairingDevice}
											checked={this.state.disabledOpenCloseDeviceInput}										
											 />											
							        		 <Button
												positive
												content="Apply"
												disabled={!this.state.disabledOpenCloseDeviceInput}
												style={{cursor: !this.state.disabledOpenCloseDeviceInput ? 'not-allowed' : 'pointer'}}
												onClick={() => !this.state.disabledOpenCloseDeviceInput ? null : this.editOpenCloseValues()}
												loading={this.state.pairedLoading}
											/>
							        	</Card.Header>				       
						      		</Card.Content>
						       		<Card.Content extra>
							       		<Form>
							       			{this.state.pairSequence.map((item, index) => (
							       				<Form.Group style={{ alignItems: 'center'}} key={index}>
							       				
							       					<Form.Field
												        control={Select}
												        options={this._devicesForPairing}
												        label={{ children: 'Device Id', htmlFor: 'device_id_' + index }}
												        placeholder='deviceId'
												        search
												        searchInput={{ id: 'device_id_' + index }}
												        name="device_id"
												        id={'deviceid_' + index}
												        value={this.state.pairSequence[index]['device_id']}
												        onChange={this.pairingInputHandler}
												      />
							       					<Form.Field
												        control={Select}
												        options={stateList}
												        label={{ children: 'State', htmlFor: 'gate_state_' + index }}
												        placeholder='State'
												        search
												        searchInput={{ id: 'gate_state_' + index }}
												        name="gate_state"
												        id={'gatestate_' + index}
												        value={this.state.pairSequence[index]['gate_state']}
												        onChange={this.pairingInputHandler}
												      />
												      {
												      	this.state.pairSequence[index]['gate_state'] === 'custom' && 
												      	<Form.Field												       
												        control={Input}
												        label={{ children: 'Set Gate Percent', htmlFor: "custom_" + index }}
												        placeholder='Gate Percent'
												        name='custom'
												        id={"custom_" + index}
												        value={this.state.pairSequence[index]['custom']}
												        onChange={this.pairingInputHandler}
												        />
												      }	
												      <div class="field">
												        <label>Duration</label>
												        <NumberFormat 
												        name='duration' 
												        placeholder="dd:hh:mm" 
												        format="##:##:##" 
												        mask={['d', 'd', 'h', 'h', 'm', 'm']}
												        value={this.state.pairSequence[index]['duration']}
												        onValueChange={(value) => this.numberInputHandler(value, index)}
												        />
												      </div>
												      <Icon name="plus" style={{cursor: 'pointer', marginLeft: '20px'}} onClick={this.incrementPairOption}/>
												      { index >= 1 && <Icon name="minus" style={{cursor: 'pointer', marginLeft: '20px'}} onClick={() => { this.decrementPairOption(index) }}/> }
							       				</Form.Group>
							       			))}						       											    	
									    </Form>
						       		</Card.Content>
				    			</Card>
	    					</Grid.Column>
	    					<Grid.Column width={4} id='threshold-alerts'>
				    			{this.state.timeLineLoader ?
				    				<Loader active>Loading</Loader>
				    				:				    								    			
				    				<React.Fragment>
				    				<Header as="h3"> Sensor Updates </Header>
				    				<Timeline id="timeline-container">
				    					{this.showTimeLine()}
				    				</Timeline>
				    				</React.Fragment>				    								    			
				    			}			    								    				
			    			</Grid.Column>
			    		</Grid.Row>

			    	</Grid>

			    	<Grid>
			    		<Grid.Row>
			    			<Grid.Column>
			    				<Form>
								    <Form.Group widths="4">
								    	<div className="field">
								    		<label>Start Date</label>
									      	<div className="ui input">					      		
									      		<input 
												    type='date'
												    name='start_date'
												    id="start_date"								    
												    onChange={this.filterInputChangeHandler}						    
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
												    onChange={this.filterInputChangeHandler}					    
												    />
									      	</div>
									    </div>								      
								      <div className="field" style={{alignSelf: 'flex-end'}} >				      	
								      	<Button
										positive
										content="Search"
										onClick={this.filterData}				
										/>
								      </div>
								    </Form.Group>				    
								</Form>
			    			</Grid.Column>
			    		</Grid.Row>
			    		<Grid.Row>
			    			<Grid.Column>
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
			    			</Grid.Column>
			    		</Grid.Row>
			    		<Grid.Row>
			    			<Grid.Column>
			    				<SmartDataTable
									data={this.state.errorLogs}
									name='error-logs'
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
			    			</Grid.Column>
			    		</Grid.Row>
			    	</Grid>

			    </div>
			</React.Fragment>
		)
	}
}

export default TalkingTowerSpecification;