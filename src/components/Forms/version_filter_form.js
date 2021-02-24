import React from 'react';
import { Form, Input, Button } from 'semantic-ui-react';

const VersionFilterForm = (props) => (
	<Form.Group>
	 	<Form.Field
	        id='fw'
	        control={Input}						        
	        placeholder='Firmware Version'
	        name='FW'
	        value={props.stateObj.FW}
	        onChange={props.filterInputChangeHandler}
	    />
	    <Form.Field
	        id='moBo'
	        control={Input}						        
	        placeholder='MotherBoard Version'
	        name='moBo'
	        value={props.stateObj.moBo}
	        onChange={props.filterInputChangeHandler}						        
	    />
	    <Form.Field
	        id='daBo'
	        control={Input}						        
	        placeholder='DaughterBoard Version'
	        name='daBo'
	        value={props.stateObj.daBo}
	        onChange={props.filterInputChangeHandler}						        
	    />
	    <Button
      		positive
      		icon='checkmark'
          	labelPosition='right'
          	content="Apply"
          	onClick={props.applyVersionFilterHandler}
          	disabled={!props.stateObj.FW ||
          		!props.stateObj.moBo ||
          		!props.stateObj.daBo
          	}				              
    	/>
	 </Form.Group>
);

export default VersionFilterForm;
