import React from 'react';
import { Form, Input, Select, Button } from 'semantic-ui-react';

const BatteryFilterForm = (props) => (
	<Form.Group>
	    <Form.Field
	        control={Select}
	        options={props.operatorOptions}						        
	        placeholder='Select Operator'						        						        
	        onChange={props.operatorChangeHandler}
	        name='to_battery_range'
	      />						      
	    <Form.Field
	        id='battery'
	        control={Input}						        
	        placeholder={props.showToFeild['to_battery_range'] ? 'From Battery': 'Battery'}
	        name='batt'
	        maxLength="3"
	        value={props.stateObj.batt}
	        onChange={props.filterInputChangeHandler}						        
	    />
      	{
      		props.showToFeild['to_battery_range'] &&							      
	  		<Form.Field
		        id='to_battery_range'
		        control={Input}							        
		        placeholder='To Battery'
		        name="to_batt_range"
		        maxLength="3"
		        value={props.stateObj.to_batt_range}
		        onChange={props.filterInputChangeHandler}						        
	      	/>
	    }

	    <Button
      		positive
      		icon='checkmark'
          	labelPosition='right'
          	content="Apply"
          	onClick={() => props.applyDeviceRangeFilterHandler('batt')}
          	disabled={ !props.stateObj.batt }			              
    	/>
	    </Form.Group>	
);

export default BatteryFilterForm;