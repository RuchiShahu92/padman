import React from 'react';
import { Transition, Modal, Button } from 'semantic-ui-react';
import AddUserForm from '../Forms/add_user_form';

const UserModal = (props) => (
	<Transition visible={props.visible} animation='scale' duration={1000}>
			        <Modal 
			        closeOnEscape={true}
			        closeOnDimmerClick={false}
			        dimmer={props.dimmer}
			        open={props.open}
			        onClose={props.onCloseHandler}>

					<Modal.Header>{props.editMode ? 'Edit User' : 'Add User' }</Modal.Header>
			        <Modal.Content>
			            <Modal.Description>
			            	<AddUserForm
			            		stateObj={props.stateObj}
			            		inputChangeHandler={props.inputChangeHandler}
			            	/>
			            </Modal.Description>			            
			          </Modal.Content>
			          <Modal.Actions>
			            <Button color='black' onClick={props.onCloseHandler}>
			              Cancel
			            </Button>
			            {
			            	props.editMode ? 
			            	<Button
				              positive
				              icon='checkmark'
				              labelPosition='right'
				              content="Update"
				              onClick={props.updateUserDetails}
				              loading={props.btnState}
				            />
			            :
			            <Button
			              positive
			              icon='checkmark'
			              labelPosition='right'
			              content="Submit"
			              onClick={props.userFormSubmitHandler}			              
			              loading={props.btnState}
			            />
			        }
			          </Modal.Actions>
			        </Modal>
			        </Transition>
)

export default UserModal;