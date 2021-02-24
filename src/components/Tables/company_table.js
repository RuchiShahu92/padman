import React from 'react';
import SmartDataTable from 'react-smart-data-table';

const CompanyTable = (props) => (
	<SmartDataTable
		data={props.companyList}
		name="company-list"
		className={props.className}
		headers={props.headers}
		filterValue={props.filterValue}
		sortable
		dynamic
		onRowClick={props.rowClickHandler}
		perPage={10}
	/>
)

export default CompanyTable;