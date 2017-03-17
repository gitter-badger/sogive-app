
import C from '../C.js';
import _ from 'lodash';
import {getType} from '../data/DataClass';
import {assert,assMatch} from 'sjtest';

class Store {	

	constructor() {
		this.callbacks = [];
		/** This is the data store! */
		this.appstate = {
			/** items from the server  */
			data:{}, 
			/** what are we focused on? type -> id */
			focus:{}, 
			show:{}, 
			widget:{}
		};
	}

	addListener(callback) {
		this.callbacks.push(callback);
	}

	update(newState) {
		console.log('update', newState);
		_.merge(this.appstate, newState);
		this.callbacks.forEach(fn => fn(this.appstate));
	}

	/**
	 * type, id
	 */
	getData(type, id) {
		assert(C.TYPES.has(type));
		assert(id, type);
		return this.appstate.data[type][id];
	}

	/**
	 * Convenience for handling undefined
	 * e.g. ['widget','foo','bar'] -- if 'foo' doesn't exist, returns null
	 */
	get(path) {
		let s = this.appstate;
		for(let pi=0; pi<path.length; pi++) {
			let k = path[pi];
			assert(k, path);
			let s2 = s[k];
			if ( ! s2) return null;
			s = s2;
		}
		return s;
	}

	setShow(thing, showing) {
		assMatch(thing, String);
		let s = {show: {}};
		s.show[thing] = showing;
		this.update(s);
	}

	updateFromServer(res) {
		console.log("updateFromServer", res);
		let hits = res.cargo && res.cargo.hits;
		if ( ! hits) return;
		let itemstate = {data:{}};
		hits.forEach(item => {
			try {
				let type = getType(item);
				if ( ! type) {
					// skip
					return;
				}
				assert(C.TYPES.has(type), item);
				let typemap = itemstate.data[type];
				if ( ! typemap) {
					typemap = {};
					itemstate.data[type] = typemap;
				}
				assert(item.id, item);
				typemap[item.id] = item;
			} catch(err) {
				// swallow and carry on
				console.error(err);
			}
		});
		this.update(itemstate);
		return res;
	}

} // ./Store

const DataStore = new Store();
export default DataStore;
// accessible to debug
if (typeof(window) !== 'undefined') window.DataStore = DataStore;

/**
 * Store all the state in one big object??
 */
DataStore.update({
	data: {
		Charity: {},
		Person: {}
	},
	focus: {
		Charity: null,
		Person: null,
	},
	show: {
	}
});
