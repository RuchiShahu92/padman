import React, { Component } from 'react';
import MenuBar from '../MenuBar';
import { Grid, Card, Header, Icon, Loader, Checkbox, Button, Form, Radio } from 'semantic-ui-react';
import Highcharts from 'highcharts/highstock';
import HighchartsReact from 'highcharts-react-official';

import { setAWSConfiguration, docClient, getFormatedDate, formateMessageBody, errorCodes } from '../../app/common';
import { sematicUI } from '../../app/constants';
import SmartDataTable from 'react-smart-data-table';
import ZoneConfigurationModal from '../Modals/zone_configuration_modal';
import AlertConfigurationModal from '../Modals/alert_configuration_modal';
import SWLableConfigModal from '../Modals/sw_config_label_modal';

const xAxis = {
	type: "datetime",
    labels: {
      overflow: "justify"
    },
    gridLineWidth: 0.5,
}

const chart =  {
    type: "spline",
    scrollablePlotArea: {
      minWidth: 600,
      scrollPositionX: 1
    }
}


class SoilWatcherSpecification extends Component {
	constructor(props) {
		super(props);
		this.state = {
			topValHighchartOption: {},
			midValHighchartOption: {},
			botValHighchartOption: {},
			deviceData: [],
			sensorAverage: {
				topVal: true,
				midVal: true,
				botVal: true
			},
			loader: false,
			averageValueHighchartOptions: {},
			chartTypeSelection: false,
			zone_modal_open: false,
			zoneObj: {
				top_stress_zone: 0,
				mid_stress_zone: 0,
				bot_stress_zone: 0
			},
			alert_modal_open: false,
			alertStatus: false,
			alertObj: {

			},
			moistureObj: {
				topMoistureLevel: 15,
				midMoistureLevel: 30,
				botMoistureLevel: 50
			},
			btnLoading: false,
			config_label_modal: false,
			graphLoader: true
		}

		this._topValSensor = [];
		this._midValSensor = [];
		this._botValSensor = [];

		this._minMaxSensorValue = {
			topValMin: 0,
			topValMax: 0,
			midValMin: 0,
			midValMax: 0,
			botValMin: 0,
			botValMax: 0
		};
		this._topValData = [];
		this._midValData = [];
		this._botValData = [];
		this._sortSensorData = [];
		this._pushConfiguration = true;
	}

	componentWillMount() {
		setAWSConfiguration();
		this.checkForUserConfiguration();		
	}

	checkForUserConfiguration = () => {
		let params = {
			TableName: 'SMSGateway_Device',			
			FilterExpression: 'deviceId = :device_id',
			ExpressionAttributeValues: {							
				':device_id': this.props.match.params.device_id				
			}			
		};
		docClient.scan(params, (error, data) => {				
			if (data.Items.length > 0) {
				let zoneObj = this.state.zoneObj;
				let alertStatus = this.state.alertStatus;
				let alertObj = this.state.alertObj;
				let moistureObj = this.state.moistureObj;

				moistureObj['topMoistureLevel'] = data.Items[0]['topMoistureLevel'] || 15;
				moistureObj['midMoistureLevel'] = data.Items[0]['midMoistureLevel'] || 30;
				moistureObj['botMoistureLevel'] = data.Items[0]['botMoistureLevel'] || 50;

				zoneObj['top_stress_zone'] = data.Items[0]['topStressZone'];
				zoneObj['top_growing_zone'] = data.Items[0]['topGrowingZone'];
				zoneObj['mid_stress_zone'] = data.Items[0]['midStressZone'];
				zoneObj['mid_growing_zone'] = data.Items[0]['midGrowingZone'];
				zoneObj['bot_stress_zone'] = data.Items[0]['botStressZone'];
				zoneObj['bot_growing_zone'] = data.Items[0]['botGrowingZone'];
				zoneObj['top_sensor_0_per_value'] = data.Items[0]['top0Val'];
				zoneObj['top_sensor_100_per_value'] = data.Items[0]['top100Val'];
				zoneObj['mid_sensor_0_per_value'] = data.Items[0]['mid0Val'];
				zoneObj['mid_sensor_100_per_value'] = data.Items[0]['mid100Val'];
				zoneObj['bot_sensor_0_per_value'] = data.Items[0]['bot0Val'];
				zoneObj['bot_sensor_100_per_value'] = data.Items[0]['bot100Val'];
				alertStatus = data.Items[0]['alertStatus'];
				alertObj['alert_percent'] = data.Items[0]['alertPercent'];
				alertObj['watch_hours'] = data.Items[0]['watchHours'];
				alertObj['prewarning_hours'] = data.Items[0]['prewarningHours'];
				this.setState({
					zoneObj,
					alertStatus,
					alertObj,
					moistureObj					
				})
				this.getSoilWatcherSignalData();
				this._pushConfiguration = false;
			} else {
				this._pushConfiguration = true;
				this.zoneModalOpen();
			}
		})
	}

