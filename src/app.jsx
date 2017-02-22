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
				<IndexRoute component={{ page: DashboardPage }} />
				<Route path='dashboard' component={{ page: DashboardPage }} />
				<Route path='search' component={{ page: SearchPage }} />
				<Route path='account' component={{ page: AccountPage }} />
				<Route path='donate' component={{ page: DonateToCampaignPage }} />
				<Route path='charity/:charityId' component={{ page: CharityPage }} />
			</Route>
		</Router>
	</Provider>,
	document.getElementById('mainDiv'));
