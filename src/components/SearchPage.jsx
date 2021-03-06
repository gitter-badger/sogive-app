/* eslint-disable react/no-multi-comp */ // Don't complain about more than one React class in the file
import React from 'react';
import _ from 'lodash';
import { assert } from 'sjtest';
import {Button, Form, FormGroup, FormControl, Glyphicon, Media, InputGroup} from 'react-bootstrap';
import {uid, encURI, parseHash, modifyHash} from 'wwutils';
import Login from 'you-again';

import ServerIO from '../plumbing/ServerIO';
import DataStore from '../plumbing/DataStore';
import NGO from '../data/charity/NGO';
import Misc from './Misc';
import {ImpactDesc, impactCalc} from './ImpactWidgetry';
import C from '../C';

// #Minor TODO refactor to use DataStore more. Replace the FormControl with a Misc.PropControl

const RESULTS_PER_PAGE = 20;
const MAX_PAGES = 10;

export default class SearchPage extends React.Component {

	constructor(...params) {
		super(...params);
		this.state = {
			results: []
		};
	}

	setResults(results, total) {
		assert(_.isArray(results));
		this.setState({
			results: results,
			total: total
		});
	}

	render() {
		// query comes from the url
		let q = DataStore.getUrlValue('q');
		let from = DataStore.getUrlValue('from') || 0;
		let status = DataStore.getUrlValue('status') || '';
		if (q==='ERROR') { // HACK
			throw new Error("Argh!");
		}
		return (
			<div className='page SearchPage'>
				<div className='col-md-12'>
					<SearchForm query={q} from={from} status={status} setResults={this.setResults.bind(this)}/>
				</div>
				<div className='col-md-12'>
					<SearchResults results={this.state.results} total={this.state.total} query={q} />
				</div>
				<div className='col-md-12'>
					<SearchPager total={this.state.total} from={from} />
					<DownloadLink />
				</div>
				<div className='col-md-10'>
					<FeaturedCharities />
				</div>
			</div>
		);
	}
}

const FeaturedCharities = () => null; 
/*
<div> class='featured-charities''
	<p className='featured-charities-header'>
		Featured Charities
	<FeaturedCharities results={ { TODO a render-er for top-charities or a featured charity. When a search returns results, this should convert into a sidebar, or at least become hidden, and a sidebar should be generated. } }/>
	</p>
*/


class SearchForm extends React.Component {
	constructor(...params) {
		super(...params);
		this.state = {
			q: this.props.query,
		};
	}

	componentDidMount() {
		if (this.state.q) {
			this.search(this.state.q);
		}
	}

	// Allow hash change to provoke a new search
	componentWillReceiveProps(nextProps) {
		if (nextProps.query && (nextProps.query !== this.state.q || nextProps.from !== this.props.from || nextProps.status !== this.props.status)) {
			this.search(nextProps.query, nextProps.status, nextProps.from);
		}
	}

	onChange(name, e) {
		e.preventDefault();
		let newValue = e.target.value;
		let newState = {};
		newState[name] = newValue;
		this.setState(newState);
	}

	onSubmit(e) {
		e.preventDefault();
		console.warn("submit",this.state);
		this.search(this.state.q || '', this.props.status, this.props.from);
	}

	search(query, status, from) {
		// Put search query in URL so it's bookmarkable / shareable
		DataStore.setUrlValue("q", query);
		DataStore.setValue(['widget', 'Search', 'loading'], true);

		// hack to allow status=DRAFT
		ServerIO.search({q: query, from, size: RESULTS_PER_PAGE, status})
			.then(function(res) {
				console.warn(res);
				let charities = res.cargo.hits;
				let total = res.cargo.total;
				DataStore.setValue(['widget', 'Search', 'loading'], false);
				// DataStore.setValue([], { TODO
				// 	charities: charities,
				// 	total: total
				// });
				this.props.setResults(charities, total);
			}.bind(this));
	}

	showAll(e) {
		e.preventDefault();
		this.setState({q: ''});
		this.search('');
	}

	clear(e) {
		e.preventDefault();
		this.setState({q: ''});
	}

	render() {
		return (
			<div className='SearchForm'><Form onSubmit={(event) => { this.onSubmit(event); }} >
				<FormGroup className='' bsSize='lg' controlId="formq">
					<InputGroup bsSize='lg'>
						<FormControl
							className='sogive-search-box'
							type="search"
							value={this.state.q || ''}
							placeholder="Keyword search"
							onChange={(e) => this.onChange('q', e)}
						/>
						<FieldClearButton onClick={(e) => this.clear(e)}>
							<Glyphicon glyph='remove-circle' />
						</FieldClearButton>
						<InputGroup.Addon className='sogive-search-box' onClick={(e) => this.onSubmit(e)}>
							<Glyphicon glyph="search" />
						</InputGroup.Addon>
					</InputGroup>
				</FormGroup>
				<div className='pull-right'>
					<Button onClick={this.showAll.bind(this)} className="btn-showall" bsSize='sm'>
						Show All
					</Button>
				</div>
			</Form></div>
		);
	} // ./render
} //./SearchForm

