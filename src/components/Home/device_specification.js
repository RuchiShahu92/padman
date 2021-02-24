import React, {Component} from 'react';
import MenuBar from '../MenuBar';
import {Grid, Card, Header, Divider, Form, Input, Icon, Loader, Button, Checkbox} from 'semantic-ui-react';

import {
    setAWSConfiguration,
    getdeviceInstance,
    docClient,
    getFormatedDate,
    formateMessageBody,
    errorCodes
} from '../../app/common';

import Highcharts from 'highcharts/highstock';
import HighchartsReact from 'highcharts-react-official';
import {Timeline, TimelineEvent} from 'react-event-timeline';
import {sematicUI} from '../../app/constants';
import SmartDataTable from 'react-smart-data-table';

//import from './device_specific_css';

const headers = {
    'lastSeen': {
        invisible: true
    }
}

class DeviceSpecific extends Component {
    constructor(props) {
        super(props);
        this.state = {
            threshold_break: 0,
            loading_disabledHighThresholdInput: false,
            loading_disabledLowThresholdInput: false,
            disabledHighThresholdInput: true,
            disabledLowThresholdInput: true,
            disableAlertSystemInput: true,
            disabledOpenCloseDeviceInput: this.props.location.state.shadowState.paired == "YES" ? true : false,
            hihThr: JSON.parse(this.props.location.state.shadowState.deviceSpecific)['hT'],
            loThr: JSON.parse(this.props.location.state.shadowState.deviceSpecific)['lT'],
            /*open_device_on_threshold: JSON.parse(this.props.location.state.shadowState.deviceSpecific)['open'],
            close_device_on_threshold: JSON.parse(this.props.location.state.shadowState.deviceSpecific)['close'],*/
            highchartsOptions: {},
            alias: this.props.location.state.shadowState.alias,
            timeLineData: [],
            pushConfiguration: true,
            alertStatus: false,
            deviceData: [],
            graphLoader: true
        };
        this._params = {};
        this._totalDataSet = [];        
    }

    componentWillMount() {
        setAWSConfiguration();
        this.getThresholdBreak();
    }

    componentDidMount() {
        this.checkForDeviceEntry();
    }

    checkForDeviceEntry = () => {
        let params = {
            TableName: 'user_configuration_device',
            FilterExpression: 'deviceId = :device_id',
            ExpressionAttributeValues: {
                ':device_id': this.props.match.params.device_id
            }
        };
        docClient.scan(params, (error, data) => {
            if (data.Items.length > 0) {
                let pushConfiguration = data.Items.length > 0 ? false : true
                this.setState({
                    pushConfiguration,
                    alertStatus: data.Items[0]['alertStatus'] || false
                })
            }
        })
    }

    showTimeLine = () => {
        return this.state.timeLineData.map((data, index) => (
            <TimelineEvent
                key={index}
                createdAt={data.createdAt}
                icon={<i className="angle double down"/>}
                bubbleStyle={{backgroundColor: data.low_threshold ? 'red' : 'green'}}
                contentStyle={{color: '#fff', backgroundColor: data.low_threshold ? 'red' : 'green'}}
            >
                Sensor {data.title} - {data.low_threshold ? 'Low' : 'High'} ({data.threshold_break})
            </TimelineEvent>
        ))
    }

    getThresholdBreak = () => {
        let dt = new Date();
        let midNightEpocTime = dt.setHours(0, 0, 0, 0);
        let currentEpocTime = new Date().valueOf();
        let params = {
            TableName: 'water_watcher_sensor_tracker',
            FilterExpression: 'lastSeen BETWEEN :date1 and :date2 AND (deviceId = :device_id) AND (attribute_exists(lowThresholdBreak) OR attribute_exists(highThresholdBreak))',
            ExpressionAttributeValues: {
                ':device_id': this.props.match.params.device_id,
                ':date1': parseInt(midNightEpocTime),
                ':date2': parseInt(currentEpocTime)
            },
            Select: 'COUNT'
        };
        docClient.scan(params, (error, data) => {
            this.setState({
                threshold_break: data.Count
            });
            this.getSensorData();
        })
    }

