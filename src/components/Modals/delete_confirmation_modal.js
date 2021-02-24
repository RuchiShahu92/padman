import React from 'react';
import { Transition, Modal, Button } from 'semantic-ui-react';

const DeleteConfirmationModal = (props) => (
	<Transition visible={props.visible} animation='scale' duration={1000}>
			        <Modal 
			        closeOnEscape={true}
			        closeOnDimmerClick={false}
			        dimmer={props.dimmer}
			        open={props.open}
			        onClose={props.onCloseHandler}>

					<Modal.Header>Delete {props.name} </Modal.Header>
			        <Modal.Content>
			            <Modal.Description>
			            	Are you sure you want to delete ?
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
			              content="Delete"
			              onClick={() => {props.handleDelete(props.value)}}
			              loading={props.btnState}
			            />
			          </Modal.Actions>
			        </Modal>
			        </Transition>
)

export default DeleteConfirmationModal;