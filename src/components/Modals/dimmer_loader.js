import React from 'react';
import { Dimmer, Loader, Image, Segment } from 'semantic-ui-react';
import { paragraphIMage } from '../../app/constants';

const DimmerLoader = (props) => (
	<Dimmer.Dimmable as={Segment} blurring dimmed={false}>
      <Dimmer active={true}>
      	 <Loader />
      </Dimmer>
      <p>
        <Image src={paragraphIMage} style={{width: "100%"}} />
      </p>
      <p>
        <Image src={paragraphIMage} style={{width: "100%"}} />
      </p>     				          
    </Dimmer.Dimmable>
)
export default DimmerLoader;