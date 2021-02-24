import React from 'react';
import SmartDataTable from 'react-smart-data-table';

const UserTable = (props) => (
	<SmartDataTable
		data={props.userList}
		name="user-list"
		className={props.className}
		headers={props.headers}
		sortable
		dynamic
		perPage={20}
	/>
)

export default UserTable;