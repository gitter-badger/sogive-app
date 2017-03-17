
import DataStore from './DataStore';
import ServerIO from './ServerIO';
import _ from 'lodash';
import {assert, assMatch} from 'sjtest';
import C from '../C.js';
import Login from 'hooru';

const ActionMan = {};

ActionMan.setDataValue = (path, valueOrEvent) => {
	let value = valueOrEvent.target? valueOrEvent.target.value : valueOrEvent;	
	assert(_.isArray(path), path);
	assert(C.TYPES.has(path[0]), path);
	// console.log('ActionMan.setValue', path, value);

	let newState = {};
	let tip = newState;	
	for(let pi=0; pi < path.length; pi++) {
		let pkey = path[pi];
		if (pi === path.length-1) {
			tip[pkey] = value;
			break;
		}
		// When to make an array? Let's leave that for the server to worry about.
		// Javascript is lenient on array/object for key->value access.
		let newTip = {};
		tip[pkey] = newTip;
		tip = newTip;
	}

	DataStore.update({data: newState});
};

ActionMan.showLogin = () => {
	DataStore.setShow(C.show.LoginWidget, true);
};

ActionMan.socialLogin = (service) => {
	assMatch(service, String);
	Login.auth(service);
};

ActionMan.saveCharity = (cid) => {
	assMatch(cid, String);
	let charity = DataStore.getData(C.TYPES.Charity, cid);
	ServerIO.saveCharity(charity)
	.then(DataStore.updateFromServer);
};

export default ActionMan;
