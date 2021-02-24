import React from 'react';
import { Form, Input, Select, Button } from 'semantic-ui-react';

const LastSeenFilterForm = (props) => (
	<Form.Group>
	    <Form.Field
	        control={Select}
	        options={props.operatorOptions}						        
	        placeholder='Select Operator'						        						        
	        onChange={props.operatorChangeHandler}
	        name='to_last_seen'
	      />	      
	      <div className="field">
	      	<div className="ui input">
	      		<input 
				    type='date'
				    name='lastSeen'
				    value={props.stateObj.lastSeen}
				    onChange={props.filterInputChangeHandler}						    
				    />
	      	</div>
	      </div>						    
      	{
      		props.showToFeild['to_last_seen'] &&
      		 <div className="field">
	      		<div className="ui input">
		      		<input 
					    type='date'
					    name='to_lastSeen_range'
					    value={props.stateObj.to_lastSeen_range}
					    onChange={props.filterInputChangeHandler}								    
					/>
				</div>
			</div>	  		
	    }

	    <Button
      		positive
      		icon='checkmark'
          	labelPosition='right'
          	content="Apply"
          	onClick={() => props.applyDeviceRangeFilterHandler('lastSeen')}
          	disabled={ !props.stateObj.lastSeen }
    	/>
	    </Form.Group>
);

export default LastSeenFilterForm;