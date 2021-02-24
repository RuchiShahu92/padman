import React from 'react';
import { Transition, Modal, Form, Button, Select, Input, Divider, Header } from 'semantic-ui-react';

import FilterForm from '../Forms/filter_form';
import DeviceFilterForm from '../Forms/device_filter_form';
import VersionFilterForm from '../Forms/version_filter_form';
import DeviceRangeFilterForm from '../Forms/device_range_filter_form';
import BatteryFilterForm from '../Forms/battery_filter_form';
import CatMRssiFilterForm from '../Forms/catmrssi_filter_form';
import LoraRssiFilterForm from '../Forms/lorarssi_filter_form';
import LastSeenFilterForm from '../Forms/lastseen_filter_form';

const FilterColumnModal = (props) => (
	<Transition visible={props.visible} animation='scale' duration={1000}>
        <Modal
	        closeOnEscape={true}
	        closeOnDimmerClick={false}
	        dimmer={props.dimmer}
	        open={props.open}
	        onClose={props.onCloseHandler}
	        size="large"
	    >
			<Modal.Header> Apply Filters </Modal.Header>
			<Modal.Content scrolling style={{ minHeight: 'calc(60vh)'}}>
			    <Modal.Description>
			        <Form>
			        	<FilterForm
			        	numFilter={props.numFilter}
			        	incrementNumFilter={props.incrementNumFilter}
			        	filterInputChangeHandler={props.filterInputChangeHandler}
			        	applyFilter={props.applyFilter}
			        	decrementNumFilter={props.decrementNumFilter}
			        	companyNameOptions={props.companyNameOptions}
			        	/>
			        	<Divider horizontal>
			        		<Header as='h4'>
					        	Date Filter
					        </Header>
					    </Divider>
			        	<LastSeenFilterForm
							stateObj={props.stateObj}
					    	filterInputChangeHandler={props.dataFilterChange}
					    	operatorOptions={props.operatorOptions}
					    	showToFeild={props.showToFeild}
					    	operatorChangeHandler={props.operatorChangeHandler}
					    	applyDeviceRangeFilterHandler={props.applyDeviceRangeFilterHandler}
						/>
			        {
			        	/*<DeviceFilterForm
			        		options={props.options}
			        		deviceTypeChangeHandler={props.deviceTypeChangeHandler}
			        		deviceModeChangeHandler={props.deviceModeChangeHandler}
			        	/>

						<Divider horizontal>
							<Header as='h4'>						       
					        	Check for Firmware, MotherBoard and DaughterBoard VersionForm
					        </Header>
						</Divider>

					    <VersionFilterForm 
					    	stateObj={props.stateObj}
					    	filterInputChangeHandler={props.filterInputChangeHandler}
					    	applyVersionFilterHandler={props.applyVersionFilterHandler}
					    />

						<Divider horizontal>
					      	<Header as='h4'>						       
					        	Device Id
					      	</Header>
					    </Divider>

					    <DeviceRangeFilterForm
					    	stateObj={props.stateObj}
					    	filterInputChangeHandler={props.filterInputChangeHandler}
					    	operatorOptions={props.operatorOptions}
					    	showToFeild={props.showToFeild}
					    	operatorChangeHandler={props.operatorChangeHandler}
					    	applyDeviceRangeFilterHandler={props.applyDeviceRangeFilterHandler}
					    />

						<Divider horizontal>
					      <Header as='h4'>
					        Battery
					      </Header>
					    </Divider>

						<BatteryFilterForm
							stateObj={props.stateObj}
					    	filterInputChangeHandler={props.filterInputChangeHandler}
					    	operatorOptions={props.operatorOptions}
					    	showToFeild={props.showToFeild}
					    	operatorChangeHandler={props.operatorChangeHandler}
					    	applyDeviceRangeFilterHandler={props.applyDeviceRangeFilterHandler}	
						/>						  

					    <Divider horizontal>
					    	<Header as='h4'>						       
					        	CAt M Rssi
					        </Header>
					    </Divider>

					    <CatMRssiFilterForm
					    	stateObj={props.stateObj}
					    	filterInputChangeHandler={props.filterInputChangeHandler}
					    	operatorOptions={props.operatorOptions}
					    	showToFeild={props.showToFeild}
					    	operatorChangeHandler={props.operatorChangeHandler}
					    	applyDeviceRangeFilterHandler={props.applyDeviceRangeFilterHandler}	
						/>

						<Divider horizontal>
							<Header as='h4'>
								Lora Rssi
							</Header>
						</Divider>

						<LoraRssiFilterForm
							stateObj={props.stateObj}
					    	filterInputChangeHandler={props.filterInputChangeHandler}
					    	operatorOptions={props.operatorOptions}
					    	showToFeild={props.showToFeild}
					    	operatorChangeHandler={props.operatorChangeHandler}
					    	applyDeviceRangeFilterHandler={props.applyDeviceRangeFilterHandler}
						/>

						<Divider horizontal>
							<Header as='h4'>						       
						        Last Seen
						    </Header>
						</Divider>

						<LastSeenFilterForm
							stateObj={props.stateObj}
					    	filterInputChangeHandler={props.filterInputChangeHandler}
					    	operatorOptions={props.operatorOptions}
					    	showToFeild={props.showToFeild}
					    	operatorChangeHandler={props.operatorChangeHandler}
					    	applyDeviceRangeFilterHandler={props.applyDeviceRangeFilterHandler}
						/>*/
						}						
					</Form>
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
			      	content="Reset Filter"
			      	floated='right'
			      	onClick={props.resetFilter}
				/>
			</Modal.Actions>

		</Modal>
	</Transition>
)

export default FilterColumnModal;