import React from 'react';
import { Form, Input, Select, Button } from 'semantic-ui-react';

const CatMRssiFilterForm = (props) => (
	<Form.Group>
	    <Form.Field
	        control={Select}
	        options={props.operatorOptions}						        
	        placeholder='Select Operator'						        						        
	        onChange={props.operatorChangeHandler}
	        name='to_cat_range'
	      />						      
	    <Form.Field
	        id='cat_m_rssi'
	        control={Input}						        
	        placeholder={props.showToFeild['to_cat_range'] ? 'From CAt M Rssi': 'CAt M Rssi'}
	        name='catM1RSSI'
	        maxLength="2"	    
	        value={props.stateObj.catM1RSSI}
	        onChange={props.filterInputChangeHandler}						        
	    />
	  	{
	  		props.showToFeild['to_cat_range'] &&							      
	  		<Form.Field
		        id='to_cat_range'
		        control={Input}							        
		        placeholder='To Cat M Rssi'
		        name="to_catM1RSSI_range"
		        maxLength="2"
		        value={props.stateObj.to_catM1RSSI_range}
		        onChange={props.filterInputChangeHandler}						        
	      	/>
	    }

	    <Button
	  		positive
	  		icon='checkmark'
	      	labelPosition='right'
	      	content="Apply"
	      	onClick={() => props.applyDeviceRangeFilterHandler('catM1RSSI')}
	      	disabled={ !props.stateObj.catM1RSSI}
		/>
	    </Form.Group>
);

export default CatMRssiFilterForm;