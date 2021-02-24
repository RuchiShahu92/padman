import React from 'react';
import {
	Transition,
	Modal,
	Button,
	Table	
} from 'semantic-ui-react';

const HeaderCellData = (props) => {
	return Object.keys(JSON.parse(props.deviceSpecificData.deviceSpecific)).map((headerCell, index) => (
				<Table.HeaderCell key={index}>{headerCell.charAt(0).toUpperCase() + headerCell.replace(/([a-z])([A-Z])/g, '$1 $2').substr(1)}</Table.HeaderCell>
			))
};

const CellData = (props) => {
	return Object.keys(JSON.parse(props.deviceSpecificData.deviceSpecific)).map((headerCell, index) => (
				<Table.Cell key={index}>{JSON.parse(props.deviceSpecificData.deviceSpecific)[headerCell]}</Table.Cell>
			))
}

const DeviceSpecificModal = (props) => (
	<Transition visible={props.visible} animation='scale' duration={1000}>
		<Modal			
			closeOnEscape={true}
			closeOnDimmerClick={false}
			dimmer={props.dimmer}
			open={props.open}
			onClose={props.onCloseHandler}
			>
			<Modal.Header>Device Specification of {props.deviceSpecificData.deviceId}</Modal.Header>
			<Modal.Content>
				<Modal.Description>
				<Table celled>
				<Table.Header>
				<Table.Row>				 
				{ 
					props.deviceSpecificData.deviceSpecific != undefined &&
						<HeaderCellData { ...props } />
				}
				</Table.Row>
				</Table.Header>
				    <Table.Body>				      
				      <Table.Row>				        
				        {				        	
							props.deviceSpecificData.deviceSpecific != undefined &&							
								<CellData { ...props } />
				        }
				      </Table.Row>
				    </Table.Body>
				</Table>
				</Modal.Description>
			</Modal.Content>
			<Modal.Actions>
	            <Button color='black' onClick={props.onCloseHandler}>
	              Cancel
	            </Button>
	        </Modal.Actions>
		</Modal>
	</Transition>
)

export default DeviceSpecificModal;