import React from 'react';
import { assert, assMatch } from 'sjtest';
import Login from 'you-again';
import _ from 'lodash';
import { XId } from 'wwutils';

import printer from '../utils/printer';
// import C from '../C';
import ServerIO from '../plumbing/ServerIO';
import DataStore from '../plumbing/DataStore';
// import ChartWidget from './ChartWidget';
import Misc from './Misc';
import {LoginLink} from './LoginWidget/LoginWidget';


const DashboardPage = () => {
	let user = Login.getUser();
	const pv = DataStore.fetch(['data','Donation'],	
		() => {
			return ServerIO.getDonations()
				.then(function(result) {
					let dons = result.cargo.hits;
					return dons;
				});
		});
	const donations = pv.value;

	let content;

	if ( ! user) {
		return (
			<div className="page DashboardPage">
				<h2>My Dashboard</h2>
				<div><LoginLink title='Login or Register' /> to track your donations</div>
			</div>
		);
	}
	if ( ! donations) {		
		content = <Misc.Loading />;
	} else {
		content = (
			<div>
				<DashboardWidget title="Donation History">
					<DonationList donations={donations} />
				</DashboardWidget>
				{donations.length? null : 
					<DashboardWidget title='Welcome to SoGive'>
						Get started by <a href='/#search'>searching</a> for a charity.
					</DashboardWidget>
				}
			</div>
		);
	}

	// display...
	return (
		<div className="page DashboardPage">
			<h2>My Dashboard</h2>
			{ content }
		</div>
	);
}; // ./DashboardPage


const DonationList = ({donations}) => {
	return <div>{ _.map(donations, d => <Donation key={'d'+d.id} donation={d} />) }</div>;
};

const Donation = ({donation}) => {
	let niceName = XId.id(donation.to).split('-');
	niceName = niceName.map((word) => word.charAt(0).toUpperCase() + word.slice(1));
	niceName = niceName.join(' ');
	const impact = donation.impact? <div>Your donation funded {printer.prettyNumber(donation.impact.count, 2)} {donation.impact.unit}</div> : null;
	return (
		<div className='well'>
			<Misc.Time time={donation.date} /> &nbsp;
			You donated <Misc.Money precision={false} amount={donation.total} /> to <a href={'#charity?charityId='+XId.id(donation.to)}>{niceName}</a>.
			{impact}
			<div>GiftAid? {donation.giftAid? 'yes' : 'no'} <br />
			<small>Payment ID: {donation.paymentId}</small></div>
		</div>
	);
};

		/*<h2>Version 2+...</h2>
		<DashboardWidget title="News Feed">
			Updates from projects you support and people you follow.
		</DashboardWidget>

		<DashboardWidget title="Your Donations over Time">
			<ChartWidget type="line" />
		</DashboardWidget>

		<DashboardWidget title="Donations by Category">
			Pie chart of what you give to
		</DashboardWidget>

		<DashboardWidget title="Your Badges">
			Badges (encouraging use of all features, and repeated use -- but not extra £s)
		</DashboardWidget>

		<DashboardWidget title="Recent Donations">
			List of recent donations and impacts, with a link to the full history
		</DashboardWidget>*/


const DashboardWidget = ({ children, iconClass, title }) =>
	(<div className="panel panel-default">
		<div className="panel-heading">
			<h3 className="panel-title"><DashTitleIcon iconClass={iconClass} /> {title || ''}</h3>
		</div>
		<div className="panel-body">
			{children}
		</div>
</div>);
// ./DashboardWidget

const DashTitleIcon = ({ iconClass }) =>
	<i className={iconClass} aria-hidden="true" />;

export default DashboardPage;
