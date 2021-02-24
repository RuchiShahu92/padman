import React from 'react';
import SmartDataTable from 'react-smart-data-table';

const PendingCommandsTable = (props) => (
	<SmartDataTable
		data={props.commandStack}
		name="pending-commands"
		className={props.className}		
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

export default PendingCommandsTable;