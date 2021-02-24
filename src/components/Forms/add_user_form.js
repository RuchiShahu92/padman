import React from 'react';
import { Form, Input, Checkbox, Divider, Header, Select } from 'semantic-ui-react';

const options = [
	{key: 'a', text: 'Admin', value: 'Admin'},
	{key: 'v', text: 'Viewer', value: 'Viewer'},
];

const AddUserForm = (props) => (
	<Form>
	    <Form.Group widths='equal'>
	    <Form.Field
	        control={Select}
	        options={options}
	        label={{ children: 'User Type*', htmlFor: 'form-select-control-user-type' }}
	        placeholder='User Type'
	        search
	        searchInput={{ id: 'form-select-control-user-type' }}
	        value={props.stateObj.user_type}
	        name="user_type"
	        onChange={props.inputChangeHandler}
	        type="select"
	      />
	      <Form.Field
	        id='username'
	        control={Input}
	        label='User Name'
	        placeholder='User Name*'
	        name='username'
	        value={props.stateObj.username}
	        onChange={props.inputChangeHandler}
	      />
	      <Form.Field
	        id='email'
	        control={Input}
	        label='Email*'
	        placeholder='Email'
	        name='email'
	        value={props.stateObj.email}
	        onChange={props.inputChangeHandler}
	      />
	      <Form.Field
	        id='phone'
	        control={Input}
	        label='Phone'
	        placeholder='Phone'
	        name='phone'
	        value={props.stateObj.phone}
	        onChange={props.inputChangeHandler}
	      />
	    </Form.Group>
	    {props.stateObj.user_type === 'Viewer' && 
	    <div>
	    <Divider horizontal>
			<Header as='h4'>						       
	        	Set Permissions
	        </Header>
		</Divider>		
	     <Form.Group widths='equal'>
	     	<Checkbox 
	     	name="access_controll_device" 
	     	label="Access to control device and set sequence for autowinch" 
	     	checked={props.stateObj.permissions[0].access_controll_device}
	     	onChange={props.inputChangeHandler}
	     	index={0}
	     	/>
	     	<Checkbox 
	     	name="access_measure_meter" 
	     	label="Access to Modify Measure Meter"
	     	checked={props.stateObj.permissions[1].access_measure_meter}
	     	onChange={props.inputChangeHandler}
	     	index={1}
	     	/>
	     	<Checkbox 
	     	name="access_soil_watcher" 
	     	label="Access to Modify Soil Watcher" 
	     	checked={props.stateObj.permissions[2].access_soil_watcher}
	     	onChange={props.inputChangeHandler}
	     	index={2}
	     	/>
	     	<Checkbox 
	     	name="access_chatterbox_tnt" 
	     	label="Access to Modify ChatterBox and TNT" 
	     	checked={props.stateObj.permissions[3].access_chatterbox_tnt}
	     	onChange={props.inputChangeHandler}
	     	index={3}
	     	/>
	     </Form.Group>
	     </div>
	 }
	</Form>
);

export default AddUserForm;