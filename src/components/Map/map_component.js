import React, { Component } from 'react';
import {
  withScriptjs,
  withGoogleMap,
  GoogleMap,
  Marker,
  InfoWindow,
  Polyline
} from "react-google-maps";

const getSpecificItems = {
    'AW': 'http://maps.google.com/mapfiles/ms/icons/blue-dot.png',
    'AP': 'http://maps.google.com/mapfiles/ms/icons/blue-dot.png',
    'TT': 'http://maps.google.com/mapfiles/ms/icons/red-dot.png',
    'CI': 'http://maps.google.com/mapfiles/ms/icons/red-dot.png',
    'MM': 'http://maps.google.com/mapfiles/ms/icons/green-dot.png',
    'SW': 'http://maps.google.com/mapfiles/ms/icons/yellow-dot.png'
}

const MapComponent = withScriptjs(withGoogleMap((props) => (
  <GoogleMap
    defaultZoom={15}
     defaultCenter={props.defaultCenter}
     mapTypeId="satellite"
     defaultOptions={{ streetViewControl: true,
      scaleControl: false,
      mapTypeControl: true,
      panControl: false,
      zoomControl: true,
      rotateControl: true,
      fullscreenControl: true
    }}
    disableDefaultUI
  >
   	{
   		props.data.map((item, index) => 
   			<Marker key={index} position={{ lat: parseFloat(item['lat']), lng: parseFloat(item['lng']) }} 
   			icon={{
            url: getSpecificItems[item.deviceType],
            size: {
                width: 40,
                height: 40,
                widthUnit: 'px',
                heightUnit: 'px'
            }
        }}
   			onClick={props.handleToggle}
   			>
   			{ props.openMarker && 
   			<InfoWindow
						onCloseClick={props.handleToggle}
						>
					<span><a href="javascript:void(0);" onClick={() => props.rediretToSpecificationPage(item.deviceId, item.messageBody)}>{item.deviceId}</a></span>
				</InfoWindow>
			}
   			</Marker>
   		)
   	}   	
  </GoogleMap>
  ))
  )

export default MapComponent;