import React, {Component} from 'react';
import MenuBar from '../MenuBar';
import { Icon } from 'semantic-ui-react';
import {
    setAWSConfiguration,
    docClient,
    getFormatedDate,
    setIOTConfiguration,
    getRequireCognitoAccessKeys
} from '../../app/common';
import {
    sematicUI,
    toggleColumnItems,
    deviceTypeOptions,
    deviceForOption,
    headers,
    filterDeviceTypeOptions,
    filterOperatorWiseOption,
    getPaths,
    versionOptions
} from '../../app/constants';

/*Import custom defined Components*/

import ColumnHideShowModal from '../Modals/column_modal';
import FilterColumnModal from '../Modals/filter_modal';
import CompanyModal from '../Modals/company_modal';
import DeviceModal from '../Modals/device_modal';
import DeviceTable from '../Tables/device_table';
import DimmerLoader from '../Modals/dimmer_loader';
import DeviceSpecificModal from '../Modals/device_spec_modal';

import ReactExport from "react-data-export";

const ExcelFile = ReactExport.ExcelFile;
const ExcelSheet = ReactExport.ExcelFile.ExcelSheet;
const ExcelColumn = ReactExport.ExcelFile.ExcelColumn;

var awsIot = require('aws-iot-device-sdk');

class Home extends Component {
    constructor(props) {
        super(props);

        this.state = {
            open: false,
            deviceData: {},
            companyObj: {},
            company_modal_open: false,
            column_modal_open: false,
            filter_modal_open: false,
            device_spec_modal_open: false,
            visible: false,
            btnLoading: false,
            compnayLoading: true,
            deviceLoading: true,
            deviceList: [],
            filterValue: sessionStorage.getItem('filterValue') ? sessionStorage.getItem('filterValue') : '',
            headers: headers,
            specRowData: {},
            filterObj: {},
            showToFeild: {},
            numFilter: [
                {column: '', type: 'string', operator: '', value: ''}
            ],
            deleteLoading: false,
            deleteRow: -1
        }

        this._companyNameOptions = [];
        this._companyListForFilter = [];
        this._aggregatedDataList = [];
        this._companyList = [];
        this._device = null;
        this._deviceListCloneData = [];
        this._updateTopics = [];
        this._autowinchDevices = [];
    }

    componentWillMount() {
        setAWSConfiguration();
        this._iotData = setIOTConfiguration();
    }

    componentDidMount() {
        let headers = this.state.headers;
        headers['action'] = {           
          transform: (value, idx, row) => (
            <Icon name="trash" loading={this.state.deleteLoading && idx == this.state.deleteRow} onClick={e => this.deleteDevice(idx, row)} style={{color: 'red', cursor: 'pointer'}} />
          )
        }
        this.getCompanyList();
    }

    componentWillUnmount() {
        if (this._device)
            this._device.end();
    }

    deleteDevice = (id, row) => {
        console.log(id)
        this.setState({
            deleteLoading: true,
            deleteRow: id
        })            
        let params = {
            TableName: 'SMSGateway_Device',
            Key: {
                deviceId: row['deviceId']
            }
        };
        docClient.delete(params, (err, data) => {
            if (!err) {
                if (row['version'] === 'iot') {
                    this.deleteDeviceFromMessageTable(row['deviceId'], id);
                } else {
                    this.deleteAllMessagesFromTable(row('deviceId'), id);
                }            
            }
        })
    }

    deleteAllMessagesFromTable = (deviceId, id) => {
        let params = {
            TableName: 'SMSGateway_Message',
            IndexName: 'deviceId-index',
            KeyConditionExpression: 'deviceId = :deviceId',
            ExpressionAttributeValues: {
                ':deviceId': deviceId
            }
        };
        docClient.query(params, (err, data) => {
            if (!err) {
                if (data.Items.length > 0) {
                    let listDeviceMessages = data.Items;
                    this.deleteDeviceMessages(listDeviceMessages, deviceId);
                }
            } else {
                console.log('error in fetching legacy device', err);
                this.setState({
                    deleteLoading: false,
                    deleteRow: -1
                })
            }
        })
    }

    deleteDeviceMessages = (deviceMessages, deviceId) => {
        for (let i = 0; i < deviceMessages.length; i++) {
            let params = {
                TableName: 'SMSGateway_Message',
                Key: {
                    messageId: deviceMessages[i].messageId
                }
            };
            docClient.delete(params, (err, data) => {
                if (!err) {
                    console.log('deleted item', deviceMessages[i].messageId);
                }
            });            
        }       
        let deviceList = this.state.deviceList;
        let index = deviceList.map((item) => {return item.deviceId}).indexOf(deviceId);                
        deviceList.splice(index, 1);
        this.setState({
            filterValue: '',
            deviceList,
            deleteLoading: false,
            deleteRow: -1                   
        }, () => {
             alert('deleted ' + deviceId);
        });
    }

    deleteDeviceFromMessageTable = (deviceId, id) => {
        let params = {
            TableName: 'SMSGateway_Message',
            Key: {
                messageId: deviceId + "-01"
            }
        };
        docClient.delete(params, (err, data) => {
            if (!err) {
                alert('deleted ' + deviceId);
                let deviceList = this.state.deviceList;
                let index = deviceList.map((item) => {return item.deviceId}).indexOf(deviceId);                
                deviceList.splice(index, 1);
                this.setState({
                    filterValue: '',
                    deviceList,
                    deleteLoading: false,
                    deleteRow: -1                    
                })
            }
        })
    }

