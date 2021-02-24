import React from 'react';
import { 
	Transition,
	Modal,
	Button,
	Form,
	Checkbox
} from 'semantic-ui-react';

const ColumnFields = (props) => {
	return props.toggleColumnItems.map((Items, index) => (
		<Form.Field key={index} style={{ marginBottom: '10px'}}>
	      <Checkbox label={Items}
	      toggle 								      
	      onChange={props.checkBoxChangeHandler} 
	      checked = {!props.checkBoxCheckedState[Items]['invisible']}
	      />
	    </Form.Field>
	))
}


const ColumnHideShowModal = (props) => (

<Transition visible={props.visible} animation='scale' duration={1000}>
			        <Modal 
			        size='tiny'
			        closeOnEscape={true}
			        closeOnDimmerClick={false}
			        dimmer={props.dimmer}
			        open={props.open}
			        onClose={props.onCloseHandler}>

					<Modal.Header>Hide or Show Columns</Modal.Header>
			        <Modal.Content scrolling>
			            <Modal.Description>
			            	<ColumnFields { ...props } />
			            </Modal.Description>
			        </Modal.Content>
			        <Modal.Actions>
			            <Button color='black' onClick={props.onCloseHandler}>
			              Cancel
			            </Button>
			        </Modal.Actions>
			        </Modal>
			    </Transition>

);

export default ColumnHideShowModal;