const FieldClearButton = ({onClick, children}) => (
	<span className='field-clear-button visible-xs-block' onClick={onClick}>
		{children}
	</span>
);

const SearchResults = ({ results, total, query }) => {
	if ( ! results) results = [];
	// NB: looking for a ready project is deprecated, but left for backwards data compatibility
	// TODO adjust the DB to have ready always on the charity
	const ready = _.filter(results, NGO.isReady);
	const unready = _.filter(results, r => ! NGO.isReady(r) );
	return (
		<div className='SearchResults'>
			<SearchResultsNum results={results} total={total} query={query} />
			{ _.map(ready, item => <SearchResult key={uid()} item={item} />) }
			{unready.length? <div className='unready-results col-md-10'><h3>Analysis in progress</h3>SoGive is working to collect data and model the impact of every UK charity -- all 200,000.</div> : null}
			{ _.map(unready, item => <SearchResult key={uid()} item={item} />) }
		</div>);
}; //./SearchResults

const SearchResultsNum = ({results, total, query}) => {
	let loading = DataStore.getValue('widget', 'Search', 'loading');
	if (loading) return <div className='num-results'><Misc.Loading /></div>;
	if (results.length || query) return <div className='num-results'>{total} results found</div>;
	return <div className='num-results' />; // ?!
};

const SearchPager = ({total, from = 0}) => {
	const pageCount = Math.ceil(total / RESULTS_PER_PAGE);
	const thisPage = Math.ceil((from / RESULTS_PER_PAGE) + 1);
	const pageNumbers = [];
	if (pageCount > MAX_PAGES) {
		// Present a "nice" abbreviated list of page numbers
		// Always first and last, always 2 (if they exist) either side of current page
		if (thisPage <= 4) {
			for (let i = 1; i <= thisPage + 2; i++) {
				pageNumbers.push(i);
			}
			pageNumbers.push('…');
			pageNumbers.push(pageCount);
		} else if (thisPage >= pageCount - 3) {
			pageNumbers.push('1');
			pageNumbers.push('…');
			for (let i = thisPage - 2; i <= pageCount; i++) {
				pageNumbers.push(i);
			}
		} else {
			pageNumbers.push('1');
			pageNumbers.push('…');
			for (let i = thisPage - 2; i <= thisPage + 2; i++) {
				pageNumbers.push(i);
			}
			pageNumbers.push('…');
			pageNumbers.push(pageCount);
		}
	} else {
		for (let i = 1; i <= pageCount; i++) {
			pageNumbers.push(i);
		}
	}
	const pageLinks = pageNumbers.map((pageNum, index) => {
		if (Number.isInteger(pageNum)) {
			if (pageNum === thisPage) {
				return <span key={`search-page-${pageNum}`}>{pageNum}</span>;
			}
			const newFrom = (pageNum - 1) * RESULTS_PER_PAGE;
			const newHash = modifyHash(null, {from: newFrom}, true);
			const goToPage = (event) => {
				DataStore.setUrlValue('from', newFrom);
				event.stopPropagation();
				event.preventDefault();
			};
			return <a href={window.location.pathname + newHash} onClick={goToPage} key={`search-page-${pageNum}`}>{pageNum}</a>;
		}
		return <span key={`search-page-gap-${index}`}>{pageNum}</span>;
	});

	return <div>{pageLinks}</div>;
};

const DownloadLink = () => {
	if ( ! Login.isLoggedIn()) return null;
	const locn = ""+window.location;
	const qi = locn.indexOf('?');
	const qry = qi === -1? '' : locn.substr(qi+1);
	return (
		<a className='pull-right' 
			title='Download these reults in .csv (spreadsheet) format'
			href={'/search.csv?'+qry} 
			target='_new'>
			<Glyphicon glyph='download-alt' /> csv
		</a>
	);
};

const SearchResult = ({ item }) => {
	let project = NGO.getProject(item);
	let status = item.status;
	let page = status===C.STATUS.DRAFT? 'edit' : 'charity';
	return (
		<div className='SearchResult col-md-10' >
			<Media>
				<a href={'#'+page+'?charityId='+encURI(NGO.id(item))}>
					<Media.Left>
						{item.logo? <img className='charity-logo' src={item.logo} alt={`Logo for ${item.displayName || item.name}`} /> : null}
					</Media.Left>
					<Media.Body>
						<Media.Heading>{item.displayName || item.name}</Media.Heading>
						<p>{item.summaryDescription || item.description}</p>
						<ImpactDesc charity={item} project={project} outputs={project && project.outputs} amount={false} />
					</Media.Body>
				</a>
			</Media>
		</div>
	);
}; //./SearchResult