    getCompanyList = () => {
        let params = {
            TableName: 'SMSGateway_Company'
        };
        docClient.scan(params, (err, data) => {
            if (!err) {
                this._companyList = data.Items;
                this._companyList.forEach((dataResponse) => {
                    this._companyNameOptions.push({
                        'key': dataResponse.companyName,
                        'text': dataResponse.companyName,
                        'value': dataResponse.companyId
                    })
                    this._companyListForFilter.push({
                        'key': dataResponse.companyName,
                        'text': dataResponse.companyName,
                        'value': dataResponse.companyName
                    })
                })
                this.setState({
                    compnayLoading: false
                })
                this.getDevices(this._companyList);
            }
        })
    }

    getDevices = (companyData) => {
        let params = {
            TableName: 'SMSGateway_Device'
        };

        docClient.scan(params, (err, data) => {
            if (!err) {
                if (data.Items.length > 0) {
                    let aggregratedDataOfDevice_Company = {};
                    let params = {};
                    let deviceData = [];
                    for (let i = 0; i < data.Items.length; i++) {
                        if (data.Items[i].deviceId.startsWith('AI') || data.Items[i].deviceId.startsWith('AP')) {
                            this._autowinchDevices.push(data.Items[i]);
                        }
                        for (let j = 0; j < companyData.length; j++) {
                            if (data.Items[i]['companyId'] == companyData[j]['companyId']) {
                                aggregratedDataOfDevice_Company = {
                                    ...data.Items[i],
                                    ...companyData[j]
                                }
                                if (data.Items[i]['version'] === 'legacy') {
                                    this._aggregatedDataList.push({
                                        "action": null,
                                        "deviceId": aggregratedDataOfDevice_Company["deviceId"],
                                        "version": aggregratedDataOfDevice_Company["version"],
                                        "companyName": aggregratedDataOfDevice_Company.companyName,
                                        "BPCode": aggregratedDataOfDevice_Company.bpCode,
                                        "mac": null,
                                        "deviceType": aggregratedDataOfDevice_Company["deviceType"] || '-',
                                        "deviceMode": aggregratedDataOfDevice_Company["deviceMode"],
                                        "alias": aggregratedDataOfDevice_Company["deviceTag"],
                                        "ICCID": null,
                                        "IMEI": null,
                                        "notes": aggregratedDataOfDevice_Company["notes"],
                                        "batt": null,
                                        "paired": null,
                                        "lat long": null,
                                        "catM1RSSI": null,
                                        "loraRSSI": null,
                                        'lastSeen': null,
                                        "FW": null,
                                        "modemFW": null,
                                        "moBo": null,
                                        "daBo": null,
                                        "error": null,
                                        "devicePhone": aggregratedDataOfDevice_Company.devicePhone,
                                        "createdOn": getFormatedDate(aggregratedDataOfDevice_Company.createdOn),
                                        "companyId": aggregratedDataOfDevice_Company.compnayId,
                                        "deviceSpecific": null,
                                        "pairedDevices": null                                        
                                    });
                                } else {
                                    params['thingName'] = data.Items[i]['deviceId'];
                                    this._updateTopics.push('$aws/things/' + data.Items[i]['deviceId'] + '/shadow/update/accepted');
                                    this.mergeThingsShadowData(aggregratedDataOfDevice_Company, params, data.Items.length);
                                }
                            }
                        }
                    }
                    this.setState({
                        deviceList: this._aggregatedDataList,
                        deviceLoading: false
                    }, () => {
                        this._deviceListCloneData = this._aggregatedDataList;
                        console.log(this._deviceListCloneData.length)
                    })
                } else {
                    this.setState({
                        deviceLoading: false
                    })
                }
            }
        });
    }

    mergeThingsShadowData = (aggregatedDataObj, params, dataLength) => {
        this.getLastStateOfThings(params, aggregatedDataObj).then((processedList) => {
            this._aggregatedDataList.push(processedList);
            /*if (this._aggregatedDataList.length === dataLength) {
                this.setState({
                    deviceList: this._aggregatedDataList
                }, () => {
                    this._deviceListCloneData = this._aggregatedDataList;
                    console.log(this._deviceListCloneData)
                    this.setState({
                        deviceLoading: false
                    })
                })

                listen for update from AWS IOT THIND SHADOW
                this.listenForDeviceUpdate();
            }*/

        })
    }

