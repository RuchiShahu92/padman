import React from 'react';
import SmartDataTable from 'react-smart-data-table';

const AutoWinchTable = (props) => (
	<SmartDataTable
		data={props.commandStack}
		name="auto-winch-command-stack"
		className={props.className}
		headers={props.headers}
		sortable
		dynamic
		perPage={10}
		 emptyTable={(
        <div className={props.emptyDivClassName}>
          No Commands Found.
        </div>
      )}
	/>
)

export default AutoWinchTable;