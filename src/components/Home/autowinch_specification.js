import React, { Component } from 'react';
import MenuBar from '../MenuBar';
import { setAWSConfiguration, setIOTConfiguration, errorCodes, docClient, getFormatedDate, formateMessageBody, getActualFormatDate } from '../../app/common';
import { Form, Input, Button, Label, Icon, Header, Select, Divider, Loader, Grid, Card } from 'semantic-ui-react';
import { sematicUI } from '../../app/constants';
import SmartDataTable from 'react-smart-data-table';
import { DateTimeInput } from 'semantic-ui-calendar-react';
import AutoWinchTable from '../Tables/autowinch_table';
import NumberFormat from 'react-number-format';
import PendingCommandsTable from '../Tables/autowinch_pendingcommand_table';
import * as moment from "moment";

const headers = {
	'commandStatus': {
		transform: (value, idx) => (
			<Icon name="check circle" style={value ? {color: 'green'} : {color: 'red'}} />
		)
	},
	'timestamp': {		
		transform: (value, idx) => (
			<p><span style={{display: 'none'}}>{value}</span><span>{moment(value).format("DD/MM/YYYY H:mm")}</span></p>
		)
	}
}

const messageTableHeaders = {
	'createdOn': {
		transform: (value, idx) => {			
			return (
			<p><span style={{display: 'none'}}>{value}</span><span>{moment(value).format("DD/MM/YYYY H:mm")}</span></p>
			)
		}				
	},
	'lastSeen': {
		invisible: true
	}
}

const deviceStateOption = [
	{key: 'all', text: 'All', value: 'all'},
	{key: 'desired', text: 'Desired', value: 'desired'},
	{key: 'reported', text: 'Reported', value: 'reported'},
]

class AutowinchSpecification extends Component {
	constructor(props) {
		super(props);
		this.state = {
			commandObj: {},
			commandStack: [],
			pendingCommands: [],
			loader: false,
			deviceData: [],
			commandStackLoader: true,
			alias: this.props.location.state.alias,
			errorLogs: []
		};

		this._deviceId =  this.props.match.params.device_id;		
		this._pendingCommands = [];
		this._scheduledCommands = [];
		this._batt = '';
		this._mac = '';
		this._deviceMode = '';
		this._commands = [];		
	}

	componentWillMount() {
		setAWSConfiguration();
		this._iotData = setIOTConfiguration();
	}

	componentDidMount() {		
		this.getPendingCommands();		
	}

	getPendingCommands = () => {
		let params = {
			thingName: this._deviceId
		}

		this._iotData.getThingShadow(params, (err, data) => {
			if (!err) {
				let parsedDataPayload = JSON.parse(data.payload);
				this._batt = parsedDataPayload['state']['reported']['batt'];
				this._mac = parsedDataPayload['state']['reported']['mac'];
				this._deviceMode = parsedDataPayload['state']['reported']['deviceMode'];
				this._deviceType = parsedDataPayload['state']['reported']['deviceType'];
				try {
					//var deviceSpecific = parsedDataPayload['state']['desired']['deviceSpecific'] || [];
				} catch(exception) {
					console.log(exception);
					this.setState({
						commandStackLoader: false
					})
					return false;
				}				
				//let commands = deviceSpecific['commands'] || [];
				let commands = parsedDataPayload['state']['reported']['deviceSpecific']['deviceCommands'] || [];
				this._commands = commands;
				for (let i = 0; i < commands.length; i++) {
					this._pendingCommands.push({
						'timestamp': moment(commands[i][7] + "-" + commands[i][6] + "-" + commands[i][5] + " " + commands[i][2] + ":" + commands[i][3] + ":" + commands[i][4]).format("DD/MM/YYYY H:mm"),
						'duration': commands[i][1] + " Minutes",
						'gatePercentage': commands[i][0] + "%",
						//'commandStatus': false
					})
				}
				this.setState({
					pendingCommands : this._pendingCommands
				})
				this.getScheduledCommands();
			} else {
				this.setState({
					commandStackLoader: false
				})
			}
		});
	}