    getLastStateOfThings = (params, aggregatedDataObj) => {
        return new Promise((resolve, reject) => {
            this._iotData.getThingShadow(params, (err, data) => {
                if (!err) {
                    let parsedDataPayload = JSON.parse(data.payload);
                    let processedList = {};                    
                    processedList = {
                        "action": null,
                        "deviceId": parsedDataPayload['state']['reported']["deviceId"],
                        "version": aggregatedDataObj["version"],
                        "companyName": aggregatedDataObj.companyName,
                        "BPCode": aggregatedDataObj.bpCode,
                        "mac": parsedDataPayload['state']['reported']["mac"] || '-',
                        "deviceType": parsedDataPayload['state']['reported']["deviceType"] || '-',
                        "deviceMode": parsedDataPayload['state']['reported']["deviceMode"],
                        "alias": aggregatedDataObj["deviceTag"],
                        "ICCID": parsedDataPayload['state']['reported']['iccid'],
                        "IMEI": parsedDataPayload['state']['reported']['imei'],
                        "notes": aggregatedDataObj["notes"],
                        "batt": parsedDataPayload['state']['reported']["batt"],
                        "paired": parsedDataPayload['state']['reported']["paired"],
                        "lat long": parsedDataPayload['state']['reported']["lat"] + "," + parsedDataPayload['state']['reported']["lon"],
                        "catM1RSSI": parsedDataPayload['state']['reported']["catM1RSSI"],
                        "loraRSSI": parsedDataPayload['state']['reported']["loraRSSI"],
                        'lastSeen': parsedDataPayload['state']['reported']["time"],
                        "FW": parsedDataPayload['state']['reported']["FW"],
                        "modemFW": parsedDataPayload['state']['reported']["modemFW"],
                        "moBo": parsedDataPayload['state']['reported']["moBo"],
                        "daBo": parsedDataPayload['state']['reported']["daBo"],
                        "error": parsedDataPayload['state']['reported']["error"],
                        "devicePhone": aggregatedDataObj.devicePhone,
                        "createdOn": getFormatedDate(aggregatedDataObj.createdOn),
                        "companyId": aggregatedDataObj.compnayId,
                        "deviceSpecific": JSON.stringify(parsedDataPayload['state']['reported']["deviceSpecific"]),
                        "pairedDevices": aggregatedDataObj['pairedDevices']                        
                    }
                    if (aggregatedDataObj.hasOwnProperty('alertStatus')) {
                        processedList["alertStatus"] = aggregatedDataObj.alertStatus;
                    }
                    resolve(processedList)
                } else {
                    resolve({})
                }
            });
        })
    }

    toggleColumns = (event, data) => {
        let headers = this.state.headers;
        headers[data.label]['invisible'] = !headers[data.label]['invisible'];
        this.setState({
            headers: headers
        })
    }

    handleFilterChange = ({target: {name, value}}) => {
        this.setState({
            [name]: value
        })
    }

    handleDeviceTypeChange = (event, data) => {
        if (data.value === "ALL") {
            this.setState({
                deviceList: this._deviceListCloneData
            })
            return false;
        }
        let dataState = [];
        for (var i = 0; i < this._deviceListCloneData.length; i++) {
            if (this._deviceListCloneData[i]['deviceType'] === data.value) {
                dataState.push(this._deviceListCloneData[i])
            }
        }
        this.setState({
            deviceList: dataState
        })
    }

    /*Device Modal open and close methods*/

    show = dimmer => () => {
        this.setState({
            dimmer,
            open: true
        })
    }

    close = () => {
        this.setState({
            open: false
        })
    }

    /*Company Modal open and close methods*/

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

    /*Hide or Show Column Modal open and close Methods*/

    openColumnModel = column_modal_dimmer => () => {
        this.setState({
            column_modal_dimmer,
            column_modal_open: true
        })
    }

    closeColumnModel = () => {
        this.setState({
            column_modal_open: false
        })
    }

    /* Filter Modal open and close Methods*/

    openFilterModel = filter_modal_dimmer => () => {
        this.setState({
            filter_modal_dimmer,
            filter_modal_open: true
        })
    }

    closeFilterModel = () => {
        this.setState({
            filter_modal_open: false
        })
    }

    /*Device Specific Modal open and close Method*/

    openDeviceSpecModal = () => {
        this.setState({
            device_spec_modal_dimmer: 'blurring',
            device_spec_modal_open: true
        })
    }

    closeDeviceSpecModal = () => {
        this.setState({
            device_spec_modal_open: false
        })
    }

    /* Device input text change event*/

    handleInputChange = (event, data) => {
        const deviceData = this.state.deviceData;
        deviceData[data.name] = data.value;
        if (data.name === "isSequence") {
            deviceData[data.name] = data.value !== "Paired" ? true : false
        }
        console.log(deviceData)
        this.setState({
            deviceData
        })
    }

    /* Company input text change event*/

