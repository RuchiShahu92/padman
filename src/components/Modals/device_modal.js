import React from 'react';
import {Transition, Modal, Button} from 'semantic-ui-react';

import AddDeviceForm from '../Forms/add_device_form';
import {deviceForOption} from "../../app/constants";

const DeviceModal = (props) => (
    <Transition visible={props.open} animation='scale' duration={1000}>
        <Modal dimmer={props.dimmer} open={props.open}
               onClose={props.onCloseHandler}
               closeOnDimmerClick={false}
        >
            <Modal.Header>Add Device</Modal.Header>
            <Modal.Content>
                <Modal.Description>
                    <AddDeviceForm
                        deviceFor={props.deviceFor}
                        options={props.options}
                        versionOptions={props.versionOptions}
                        stateObj={props.stateObj}
                        inputChangeHandler={props.inputChangeHandler}
                        openCompanyModalHandler={props.openCompanyModalHandler}
                        companyNameOptions={props.companyNameOptions}
                        companyOptionLoadingState={props.companyOptionLoadingState}
                    />
                </Modal.Description>
            </Modal.Content>

            <Modal.Actions>
                <Button color='black' onClick={props.onCloseHandler}> Cancel </Button>
                <Button
                    positive
                    icon='checkmark'
                    labelPosition='right'
                    content="Submit"
                    onClick={props.deviceFormSubmitHandler}
                    disabled={!props.stateObj.device_id
                    || !props.stateObj.device_type
                    || !props.stateObj.company_name
                    || !props.stateObj.version
                    }
                    loading={props.btnState}
                />
            </Modal.Actions>
        </Modal>
    </Transition>
)

export default DeviceModal;