import React from 'react';
export const sematicUI = {
  segment: 'ui basic segment',
  message: 'ui message',
  input: 'ui icon input',
  searchIcon: 'search icon',
  rowsIcon: 'numbered list icon',
  table: 'ui compact selectable table',
  select: 'ui dropdown',
  refresh: 'ui labeled primary icon button',
  refreshIcon: 'sync alternate icon',
  change: 'ui labeled secondary icon button',
  changeIcon: 'exchange icon',
  checkbox: 'ui toggle checkbox',
  loader: 'ui active text loader',
  deleteIcon: 'trash red icon',
}

export const toggleColumnItems = [
'deviceId', 'version','companyName', 'bpCode', 'batt', 'mac',
'deviceType', 'deviceMode', 'alias', 'paired', 'lat long',
'FW', 'modemFW', 'moBo', 'daBo', 'catM1RSSI', 'loraRSSI',
'lastSeen', 'createdOn'
];

export const paragraphIMage = require('../paragraph.png');

export const deviceTypeOptions = [
  {key: 'a', text: 'AW', value: 'AW'},
  { key: 's', text: 'SW', value: 'SW' },
  { key: 'w', text: 'MM', value: 'MM' },
  { key: 'e', text: 'EDT', value: 'EDT' },
  { key: 't', text: 'TT', value: 'TT' },
  { key: 'ai', text: 'AI', value: 'AI' },
  { key: 'ap', text: 'AP', value: 'AP' },
  { key: 'cb', text: 'CB', value: 'CB' },
  { key: 'ci', text: 'CI', value: 'CI' },
  { key: 'ww', text: 'WW', value: 'WW' }
];

export const deviceForOption = [
    { key: 'p', text: 'Paired', value: 'Paired'},
    { key: 's', text: 'Sequence', value: 'Sequence'}
]

export const filterDeviceTypeOptions = [
{ key: 'all', text: 'All', value: 'ALL' },
  ...deviceTypeOptions,
];

export const filterOperatorWiseOption = [
  {key: 'between', text: 'Between', value: 'Between'},
  {key: 'lessthan', text: '<=', value: '<='},
  {key: 'greaterthan', text: '>=', value: '>='},
];

export const versionOptions = [
  {key: 'l', text: 'Legacy', value: 'legacy'},
  {key: 'i', text: 'IOT', value: 'iot'}
];

export const getPaths = {
  'WW': '/water-watcher/',
  'SW': '/soil-watcher/',  
  'TT': '/talking-tower/',
  'AI': '/autowinch/',
  'AP': '/autowinch/',
  'MM': '/water-watcher/',
  'CI': '/talking-tower/'
}

export const headers = {
        'companyId': {
          text: 'companyId',
          invisible: true
        },
        'deviceId': {
          invisible: false,
          transform: (value, idx) => (
            <a href="javascript:void(0);" rel="noopener noreferrer" style={{ textDecoration: 'underline'}}>{value}</a>
          )
        },
        'version': {
          invisible: false
        }, 
        'companyName': {
          invisible: false
        },
        'bpCode': {
          invisible: false
        },
        'mac': {
          invisible: false
        },
        'deviceType': {invisible: false},
        'deviceMode': {invisible: false},
        'alias': {invisible: false},
        'lastSeen': {invisible: false},
        'paired': {invisible: false},
        'devicePhone': {
          invisible: false
        },        
        'batt': {invisible: false},
        'catM1RSSI': {invisible: false},
        'loraRSSI': {invisible: false},
        'FW': {invisible: false},
        'modemFW': {invisible: false},
        'moBo': {invisible: false},
        'daBo': {invisible: false},        
        'lon': {invisible: false},        
        'createdOn': {invisible: false},        
        'lat long': {
          invisible: false,
          transform: (value, idx) => (
            <a href={"https://www.google.com/maps/search/?api=1&query=" + value } rel="noopener noreferrer">{value}</a>
          )
        },
        'deviceSpecific': {
          invisible: true
        },
        alertStatus:{
          invisible: true
        },
        'pairedDevices': {
          invisible: true
        }
  }

export default {
  sematicUI,
  toggleColumnItems,
  paragraphIMage,
  deviceTypeOptions,
  headers,
  filterDeviceTypeOptions,
  getPaths,
  versionOptions
}