    getSensorData = () => {
        this._params = {
            TableName: 'measure_meter_sensor_tracker',
            IndexName: 'deviceId-createdOn-index',
            KeyConditionExpression: "deviceId = :device_id",            
            ExpressionAttributeValues: {
                ':device_id': this.props.match.params.device_id
            }
        };
        docClient.query(this._params, (err, data) => {
            if (!err) {
                var sensorData = [];
                let timeLineData = [];
                let sortTimeLineData = data.Items.sort((obj1, obj2) => {
                    return obj1.lastSeen - obj2.lastSeen;
                });
                let deviceMessageList = [];
                sortTimeLineData.forEach((sensorObj) => {
                    let messageBody;
                    let isoDate;
                    sensorData.push([
                        sensorObj.lastSeen,
                        sensorObj.sensor
                    ])
                    messageBody = sensorObj['messageBody'] !== undefined ? sensorObj['messageBody'] : ''
                    isoDate = new Date(sensorObj.lastSeen).toISOString().split('.')[0];
                    deviceMessageList.push({
                        'createdOn': getFormatedDate(isoDate),
                        'Sensor': sensorObj.deviceInfo,
                        'batt': sensorObj.batteryInfo,
                        'signalStrength': sensorObj.rssi,
                        'errorStatus': JSON.parse(messageBody)['error'],
                        'errorDescription': errorCodes[parseInt(JSON.parse(messageBody)['error'])],
                        'messageBody': formateMessageBody(messageBody),
                        'lastSeen': sensorObj.lastSeen

                    })
                    if (sensorObj.hasOwnProperty('lowThresholdBreak')) {
                        timeLineData.push({
                            title: sensorObj.sensor,
                            createdAt: getFormatedDate(sensorObj.lastSeen),
                            low_threshold: true,
                            threshold_break: sensorObj.lowThresholdBreak
                        })
                    }
                    if (sensorObj.hasOwnProperty('highThresholdBreak')) {
                        timeLineData.push({
                            title: sensorObj.sensor,
                            createdAt: getFormatedDate(sensorObj.lastSeen),
                            low_threshold: false,
                            threshold_break: sensorObj.highThresholdBreak
                        })
                    }
                })
                let highchartsOptions = {
                    title: {
                        text: this.props.match.params.device_id + ' Sensor Signals'
                    },
                    rangeSelector: { 
                        inputEnabled: false,
                        selected: 0,                             
                        buttons: [{
                          type: 'day',
                          count: 1,
                          text: '1d'
                        }, {
                          type: 'day',
                          count: 7,
                          text: '7d'
                        },
                        {
                          type: 'month',
                          count: 1,
                          text: '1m'
                        },
                        {
                          type: 'month',
                          count: 3,
                          text: '3m'
                        },
                        {
                          type: 'month',
                          count: 6,
                          text: '6m'
                        },
                        {
                          type: 'year',
                          count: 1,
                          text: '1y'
                        },
                        {
                          type: 'all',
                          text: 'All'
                        }]
                      },
                    series: [{
                        name: this.props.match.params.device_id,
                        data: sensorData
                    }],                    
                    xAxis: {
                        events: {
                            afterSetExtremes: function (e) {
                                if (typeof e.rangeSelectorButton !== "undefined") {}
                            }
                        }

                    },
                    tooltip: {
                        valueDecimals: 2,
                        formatter: function() {
                          return (
                            Highcharts.dateFormat("%a %d %b %H:%M:%S", this.x) +
                            "<br/>" +
                            Highcharts.numberFormat(this.y, 2)
                          );
                        }
                      }
                }
                deviceMessageList.sort((obj1, obj2) => {
                    return obj2.lastSeen - obj1.lastSeen;
                });
                this.setState({
                    highchartsOptions,
                    timeLineData,
                    deviceData: deviceMessageList,
                    graphLoader: false
                }, () => {
                    setTimeout(() => {
                        var element = document.getElementById('threshold-alerts').childNodes[1];
                        element.scrollTop = element.scrollHeight;
                    }, 1000);
                })
            }
        });
    }

