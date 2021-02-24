import AWS from 'aws-sdk';

const AmazonCognitoIdentity = require('amazon-cognito-identity-js');

var awsIot = require('aws-iot-device-sdk');

export var docClient;

export function setAWSConfiguration() {
	AWS.config.region = 'ap-southeast-2'; // Region
	AWS.config.credentials = new AWS.CognitoIdentityCredentials({
	    IdentityPoolId: 'ap-southeast-2:12f2d93c-066f-49a0-8b58-093b2511acf7',
	    RoleArn: 'arn:aws:iam::420344081058:role/Cognito_jay_movie_tableUnauth_Role'
	});
	docClient = new AWS.DynamoDB.DocumentClient();	 
}

export function getRequireCognitoAccessKeys() {
	
	return AWS.config.credentials;
}

export function getdeviceInstance() {
	return new Promise((resolve, reject) => {
		let configInstance = getRequireCognitoAccessKeys();
		configInstance.get((erro) => {
			let { accessKeyId, secretAccessKey, sessionToken } =configInstance;
			let deviceInstance = awsIot.device({
		 		protocol: 'wss',
				host: 'a33i1b221n6do5-ats.iot.ap-southeast-2.amazonaws.com',
				region: 'ap-southeast-2',
				accessKeyId: accessKeyId,
				secretKey: secretAccessKey,
				sessionToken: sessionToken
			})

			resolve(deviceInstance);
		})
	})
}

export function getUserPool() {
	let data = {
		UserPoolId : 'ap-southeast-2_mWDRSOy4f',
		ClientId : '68p31534v0sn898cgpa76vs16g'
	};

	return new AmazonCognitoIdentity.CognitoUserPool(data);
}

export function getCognitoUser(username, userPool) {
	let userData = {
		Username : username,
		Pool : userPool
	};
	return new AmazonCognitoIdentity.CognitoUser(userData);
}

export function verifyAuthenticationDetails(authenticationData) {
	return new AmazonCognitoIdentity.AuthenticationDetails(authenticationData);
}

export function setIOTConfiguration() {
	return new AWS.IotData({
	  endpoint: 'a33i1b221n6do5-ats.iot.ap-southeast-2.amazonaws.com'
	});
}


export function getFormatedDate(date) {
	let dateObj = new Date(date);
	let formatDate = dateObj.getFullYear() + "-" + (dateObj.getMonth() + 1) + "-" + dateObj.getDate() + " at " + dateObj.getHours() + ":" + dateObj.getMinutes() + ":" + dateObj.getSeconds();
	return formatDate.replace(/\b(\d{1})\b/g, '0$1').replace(/s/g, '');
}

export function getActualFormatDate(date) {
	let dateObj = new Date(date);
	let formatDate = dateObj.getDate() + "-" + (dateObj.getMonth() + 1) + "-" + dateObj.getFullYear()  + " at " + dateObj.getHours() + ":" + dateObj.getMinutes() + ":" + dateObj.getSeconds();
	return formatDate.replace(/\b(\d{1})\b/g, '0$1').replace(/s/g, '');
}

export function formateMessageBody(msgBody) {
	let unEscapeMsgBody = unescape(msgBody);	
	return unEscapeMsgBody.split('\n').join(" ").split('+').join(" ");
}

export function getTimeLineFormatedDate(date) {
	let dateObj = new Date(date);
	let formatDate = dateObj.getUTCFullYear() + "-0" + (dateObj.getUTCMonth() + 1) + "-0" + dateObj.getUTCDate() + "T" + dateObj.getHours() + ":" + dateObj.getMinutes() + ":" + dateObj.getSeconds();
	console.log(formatDate)
	return formatDate;		
}

	export const errorCodes = {0x0000: 'Healthy', 0x0001: 'Latch Error', 0x0002: 'Modem Error',
    0x0004: 'MQTT Error', 0x0008: 'GPS ERROR', 0x0010: 'FTP Error', 0x0020: 'SIM Error',
    0x0100: 'ENCODER Error', 0x0200: 'MOTOR OVER CURRENT ERROR', 0x0400: 'MOTOR OVER LOAD ERROR',
    0x0800: 'BATTERY ERROR', 0x1000: 'POWER RESET ERROR'};