	zoneModalOpen = () => {
		this.setState({
			zone_modal_dimmer: 'blurring',
			zone_modal_open: true
		})
	}
 
	alertModalOpen = () => {
		this.setState({
			alert_modal_dimmer: 'blurring',
			alert_modal_open: true
		})
	}

	configLableModalOpen = () => {
		this.setState({
			config_label_dimmer: 'blurring',
			config_label_modal: true
		})
	}

	closeConfigLableModal = () => {
		this.setState({
			config_label_modal: false
		})
	}

	updateLabels = () => {
		this.setState({
			btnLoading: true
		})		
		let params = {
			TableName: 'SMSGateway_Device',
			Key: {
				'deviceId': this.props.match.params.device_id
			},
			UpdateExpression: 'set topMoistureLevel = :top_label, midMoistureLevel = :mid_label, botMoistureLevel = :bot_label',
			ExpressionAttributeValues: {
				':top_label': this.state.moistureObj.topMoistureLevel,
				':mid_label': this.state.moistureObj.midMoistureLevel,
				':bot_label': this.state.moistureObj.botMoistureLevel
			}
		};
		docClient.update(params, (err, data) => {

			if (!err) {
				alert("Updated successfully");
			} else {
				console.log(err)
			}
			this.setState({
				btnLoading: false
			})
		})
	}

	getSoilWatcherSignalData = () => {
		let params = {
			TableName: 'soilwatcher_sensor_updates',
			IndexName: 'deviceId-createdOn-index',
			KeyConditionExpression: "deviceId = :device_id",
			ExpressionAttributeValues: {
				":device_id": this.props.match.params.device_id
			}
		};		
		docClient.query(params, (err, data) => {
			if (!err)  {
				let deviceMessageList = [];
				this._sortSensorData = data.Items.sort((obj1, obj2) => {
					return obj1.lastSeen - obj2.lastSeen;
				});
				let messageBody;				
				let isoDate;
				this._sortSensorData.forEach((dataItem) => {					
					messageBody = dataItem['messageBody'] !== undefined ? dataItem['messageBody'] : '';
					isoDate = new Date(dataItem.lastSeen).toISOString().split('.')[0];
					deviceMessageList.push({
	        			'createdOn': getFormatedDate(isoDate),
	        			'topSensorValue': dataItem.topSensorValue,
	        			'midSensorValue': dataItem.midSensorValue,
	        			'bottSensorValue': dataItem.bottSensorValue,
	        			'errorStatus': JSON.parse(messageBody)['error'],
						'errorDescription': errorCodes[parseInt(JSON.parse(messageBody)['error'])],
	        			'batt': dataItem.batteryInfo,
	        			'signalStrength': dataItem.rssi,
	    				'messageBody': formateMessageBody(messageBody),
	    				'lastSeen': dataItem.lastSeen
					})
					this._topValData.push(dataItem.topSensorValue);
					this._midValData.push(dataItem.midSensorValue);
					this._botValData.push(dataItem.bottSensorValue);
				})

				this._minMaxSensorValue.topValMin = Math.min(...this._topValData);
				this._minMaxSensorValue.topValMax = Math.max(...this._topValData);
				
				this._minMaxSensorValue.midValMin = Math.min(...this._midValData);
				this._minMaxSensorValue.midValMax = Math.max(...this._midValData);

				this._minMaxSensorValue.botValMin = Math.min(...this._botValData);
				this._minMaxSensorValue.botValMax = Math.max(...this._botValData);

				deviceMessageList.sort((obj1, obj2) => {
					return obj2.lastSeen - obj1.lastSeen;
				});

				this.setState({
					deviceData: deviceMessageList
				})
				
				this.setOptionForTopVal(this.state.chartTypeSelection);
			}			
		});
	}