    enableEditingInput = (disabledStateName) => {
        this.setState({
            [disabledStateName]: false
        })
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

    toggleUserConfiguration = (event, data) => {
        if (this.state.pushConfiguration) {
            this.pushAlertStatus(data);
        } else {
            this.updateAlertStatus(data);
        }
    }

    pushAlertStatus = (data) => {
        let params = {
            TableName: 'user_configuration_device',
            Item: {
                "deviceId": this.props.match.params.device_id,
                "userName": localStorage.getItem('username'),
                "alertStatus": data.checked
            }
        }
        docClient.put(params, (err, dataItem) => {
            if (!err) {
                alert('Alert set Successfully');
                this.setState({
                    alertStatus: data.checked
                })
            }
        })
    }

    updateAlertStatus = (status) => {
        var params = {
            TableName: 'user_configuration_device',
            Key: {
                deviceId: this.props.match.params.device_id
            },
            UpdateExpression: "set alertStatus = :status",
            ExpressionAttributeValues: {
                ":status": status.checked
            },
            ReturnValues: "UPDATED_NEW"
        }
        let alertStatus = status.checked;
        docClient.update(params, (err, data) => {
            if (!err) {
                alert('successfully set Alerts')
                this.setState({
                    alertStatus
                })
            }
        });
    }

    editThresholdValues = (threshold_level, disabledStateName) => {
        this.setState({
            ['loading_' + disabledStateName]: true
        })
        getdeviceInstance().then((deviceInstance) => {
            let device_id = this.props.match.params.device_id;
            deviceInstance.publish('$aws/things/' + device_id + '/shadow/update', JSON.stringify({
                state: {
                    reported: {
                        "deviceSpecific": {
                            [threshold_level]: this.state[threshold_level]
                        }
                    }
                }

            }))
            this.setState({
                [disabledStateName]: true,
                ['loading_' + disabledStateName]: false
            })
            alert('Threshold set successfully');
        })
    }

    editOpenCloseValues = (event) => {
        getdeviceInstance().then((deviceInstance) => {
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
        })
    }


    inputChangeHandler = (event, data) => {
        this.setState({
            [data.name]: data.value
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
            TableName: 'measure_meter_sensor_tracker',
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

    chartCallback = (chart) => {    
        this.chart = chart;    
    }

    getDeviceShadowMessage = (params) => {
        let deviceMessageList = [];
        docClient.scan(params, (err, data) => {
            if (data.Items) {
                let messageBody;
                let isoDate;
                data.Items.forEach((deviceData, index) => {
                    messageBody = deviceData['messageBody'] !== undefined ? deviceData['messageBody'] : ''
                    isoDate = new Date(deviceData.lastSeen).toISOString().split('.')[0];
                    deviceMessageList.push({
                        'createdOn': getFormatedDate(isoDate),
                        'gatePercent': deviceData.deviceInfo,
                        'batt': deviceData.batteryInfo,
                        'signalStrength': deviceData.rssi,
                        'messageBody': formateMessageBody(messageBody),
                        'lastSeen': deviceData.lastSeen
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
        const {device_id} = this.props.match.params;
        const {mac, deviceType, deviceMode, batt} = this.props.location.state.shadowState;
        return (
            <React.Fragment>
                <MenuBar history={this.props.history}/>

                <div className="ui container">
                    <Grid columns='four'>
                        <Grid.Row>
                            <Grid.Column>
                                <Card>
                                    <Card.Content>
                                        <Card.Header>
                                            Threshold Break
                                        </Card.Header>
                                    </Card.Content>
                                    <Card.Content extra style={{
                                        textAlign: 'center',
                                        paddingTop: '17px',
                                        paddingBottom: '17px'
                                    }}>
                                        <Header as="h2">{this.state.threshold_break} Times/day</Header>
                                    </Card.Content>
                                </Card>
                            </Grid.Column>
                            <Grid.Column>
                                <Card>
                                    <Card.Content>
                                        <Card.Header>
                                            High Threshold
                                            <Icon
                                                name={this.state.disabledHighThresholdInput ? 'pencil square' : 'check circle'}
                                                style={{marginLeft: '1em', float: 'right', cursor: 'pointer'}}
                                                loading={this.state.loading_disabledHighThresholdInput}
                                                onClick={() => {
                                                    this.state.disabledHighThresholdInput ? this.enableEditingInput('disabledHighThresholdInput')
                                                        : this.editThresholdValues('hT', 'disabledHighThresholdInput')
                                                }}
                                            />
                                        </Card.Header>
                                    </Card.Content>
                                    <Card.Content extra>
                                        <Form>
                                            <Form.Field
                                                control={Input}
                                                placeholder='High Threshold'
                                                name='hihThr'
                                                icon={{name: 'angle double up', color: 'green'}}
                                                iconPosition='left'
                                                value={this.state.hihThr}
                                                readOnly={this.state.disabledHighThresholdInput}
                                                onChange={this.inputChangeHandler}
                                            />
                                        </Form>
                                    </Card.Content>
                                </Card>
                            </Grid.Column>
                            <Grid.Column>
                                <Card>
                                    <Card.Content>
                                        <Card.Header>
                                            Low Threshold
                                            <Icon
                                                name={this.state.disabledLowThresholdInput ? 'pencil square' : 'check circle'}
                                                style={{marginLeft: '1em', float: 'right', cursor: 'pointer'}}
                                                loading={this.state.loading_disabledLowThresholdInput}
                                                onClick={() => {
                                                    this.state.disabledLowThresholdInput ? this.enableEditingInput('disabledLowThresholdInput')
                                                        : this.editThresholdValues('lT', 'disabledLowThresholdInput')
                                                }}
                                            />
                                        </Card.Header>
                                    </Card.Content>
                                    <Card.Content extra>
                                        <Form>
                                            <Form.Field
                                                control={Input}
                                                placeholder='Low Threshold'
                                                name='loThr'
                                                icon={{name: 'angle double down', color: 'red'}}
                                                iconPosition='left'
                                                value={this.state.loThr}
                                                readOnly={this.state.disabledLowThresholdInput}
                                                onChange={this.inputChangeHandler}
                                            />
                                        </Form>
                                    </Card.Content>
                                </Card>
                            </Grid.Column>
                            <Grid.Column className="battery-container">
                                <div className="battery">
                                    <div className="battery-level" style={{
                                        height: batt + '%',
                                        background: batt > 50 ? '#30b455' : batt >= 30 && batt <= 50 ? '#FFFF00' : '#FF0000'
                                    }}>
                                    </div>
                                </div>
                                <div>
                                    {batt + "%"}
                                </div>
                            </Grid.Column>
                        </Grid.Row>
                    </Grid>
                    <Grid>
                        <Grid.Row>
                            <Grid.Column width={12}>
                            {this.state.graphLoader ? 
                                <Loader active>Loading</Loader>
                                :
                                <HighchartsReact
                                    highcharts={Highcharts}
                                    constructorType={'stockChart'}
                                    options={this.state.highchartsOptions}
                                    callback = { this.chartCallback}
                                />
                            }
                            </Grid.Column>
                            <Grid.Column width={4} id='threshold-alerts'>
                                <Header as="h3"> Sensor Updates </Header>
                                <Timeline id="timeline-container">
                                    {this.showTimeLine()}
                                </Timeline>
                            </Grid.Column>
                        </Grid.Row>
                    </Grid>
                    <Grid columns='two'>
                        <Grid.Row>
                            <Grid.Column width={8}>
                                <Card style={{width: '100%'}}>
                                    <Card.Content extra>
                                        <div style={{
                                            display: 'flex',
                                            justifyContent: 'space-between',
                                            alignItems: 'center'
                                        }}>
                                            <div style={{
                                                width: '100px',
                                                height: '100px',
                                                borderRadius: '50%',
                                                border: '1px solid',
                                                textAlign: 'center',
                                                display: 'flex',
                                                justifyContent: 'center',
                                                alignItems: 'center'
                                            }}>{deviceType}</div>
                                            <div>
                                                <Header as='h2'>{this.props.match.params.device_id}</Header>
                                                <Card.Meta>{mac}</Card.Meta>
                                            </div>
                                            <Form>
                                                <label>Alias</label>
                                                <Icon
                                                    name='check circle'
                                                    disabled={!this.state.alias}
                                                    loading={this.state.editLoader}
                                                    style={{
                                                        cursor: !this.state.alias ? 'not-allowed' : 'pointer',
                                                        fontSize: '1.3em',
                                                        float: 'right'
                                                    }}
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
                            <Grid.Column width={4}>
                                <Card>
                                    <Card.Content>
                                        <Card.Header style={{
                                            display: 'flex',
                                            justifyContent: 'space-between',
                                            alignItems: 'center'
                                        }}>
                                            Paired Device
                                            <Checkbox slider
                                                      onChange={this.toggleEditPairingDevice}
                                                      checked={this.state.disabledOpenCloseDeviceInput}
                                            />
                                            <Icon
                                                name='check circle'
                                                disabled={!this.state.disabledOpenCloseDeviceInput}
                                                style={{
                                                    cursor: !this.state.disabledOpenCloseDeviceInput ? 'not-allowed' : 'pointer',
                                                    fontSize: '1.3em'
                                                }}
                                                onClick={() => !this.state.disabledOpenCloseDeviceInput ? null : this.editOpenCloseValues()}
                                            />

                                        </Card.Header>
                                    </Card.Content>
                                    <Card.Content extra>
                                        <Form>
                                            <Form.Field
                                                control={Input}
                                                placeholder='Open Device'
                                                name='open_device_on_threshold'
                                                icon={{name: 'lock open'}}
                                                iconPosition='left'
                                                value={this.state.open_device_on_threshold}
                                                readOnly={!this.state.disabledOpenCloseDeviceInput}
                                                onChange={this.inputChangeHandler}
                                            />
                                            <Form.Field
                                                control={Input}
                                                placeholder='Close Device'
                                                name='close_device_on_threshold'
                                                icon={{name: 'lock'}}
                                                iconPosition='left'
                                                value={this.state.close_device_on_threshold}
                                                readOnly={!this.state.disabledOpenCloseDeviceInput}
                                                onChange={this.inputChangeHandler}
                                            />
                                        </Form>
                                    </Card.Content>
                                </Card>
                            </Grid.Column>
                            <Grid.Column width={4}>
                                <Card>
                                    <Card.Content>
                                        <Card.Header style={{
                                            display: 'flex',
                                            justifyContent: 'space-between',
                                            alignItems: 'center'
                                        }}>
                                            Users Alerts
                                            <Checkbox slider
                                                      onChange={this.toggleUserConfiguration}
                                                      checked={this.state.alertStatus}
                                            />
                                        </Card.Header>
                                    </Card.Content>
                                </Card>
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
                                        <div className="field" style={{alignSelf: 'flex-end'}}>
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
                                            headers={headers}
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
                    </Grid>
                </div>
            </React.Fragment>
        );
    }
}

export default DeviceSpecific;