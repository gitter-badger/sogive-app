import React, { Component, PropTypes } from 'react';
import { connect } from 'react-redux';

import { assert } from 'sjtest';

// import LoginWidget from './LoginWidget.jsx';
// import printer from '../../utils/printer.js';
import { getUrlVars } from 'wwutils';

// import {XId,yessy,uid} from '../js/util/orla-utils.js';
// import C from '../../C.js';

// Templates
import MessageBar from '../MessageBar';
import SoGiveNavBar from '../SoGiveNavBar';

/**
		Top-level: SoGive tabs
*/
const MainDiv = ({ page }) => (
	<div>
		<SoGiveNavBar />
		<div className="container avoid-navbar">
			<MessageBar />
			{ page }
		</div>
	</div>
);

// only serves to set default charity...
	// constructor() {
	// 	super();
	// 	const pageProps = getUrlVars();
	// 	// FIXME
	// 	pageProps.charityId = 'solar-aid';
	// 	this.state = { pageProps };
	// }

/**
 * This function maps parts of the Redux central state object onto the component's props.
 * We can use deep refs like state.navigation.previousTab...
 * ...and we can use dynamic refs like state.xids[ownProps.user].bio
 * We can also disregard the supplied props by omitting ownProps.
 */
const mapStateToProps = (state, ownProps) => ({
	...ownProps,
});

export default connect(
  mapStateToProps,
)(MainDiv);

