import React from 'react';
import SmartDataTable from 'react-smart-data-table';

const DeviceTable = (props) => (
	<SmartDataTable
      data={props.deviceListData}					         
      headers={props.headers}
      name='device-table'
      className={props.className}
      filterValue={props.filterValue}
      perPage={30}
      sortable					          
      withLinks
      withHeader					          
      onRowClick={props.rowClickHandler}          
      dynamic
      emptyTable={(
        <div className={props.emptyDivClassName}>
          No device found, Please add Devices.
        </div>
      )}
   	/>
)

export default DeviceTable;