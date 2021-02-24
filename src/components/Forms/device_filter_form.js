import React from 'react';
import { Form, Input, Select, Button } from 'semantic-ui-react';

const deviceModeOption = [
	{key: 'all', text: 'All', value: 'All'},
	{key: 'standalone', text: 'Stand Alone', value: 'Standalone'},
	{key: 'gateway', text: 'Gateway', value: 'Gateway'},
]

const DeviceFilterForm = (props) => (
	<Form.Group>
    	<Form.Field
	        control={Select}
	        options={props.options}
	        label={{ children: 'Device Type', htmlFor: 'filter_device_type' }}
	        placeholder='Device Type'
	        search
	        searchInput={{ id: 'filter_device_type' }}
	        onChange={props.deviceTypeChangeHandler}
	      />
	    <Form.Field
	    	control={Select}
	        options={deviceModeOption}
	        label={{ children: 'Device Mode', htmlFor: 'filter_device_mode' }}
	        placeholder='Device Mode'
	        search
	        searchInput={{ id: 'filter_device_mode' }}
	        onChange={props.deviceModeChangeHandler}
	    />
	</Form.Group>
);

export default DeviceFilterForm;