	getScheduledCommands = () => {
		let params = {
			TableName: 'autowinch_command_stack_tracker',
			FilterExpression: 'deviceId = :device_id',
			ExpressionAttributeValues: {							
				':device_id': this._deviceId
			}
		};

		docClient.scan(params, (err, data) => {
			if (!err) {
				let deviceMessageList = [];
				data.Items.forEach((dataItem, i) => {
					let messageBody;					
					this._scheduledCommands.push({
						'timestamp': dataItem['timestamp'], // getFormatedDate(dataItem['timestamp'])
						'duration': dataItem['duration'],
						'gatePercentage': dataItem['percent'] + "%",
						'commandStatus': true
					})
					messageBody = dataItem['messageBody'] !== undefined ? dataItem['messageBody'] : ''					
					deviceMessageList.push({
	        			'createdOn': dataItem.lastSeen,
	        			'gatePercent': dataItem.deviceInfo,
	        			'batt': dataItem.batteryInfo,
	        			'signalStrength': dataItem.rssi,						
	    				'messageBody': formateMessageBody(messageBody),
	    				'lastSeen': dataItem.lastSeen,

					})
				})
				deviceMessageList.sort((obj1, obj2) => {
					return obj2.lastSeen - obj1.lastSeen;
				});
				this.setState({
					commandStack: this._scheduledCommands,
					commandStackLoader: false,
					deviceData: deviceMessageList
				}, () => {
					this.showErrorLogs();
				})
			}
			else {
				this.setState({
					commandStackLoader: false
				})
			}
		})
		
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

	inputChangeHandler = (event, data) => {		
		let commandObj = this.state.commandObj;
		commandObj[data.name] = data.value;
		if (data.name == "timestamp") {			
			commandObj['epoch_timestamp'] = new Date(data.value).valueOf();
		}
		this.setState({
			commandObj
		})
	}

	numberInputHandler = ({formattedValue, value}) => {
		if (formattedValue.search('m') === -1) {			
			let commandObj = this.state.commandObj;				
			commandObj['duration'] = formattedValue;
			this.setState({
				commandObj
			})
		}
	}

	aliasChangeHandler = (event, data) => {
		this.setState({
			[data.name]: data.value
		})		
	}

	setCommand = () => {
		this.setState({
			loader: true
		});

		var dt = new Date(this.state.commandObj.epoch_timestamp);
		let daysToMinute = parseInt(this.state.commandObj.duration.split(':')[0]);
	  	let hoursToMinute = parseInt(this.state.commandObj.duration.split(':')[1]);
	  	let minutes = parseInt(this.state.commandObj.duration.split(':')[2]);
	  	let totalDuration = ((daysToMinute * 24) * 60) + (hoursToMinute * 60) + minutes;

        var commands = [];

        commands.push([
        	parseInt(this.state.commandObj.percent),
        	totalDuration,
        	dt.getHours(),
        	dt.getMinutes(),
        	dt.getSeconds(),
            dt.getDate(),
            dt.getMonth() + 1,
            dt.getFullYear()
        ]);

        /*let closeDt = new Date(this.state.commandObj.epoch_timestamp);
        closeDt.setMinutes(closeDt.getMinutes() + totalDuration);
        commands.push([
            0,
            0,
            closeDt.getHours(),
            closeDt.getMinutes(),
            closeDt.getSeconds(),
            closeDt.getDate(),
            closeDt.getMonth() + 1,
            closeDt.getFullYear()
        ]);    */

         var desiredData = {
            "state": {
                "desired": {
                    "deviceSpecific": {
                        "commands" : commands,
                        "num": commands.length,
                        "mode":"clear_add"
                    }
                }
            }
        };

        this.publishToShadow(desiredData, totalDuration);		
	}

	publishToShadow = (desiredData, totalDuration) => {
		 var params = {
          topic: '$aws/things/' + this._deviceId + '/shadow/update', 
          payload: JSON.stringify(desiredData),
          qos: 1
       };
           
       this._iotData.publish(params, (err, data) => {
            if (err) {
               alert('Failed to set Schedule');
            }
            else {
               alert('Successfully schedule event');
               let commandObj = {
               	timestamp: '',
               	duration: '',
               	percent: ''
               }               
               let newCommandStack = {
               	'timestamp': this.state.commandObj.epoch_timestamp,
               	'duration': totalDuration + " Minutes",
               	'gatePercentage': this.state.commandObj.percent + "%",
               	'commandStatus': false
               }
               // this._pendingCommands.push(newCommandStack)
               let pendingCommands = [];
               pendingCommands.push({...newCommandStack});
               pendingCommands[0]['timestamp'] = moment(pendingCommands[0]['timestamp']).format("DD/MM/YYYY H:mm");               
               let commandStack = this.state.commandStack;
               commandStack.unshift(newCommandStack);

               this.setState({
					loader: false,					
					commandStack,
					pendingCommands
				});
            }
       });
	}

	deviceStateChangeHandler = (event, data) => {
		let commandStack = [];		
		commandStack = this['_' + data.value + 'CommandStack'];
		if (data.value === "all") {
			commandStack = this._pendingCommands.concat(this._scheduledCommands)
		}
		
		this.setState({
			commandStack
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

	filterData = () => {
		let params = {
			TableName: 'autowinch_command_stack_tracker',
			FilterExpression: 'deviceId = :device_id',
			ExpressionAttributeValues: {
				':device_id': this._deviceId
			}
		}

    	if (this._start_date > 0 && this._end_date > 0) {
    		if (this._start_date > this._end_date) {
    			alert("start date cannot be bigger than end date");
    			return false;
    		}
    		params['FilterExpression'] = "createdOn BETWEEN :date1 and :date2 and deviceId = :device_id";
    		params['ExpressionAttributeValues'][":date1"] = this._start_date;
    		params['ExpressionAttributeValues'][":date2"] = this._end_date;
    		params['ExpressionAttributeValues'][":device_id"] = this._deviceId;
    	}    	
    	this.setState({    		
    		loading: true
    	}, () => {
    		this.getDeviceShadowMessage(params);
    	})
    }

    getDeviceShadowMessage = (params) => {    	
    	let deviceMessageList = [];
    	docClient.scan(params, (err, data) => {    		
    		if (data.Items) {
    			let messageBody;    			
    			let reverseMessageData = data.Items.sort((obj1, obj2) => {
					return obj2.lastSeen - obj1.lastSeen;
				});
    			reverseMessageData.forEach((deviceData, index) => {
    				messageBody = deviceData['messageBody'] !== undefined ? deviceData['messageBody'] : ''    				
	        		deviceMessageList.push({
	        			'createdOn': deviceData.lastSeen,
	        			'gatePercent': deviceData.deviceInfo,
	        			'batt': deviceData.batteryInfo,
	        			'signalStrength': deviceData.rssi,
	    				'messageBody': formateMessageBody(messageBody)
					})
		        })
    		}
    		
    		this.setState({
    			deviceData: deviceMessageList,
    			loading: false
    		})
    	});
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

	render() {
		return (
			<React.Fragment>
				<MenuBar history = { this.props.history } />
				<div className="ui container">
					<Grid>
						<Grid.Row>
					 		<Grid.Column width={10}>
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
											}}>{ this._deviceType }</div>
											<div>
												<Header as='h2'>{this.props.match.params.device_id}</Header>
												<Card.Meta>{ this._mac }</Card.Meta>
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
										        onChange={this.aliasChangeHandler}
										      	/>
										      	<Form.Field						        
										        control={Input}
										        label='Device Mode'
										        value={this._deviceMode}
										        readOnly={true}									        
										      	/>
										    </Form>
									    </div>
									</Card.Content>
								</Card>
    						</Grid.Column>					 		
			    			<Grid.Column className="battery-container" width={6}>
			    				<div className="battery">
			    					<div className="battery-level" style={{height: this._batt + '%', background: this._batt > 50 ? '#30b455' : this._batt >= 30 && this._batt <= 50 ? '#FFFF00' : '#FF0000'}}>
			    					</div>
			    				</div>
			    				<div>
			    					{this._batt + "%"}
			    				</div>
			    			</Grid.Column>			    			
			    		</Grid.Row>
			    	</Grid>
			    	<Divider />	
					<Form>
						<Form.Group widths="equal">
							<div className="field">
								<span style={{ display: 'block', fontWeight: 'bold', marginBottom: '4px'}}>Time Event</span>													
								<DateTimeInput
						          id='timestamp'
							      name='timestamp'
							      clearable
          						  clearIcon={<Icon name="remove" color="red" />}
						          placeholder="Date Time"
						          value={this.state.commandObj.timestamp}
						          iconPosition="left"					         
						          onChange={this.inputChangeHandler}
						          dateFormat="YYYY-MM-DD"
						          autoComplete="off"
						        />
						    </div>
						    
						    	<div className="field">
						    		<label>Duration</label>						    	
							    	<NumberFormat 
							        name='duration' 
							        placeholder="dd:hh:mm" 
							        format="##:##:##" 
							        mask={['d', 'd', 'h', 'h', 'm', 'm']}
							        value={this.state.commandObj.duration}
							        autoComplete="off"
							        onValueChange={(value) => this.numberInputHandler(value)}
							        />
							    </div>
						    {
							/*<Form.Field
								id='duration'
						        name='duration'
						        control={Input}
						        label='Duration'
						        value={this.state.commandObj.duration}
						        placeholder="for e.g., 30 Minutes,"
						        onChange={this.inputChangeHandler}
						        autoComplete='off'
							/>*/
						}
							<Form.Field
								id='percent'
						        name='percent'
						        control={Input}
						        label='Gate Percentage'
						        value={this.state.commandObj.percent}
						        placeholder="for e.g., 40%"
						        onChange={this.inputChangeHandler}
						        autoComplete='off'
							/>
						</Form.Group>
						<Form.Group>
							<Button
								positive
								icon='checkmark'
								labelPosition='right'
								content="Set Command"
								disabled={!this.state.commandObj.timestamp ||
									!this.state.commandObj.duration ||
									!this.state.commandObj.percent}
								onClick={this.setCommand}
								loading={this.state.loader}
							/>
						</Form.Group>
					</Form>
					<Divider />					
					<Form>
						<Form.Group>
						{
							<Form.Field
						        control={Select}
						        options={deviceStateOption}
						        label={{ children: 'Device State', htmlFor: 'filter_device_state' }}
						        placeholder='Device State'
						        search
						        searchInput={{ id: 'filter_device_state' }}
						        onChange={this.deviceStateChangeHandler}
						        defaultValue="all"
						    />
						}					    	
						</Form.Group>
					</Form>

					<PendingCommandsTable
					commandStack={this.state.pendingCommands}
					className={sematicUI.table}
					emptyDivClassName={sematicUI.message}
					/>

					{this.state.commandStackLoader ?
						<Loader active>Loading</Loader>
						:
						<AutoWinchTable
						commandStack={this.state.commandStack}
						className={sematicUI.table}
						headers={headers}
						emptyDivClassName={sematicUI.message}
						/>
					}
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
									headers={messageTableHeaders}
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
		);
	}
}

export default AutowinchSpecification;