    handleCompanyInputChange = (event, data) => {
        const companyObj = this.state.companyObj;
        companyObj[data.name] = data.value;

        if (data.type === "checkbox") {
            companyObj[data.name] = data.checked;
        }

        this.setState({
            companyObj
        })
        console.log(this.state.companyObj)
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

    addDevice = () => {
        this.setState({
            btnLoading: true
        });
        let deviceParameter = this.state.deviceData;
        var params = {
            TableName: 'SMSGateway_Device',
            Item: {
                "deviceId": deviceParameter.device_type + deviceParameter.device_id,
                "companyId": deviceParameter.company_name,
                "deviceType": deviceParameter.device_type,
                "isSequence": deviceParameter.isSequence,
                "notes": deviceParameter.notes,
                "version": deviceParameter.version,
                "devicePhone": deviceParameter.device_phone,
                "deviceTag": deviceParameter.device_alias || (deviceParameter.device_type + deviceParameter.device_id),
                "createdOn": new Date().valueOf(),
                "updatedOn": new Date().valueOf()
            }
        };

        if (deviceParameter.device_type == "SW") {
            params.Item['topMoistureLevel'] = deviceParameter.topMoistureLevel || 15;
            params.Item['midMoistureLevel'] = deviceParameter.midMoistureLevel || 30;
            params.Item['botMoistureLevel'] = deviceParameter.botMoistureLevel || 50;
        }

        if (deviceParameter.device_type == "MM") {
            params.Item['defaultCalibration'] = JSON.stringify({
                unit: '%',
                values: {
                    0: 0, 
                    100: 1000
                }
            })
            if (deviceParameter.unit == '%') {
                params.Item['userCalibration'] = JSON.stringify({
                    unit: '%',
                    values: {
                       0: deviceParameter['zeroPercentValue'],
                       100: deviceParameter['hundredPercentValue'],
                    }
                })
            } else {
                if (deviceParameter.unit) {
                    params.Item['userCalibration'] = JSON.stringify({
                    unit: 'cm',
                    values: {
                       [deviceParameter['firstCm']]: deviceParameter['firstCmValue'],
                       [deviceParameter['secondCm']]: deviceParameter['secondCmValue'],
                       [deviceParameter['thirdCm']]: deviceParameter['thirdCmValue']
                    }
                    })
                }
            }
        }

        docClient.put(params, (err, data) => {
            if (!err) {
                alert("Device added Successfully");
                this.setState({
                    btnLoading: false
                })
                this.close();

                this._aggregatedDataList.push({
                    "deviceId": deviceParameter["deviceId"],
                    "version": deviceParameter["version"],
                    "companyName": deviceParameter.companyName,
                    "BPCode": deviceParameter.bpCode,
                    "mac": null,
                    "deviceType": deviceParameter["deviceType"] || '-',
                    "deviceMode": deviceParameter["deviceMode"],
                    "alias": deviceParameter["alias"],
                    "batt": null,
                    "paired": null,
                    "lat long": null,
                    "catM1RSSI": null,
                    "loraRSSI": null,
                    'lastSeen': null,
                    "FW": null,
                    "modemFW": null,
                    "moBo": null,
                    "daBo": null,
                    "devicePhone": deviceParameter.devicePhone,
                    "createdOn": getFormatedDate(deviceParameter.createdOn),
                    "companyId": deviceParameter.compnayId,
                    "deviceSpecific": null
                })
                this.mergeNewDeviceWithShadow(params.Item);
            }
        })
    }

    mergeNewDeviceWithShadow = (data) => {
        let index = this._companyList.map((item) => {
            return item.companyId
        }).indexOf(data.companyId);
        let companyDataObj = this._companyList[index];
        console.log(companyDataObj);
        let aggregatedDataObj = {
            ...data,
            ...companyDataObj
        }
        let params = {
            thingName: data.deviceId
        }

        this._iotData.getThingShadow(params, (err, data) => {
            if (!err) {
                let parsedDataPayload = JSON.parse(data.payload);
                let processedList = {
                    "deviceId": parsedDataPayload['state']['reported']["deviceId"],
                    "companyName": aggregatedDataObj.companyName,
                    "version": 'iot',
                    "mac": parsedDataPayload['state']['reported']["mac"] || '-',
                    "deviceType": parsedDataPayload['state']['reported']["deviceType"] || '-',
                    "deviceMode": parsedDataPayload['state']['reported']["deviceMode"],
                    "alias": aggregatedDataObj["alias"],
                    "ICCID": parsedDataPayload['state']['reported']['iccid'],
                    "IMEI": parsedDataPayload['state']['reported']['imei'],
                    "batt": parsedDataPayload['state']['reported']["batt"],
                    "paired": parsedDataPayload['state']['reported']["paired"],
                    "lat long": parsedDataPayload['state']['reported']["lat"] + "," + parsedDataPayload['state']['reported']["lon"],
                    "catM1RSSI": parsedDataPayload['state']['reported']["catM1RSSI"],
                    "loraRSSI": parsedDataPayload['state']['reported']["loraRSSI"],
                    'lastSeen': parsedDataPayload['state']['reported']["time"],
                    "FW": parsedDataPayload['state']['reported']["FW"],
                    "modemFW": parsedDataPayload['state']['reported']["modemFW"],
                    "moBo": parsedDataPayload['state']['reported']["moBo"],
                    "daBo": parsedDataPayload['state']['reported']["daBo"],
                    "devicePhone": aggregatedDataObj.devicePhone,
                    "createdOn": getFormatedDate(aggregatedDataObj.createdOn),
                    "companyId": aggregatedDataObj.compnayId,
                    "deviceSpecific": JSON.stringify(parsedDataPayload['state']['reported']["deviceSpecific"])
                }
                if (aggregatedDataObj.hasOwnProperty('alertStatus')) {
                    processedList["alertStatus"] = aggregatedDataObj.alertStatus;
                }
                this._aggregatedDataList.push(processedList);
                this.setState({
                    deviceList: this._aggregatedDataList
                })
            } else {
                return false;
            }
        })
    }

    addCompany = () => {
        this.setState({
            btnLoading: true
        })
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
                this.setState({
                    companyObj: {
                        device_id: '',
                        device_type: '',
                        device_phone: '',
                        device_alias: '',
                        firm_version: '',
                        modem_firm_version: '',
                        hardware_motherboard: '',
                        hardware_daughterboard: ''
                    }
                })
                this.companyModalClose();
                this._companyNameOptions.push({
                    'key': data.companyName,
                    'text': data.companyName,
                    'value': data.companyId
                })
            }
        })
    }

    listenForDeviceUpdate = () => {
        this._configInstance = getRequireCognitoAccessKeys();
        this._configInstance.get((erro) => {
            let {accessKeyId, secretAccessKey, sessionToken} = this._configInstance;
            this._device = awsIot.device({
                protocol: 'wss',
                host: 'a33i1b221n6do5-ats.iot.ap-southeast-2.amazonaws.com',
                region: 'ap-southeast-2',
                accessKeyId: accessKeyId,
                secretKey: secretAccessKey,
                sessionToken: sessionToken
            })
            this._device.on('connect', () => {
                this._device.subscribe(this._updateTopics);
            });
            this._device.on('message', (topic, payload) => {
                let parsedPayload = JSON.parse(payload);
                console.log(parsedPayload)
                let index = this._deviceListCloneData.findIndex(obj => obj.deviceId === parsedPayload.state.reported.deviceId);
                let updateDeviceData = this._deviceListCloneData;
                updateDeviceData[index] = Object.assign(updateDeviceData[index], {
                    "mac": parsedPayload['state']['reported']["mac"] || '-',
                    "deviceType": parsedPayload['state']['reported']["deviceType"] || '-',
                    "deviceMode": parsedPayload['state']['reported']["deviceMode"],
                    "alias": parsedPayload['state']['reported']["alias"],
                    "batt": parsedPayload['state']['reported']["batt"],
                    "paired": parsedPayload['state']['reported']["paired"],
                    "lat long": parsedPayload['state']['reported']["lat"] + "," + parsedPayload['state']['reported']["lon"],
                    "catM1RSSI": parsedPayload['state']['reported']["catM1RSSI"],
                    "loraRSSI": parsedPayload['state']['reported']["loraRSSI"],
                    'lastSeen': parsedPayload['state']['reported']["time"],
                    "FW": parsedPayload['state']['reported']["FW"],
                    "modemFW": parsedPayload['state']['reported']["modemFW"],
                    "moBo": parsedPayload['state']['reported']["moBo"],
                    "daBo": parsedPayload['state']['reported']["daBo"],
                    "deviceSpecific": JSON.stringify(parsedPayload['state']['reported']["deviceSpecific"])
                })
                this.setState({
                    deviceList: updateDeviceData
                }, () => {
                    this._deviceListCloneData = this.state.deviceList;
                })
                var rows = document.getElementsByTagName('tr');
                for (var i = 1; i < rows.length; i++) {
                    var tds = rows[i].getElementsByTagName('td')
                    if (tds[0].innerText === parsedPayload.state.reported.deviceId) {
                        rows[i].style.background = 'green';
                        rows[i].style.color = '#fff';
                        this.resetRowBackground(rows, i);
                    }
                }
            });
        })
    }

    resetRowBackground = (rows, i) => {
        setTimeout(() => {
            rows[i].style.background = '#fff';
            rows[i].style.color = 'rgba(0,0,0,.87)';
        }, 1000)
    }

    redirectToSpecification = (rowData) => {
        let path = getPaths[rowData['deviceId'].replace(/[0-9]/g, '')];
        if (rowData['version'] === 'legacy') {
            this.props.history.push('/legacy-device/' + rowData['deviceId'])
        } else {
            let paramObj = {
                pathname: path + rowData['deviceId'],
                state: {
                    alias: rowData.alias
                }
            }
            if (rowData['deviceId'].replace(/[0-9]/g, '') != "AW") {
                paramObj['state']['shadowState'] = rowData;
                paramObj['state']['autowinchDevices'] = this._autowinchDevices;
            }
            this.props.history.push(paramObj);
        }
    }

    onRowClick = (event, {rowData, rowIndex, tableData}) => {
        event.preventDefault();
        if (event.target.href) {
            if (event.target.href.startsWith('https://')) {
                window.open(event.target);
                return false;
            }
            this.setState({
                specRowData: rowData
            }, () => {
                if (this.state.filterValue != '') {
                    sessionStorage.setItem('filterValue', this.state.filterValue);
                }
                this.redirectToSpecification(rowData);
            });
        }
    }

    operatorChange = (event, data) => {
        let showParticularFileld = this.state.showToFeild;
        showParticularFileld[data.name] = false;
        if (data.value == 'Between') {
            showParticularFileld[data.name] = true;
        }

        this.setState({
            showToFeild: showParticularFileld,
            operator: data.value
        })
    }

    applyDeviceRangeFilter = (filterFor) => {
        let deviceFilteredValue = [];
        if (filterFor === 'deviceId') {
            let deviceParameter = {
                device_id: this.state.filterObj.device_id,
                to_device_id: this.state.filterObj.hasOwnProperty('to_device_id') ? this.state.filterObj['to_device_id'] : ''
            }
            deviceFilteredValue = this.getDeviceFilterValue(this.state.operator, deviceParameter)
        } else if (filterFor === 'lastSeen') {
            deviceFilteredValue = this.getDateFilterValue(filterFor, this.state.operator)
        } else {
            deviceFilteredValue = this.getFilterValue(filterFor, this.state.operator)
        }
        this.setState({
            deviceList: deviceFilteredValue
        })
        this.closeFilterModel();
    }

    getDeviceFilterValue = (operator, deviceParameter) => {
        let deviceFilteredValue = [];
        let device_id = parseInt(deviceParameter['device_id'].replace(/\D/g, ''));
        let to_device_id = deviceParameter['to_device_id'] != '' ? parseInt(deviceParameter['to_device_id'].replace(/\D/g, '')) : '';

        var operatorSpecificFunc = {
            '>=': () => {
                for (let i = 0; i < this._deviceListCloneData.length; i++) {
                    if (parseInt(this._deviceListCloneData[i]['deviceId'].replace(/\D/g, '')) >= device_id
                        &&
                        this._deviceListCloneData[i]['deviceId'].replace(/\d/g, '') === deviceParameter['device_id'].replace(/\d/g, '')) {
                        deviceFilteredValue.push(this._deviceListCloneData[i])
                    }
                }
                return deviceFilteredValue;
            },
            '<=': () => {

                for (let i = 0; i < this._deviceListCloneData.length; i++) {
                    if (parseInt(this._deviceListCloneData[i]['deviceId'].replace(/\D/g, '')) <= device_id
                        &&
                        this._deviceListCloneData[i]['deviceId'].replace(/\d/g, '') === deviceParameter['device_id'].replace(/\d/g, '')) {
                        deviceFilteredValue.push(this._deviceListCloneData[i])
                    }
                }
                return deviceFilteredValue;
            },
            'Between': () => {
                for (let i = 0; i < this._deviceListCloneData.length; i++) {
                    if (parseInt(this._deviceListCloneData[i]['deviceId'].replace(/\D/g, '')) >= device_id
                        &&
                        parseInt(this._deviceListCloneData[i]['deviceId'].replace(/\D/g, '')) <= to_device_id
                        &&
                        this._deviceListCloneData[i]['deviceId'].replace(/\d/g, '') === deviceParameter['device_id'].replace(/\d/g, '')) {

                        deviceFilteredValue.push(this._deviceListCloneData[i])

                    }
                }
                return deviceFilteredValue;
            }

        }


        return operatorSpecificFunc[operator]();
    }

    getFilterValue = (filterFor, operator) => {
        let deviceFilteredValue = [];
        var operatorSpecificFunc = {
            '>=': () => {
                for (let i = 0; i < this._deviceListCloneData.length; i++) {
                    if (parseInt(this._deviceListCloneData[i][filterFor]) >= parseInt(this.state.filterObj[filterFor])) {
                        deviceFilteredValue.push(this._deviceListCloneData[i])
                    }
                }
                return deviceFilteredValue;
            },
            '<=': () => {
                for (let i = 0; i < this._deviceListCloneData.length; i++) {
                    if (parseInt(this._deviceListCloneData[i][filterFor]) <= parseInt(this.state.filterObj[filterFor])) {
                        deviceFilteredValue.push(this._deviceListCloneData[i])
                    }
                }
                return deviceFilteredValue;
            },
            'Between': () => {
                for (let i = 0; i < this._deviceListCloneData.length; i++) {
                    if (parseInt(this._deviceListCloneData[i][filterFor]) >= parseInt(this.state.filterObj[filterFor]) &&
                        parseInt(this._deviceListCloneData[i][filterFor]) <= parseInt(this.state.filterObj['to_' + filterFor + '_range'])) {
                        deviceFilteredValue.push(this._deviceListCloneData[i])
                    }
                }
                return deviceFilteredValue;
            }

        }
        return operatorSpecificFunc[operator]();
    }

    getDateFilterValue = (filterFor, operator) => {
        let deviceFilteredValue = [];
        let date = '';
        var operatorSpecificFunc = {
            '>=': () => {
                for (let i = 0; i < this._deviceListCloneData.length; i++) {
                    if (this._deviceListCloneData[i][filterFor]) {
                        date = this._deviceListCloneData[i][filterFor].split(' ')[0];
                        if (new Date(date).valueOf() >= new Date(this.state.filterObj[filterFor]).valueOf()) {
                            deviceFilteredValue.push(this._deviceListCloneData[i])
                        }
                    }
                }
                return deviceFilteredValue;
            },
            '<=': () => {
                for (let i = 0; i < this._deviceListCloneData.length; i++) {
                    if (this._deviceListCloneData[i][filterFor]) {
                        date = this._deviceListCloneData[i][filterFor].split(' ')[0];
                        if (new Date(date).valueOf() <= new Date(this.state.filterObj[filterFor]).valueOf()) {
                            deviceFilteredValue.push(this._deviceListCloneData[i])
                        }
                    }
                }
                return deviceFilteredValue;
            },
            'Between': () => {
                for (let i = 0; i < this._deviceListCloneData.length; i++) {
                    if (this._deviceListCloneData[i][filterFor]) {
                        date = this._deviceListCloneData[i][filterFor].split(' ')[0];
                        if (new Date(date).valueOf() >= new Date(this.state.filterObj[filterFor]).valueOf() &&
                            new Date(date).valueOf() <= new Date(this.state.filterObj['to_' + filterFor + '_range']).valueOf()) {
                            deviceFilteredValue.push(this._deviceListCloneData[i])
                        }
                    }
                }
                return deviceFilteredValue;
            }

        }
        return operatorSpecificFunc[operator]();
    }

    filterInputChange = (event, data) => {
        let name = data ? data.name : event.target.name;
        let filterObj = this.state.filterObj;
        filterObj[name] = data ? data.value : event.target.value;
        this.setState({
            filterObj
        })
    }

    deviceModeChange = (event, data) => {
        if (data.value === "All") {
            console.log(this._deviceListCloneData)
            this.setState({
                deviceList: this._deviceListCloneData
            })
            return false;
        }
        let dataState = [];
        for (var i = 0; i < this._deviceListCloneData.length; i++) {
            if (this._deviceListCloneData[i]['deviceMode'] === data.value) {
                dataState.push(this._deviceListCloneData[i])
            }
        }
        this.setState({
            deviceList: dataState
        })
    }

    applyVersionFilter = () => {
        let deviceFilteredValue = [];
        for (let i = 0; i < this._deviceListCloneData.length; i++) {
            if (this._deviceListCloneData[i]['FW'] == this.state.filterObj.FW &&
                this._deviceListCloneData[i]['moBo'] == this.state.filterObj.moBo &&
                this._deviceListCloneData[i]['daBo'] == this.state.filterObj.daBo
            ) {
                deviceFilteredValue.push(this._deviceListCloneData[i])
            }
        }
        this.setState({
            deviceList: deviceFilteredValue
        })
        this.closeFilterModel();
    }

    incrementNumFilter = () => {
        let numFilter = this.state.numFilter;
        numFilter.push({
            column: '',
            operator: '',
            value: ''
        })
        this.setState({
            numFilter
        })
    }

    decrementNumFilter = (index) => {
        let numFilter = this.state.numFilter;
        numFilter.splice(index, 1);
        this.setState({
            numFilter
        })
    }

    filterInputChangeHandler = (event, data) => {
        let numFilter = this.state.numFilter;
        let index = data.id.split('_')[1];
        numFilter[index][data.name] = data.value;
        this.setState({
            numFilter
        })
    }


    applyFilter = () => {
        let numFilter = this.state.numFilter;
        let query = '';
        for (let i = 0; i < numFilter.length; i++) {
            query += numFilter[i]['column'] + ',' + numFilter[i]['type'] + ',' + numFilter[i]['operator'] + ',' + numFilter[i]['value'] + '&&'
        }
        let splitQuery = query.split('&&');
        var extractKeywords = [];
        for (let q = 0; q < splitQuery.length - 1; q++) {
            extractKeywords.push(splitQuery[q].split(','))
        }
        let finalQuery = '';
        let operator;
        let value;

        for (let e = 0; e < extractKeywords.length; e++) {
            operator = (extractKeywords.length - e === 1) ? '' : ' && ';
            value = extractKeywords[e][1] === 'string' ? '"' + extractKeywords[e][3] + '"' : parseInt(extractKeywords[e][3]);
            finalQuery += 'this._deviceListCloneData[i]["' + extractKeywords[e][0] + '"] ' + extractKeywords[e][2] + ' ' + value + operator;
        }

        let dataSet = this._deviceListCloneData;
        let operators = ["===", ">==", "<=="];
        let splitFinalQuery = finalQuery.split(' ');
        let counter = -1;

        for (let sfq = 0; sfq < splitFinalQuery.length; sfq++) {
            if (operators.indexOf(splitFinalQuery[sfq]) > -1) {
                counter++;
                dataSet = this.fetchFilteredData(dataSet, splitFinalQuery[sfq], extractKeywords[counter][0], extractKeywords[counter][3], extractKeywords[counter][1]);
            }
        }

        this.setState({
            deviceList: dataSet
        }, () => {
            this.closeFilterModel();
        })
    }

    resetFilter = () => {
        let numFilter = [
            {column: '', type: 'string', operator: '', value: ''}
        ];
        this.setState({
            deviceList: this._deviceListCloneData
        }, () => {
            this.closeFilterModel();
            this.setState({
                numFilter
            })
        })
    }

    equalFunc = (dataSet, filterFor, value) => {
        let data = [];
        for (var i = 0; i < dataSet.length; i++) {
            if (dataSet[i][filterFor] === value) {
                data.push(dataSet[i])
            }
        }
        return data;
    }

    greaterFunc = (dataSet, filterFor, value, type) => {
        let data = [];
        let parsedValue = 0;
        parsedValue = parseInt(value);
        if (type === 'float') {
            parsedValue = parseFloat(value);
        }
        for (var i = 0; i < dataSet.length; i++) {
            if (type === 'float' ? parseFloat(dataSet[i][filterFor]) >= parsedValue : parseInt(dataSet[i][filterFor]) >= parsedValue) {
                data.push(dataSet[i])
            }
        }
        return data;
    }

    lesserFunc = (dataSet, filterFor, value, type) => {
        let data = [];
        let parsedValue = 0;
        parsedValue = parseInt(value);
        if (type === 'float') {
            parsedValue = parseFloat(value);
        }
        for (var i = 0; i < dataSet.length; i++) {
            if (type === 'float' ? parseFloat(dataSet[i][filterFor]) <= parsedValue : parseInt(dataSet[i][filterFor]) <= parsedValue) {
                data.push(dataSet[i])
            }
        }
        return data;
    }

    fetchFilteredData = (dataSet, operator, filterFor, value, type) => {
        let data = dataSet;
        switch (operator) {
            case '===':
                data = this.equalFunc(dataSet, filterFor, value);
                break;
            case '>==':
                data = this.greaterFunc(dataSet, filterFor, value, type);
                break;
            case '<==':
                data = this.lesserFunc(dataSet, filterFor, value, type)
                break;
        }
        return data;
    }

    xlsxButton = () => (
        <button type="button" disabled={this.state.deviceList.length === 0} className='ui positive button'>Export To
            Excel</button>)

    renderSelectedColumns = (items, index) => {
        let selectedExcelColumns = [];
        for (let i = 0; i < toggleColumnItems.length; i++) {
            if (!this.state.headers[toggleColumnItems[i]]['invisible'])
                selectedExcelColumns.push(toggleColumnItems[i])
        }
        return selectedExcelColumns.map((items, index) => {
            return <ExcelColumn key={index} label={items} value={items}/>
        })
    }

    render() {
        const {
            open,
            dimmer,
            company_modal_dimmer,
            company_modal_open,
            column_modal_dimmer,
            column_modal_open,
            filter_modal_dimmer,
            filter_modal_open,
            device_spec_modal_open,
            device_spec_modal_dimmer
        } = this.state;

        const {history} = this.props;
        const file_name = 'filtered-data';
        return (
            <div>
                <MenuBar history={history}/>
                <div className='ui grid'>
                    <div className="row">
                        <div className='left column' style={{paddingLeft: '20px'}}>
                            <button
                                type='button'
                                className='ui positive button'
                                onClick={this.show('blurring')}
                            >
                                Add Device
                            </button>
                            <div className={sematicUI.input} style={{marginRight: '0.25em'}}>
                                <input
                                    type='text'
                                    name='filterValue'
                                    value={this.state.filterValue}
                                    placeholder='Filter results...'
                                    onChange={this.handleFilterChange}
                                />
                                <i className={sematicUI.searchIcon}/>
                            </div>
                            <button
                                type='button'
                                className='ui positive button'
                                onClick={this.openColumnModel('blurring')}
                            >
                                Columns
                            </button>
                            <button
                                z type='button'
                                className='ui positive button'
                                onClick={this.openFilterModel('blurring')}
                            >
                                Filters
                            </button>
                            <ExcelFile element={this.xlsxButton()} filename={file_name}>
                                <ExcelSheet data={this.state.deviceList} name="Device Information">
                                    {
                                        this.state.deviceList && this.renderSelectedColumns()
                                    }
                                </ExcelSheet>
                            </ExcelFile>
                        </div>
                    </div>
                    <div className="row">
                        <div className="column">
                            {this.state.deviceLoading ?
                                <DimmerLoader/>
                                :
                                <DeviceTable
                                    deviceListData={this.state.deviceList}
                                    headers={this.state.headers}
                                    className={sematicUI.table}
                                    filterValue={this.state.filterValue}
                                    rowClickHandler={this.onRowClick}
                                    emptyDivClassName={sematicUI.message}
                                />
                            }
                        </div>
                    </div>
                </div>
                <DeviceModal
                    visible={open}
                    dimmer={dimmer}
                    open={open}
                    onCloseHandler={this.close}
                    stateObj={this.state.deviceData}
                    btnState={this.state.btnLoading}
                    inputChangeHandler={this.handleInputChange}
                    deviceFormSubmitHandler={this.addDevice}
                    options={deviceTypeOptions}
                    deviceFor={deviceForOption}
                    versionOptions={versionOptions}
                    openCompanyModalHandler={this.companyModalOpen('blurring')}
                    companyNameOptions={this._companyNameOptions}
                    companyOptionLoadingState={this.state.compnayLoading}
                />
                <CompanyModal
                    visible={company_modal_open}
                    dimmer={company_modal_dimmer}
                    open={company_modal_open}
                    onCloseHandler={this.companyModalClose}
                    stateObj={this.state.companyObj}
                    inputChangeHandler={this.handleCompanyInputChange}
                    btnState={this.state.btnLoading}
                    companyFormSubmitHandler={this.addCompany}
                />
                <ColumnHideShowModal
                    visible={column_modal_open}
                    dimmer={column_modal_dimmer}
                    open={column_modal_open}
                    onCloseHandler={this.closeColumnModel}
                    toggleColumnItems={toggleColumnItems}
                    checkBoxChangeHandler={this.toggleColumns}
                    checkBoxCheckedState={this.state.headers}
                />
                <FilterColumnModal
                    visible={filter_modal_open}
                    dimmer={filter_modal_dimmer}
                    open={filter_modal_open}
                    onCloseHandler={this.closeFilterModel}
                    options={filterDeviceTypeOptions}
                    operatorOptions={filterOperatorWiseOption}
                    deviceTypeChangeHandler={this.handleDeviceTypeChange}
                    operatorChangeHandler={this.operatorChange}
                    showToFeild={this.state.showToFeild}
                    applyDeviceRangeFilterHandler={this.applyDeviceRangeFilter}
                    stateObj={this.state.filterObj}
                    filterInputChangeHandler={this.filterInputChangeHandler}
                    deviceModeChangeHandler={this.deviceModeChange}
                    applyVersionFilterHandler={this.applyVersionFilter}
                    numFilter={this.state.numFilter}
                    incrementNumFilter={this.incrementNumFilter}
                    applyFilter={this.applyFilter}
                    decrementNumFilter={this.decrementNumFilter}
                    resetFilter={this.resetFilter}
                    dataFilterChange={this.filterInputChange}
                    companyNameOptions={this._companyListForFilter}
                />
                <DeviceSpecificModal
                    visible={device_spec_modal_open}
                    dimmer={device_spec_modal_dimmer}
                    open={device_spec_modal_open}
                    onCloseHandler={this.closeDeviceSpecModal}
                    deviceSpecificData={this.state.specRowData}
                />
            </div>
        );
    }
}

export default Home;