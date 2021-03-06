package org.sogive.data.user;

import java.io.File;
import java.util.Map;
import java.util.logging.Level;

import org.sogive.data.charity.NGO;
import org.sogive.data.charity.SoGiveConfig;

import com.winterwell.utils.io.SqlUtils;
import com.winterwell.data.KStatus;
import com.winterwell.es.ESPath;
import com.winterwell.es.ESType;
import com.winterwell.es.client.ESHttpClient;
import com.winterwell.es.client.IESResponse;
import com.winterwell.es.client.admin.CreateIndexRequest;
import com.winterwell.es.client.admin.CreateIndexRequest.Analyzer;
import com.winterwell.es.client.admin.PutMappingRequestBuilder;
import com.winterwell.utils.Dep;
import com.winterwell.utils.io.ArgsParser;
import com.winterwell.utils.log.Log;
import com.winterwell.web.data.XId;

/**
 * What do we store in SQL? Low latency stuff.
 * 
 *  - Transactions
 *  - Is that it?
 *  
 * @author daniel
 *
 */
public class DB {

	public static void init() {
		ESHttpClient es = Dep.get(ESHttpClient.class);
		SoGiveConfig config = Dep.get(SoGiveConfig.class);

		for(KStatus status : KStatus.main()) {
			// charity
			ESPath path = config.getPath(null, NGO.class, null, status);
			if (es.admin().indices().indexExists(path.index())) {
				continue;
			}
			String baseIndex = path.index()+"_"+es.getConfig().getIndexAliasVersion();
			es.debug = true;
			CreateIndexRequest pi = es.admin().indices().prepareCreate(baseIndex);
			// english stopwords and stemming ??This doesn't seem to work :(
			// ES docs are opaque on how to actually get analyzers setup :(
//			pi.setDefaultAnalyzer(Analyzer.english);
			pi.setAlias(path.index());
			// TODO synonyms
			
			IESResponse r = pi.get();
			
			PutMappingRequestBuilder pm = es.admin().indices().preparePutMapping(path.index(), path.type);
			ESType dtype = new ESType();
			dtype.property("name", new ESType().text()
									// enable keyword based sorting
									.field("raw", "keyword"));
			dtype.property("@id", new ESType().keyword());
			dtype.property("projects", new ESType().object()
					.property("year", new ESType().INTEGER())
					);
			pm.setMapping(dtype);
			IESResponse r2 = pm.get();
			r2.check();		
		}
		
		// donation
		ESPath path = config.getPath(null, Donation.class, null, null);
		if ( ! es.admin().indices().indexExists(path.index())) {
			String baseIndex = path.index()+"_"+es.getConfig().getIndexAliasVersion();
			CreateIndexRequest pi = es.admin().indices().prepareCreate(baseIndex);
			pi.setAlias(path.index());
			IESResponse r = pi.get();
		
			PutMappingRequestBuilder pm = es.admin().indices().preparePutMapping(path.index(), path.type);
			ESType dtype = new ESType();
			dtype.property("from", new ESType().keyword());
			dtype.property("to", new ESType().keyword());
			dtype.property("date", new ESType().date());
			pm.setMapping(dtype);
			IESResponse r2 = pm.get();
			r2.check();
		}
	}

	public static Person getUser(XId id) {
		ESHttpClient es = Dep.get(ESHttpClient.class);
		Map<String, Object> person = es.get("sogive", "user", id.toString());
		return (Person) person;
	}
}
