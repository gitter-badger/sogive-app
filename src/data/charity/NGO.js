/** Data model functions for the NGO data-type */

import _ from 'lodash';
import {isa} from '../DataClass';
import {assert, assMatch} from 'sjtest';
import Project from './Project';
import Output from './Output';
import MonetaryAmount from './MonetaryAmount';
import HashMap from 'hashmap';
import Citation from './Citation';

/**
 * Each Charity (NGO -- which is the thing.org type) has projects.
 * "overall" is a project.
 * Each project has inputs and outputs. 
 * Each output is augmented with impact data.
 * There is a representative project -- this gives the impact that's reported.
 */

const NGO = {};
export default NGO;

NGO.isa = (ngo) => isa(ngo, 'NGO');
NGO.assIsa = (ngo) => assert(NGO.isa(ngo));
/**
 * Mostly you should use #displayName()!
 */
NGO.name = (ngo) => NGO.assIsa(ngo) && ngo.name;
NGO.displayName = (ngo) => ngo.displayName || ngo.name || NGO.id(ngo);
NGO.id = (ngo) => NGO.assIsa(ngo) && ngo['@id']; // thing.org id field
NGO.description = (ngo) => isa(ngo, 'NGO') && ngo.description;
NGO.image = (ngo) => NGO.assIsa(ngo) && ngo.images;
NGO.summaryDescription = (ngo) => ngo.summaryDescription;
NGO.registrationNumbers = (ngo) => {
	// TODO OSCR, companies house
	if (ngo.englandWalesCharityRegNum) return [{regulator:'Charity Commission', id:ngo.englandWalesCharityRegNum}];
	return [];
};
/**
 * @return {?Project} the representative project, or null if the charity is not ready.
 */
NGO.getProject = (ngo) => {
	NGO.assIsa(ngo);
	if ( ! NGO.isReady(ngo)) {
		return null;
	}
	let projects = NGO.getProjects2(ngo);
	// Get most recent, if more than one
	let repProject = projects.reduce((best, current) => {
		if ( ! current) return best;
		if ( ! best) return current;
		return best.year > current.year ? best : current;
	}, null);
	return repProject;
};

NGO.isReady = (ngo) => {
	NGO.assIsa(ngo);
	if (ngo.ready) return true;
	// HACK: handle older data, where ready was per-project
	// TODO upgrade the data
	if (ngo.ready === false) return false;
	if (ngo.projects) {
		if (ngo.projects.filter(p => p.ready).length) {
			return true;
		}
	}
	return false;
};

/**
 * @return {Project[]}
 */
NGO.getProjects2 = (ngo) => {
	const { projects } = ngo;
	if ( ! projects) {
		// Wot no projects? Could be a new addition
		NGO.assIsa(ngo);
		return [];
	}
	assert(_.isArray(projects), ngo);
	// We used to filter for ready, and never show unready. However ready/unready is now set at the charity level
	let readyProjects = projects; //.filter(p => p.ready);

	// Representative and ready for use?
	const repProjects = readyProjects.filter(p => p.isRep);
	if (repProjects.length) return repProjects;
	
	// ...or fall back.
	let oProjects = readyProjects.filter(p => Project.isOverall(p));
	if (oProjects.length) return oProjects;
	
	return readyProjects;
};

NGO.noPublicDonations = (ngo) => NGO.isa(ngo) && ngo.noPublicDonations;

/**
 * @return {MonetaryAmount}
 */
NGO.costPerBeneficiary = ({charity, project, output}) => {
	// Is an override present? Forget calculation and just return that.
	if (output && MonetaryAmount.isa(output.costPerBeneficiary)) {
		return output.costPerBeneficiary;
	}
	return NGO.costPerBeneficiaryCalc({charity, project, output});
};

/**
 * This ignores the override (if set)
 */
NGO.costPerBeneficiaryCalc = ({charity, project, output}) => {	
	let outputCount = output.number;
	if ( ! outputCount) return null;
	let projectCost = Project.getTotalCost(project);
	if ( ! projectCost) {
		console.warn("No project cost?!", project);
		return null;
	}
	MonetaryAmount.assIsa(projectCost);
	assMatch(outputCount, Number);
	let costPerOutput = MonetaryAmount.make(projectCost);
	costPerOutput.value = projectCost.value / outputCount;
	costPerOutput.value100 = Math.round(100 * costPerOutput.value);
	return costPerOutput;
};

/**
 * @returns {Citation[]} all the citations found
 */
NGO.getCitations = (charity) => {
	let refs = [];
	recurse(charity, node => {
		if (node['@type'] === 'Citation') {
			refs.push(node);
		} else if (node.source) {
			console.warn("converting to citation", node);
			refs.push(Citation.make(node));
		}
	});
	refs = _.uniq(refs);
	return refs;
};

/**
 * @param fn (value, key) -> `false` if you want to stop recursing deeper down this branch. Note: falsy will not stop recursion.
 * @returns nothing -- operates via side-effects
 */
const recurse = function(obj, fn, seen) {
	if ( ! obj) return;
	if (_.isString(obj) || _.isNumber(obj) || _.isBoolean(obj)) {
		return;
	}
	// no loops
	if ( ! seen) seen = new HashMap();
	if (seen.has(obj)) return;
	seen.set(obj, true);

	let keys = Object.keys(obj);
	keys.forEach(k => {
		let v = obj[k];
		if (v===null || v===undefined) {
			return;
		}
		let ok = fn(v, k);
		if (ok !== false) {
			recurse(v, fn, seen);
		}
	});
};
