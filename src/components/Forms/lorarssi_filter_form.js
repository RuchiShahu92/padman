import React from 'react';
import { Form, Input, Select, Button } from 'semantic-ui-react';

const LoraRssiFilterForm = (props) => (
	<Form.Group>
	    <Form.Field
	        control={Select}
	        options={props.operatorOptions}						        
	        placeholder='Select Operator'						        						        
	        onChange={props.operatorChangeHandler}
	        name='to_loraRSSI_range'
	      />						      
	    <Form.Field
	        id='loraRSSI'
	        control={Input}						        
	        placeholder={props.showToFeild['to_loraRSSI_range'] ? 'From Lora RSSI': 'Lora RSSI'}
	        name='loraRSSI'
	        maxLength="2"
	        value={props.stateObj.loraRSSI}
	        onChange={props.filterInputChangeHandler}						        
	    />
      	{
      		props.showToFeild['to_loraRSSI_range'] &&							      
	  		<Form.Field
		        id='to_loraRSSI_range'
		        control={Input}							        
		        placeholder='To Lora Rssi'
		        name='to_loraRSSI_range'
		        maxLength="2"
		        value={props.stateObj.to_loraRSSI_range}
		        onChange={props.filterInputChangeHandler}						        
	      	/>
	    }

	    <Button
      		positive
      		icon='checkmark'
          	labelPosition='right'
          	content="Apply"
          	onClick={() => props.applyDeviceRangeFilterHandler('loraRSSI')}
          	disabled={ !props.stateObj.loraRSSI }
    	/>
	    </Form.Group>
);

export default LoraRssiFilterForm;