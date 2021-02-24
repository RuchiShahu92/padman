import React from 'react';
import { Transition, Modal, Button, Form, Input, Checkbox } from 'semantic-ui-react';


const AlertConfigurationModal = (props) => (
	<Transition visible={props.open} animation='scale' duration={1000}>
		<Modal dimmer={props.dimmer} open={props.open} 
			onClose={props.onCloseHandler} 
			closeOnDimmerClick={false}
		>
			<Modal.Header> Set Alert </Modal.Header>
			<Modal.Content>
				<Modal.Description>
					<Form>
						<Form.Group width='equal'>
							<Checkbox slider
								onChange={props.onChangeHandler}
								checked={props.alertStatus}										
								 />
						</Form.Group>
						<Form.Group widths='equal'>
							<Form.Field
						        id='alert_percent'
						        name='alert_percent'
						        control={Input}
						        label='Set alert percent'
						        value={props.stateObj.alert_percent}
						        placeholder="for e.g., 30%"
						        onChange={props.alertInputChangeHandler}
						        autocomplete='off'
						        disabled={!props.alertStatus}
						      />
						      <Form.Field
						        id='watch_hours'
						        name='watch_hours'
						        control={Input}
						        label='Set Watch Hours'
						        value={props.stateObj.watch_hours}
						        placeholder="for e.g., 36 Hours"
						        onChange={props.alertInputChangeHandler}
						        autocomplete='off'
						        disabled={!props.alertStatus}
						      />
						      <Form.Field
						        id='prewarning_hours'
						        name='prewarning_hours'
						        control={Input}
						        label='Set Prewarnig Hours'
						        value={props.stateObj.prewarning_hours}
						        placeholder="for e.g., 72 Hours"
						        onChange={props.alertInputChangeHandler}
						        autocomplete='off'
						        disabled={!props.alertStatus}
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
					onClick={props.onSubmitHandler}
				/>
			</Modal.Actions>
		</Modal>
	</Transition>
);

export default AlertConfigurationModal;