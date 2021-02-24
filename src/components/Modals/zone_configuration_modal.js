import React from 'react';
import { Transition, Modal, Button, Form, Input } from 'semantic-ui-react';

const ZoneConfigurationModal = (props) => (
	<Transition visible={props.open} animation='scale' duration={1000}>
		<Modal dimmer={props.dimmer} open={props.open} 
			onClose={props.onCloseHandler} 
			closeOnDimmerClick={false}
		>
			<Modal.Header>Set Zones </Modal.Header>
			<Modal.Content>
				<Modal.Description>
					<Form>
						<Form.Group widths='equal'>
							 <Form.Field
						        id='top_stress_zone'
						        control={Input}
						        label='Top Stress Zone from 0'
						        placeholder='To*'
						        name='top_stress_zone'
						        value={props.stateObj.top_stress_zone}
						        onChange={props.inputChangeHandler}
						        autoComplete='off'
						      />
						      <Form.Field
						        id='top_growing_zone'
						        control={Input}
						        label= { 'Top Growing Zone From ' + props.stateObj.top_stress_zone}
						        placeholder='To*'
						        name='top_growing_zone'
						        value={props.stateObj.top_growing_zone}
						        onChange={props.inputChangeHandler}
						      />					      
						</Form.Group>
						<Form.Group widths='equal'>
							<Form.Field
						        id='mid_stress_zone'
						        control={Input}
						        label='Mid Stress Zone from 0'
						        placeholder='To*'
						        name='mid_stress_zone'
						        value={props.stateObj.mid_stress_zone}
						        onChange={props.inputChangeHandler}
						        autocomplete='off'
						      />
						      <Form.Field
						        id='mid_growing_zone'
						        control={Input}
						        label= { 'Mid Growing Zone From ' + props.stateObj.mid_stress_zone}
						        placeholder='To*'
						        name='mid_growing_zone'
						        value={props.stateObj.mid_growing_zone}
						        onChange={props.inputChangeHandler}
						      />
						</Form.Group>
						<Form.Group widths='equal'>
							<Form.Field
						        id='bot_stress_zone'
						        control={Input}
						        label='Bot Stress Zone from 0'
						        placeholder='To*'
						        name='bot_stress_zone'
						        value={props.stateObj.bot_stress_zone}
						        onChange={props.inputChangeHandler}
						        autocomplete='off'
						      />
						      <Form.Field
						        id='bot_growing_zone'
						        control={Input}
						        label= { 'Bot Growing Zone From ' + props.stateObj.bot_stress_zone}
						        placeholder='To*'
						        name='bot_growing_zone'
						        value={props.stateObj.bot_growing_zone}
						        onChange={props.inputChangeHandler}
						      /> 
						</Form.Group>
						<Form.Group widths='equal'>
							 <Form.Field
						        id='top_sensor_0_per_value'
						        control={Input}
						        label='Top Sensor 0% Value'
						        placeholder='0%*'
						        name='top_sensor_0_per_value'
						        value={props.stateObj.top_sensor_0_per_value}
						        onChange={props.inputChangeHandler}
						      />
						      <Form.Field
						        id='top_sensor_100_per_value'
						        control={Input}
						        label= 'Top Sensor 100% Value'
						        placeholder='100%*'
						        name='top_sensor_100_per_value'
						        value={props.stateObj.top_sensor_100_per_value}
						        onChange={props.inputChangeHandler}
						      />
						</Form.Group>
						<Form.Group widths='equal'>
							 <Form.Field
						        id='mid_sensor_0_per_value'
						        control={Input}
						        label='Mid Sensor 0% Value'
						        placeholder='0%*'
						        name='mid_sensor_0_per_value'
						        value={props.stateObj.mid_sensor_0_per_value}
						        onChange={props.inputChangeHandler}
						      />
						      <Form.Field
						        id='top_sensor_100_per_value'
						        control={Input}
						        label= 'Mid Sensor 100% Value'
						        placeholder='100%*'
						        name='mid_sensor_100_per_value'
						        value={props.stateObj.mid_sensor_100_per_value}
						        onChange={props.inputChangeHandler}
						      />
						</Form.Group>
						<Form.Group widths='equal'>
							 <Form.Field
						        id='bot_sensor_0_per_value'
						        control={Input}
						        label='Bottom Sensor 0% Value'
						        placeholder='0%*'
						        name='bot_sensor_0_per_value'
						        value={props.stateObj.bot_sensor_0_per_value}
						        onChange={props.inputChangeHandler}
						      />
						      <Form.Field
						        id='bot_sensor_100_per_value'
						        control={Input}
						        label='Bottom Sensor 100% Value'
						        placeholder='100%*'
						        name='bot_sensor_100_per_value'
						        value={props.stateObj.bot_sensor_100_per_value}
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
				onClick={props.onSubmitHandler}
				/>
			</Modal.Actions>
		</Modal>
	</Transition>
)

export default ZoneConfigurationModal;