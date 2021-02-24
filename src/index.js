import React from 'react';
import ReactDOM from 'react-dom';
import { BrowserRouter } from 'react-router-dom';
import 'semantic-ui-css/semantic.min.css';
import './index.css';
import App from './app';
import * as Sentry from '@sentry/browser';

import * as serviceWorker from './serviceWorker';

//Sentry.init({dsn: "https://9274778fe11e444ebac47704c894bef2@sentry.mynividata.in/22"});

ReactDOM.render(
	(
		<BrowserRouter>
			<App />
		</BrowserRouter>
	), 
	document.getElementById('root'));

// If you want your app to work offline and load faster, you can change
// unregister() to register() below. Note this comes with some pitfalls.
// Learn more about service workers: http://bit.ly/CRA-PWA
serviceWorker.unregister();
