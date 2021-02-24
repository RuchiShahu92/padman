import React from 'react';
import { Transition, Modal, Button, Form, Input, Checkbox } from 'semantic-ui-react';


const SWLableConfigModal = (props) => (
	<Transition visible={props.open} animation='scale' duration={1000}>
		<Modal dimmer={props.dimmer} open={props.open} 
			onClose={props.onCloseHandler} 
			closeOnDimmerClick={false}
		>
			<Modal.Header> Edit Labels </Modal.Header>
			<Modal.Content>
				<Modal.Description>
					<Form>
						<Form.Group>
				            <Form.Field
				                id='topMoistureLevel'
				                control={Input}
				                label='Top Moisture Level(in cm)'
				                placeholder='15'
				                value={props.stateObj.topMoistureLevel}
				                name='topMoistureLevel'
				                onChange={props.inputChangeHandler}
				            />
				             <Form.Field
				                id='midMoistureLevel'
				                control={Input}
				                label='Mid Moisture Level(in cm)'
				                placeholder='30'
				                value={props.stateObj.midMoistureLevel}
				                name='midMoistureLevel'
				                onChange={props.inputChangeHandler}
				            />
				             <Form.Field
				                id='botMoistureLevel'
				                control={Input}
				                label='Bottom Moisture Level(in cm)'
				                placeholder='50'
				                value={props.stateObj.botMoistureLevel}
				                name='botMoistureLevel'
				                onChange={props.inputChangeHandler}
				            />
				        </Form.Group>
					</Form>
				</Modal.Description>
			</Modal.Content>
			<Modal.Actions>
				<Button color='black' onClick={props.onCloseHandler}> Cancel </Button>
				<Button
					positive
					icon='checkmark'
					labelPosition='right'
					content="Submit"
					loading={props.btnLoading}
					onClick={props.onSubmitHandler}
				/>
			</Modal.Actions>
		</Modal>
	</Transition>
);

export default SWLableConfigModal;