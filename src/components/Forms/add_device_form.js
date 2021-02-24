import React from 'react';
import {Form, Input, Select, Button} from 'semantic-ui-react';

const unitSelection = [
    {key: 'p', text: '%', value: '%'},
    {key: 'c', text: 'CM', value: 'cm'},
];

const AddDeviceForm = (props) => (

    <Form>
        <Form.Group widths='equal'>
            <Form.Field
                control={Select}
                options={props.options}
                label={{children: 'Device Type*', htmlFor: 'form-select-control-device_type'}}
                placeholder='Device Type'
                search
                searchInput={{id: 'form-select-control-device_type'}}
                value={props.stateObj.device_type}
                name="device_type"
                onChange={props.inputChangeHandler}
                type="select"
            />
            <Form.Field
                id='form-input-control-device-id'
                control={Input}
                label='Device Id*'
                placeholder='Device Id'
                name='device_id'
                value={props.stateObj.device_id}
                onChange={props.inputChangeHandler}
                maxLength="4"
            />
            <Form.Field>
                <label style={{display: 'flex'}}>
                    Company
                    <span
                        onClick={props.openCompanyModalHandler}
                        style={{marginLeft: 'auto', color: '#198f35', textDecoration: 'underline', cursor: 'pointer'}}
                    >Add Company
	      </span>
                </label>
                <Select
                    options={props.companyNameOptions}
                    placeholder='Company Name'
                    search
                    searchInput={{id: 'form-select-control-company-name'}}
                    value={props.stateObj.company_name}
                    name="company_name"
                    onChange={props.inputChangeHandler}
                    loading={props.companyOptionLoadingState}
                />
            </Form.Field>
            {(props.stateObj.device_type === "AI" || props.stateObj.device_type === "AP") &&
            <Form.Field
                control={Select}
                options={props.deviceFor}
                label={{children: 'Config Your Device For*', htmlFor: 'isSequence'}}
                placeholder='Device For'
                search
                searchInput={{id: 'isSequence'}}
                name="isSequence"
                onChange={props.inputChangeHandler}
                type="select"
            />
            }
        </Form.Group>

        <Form.Group widths='equal'>
            {
                <Form.Field
                    id='notes'
                    control={Input}
                    label='Notes'
                    placeholder='Notes'
                    name='notes'
                    value={props.stateObj.notes}
                    onChange={props.inputChangeHandler}
                />
            }
            <Form.Field
                control={Select}
                options={props.versionOptions}
                label={{children: 'Version*', htmlFor: 'form-select-control-version'}}
                placeholder='Version(Legacy or IOT)'
                search
                searchInput={{id: 'form-select-control-version'}}
                value={props.stateObj.version}
                name="version"
                onChange={props.inputChangeHandler}
                type="select"
            />
            <Form.Field
                id='form-input-control-phone'
                control={Input}
                label='Phone'
                placeholder='Phone'
                value={props.stateObj.device_phone}
                name='device_phone'
                onChange={props.inputChangeHandler}
            />
            <Form.Field
                id='form-input-control-alias'
                control={Input}
                label='Alias'
                placeholder='Alias'
                value={props.stateObj.device_alias}
                name='device_alias'
                onChange={props.inputChangeHandler}
            />            
        </Form.Group>        
        {props.stateObj.device_type === "MM" && 
        <div>    
        <Form.Group>
            <Form.Field
                control={Select}
                options={unitSelection}
                label='Select Unit*'
                placeholder='Select Unit'                            
                value={props.stateObj.unit}
                name="unit"
                onChange={props.inputChangeHandler}
                type="select"
            />            
        </Form.Group>
            {props.stateObj.unit == "%" &&            
                <Form.Group>
                    <Form.Field
                    id='form-input-control-0'
                    control={Input}
                    label='0%'
                    placeholder='0% value'
                    value={props.stateObj.zeroPercentValue}
                    name='zeroPercentValue'
                    onChange={props.inputChangeHandler}
                />
                <Form.Field
                    id='form-input-control-100'
                    control={Input}
                    label='100%'
                    placeholder='100% value'
                    value={props.stateObj.hundredPercentValue}
                    name='hundredPercentValue'
                    onChange={props.inputChangeHandler}
                />
            </Form.Group>
            }
            {props.stateObj.unit == "cm" &&
            <Form.Group>
                <div>
                <Form.Field
                    id='firstCm'
                    control={Input}                    
                    placeholder='0 cm'
                    value={props.stateObj.firstCm}
                    name='firstCm'
                    onChange={props.inputChangeHandler}
                />
                <Form.Field
                    id='form-input-control-0'
                    control={Input}
                    label={(props.stateObj.firstCm || 0)+ ' CM'}
                    placeholder='value'
                    value={props.stateObj.firstCmValue}
                    name='firstCmValue'
                    onChange={props.inputChangeHandler}
                />
                </div>
                <div>
                 <Form.Field
                    id='secondCm'
                    control={Input}                    
                    placeholder='0 cm'
                    value={props.stateObj.secondCm}
                    name='secondCm'
                    onChange={props.inputChangeHandler}
                />
                <Form.Field
                    id='secondCmValue'
                    control={Input}
                    label={(props.stateObj.secondCm || 0)+ ' CM'}
                    placeholder='value'
                    value={props.stateObj.secondCmValue}
                    name='secondCmValue'
                    onChange={props.inputChangeHandler}
                />
                </div>
                <div>
                <Form.Field
                    id='thirdCm'
                    control={Input}                    
                    placeholder='0 cm'
                    value={props.stateObj.thirdCm}
                    name='thirdCm'
                    onChange={props.inputChangeHandler}
                />
                <Form.Field
                    id='thirdCmValue'
                    control={Input}
                    label={(props.stateObj.thirdCm || 0)+ ' CM'}
                    placeholder='value'
                    value={props.stateObj.thirdCmValue}
                    name='thirdCmValue'
                    onChange={props.inputChangeHandler}
                />
                </div>
            </Form.Group>
        }
        </div>
    }
    {props.stateObj.device_type === "SW" && 
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
    }
    </Form>
);

export default AddDeviceForm;