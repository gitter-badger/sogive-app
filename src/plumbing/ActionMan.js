
import ServerIO from './ServerIO';
import DataStore from './DataStore';
import {assert} from 'sjtest';
import NGO from '../data/charity/NGO';
import Project from '../data/charity/Project';
import Citation from '../data/charity/Citation';
import _ from 'lodash';

const addCharity = () => {
	// TODO search the database for potential matches, and confirm with the user
	// get the info (just the name)
	let item = DataStore.appstate.widget.AddCharityWidget.form;
	assert(item.name);
	// TODO message the user!
	ServerIO.addCharity(item)
	.then(res => {
		alert("Success! Charity added");
		console.log("AddCharity", res);
		let charity = res.cargo;
		DataStore.setValue(['widget','AddCharityWidget','result','id'], NGO.id(charity));
	});
};


const addProject = ({charity, isOverall}) => {
	assert(NGO.isa(charity));
	let item = DataStore.appstate.widget.AddProject.form;
	if (isOverall) item.name = Project.overall;
	let proj = Project.make(item);
	// add to the charity	
	if ( ! charity.projects) charity.projects = [];
	charity.projects.push(proj);
	// clear the form
	DataStore.setValue(['widget', 'AddProject', 'form'], {});
};

const removeProject = ({charity, project}) => {
	assert(NGO.isa(charity));
	let i = charity.projects.indexOf(project);
	charity.projects.splice(i,1);
	// update
	DataStore.update();
};

const addInputOrOutput = ({list, ioPath, formPath}) => {
	assert(_.isArray(list), list);
	let item = DataStore.getValue(formPath);
	// Copy the form value to be safe against shared state? Not needed now setValue {} works.
	// item = Object.assign({}, item);
	// add to the list
	list.push(item);
	// clear the form
	DataStore.setValue(formPath, {});
};

const addDataSource = ({list, srcPath, formPath}) => {
	assert(_.isArray(list), list);
	let citation = Citation.make(DataStore.getValue(formPath));
	list.push(citation);
	// clear the form
	DataStore.setValue(formPath, {});
};

const ActionMan = {
	addCharity,
	addProject, removeProject,
	addInputOrOutput,
	addDataSource
};


export default ActionMan;
