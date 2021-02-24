import React from 'react';
import { Form, Input, Button, Select } from 'semantic-ui-react';

const DeviceRangeFilterForm = (props) => (
	<Form.Group>						   
	    <Form.Field
	        control={Select}
	        options={props.operatorOptions}						        
	        placeholder='Select Operator'						        						        
	        onChange={props.operatorChangeHandler}
	        name='to_device_id'
	      />						      
	    <Form.Field
	        id='deviceId'
	        control={Input}						        
	        placeholder={props.showToFeild['to_device_id'] ? 'From Device Id': 'Device Id'}
	        name='device_id'
	        value={props.stateObj.device_id}
	        onChange={props.filterInputChangeHandler}						        
	    />
	  	{
	  		props.showToFeild['to_device_id'] &&							      
	  		<Form.Field
		        id='to_device_id'
		        control={Input}							        
		        placeholder='To Device Id'
		        name="to_device_id"
		        value={props.stateObj.to_device_id}
		        onChange={props.filterInputChangeHandler}						        
	      	/>
	    }

	    <Button
	  		positive
	  		icon='checkmark'
	      	labelPosition='right'
	      	content="Apply"
	      	onClick={() => props.applyDeviceRangeFilterHandler('deviceId')}
	      	disabled={ !props.stateObj.device_id }
		/>
	    </Form.Group>
);

export default DeviceRangeFilterForm;