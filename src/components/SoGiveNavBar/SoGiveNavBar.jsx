import React, { PropTypes } from 'react';
import { connect } from 'react-redux';
import { Link } from 'react-router';

import AccountMenu from '../AccountMenu';

// import { Nav, NavBar, NavItem } from 'react-bootstrap';
// https://react-bootstrap.github.io/components.html#navbars
// 	return (
// 			<NavBar inverse defaultExpanded>
// 					<NavBar.Header>
// 							<NavBar.Brand><a href="#"><img style={{maxWidth:'100px',maxHeight:'50px',background:'black'}} src="img/logo.png" /></a></NavBar.Brand>
// 							<Navbar.Toggle />
// 					</NavBar.Header>
// 					<Navbar.Collapse>
// 					<Nav>
// 							<NavBar.Brand><a href="#"><img style={{maxWidth:'100px',maxHeight:'50px',background:'black'}} src="img/logo.png" /></a></NavBar.Brand>
// 							<NavItem eventKey={1} href="#">Link</NavItem>
// 							<NavItem eventKey={2} href="#">Link</NavItem>
// 					</Nav>
// 					<Nav pullRight>
// 							<NavItem eventKey={1} href="#">Link Right</NavItem>
// 							<NavItem eventKey={2} href="#">Link Right</NavItem>
// 					</Nav>
// 					</Navbar.Collapse>
// 			</NavBar>
// 	);

const SoGiveNavBar = ({ page }) => {
	console.log('NavBar', page);

	return (
		<nav className="navbar navbar-fixed-top navbar-inverse">
			<div className="container">
				<div className="navbar-header" title="Dashbrd">
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
					<Link className="navbar-brand" to="/">
						<img alt="SoGive logo" style={{maxWidth:'100px',maxHeight:'50px',background:'black'}} src="img/logo.png" />
					</Link>
				</div>
				<div id="navbar" className="navbar-collapse collapse">
					<ul className="nav navbar-nav">
						<li className={page === 'dashboard'? 'active' : ''}>
							<Link className="nav-item nav-link" to="/dashboard">
								My Profile
							</Link></li>
						<li className={page === 'search'? 'active' : ''}>
							<Link className="nav-item nav-link" to="/search">
								Search
							</Link></li>
						<li className={page === 'charity'? 'active' : ''}>
							<Link className="nav-item nav-link" to="/charity">
								(dummy) Charity
							</Link>
						</li>
					</ul>
					<Link to="/account">
						<AccountMenu active={page === 'account'} />
					</Link>
				</div>
			</div>
		</nav>
	);
};
// ./NavBar

SoGiveNavBar.propTypes = {
	page: PropTypes.string.isRequired,
};


const mapStateToProps = (state, ownProps) => ({
	...ownProps,
});

export default connect(
  mapStateToProps,
)(SoGiveNavBar);