	getYAxisConfiguration = (stressZone, growingZone) => {
		return {
				title: {
				  text: "SMI %"
				},
				minorGridLineWidth: 0,
				gridLineWidth: 0.5,
				alternateGridColor: null,
				min: 0,
				max: 100,
				plotBands: [
				  {
				  	from: 0,
				  	to: stressZone,
				    color: "#ff9800",
				    label: {
				      text: "Stress",
				      style: {
				        color: "#fff"
				      }
				    }
				  },
				  {	    
				  	from: stressZone,
				  	to: growingZone,
				    color: "#4caf50",
				    label: {
				      text: "Growing",
				      style: {
				        color: "#fff"
				      }
				    }
				  },
				  {
				  	from: growingZone,
				  	to: 100,
				    color: "#2196f3",
				    label: {
				      text: "Saturation",
				      style: {
				        color: "#fff"
				      }
				    }
				  }
				]
			}
	}

	calculatePercentWise = (val, diff, minVal) => {
		let data = [];		
		this._sortSensorData.forEach((dataItem) => {
			data.push([
				dataItem.lastSeen,
				((dataItem[val] - parseInt(minVal)) * 100) / diff
			])						
		})
		return data;
	}

	showRawData = () => {
		this._topValSensor = [];
		this._midValSensor = [];
		this._botValSensor = [];
		this._sortSensorData.forEach((dataItem) => {
			this._topValSensor.push([
				dataItem.lastSeen,
				dataItem.topSensorValue
			])
			this._midValSensor.push([
				dataItem.lastSeen,
				dataItem.midSensorValue
			])
			this._botValSensor.push([
				dataItem.lastSeen,
				dataItem.bottSensorValue
			])
		})
	}

	configureYAxis = (yAxisFor, diff, minVal, stressZone, growingZone) => {
		let parsedMin = parseInt(minVal);
		yAxisFor['plotBands'][0]['from'] =  parsedMin;
		yAxisFor['plotBands'][0]['to'] = (parseInt(stressZone) * diff) / 100 + parsedMin;
		yAxisFor['plotBands'][1]['from'] = (parseInt(stressZone) * diff) / 100 + parsedMin;
		yAxisFor['plotBands'][1]['to'] = (parseInt(growingZone) * diff) / 100 + parsedMin;
		yAxisFor['plotBands'][2]['from'] = (parseInt(growingZone) * diff) / 100 + parsedMin;
		yAxisFor['plotBands'][2]['to'] = (100 * diff) / 100 + parsedMin;
	}

	toggleTooltip = (rawData) => {
		var device_id = this.props.match.params.device_id;
		let tooltip = {
      formatter: function() {
        console.log(this)
        return (
          Highcharts.dateFormat("%a %d %b %H:%M:%S", this.x) +
          "<br/>" +
          "<b>" +
           device_id +
          "</b>: " +
          Highcharts.numberFormat(this.y, 2) +
          " %"
        );
      }
    };
    if (rawData) {
      tooltip = {
        formatter: function() {
          return (
            Highcharts.dateFormat("%a %d %b %H:%M:%S", this.x) +
            "<br/>" +
            "<b>" +
            device_id +
            "</b>: " +
            this.y
          );
        }
      };
    }
    return tooltip;
	}

	avgToolTip = (rawData) => {
    var device_id = this._deviceId;
    let tooltip = {
        formatter: function() {  
          var tooltipVal = '';
          for (let i = 0; i < this.points.length; i++) {
            tooltipVal += Highcharts.numberFormat(this.points[i].y, 2) + '% <br>';
          }
          return (
              Highcharts.dateFormat("%a %d %b %H:%M:%S", this.x) +
              "<br/>" +
              "<b>" +
              device_id +
              "</b>: <br>" + 
              tooltipVal
            );
        }
      };
    if (rawData) {
      tooltip = {
        formatter: function() {
          var tooltipVal = '';
          for (let i = 0; i < this.points.length; i++) {
            tooltipVal += Highcharts.numberFormat(this.points[i].y, 2) + '<br>';
          }
          return (
              Highcharts.dateFormat("%a %d %b %H:%M:%S", this.x) +
              "<br/>" +
              "<b>" +
              device_id +
              "</b>: <br>" +
              tooltipVal
            );
        }
      };
    }    
    return tooltip;
  }

