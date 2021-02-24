import React from 'react';
import { Transition, Modal, Button } from 'semantic-ui-react';
import AddCompanyForm from '../Forms/add_company_form';

const CompanyModal = (props) => (
	<Transition visible={props.visible} animation='scale' duration={1000}>
			        <Modal 
			        closeOnEscape={true}
			        closeOnDimmerClick={false}
			        dimmer={props.dimmer}
			        open={props.open}
			        onClose={props.onCloseHandler}>

					<Modal.Header>{props.isForEdit ? 'Edit Company' : 'Add Company'}</Modal.Header>
			        <Modal.Content>
			            <Modal.Description>
			            	<AddCompanyForm
			            		stateObj={props.stateObj}
			            		inputChangeHandler={props.inputChangeHandler}
			            	/>
			            </Modal.Description>			            
			          </Modal.Content>
			          <Modal.Actions>
			            <Button color='black' onClick={props.onCloseHandler}>
			              Cancel
			            </Button>
			            <Button
			              positive
			              icon='checkmark'
			              labelPosition='right'
			              content="Submit"
			              onClick={props.companyFormSubmitHandler}
			              disabled={ !props.stateObj.company_name
			              	|| !props.stateObj.company_phone
			              	|| !props.stateObj.company_email
			              }
			              loading={props.btnState}
			            />
			          </Modal.Actions>
			        </Modal>
			        </Transition>
)

export default CompanyModal;