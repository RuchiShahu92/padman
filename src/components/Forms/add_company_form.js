import React from 'react';
import { Form, Input, Checkbox } from 'semantic-ui-react';

const AddCompanyForm = (props) => (
	<Form>
	    <Form.Group widths='equal'>							      
	      <Form.Field
	        id='company_name'
	        control={Input}
	        label='Company Name'
	        placeholder='Company Name*'
	        name='company_name'
	        value={props.stateObj.company_name}
	        onChange={props.inputChangeHandler}
	      />
	      <Form.Field
	        id='email'
	        control={Input}
	        label='Email*'
	        placeholder='Email'
	        name='company_email'
	        value={props.stateObj.company_email}
	        onChange={props.inputChangeHandler}
	      />
	      <Form.Field
	        id='phone'
	        control={Input}
	        label='Phone*'
	        placeholder='Phone'
	        name='company_phone'
	        value={props.stateObj.company_phone}
	        onChange={props.inputChangeHandler}
	      />
	    </Form.Group>
	     <Form.Group widths='equal'>
	     	<Form.Field
	        id='form-input-control-mac'
	        control={Input}
	        label='Address'
	        placeholder='Address'
	        name='company_address'
	        value={props.stateObj.company_address}
	        onChange={props.inputChangeHandler}
	      />
	      <Form.Field
	        id='form-input-control-phone'
	        control={Input}
	        label='Person Contact Name'
	        placeholder='Person Contact Name'
	        value={props.stateObj.person_contact_name}
	        name='person_contact_name'
	        onChange={props.inputChangeHandler}
	      />
	      <Form.Field
	        id='form-input-bpcode'
	        control={Input}
	        label='BP Code'
	        placeholder='BP Code'
	        name='bp_code'
	        value={props.stateObj.bp_code}
	        maxLength="6"
	        onChange={props.inputChangeHandler}	        
	      />
	      <Form.Field
	        id='form-input-control-alias'
	        control={Input}
	        label='Notes'
	        placeholder='Notes'
	        value={props.stateObj.notes}
	        name='notes'
	        onChange={props.inputChangeHandler}
	      />							     
	     </Form.Group>
	     <Form.Group widths='equal'>	     	
	       <Checkbox 
	       toggle 
	       label='Enable Access For Web'
	       name="is_web_access"
	       checked={props.stateObj.is_web_access}
	       onChange={props.inputChangeHandler}
	       />
	     </Form.Group>
	</Form>
);

export default AddCompanyForm;