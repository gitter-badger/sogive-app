import React from 'react';
import ReactDOM from 'react-dom';
import { createStore, combineReducers } from 'redux';
import { Provider } from 'react-redux';
import { Router, Route, IndexRoute, browserHistory } from 'react-router';
import { syncHistoryWithStore, routerReducer } from 'react-router-redux';

import reducers from './reducers';
import MainDiv from './components/MainDiv';

import DashboardPage from './components/DashboardPage';
import SearchPage from './components/SearchPage';
import AccountPage from './components/Account';
import DonateToCampaignPage from './components/DonateToCampaignPage';
import CharityPage from './components/CharityPage';

const store = createStore(
	combineReducers({
		...reducers,
		routing: routerReducer,
	})
);
const history = syncHistoryWithStore(browserHistory, store);

ReactDOM.render(
	<Provider store={store}>
		<Router history={history}>
			<Route path='/' component={MainDiv}>
				<IndexRoute component={DashboardPage} />
				<Route path='dashboard' component={DashboardPage} />
				<Route path='search' component={SearchPage} />
				<Route path='account' component={AccountPage} />
				<Route path='donate' component={DonateToCampaignPage} />
				<Route path='charity/:charityId' component={CharityPage} />
			</Route>
		</Router>
	</Provider>,
	document.getElementById('mainDiv'));