	setOptionForTopVal = (rawChart) => {
		let stressZone = this.state.zoneObj.top_stress_zone;
		let growingZone = this.state.zoneObj.top_growing_zone;
		var yAxisForTopVal = this.getYAxisConfiguration(stressZone, growingZone);		
		let min = this.state.zoneObj.top_sensor_0_per_value;
		let max = this.state.zoneObj.top_sensor_100_per_value;
		let diff = max - min;
		let tooltip = {};
		if (rawChart) {
			yAxisForTopVal['min'] = min;
			yAxisForTopVal['max'] = max;
			yAxisForTopVal["title"]["text"] = "SMI";
			this.configureYAxis(yAxisForTopVal, diff, min, stressZone, growingZone);
			this.showRawData();	
			tooltip = this.toggleTooltip(true);			
		} else {
			this._topValSensor = this.calculatePercentWise('topSensorValue', diff, min);
			tooltip = this.toggleTooltip(false);
		}		

		let highchartOptions = {
			rangeSelector: {
		        inputEnabled: false,
		        selected: 1,
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
				showInLegend: false,
				name: this.props.match.params.device_id,
				data: this._topValSensor,
				color: 'black'
			}],
			tooltip: tooltip,		 
			chart: chart,          
			yAxis: yAxisForTopVal,
          	xAxis: xAxis
		}
		this.setState({
			topValHighchartOption: highchartOptions		
		}, () => {			
			this.setOptionForMidVal(rawChart)
		})
	}

	setOptionForMidVal = (rawChart) => {
		let stressZone = this.state.zoneObj.mid_stress_zone;
		let growingZone = this.state.zoneObj.mid_growing_zone;
		var yAxisForMidVal = this.getYAxisConfiguration(stressZone, growingZone);
		let min = this.state.zoneObj.mid_sensor_0_per_value;
		let max = this.state.zoneObj.mid_sensor_100_per_value;
		let diff = max - min;
		let tooltip = {};		
		if (rawChart) {
			yAxisForMidVal['min'] = min;
			yAxisForMidVal['max'] = max;
			/*yAxisForMidVal['tickInterval'] = 400;
			yAxisForMidVal['endOnTick'] = false;*/
			yAxisForMidVal['title']['text'] = 'SMI';			
			this.configureYAxis(yAxisForMidVal, diff, min, stressZone, growingZone);
			tooltip = this.toggleTooltip(true);
		} else {
			this._midValSensor = this.calculatePercentWise('midSensorValue', diff, min);
			tooltip = this.toggleTooltip(false);
		}
		
		let highchartOptions = {
			rangeSelector: {
		        inputEnabled: false,
		        selected: 1,
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
				showInLegend: false,
				name: this.props.match.params.device_id,
				data: this._midValSensor,
				color: 'black'
			}],
			tooltip: tooltip,
			chart: chart,          
			yAxis: yAxisForMidVal,
          	xAxis: xAxis
		}
		this.setState({
			midValHighchartOption: highchartOptions		
		}, () => {
			this.setOptionForBotVal(rawChart)
		})
	}

	setOptionForBotVal = (rawChart) => {
		let stressZone = this.state.zoneObj.bot_stress_zone;
		let growingZone = this.state.zoneObj.bot_growing_zone;
		var yAxisForBotVal = this.getYAxisConfiguration(stressZone, growingZone);
		let min = this.state.zoneObj.bot_sensor_0_per_value;
		let max = this.state.zoneObj.bot_sensor_100_per_value;
		let diff = max - min;
		let tooltip = {};
		if (rawChart) {
			yAxisForBotVal['min'] = min;
			yAxisForBotVal['max'] = max;
			yAxisForBotVal['title']['text'] = 'SMI';			
			this.configureYAxis(yAxisForBotVal, diff, min, stressZone, growingZone);
			tooltip = this.toggleTooltip(true);
		} else {
			this._botValSensor = this.calculatePercentWise('bottSensorValue', diff, min);
			tooltip = this.toggleTooltip(false);
		}

		let highchartOptions = {
			rangeSelector: {
		        inputEnabled: false,
		        selected: 1,
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
				showInLegend: false,
				name: this.props.match.params.device_id,
				data: this._botValSensor,
				color: 'black'
			}],
			tooltip: tooltip,
			chart: chart,          
			yAxis: yAxisForBotVal,
          	xAxis: xAxis
		}
		this.setState({
			botValHighchartOption: highchartOptions,
			graphLoader: false
		}, () => {
			if (Object.keys(this.state.averageValueHighchartOptions).length > 0 || this.state.sensorAverage.topVal == true)
				this.showAverageChart(rawChart);
		})
	}

	checkboxChangeHandler = (event, data) => {
		let sensorAverage = this.state.sensorAverage;		
		sensorAverage[data.name] = data.checked
		this.setState({
			sensorAverage
		}, () => {
			this.showAverageChart(this.state.chartTypeSelection);
		})
	}

	showAverageChart = (rawChart) => {		
		var averageOf = [];
		var minVal = 0;
		var maxVal = 0;
		let stressZoneAvg = 0;
		let growingZoneAvg = 0;
		var minVals = [];
		var maxVals = [];
		for (var key in this.state.sensorAverage) {			
			if (this.state.sensorAverage[key]) {
				averageOf.push(key);				
				minVals.push(this._minMaxSensorValue[key + "Min"]);
				maxVals.push(this._minMaxSensorValue[key + "Max"])
				let zoneSensor = key.substring(0, 3);
				stressZoneAvg += parseInt(this.state.zoneObj[zoneSensor + '_stress_zone']);
				growingZoneAvg += parseInt(this.state.zoneObj[zoneSensor + '_growing_zone']);
			} 
		}

		if (!rawChart) {
			minVal = 0;
			maxVal = 0;
			for (var key in this.state.sensorAverage) {
				if (this.state.sensorAverage[key]) {
					let perSensor = key.substring(0, 3);
					minVal += parseInt(this.state.zoneObj[perSensor + '_sensor_0_per_value']);
					maxVal += parseInt(this.state.zoneObj[perSensor + '_sensor_100_per_value']);          
        		}
      		}
		}

		stressZoneAvg = stressZoneAvg / averageOf.length;
		growingZoneAvg = growingZoneAvg / averageOf.length;		

		var yAxisForAverageChart = this.getYAxisConfiguration(stressZoneAvg, growingZoneAvg);

		var averageData = [];
		var averageMinVal = Math.min(...minVals);
		var averageMaxVal = Math.max(...maxVals);
		if (!rawChart) {
			averageMinVal = minVal / averageOf.length;
			averageMaxVal = maxVal / averageOf.length;
		}		
		let diff = (averageMaxVal) - (averageMinVal);
		let tooltip = {};
		if (rawChart) {
			yAxisForAverageChart['min'] = averageMinVal;			
			yAxisForAverageChart['max'] = averageMaxVal;
			yAxisForAverageChart['title']['text'] = 'SMI';			
			this.configureYAxis(yAxisForAverageChart, diff, averageMinVal, stressZoneAvg, growingZoneAvg);
			tooltip = this.toggleTooltip(true);

			for (var i = 0; i< this._topValData.length; i++) {
				var averageOfSensorValue = 0;
				for (var j = 0; j < averageOf.length; j++ ) {					
					averageOfSensorValue += this['_' + averageOf[j] + 'Data'][i]
				}	
				if (this.state.topValHighchartOption.series[0].data[i] !== undefined) {
					averageData.push([
						this.state.topValHighchartOption.series[0].data[i][0],
						averageOfSensorValue / averageOf.length
					])
				}
			}
		} else {			
			tooltip = this.toggleTooltip(false);			
			for (var i = 0; i < this._topValData.length; i++) {
				var averageOfSensorValue = 0;
				for (var j = 0; j < averageOf.length; j++ ) {					
					averageOfSensorValue += this['_' + averageOf[j] + 'Data'][i]
				}	
				if (this.state.topValHighchartOption.series[0].data[i] !== undefined) {
					averageData.push([
						this.state.topValHighchartOption.series[0].data[i][0],
						(((averageOfSensorValue / averageOf.length) - averageMinVal) * 100) / diff
					])
				}										
			}
		}		

		let averageValueHighchartOptions = {
			title: {
				text: 'SMI SUMMARY'
			},
			rangeSelector: {
		        inputEnabled: false,
		        selected: 1,
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
				showInLegend: false,
				name: this.props.match.params.device_id,
				data: averageData,
				color: 'black'
			}],
			tooltip: tooltip,
			chart: chart,          
			yAxis: yAxisForAverageChart,
          	xAxis: xAxis
		}
		this.setState({
			averageValueHighchartOptions,
			avgChartLoader: false
		})
	}

	handleRadioChange = (e, { value, name }) => {		
		this.setState({
			[name]: value
		})
		this.setOptionForTopVal(value)
		setTimeout(() => {
			if (Object.keys(this.state.averageValueHighchartOptions).length > 0)
				this.showAverageChart(value)
		}, 2000)
	}

	handleZoneInputChange = (event, data) => {
		let zoneObj = this.state.zoneObj;
		zoneObj[data.name] = data.value;
		this.setState({
			zoneObj
		})
	}

	handleConfigLableInputChange = (event, data) => {
		let moistureObj = this.state.moistureObj;
		moistureObj[data.name] = data.value;
		this.setState({
			moistureObj
		})
	}

	closeZoneModal = () => {
		this.setState({
			zone_modal_open: false
		})
	}

	closeAlertModal = () => {
		this.setState({
			alert_modal_open: false
		})
	}

	setZones = () => {
		let params = {
			TableName: 'user_configuration_device',
			Key: {
				deviceId: this.props.match.params.device_id				
			},
			UpdateExpression: "set topStressZone = :top_stress_zone, topGrowingZone = :top_growing_zone, " + 
			"midStressZone = :mid_stress_zone, midGrowingZone = :mid_growing_zone, " + 
			"botStressZone = :bot_stress_zone, botGrowingZone = :bot_growing_zone, " +
			"top0Val = :top_0_val, top100Val = :top_100_val, mid0Val = :mid_0_val, " + 
			"mid100Val = :mid_100_val, bot0Val = :bot_0_val, bot100Val = :bot_100_val",
			ExpressionAttributeValues: {
				':top_stress_zone': this.state.zoneObj.top_stress_zone,
				':top_growing_zone': this.state.zoneObj.top_growing_zone,
				':mid_stress_zone': this.state.zoneObj.mid_stress_zone,
				':mid_growing_zone': this.state.zoneObj.mid_growing_zone,
				':bot_stress_zone': this.state.zoneObj.bot_stress_zone,
				':bot_growing_zone': this.state.zoneObj.bot_growing_zone,
				':top_0_val': this.state.zoneObj.top_sensor_0_per_value,
				':top_100_val': this.state.zoneObj.top_sensor_100_per_value,
				':mid_0_val': this.state.zoneObj.mid_sensor_0_per_value,
				':mid_100_val': this.state.zoneObj.mid_sensor_100_per_value,
				':bot_0_val': this.state.zoneObj.bot_sensor_0_per_value,
				':bot_100_val': this.state.zoneObj.bot_sensor_100_per_value
			},
			ReturnValues:"UPDATED_NEW"
		}
		if (this._pushConfiguration) {
			params = {
				TableName: 'user_configuration_device',
				Item: {
					'topStressZone': this.state.zoneObj.top_stress_zone,
					'topGrowingZone': this.state.zoneObj.top_growing_zone,
					'midStressZone': this.state.zoneObj.mid_stress_zone,
					'midGrowingZone': this.state.zoneObj.mid_growing_zone,
					'botStressZone': this.state.zoneObj.bot_stress_zone,
					'botGrowingZone': this.state.zoneObj.bot_growing_zone,
					'deviceId': this.props.match.params.device_id,
					'deviceType': 'SW',
					'userName': localStorage.getItem('username'),
					'top0Val': this.state.zoneObj.top_sensor_0_per_value,
					'top100Val': this.state.zoneObj.top_sensor_100_per_value,
					'mid0Val': this.state.zoneObj.mid_sensor_0_per_value,
					'mid100Val': this.state.zoneObj.mid_sensor_100_per_value,
					'bot0Val': this.state.zoneObj.bot_sensor_0_per_value,
					'bot100Val': this.state.zoneObj.bot_sensor_100_per_value
				}
			}
			this.pushZones(params);
			return false;
		}
		this.updateZones(params);
	}

	pushZones = (params) => {

		docClient.put(params, (err, data) => {
			if (!err) {
				alert('Zones set successfully')
				this.closeZoneModal();
				this.getSoilWatcherSignalData();
			}
		})
	}

	updateZones = (params) => {
		docClient.update(params, (err, data) => {
			if (!err) {
				alert('Zones set successfully');
				this.closeZoneModal();
				this.getSoilWatcherSignalData();

			}
		})
	}

	toggleAlertConfiguration = () => {
		this.setState({
			alertStatus: true
		})
	}

	alertInputChange = (event, data) => {
		let alertObj = this.state.alertObj;		
		alertObj[data.name] = data.value;
		this.setState({
			alertObj
		})
	}

	setAlerts = () => {
		let params = {
			TableName: 'user_configuration_device',
			Key: {
				deviceId: this.props.match.params.device_id				
			},
			UpdateExpression: "set alertStatus = :alert_status, alertPercent = :alert_percent, " + 
			"watchHours = :watch_hours, prewarningHours = :prewarning_hours",
			ExpressionAttributeValues: {
				':alert_status': this.state.alertStatus,
				':alert_percent': this.state.alertObj.alert_percent,
				':watch_hours': this.state.alertObj.watch_hours,
				':prewarning_hours': this.state.alertObj.prewarning_hours
			},
			ReturnValues:"UPDATED_NEW"
		}
		docClient.update(params, (err, data) => {
			if (!err) {
				alert('Alert set successfully');
				this.closeAlertModal();
				localStorage.setItem('soil_watcher_alert_status', this.state.alertStatus)				
			}
		})
	}

	filterData = () => {
		let params = {
			TableName: 'soilwatcher_sensor_updates',
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
    			let isoDate;
    			let reverseMessageData = data.Items.sort((obj1, obj2) => {
					return obj2.lastSeen - obj1.lastSeen;
				});
    			reverseMessageData.forEach((deviceData, index) => {
    				messageBody = deviceData['messageBody'] !== undefined ? deviceData['messageBody'] : ''
    				isoDate = new Date(deviceData.lastSeen).toISOString().split('.')[0];
	        		deviceMessageList.push({
	        			'createdOn': getFormatedDate(isoDate),	        			
	        			'topSensorValue': deviceData.topSensorValue,
	        			'midSensorValue': deviceData.midSensorValue,
	        			'bottSensorValue': deviceData.bottSensorValue,
	        			'errorStatus': JSON.parse(messageBody)['error'],
						'errorDescription': errorCodes[parseInt(JSON.parse(messageBody)['error'])],
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

    getHeaders = () => {
    	return {
    		'lastSeen': {
    			invisible: true
    		}
    	}
    }

	render() {
		const { zone_modal_open, zone_modal_dimmer, alert_modal_open, alert_modal_dimmer, config_label_modal, config_label_dimmer } = this.state;
		return (
			<React.Fragment>
				<MenuBar history = { this.props.history } />
				<div className="ui container" >
					<Grid>
						<Grid.Row>
							<Grid.Column>
								<Form style={{ display: 'flex', justifyContent: 'space-around', alignItems: 'center'}}>
									<Form.Field>
							          <Radio
							            label='Percent'
							            name='chartTypeSelection'
							            checked={!this.state.chartTypeSelection}
							            value={false}
							            onChange={this.handleRadioChange}
							          />
							       </Form.Field>
       								 <Form.Field>
							          <Radio
							            label='Raw Data'
							            name='chartTypeSelection'
							            checked={this.state.chartTypeSelection}
							            value={true}
							            onChange={this.handleRadioChange}
							          />
							        </Form.Field>
							        <Button icon labelPosition='left' onClick={this.zoneModalOpen}>
								      <Icon name='pencil' />
								      Edit Zones
								    </Button>
								     <Button icon labelPosition='left' onClick={this.alertModalOpen}>
								      <Icon name='alarm' />
								      Set Alert
								    </Button>
								    <Button icon labelPosition='left' onClick={this.configLableModalOpen}>
								      <Icon name='pencil' />
								      Edit Labels
								    </Button>
						      	</Form>
						    </Grid.Column>						    
						</Grid.Row>
						<Grid.Row>
							<Grid.Column>
								<p style={{textAlign: 'center', fontSize: '16px', fontWeight: 'bold'}}>{this.state.moistureObj.topMoistureLevel}cm Moisture Level</p>
							</Grid.Column>
						</Grid.Row>
						<Grid.Row>						
							<Grid.Column>
							{this.state.graphLoader ? 
								<Loader active>Loading</Loader>
								:												
								<HighchartsReact
						          highcharts={Highcharts}
						          constructorType={"stockChart"}						          
						          options={this.state.topValHighchartOption}
						        />
						    }
							</Grid.Column>
						</Grid.Row>
						<Grid.Row>
							<Grid.Column>
								<p style={{textAlign: 'center', fontSize: '16px', fontWeight: 'bold'}}>{this.state.moistureObj.midMoistureLevel}cm Moisture Level</p>
							</Grid.Column>
						</Grid.Row>
						<Grid.Row>							
							<Grid.Column>
							{this.state.graphLoader ? 
								<Loader active>Loading</Loader>
								:
								<HighchartsReact
						          highcharts={Highcharts}
						          constructorType={"stockChart"}						          
						          options={this.state.midValHighchartOption}
						        />
						    }
							</Grid.Column>
						</Grid.Row>
						<Grid.Row>
							<Grid.Column>
								<p style={{textAlign: 'center', fontSize: '16px', fontWeight: 'bold'}}>{this.state.moistureObj.botMoistureLevel}cm Moisture Level</p>
							</Grid.Column>
						</Grid.Row>						
						<Grid.Row>
							<Grid.Column>
							{this.state.graphLoader ? 
								<Loader active>Loading</Loader>
								:
								<HighchartsReact
						          highcharts={Highcharts}
						          constructorType={"stockChart"}						          
						          options={this.state.botValHighchartOption}
						        />
						    }
							</Grid.Column>
						</Grid.Row>
						<Grid.Row columns={3}>
							<Grid.Column>
								<Checkbox label="topValue" name="topVal" checked={this.state.sensorAverage.topVal} onChange={this.checkboxChangeHandler} />
							</Grid.Column>
							<Grid.Column>
								<Checkbox label="midValue" name="midVal" checked={this.state.sensorAverage.midVal} onChange={this.checkboxChangeHandler} />
							</Grid.Column>
							<Grid.Column>
								<Checkbox label="botValue" name="botVal" checked={this.state.sensorAverage.botVal} onChange={this.checkboxChangeHandler} />
							</Grid.Column>							
						</Grid.Row>
						{this.state.averageValueHighchartOptions.hasOwnProperty('title') &&
						<Grid.Row>
							<Grid.Column>
								<HighchartsReact
						          highcharts={Highcharts}
						          constructorType={"stockChart"}						          						          
						          options={this.state.averageValueHighchartOptions}
						        />
							</Grid.Column>
						</Grid.Row>
					}
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
									headers={this.getHeaders}
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
					<ZoneConfigurationModal
						visible={zone_modal_open}
						dimmer={zone_modal_dimmer}
						open={zone_modal_open}
						inputChangeHandler={this.handleZoneInputChange}
						stateObj={this.state.zoneObj}
						onCloseHandler={this.closeZoneModal}
						onSubmitHandler={this.setZones}
					/>
					<AlertConfigurationModal
						visible={alert_modal_open}
						dimmer={alert_modal_dimmer}
						open={alert_modal_open}
						onCloseHandler={this.closeAlertModal}
						onChangeHandler={this.toggleAlertConfiguration}
						alertStatus={this.state.alertStatus}
						alertInputChangeHandler={this.alertInputChange}
						stateObj={this.state.alertObj}
						onSubmitHandler={this.setAlerts}
					/>
					<SWLableConfigModal
						visible={config_label_modal}
						dimmer={config_label_dimmer}
						open={config_label_modal}
						onCloseHandler={this.closeConfigLableModal}
						stateObj={this.state.moistureObj}
						onSubmitHandler={this.updateLabels}
						inputChangeHandler={this.handleConfigLableInputChange}
						btnLoading={this.state.btnLoading}
					/>
				</div>
			</React.Fragment>
		);
	}

}

export default SoilWatcherSpecification;