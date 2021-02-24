import React from 'react';
import { Form, Input, Select, Button, Icon, Divider, Header } from 'semantic-ui-react';

const columnList = [
	{key: 'dt', text: 'Device Type', value: 'deviceType'},
	{key: 'device_id', text: 'Device Id', value: 'deviceId'},
	{key: 'dm', text: 'Device Mode', value: 'deviceMode'},
	{key: 'dv', text: 'Device Version', value: 'version'},
	{key: 'bt', text: 'Battery', value: 'batt'},
	{key: 'fv', text: 'Firmware Version', value: 'FW'},
	{key: 'mfv', text: 'Modem Firmware Version', value: 'modemFW'},
	{key: 'cmp_name', text: 'Company Name', value: 'companyName'},
	{key: 'bp_code', text: 'BP Code', value: 'bpCode'},
	{key: 'cat_rssi', text: 'Cat M Rssi', value: 'catM1RSSI'},
	{key: 'lora_rssi', text: 'lora RSSI', value: 'loraRSSI'},
	{key: 'mobo', text: 'MotherBoard', value: 'moBo'},
	{key: 'dabo', text: 'DaughterBoard', value: 'daBo'},
	{key: 'paired', text: 'Paired', value: 'paired'},
];

const operatorOptions = [
	{key: 'eq', text: '=', value: '==='},
	{key: 'lteq', text: '<=', value: '<=='},
	{key: 'gteq', text: '>=', value: '>=='}
];

const dataTypes = [
	{key: 's', text: 'String', value: 'string'},
	{key: 'n', text: 'Number', value: 'number'},
	{key: 'f', text: 'Float', value: 'float'}
];

const FilterForm = (props) => (
	<div>	
	{props.numFilter.map((item, index) => (
		<div key={index}>
		{
			index >= 1 &&
		<Divider horizontal>
			<Header as='h4'>						       
	        	And
	        </Header>
		</Divider>		
		}
		<Form.Group style={{ alignItems: 'center'}}>
			<Form.Field
		        control={Select}
		        options={columnList}
		        label={{ children: 'Select Column', htmlFor: 'column_selection_' + index }}
		        placeholder='Select Column'
		        search
		        searchInput={{ id: 'column_selection_' + index }}
		        name="column"
		        id={"column_" + index}
		        value={props.numFilter[index]['column']}
		        onChange={props.filterInputChangeHandler}
		      />
		      <Form.Field
		        control={Select}
		        options={dataTypes}
		        label={{ children: 'Select Type', htmlFor: 'type_selection_' + index }}
		        placeholder='Select Type'
		        search
		        searchInput={{ id: 'type_selection_' + index }}
		        name="type"
		        id={"type_" + index}
		        value={props.numFilter[index]['type']}
		        onChange={props.filterInputChangeHandler}
		      />
		      <Form.Field
		        control={Select}
		        label={{ children: 'Select Operator', htmlFor: 'operator_selection' }}
		        options={operatorOptions}						        
		        placeholder='Select Operator'
		        searchInput={{ id: 'operator_selection' }}
		        name='operator'
		        id={"operator_" + index}
		        value={props.numFilter[index]['operator']}
		        onChange={props.filterInputChangeHandler}
		      />
		      {
		      	props.numFilter[index]['column'] !== "companyName" ?
		      	<Form.Field
		        id='value'
		        control={Input}
		        label={{ children: 'Enter Value', htmlFor: 'enter_value' }}
		        placeholder='Enter Value'
		        name='value'
		        id={"value_" + index}
		        value={props.numFilter[index]['value']}
		        onChange={props.filterInputChangeHandler}
		        />
		        :
		        <Form.Field
		        control={Select}
		        label={{ children: 'Select Company', htmlFor: 'company_selection' + index }}
		        options={props.companyNameOptions}
		        placeholder='Select Company'
		        search
		        searchInput={{ id: 'company_selection' + index }}
		        name="value"
		        id={"value_" + index}
		        value={props.numFilter[index]['value']}
		        onChange={props.filterInputChangeHandler}
		      />
		  }
		    <Icon name="plus" style={{cursor: 'pointer', marginLeft: '20px'}} onClick={props.incrementNumFilter}/>
		    { index >= 1 && <Icon name="minus" style={{cursor: 'pointer', marginLeft: '20px'}} onClick={() => { props.decrementNumFilter(index) }}/> }
	</Form.Group>
	</div>		
	))}	
	
		<div className="fields" style={{ justifyContent: 'flex-end' }} >			
			<Button
		  		positive
		  		icon='checkmark'
		      	labelPosition='right'
		      	content="Apply"		      	
		      	onClick={props.applyFilter}
			/>		
		</div>
	
	</div>
);

export default FilterForm;