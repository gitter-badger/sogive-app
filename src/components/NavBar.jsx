import React from 'react';

import AccountMenu from './AccountMenu';

// BUG the navbar does not toggle closed :(
// And the react-bootstrap version of this with Navbar, NavItem seems to have bugs in NavItem's handling of clicks :'(
// ...yep, react-bootstrap's navbar has been broken for a year https://github.com/react-bootstrap/react-bootstrap/issues/2365
// Best solve ourselves

/**
 * 
 * @param {*} page The current page
 */
const NavBar = ({currentPage}) => {
	// make the page links
	let pageLinks = ['dashboard', 'search'].map( p => <NavLink currentPage={currentPage} targetPage={p} key={'li_'+p} /> );
	return (
		<nav className="navbar navbar-fixed-top navbar-inverse">
			<div className="container">
				<div className="navbar-header" title="Dashboard">
					<button
						type="button"
						className="navbar-toggle collapsed"
						data-toggle="collapse"
						data-target="#navbar"
						aria-expanded="false"
						aria-controls="navbar"
					>
						<span className="sr-only">Toggle navigation</span>
						<span className="icon-bar" />
						<span className="icon-bar" />
						<span className="icon-bar" />
					</button>
					<a className="" href="#dashboard">
						<img alt="SoGive logo" src="img/logo-white-sm.png" />
					</a>
				</div>
				<div id="navbar" className="navbar-collapse collapse">
					<ul className="nav navbar-nav">
						{pageLinks}
					</ul>
					<div>
						<AccountMenu active={currentPage === 'account'} />
					</div>
				</div>
			</div>
		</nav>
	);
};
// ./NavBar

const NavLink = ({currentPage, targetPage}) => {
	return (<li className={currentPage === targetPage? 'active' : ''}>
				<a className="nav-item nav-link" href={'#'+targetPage} >
					{targetPage}
				</a>
			</li>);
};

export default NavBar;
