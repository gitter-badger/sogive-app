/** Data model functions for the NGO data-type */

import _ from 'lodash';
import {isa} from '../DataClass';
import {assert, assMatch} from 'sjtest';
import {blockProp} from 'wwutils';

const NGO = {};
export default NGO;

NGO.validate = (ngo) => {
	assMatch(ngo['@id'], String);
	blockProp(ngo, 'id');
	return ngo;
};

NGO.isa = (ngo) => isa(ngo, 'NGO');
NGO.name = (ngo) => isa(ngo, 'NGO') && ngo.name;
NGO.description = (ngo) => isa(ngo, 'NGO') && ngo.description;
NGO.id = (ngo) => assert(ngo['@id']);

NGO.getProject = (ngo) => {
	NGO.isa(ngo);
	const { projects } = ngo;

	// Representative and ready for use?
	const repProjects = _.filter(projects, (p) => (p.isRep && p.ready));

	// Get most recent, if more than one
	let repProject = repProjects.reduce((best, current) => {
		return (best.year > current.year) ? best : current;
	}, {year: 0});

	// ...or fall back.
	if (!repProject) {
		repProject = _.find(ngo.projects, p => p.name === 'overall');
	}

	if (!repProject) {
		repProject = ngo.projects && ngo.projects[0];
	}

	return repProject;
};

// {
// 	"donationWording" : "You enabled access to XXXX solar lights, well done!",
// 	"images" : "Waiting for Solar Aid to send",
// 	"stories" : "Waiting for Solar Aid to send",
// 	"indirectImpact" : 3900000.0,
// 	"@type" : "Project",
// 	"stories_src" : "",
// 	"isRep" : true,
// 	"data-src" : "http://www.solar-aid.org/assets/Uploads/Impact-week-2015/SolarAid-IMPACT-REPORT-2015.pdf",
// 	"fundraisingCosts" : {
// 		"@type" : "MonetaryAmount",
// 		"currency" : "GBP",
// 		"value" : 324602.0
// 	},
// 	"annualCosts" : {
// 		"@type" : "MonetaryAmount",
// 		"currency" : "GBP",
// 		"value" : 6326794.0
// 	},
// 	"ready" : true,
// 	"name" : "overall",
// 	"analyst" : "Sanjay",
// 	"location" : "",
// 	"directImpact" : 624443.0
// }

/*

impact {price, number, output}

*/

NGO.getImpacts = function(project) {

};
