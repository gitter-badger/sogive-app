package org.sogive.data.charity;

import java.io.File;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.HashMap;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.concurrent.ExecutionException;
import java.util.concurrent.Future;

import org.sogive.server.CharityServlet;
import org.sogive.server.SoGiveServer;

import com.google.common.util.concurrent.ListenableFuture;
import com.winterwell.data.KStatus;
import com.winterwell.es.ESPath;
import com.winterwell.es.client.ESConfig;
import com.winterwell.es.client.ESHttpClient;
import com.winterwell.es.client.ESHttpResponse;
import com.winterwell.es.client.IESResponse;
import com.winterwell.es.client.IndexRequestBuilder;
import com.winterwell.es.client.UpdateRequestBuilder;
import com.winterwell.gson.FlexiGson;
import com.winterwell.gson.Gson;
import com.winterwell.gson.GsonBuilder;
import com.winterwell.gson.JsonIOException;
import com.winterwell.utils.Dep;
import com.winterwell.utils.MathUtils;
import com.winterwell.utils.Printer;
import com.winterwell.utils.StrUtils;
import com.winterwell.utils.Utils;
import com.winterwell.utils.containers.Containers;
import com.winterwell.utils.io.CSVReader;
import com.winterwell.utils.log.Log;
import com.winterwell.utils.time.Time;
import com.winterwell.utils.web.WebUtils;
import com.winterwell.web.app.AppUtils;

import static com.winterwell.utils.containers.Containers.get;

// https://docs.google.com/spreadsheets/d/1Gy4sZv_WZRQzdfwVH0e3tBvyBnuEJnhSFx7_7BHLSDI/edit#gid=0

//Charity Name	Description of the column
//Classification	There's not a fixed taxonomy, but try to use the existing names and separate multiple tags with &
//Reg Num	The registration number with the Charity Commission of England & Wales
//Analyst	Add your name if you've contributed to this data collection!
//Project	This is for when a charity has multiple projects and we've split the analysis up. The Overall category is for the aggregate.
//Year start date	the official timeperiod covered by the report in question.
//Year end date	
//UK-based charity?	I.e. is gift aid availble? (so for example if it's a multinational group with a uk entity, then the answer would be yes)
//CC What	Charity Commission activity classification WHAT
//CC Who	Charity Commission activity classification WHO
//CC How	Charity Commission activity classification HOW
//CC Site	Link to the charity's page on the charity commission website. Only relevant for those which are registered with the charity commission - or if it's a registered charity in Scotland show the relevant page on the OSCR website, and similarly for the charity commission of Northern Ireland
//Source of data (typically annual report)	URL for the source
//Impact 1	number, usually listed in the prose
//Impact 2	Sometimes the accounts will refer to "indirect beneficiaries" - include those here. Alternatively include the knock-on impacts or second order impacts in this column
//Impact 3	
//Impact 4	
//Impact 5	
//Impact 6	
//Annual costs	This is the overall total costs
//Income from Char Act.	Income from Charitable Activities - should include income that's generated by activity that helps beneficiaries (e.g. selling things to beneficiaries). Accounting guidelines encourage charities to show grant funds as "income from charitable activities", so the figures labelled as "income from charitable activities" in accounts are often not what we need. Reviewing the figures by looking at the notes to the accounts often provides the level of detail needed to judge this correctly
//Fundraising costs	May be labelled as something like "costs of generating voluntary income"
//Trading costs	How much of the "cost" quoted was spent on revenue generating trading/business of the charity. Doesn't include trading where the counterparty of the trade is a beneficiary of the charity (i.e. where the trading *is* part of the charitable work) - this would be income from charitable activities instead)
//Costs minus deductions	We deduct the money spent on trading and fundraising to find the money spent on the beneficiaries. The reason for this is just simplicity: if money spent fundraising and on trading just raised itself over again, it'd be the same as if it'd just sat in the bank that year, appearing neither on the cost nor income ledgers.
//Cost per Ben 1	Cost per direct beneficiary
//Cost per Ben 2	Cost per indirect beneficiary.
//Cost per Ben 3	
//Cost per Ben 4	
//Cost per Ben 5	
//Cost per Ben 6	Cost per indirect beneficiary.
//Comments/analysis about the cost per beneficiary figure	
//Total income	For UK charities only
//Voluntary income	For UK charities only
//Reserves	
//Percent	Reserves as % of annual expenditure
//Comments	Source (ie which page number in the accounts) ; what is the target level of the reserves, and how does this compare. If you notice any risks such as underisked pension schemes or FX risk, then mention those here too
//Wording for SoGive app	
//Representative project?	Where a charity has several projects, we may have to choose one as the representative project. For really big mega-charities, it may be necessary to have the "representative" row being an aggregate or "average" of all the projects
//Is this finished/ready to use?	Is there enough data to include in the SoGive app? A judgement
//Confidence indicator	An indicator of the confidence we have in the data, especially the cost per impact
//Comments on confidence indicator	Why?
//Stories	Stories about beneficiaries (either as a link, or copied and pasted - if copied and pasted also include a source). Sometimes this is available in the annual report and accounts, but may need to look on the charity's website
//Images	A link to an image of a beneficiary. Sometimes this is available in the annual report and accounts, but may need to look on the charity's website
//Description of charity	About one sentence long
//Communications with charity	notes about if and when any emails were sent to the charity
//Where hear about?	where we heard about the charity. OK to leave this blank
//Location of intervention	what part of the world the charity interventions are
//External assessments	Links to any external assessments
//Assessment	
//Rating of impactfulness	determined in a very ad-hoc way. Not being used
//Comments about quality of intervention
/**
 * @testedby {@link ImportCharityDataFromCSVTest}
 * @author daniel
 *
 */
public class ImportCharityDataFromCSV {

	static MonetaryAmount cost(Object value) {
		if (value==null) return null;
		return MonetaryAmount.pound(MathUtils.getNumber(value));
	}
	
	public static void main(String[] args) throws Exception {
		File export = new File("data/charities.csv");
		
		ImportCharityDataFromCSV importer = new ImportCharityDataFromCSV(export);
		int cnt = importer.run();
		System.out.println(cnt);
		importer.run2();
	}

	
	private void run2() throws InterruptedException, ExecutionException {
		init();
		File export = new File("data/stories-images.csv");
		CSVReader csvr = new CSVReader(export, ',').setNumFields(-1);
		
		Printer.out(csvr.next());
		Gson gson = new GsonBuilder()
				.setClassProperty("@type")
				.create();
		int cnt = 0;
		for (String[] row : csvr) {
			// the charity
			if (Utils.isBlank(row[0])) continue;
			String story = StrUtils.normalisePunctuation(get(row, 1));
			String img = get(row, 2);
			// ignore story source
			String ourid = NGO.idFromName(row[0]);
			NGO ngo = CharityServlet.getCharity(ourid, null);
			if (ngo==null) {
				continue;
			}
			boolean mod = false;
			if ( ! Utils.isBlank(img)) {
				ngo.put(images, img); mod=true;
			}
			if (Utils.truthy(story)) {ngo.put(stories, story); mod=true;}
			// save
			if (mod) {				
				UpdateRequestBuilder pi = client.prepareUpdate(sgconfig.getPath(NGO.class, ourid, KStatus.PUBLISHED));
//				String json = gson.toJson(ngo);		
				pi.setDoc(ngo);
				pi.setDocAsUpsert(true);
				Future<ESHttpResponse> f = pi.execute();
				f.get().check();				
			}
		}		
		csvr.close();
	}

	private final String images = "images";
	private final String stories = "stories";


	private File csv;
	private ESHttpClient client;

	private List<String> HEADER_ROW;
	private SoGiveConfig sgconfig;

	public ImportCharityDataFromCSV(File export) {
		this.csv = export;
		assert export.exists() : export;
	}

	public int run() throws Exception {
		init();
		CSVReader csvr = new CSVReader(csv, ',').setNumFields(-1);
		dumpFileHeader(csvr);
		
//		System.exit(1); // FIXME
		
		Gson gson = new GsonBuilder()
				.setClassProperty("@type")
				.create();
		int cnt = 0;
		for (String[] row : csvr) {
			// "Official Name" column isn't always filled - if this is the case,
			// "Charity Name" value should be used & no alternate display-name
			String officialName = Containers.get(row, col("official name"));
			String charityName = Containers.get(row, col("charity name"));
			assert (charityName != null && !charityName.isEmpty()) : row;
			
			String rawId = Utils.isBlank(officialName) ? charityName : officialName;
			final String ourId = StrUtils.toCanonical(rawId).replaceAll("\\s+", "-");

			String summaryDesc = Containers.get(row, col("summary description"));
			String desc = Containers.get(row, col("longer description"));
			String regNum = Containers.get(row, col("reg num"));
			
			NGO ngo = CharityServlet.getCharity(ourId, null);
			if (ngo==null) ngo = new NGO(ourId);
			
			if (officialName == null || officialName.isEmpty()) {
				ngo.put(NGO.name, charityName);
			} else {
				ngo.put(NGO.name, officialName);
				ngo.put("displayName", charityName);
			}
			
			if ( ! Utils.isBlank(summaryDesc)) ngo.put("summaryDescription", StrUtils.normalisePunctuation(summaryDesc));
			if ( ! Utils.isBlank(desc)) ngo.put("description", StrUtils.normalisePunctuation(desc));
			if ( ! Utils.isBlank(regNum)) ngo.put("englandWalesCharityRegNum", regNum);
			
			// Process (replace " & " delimiter with ", ") and store tags
			String tagDelimiter = "\\s*&\\s*";
			String whyTags = Containers.get(row, col("classification why"));
			if (! Utils.isBlank(whyTags)) {
				ngo.put("whyTags", whyTags.replaceAll(tagDelimiter, ", "));
			}
			String whoTags = Containers.get(row, col("classification who"));
			if (! Utils.isBlank(whoTags)) {
				
				ngo.put("whoTags", whoTags.replaceAll(tagDelimiter, ", "));
			}
			String howTags = Containers.get(row, col("classification how"));
			if (! Utils.isBlank(howTags)) {
				ngo.put("howTags", howTags.replaceAll(tagDelimiter, ", "));
			}
			String whereTags = Containers.get(row, col("classification where"));
			if (! Utils.isBlank(whereTags)) {
				ngo.put("whereTags", whereTags.replaceAll(tagDelimiter, ", "));
			}
			
			String logo = get(row, col("logo image"));
			if ( ! Utils.isBlank(logo)) ngo.put("logo", logo);
			String ukbased = get(row, col("giftaidable"));
			if ( ! Utils.isBlank(ukbased)) {
				ngo.put("uk_giftaid", yes(ukbased));
			}
			
//			no donations?
			String ad = get(row, col("accepts donations"));
			if ( ! Utils.isBlank(ad)) {
				try {
					ngo.put("noPublicDonations", ! yes(ad));
					// A lot of non-yes fields are actually notes as to WHY no public donations
					if (!Utils.isBlank(ad) && !"no".equalsIgnoreCase(ad)) {
						setNote(ngo, "noPublicDonations", ad);
					}
				} catch(Exception ex) {
					Log.e("import", ex);
				}
			}
			
//			38	Representative project?	Where a charity has several projects, we may have to choose one as the representative project. For really big mega-charities, it may be necessary to have the "representative" row being an aggregate or "average" of all the projects	yes
//			39	Is this finished/ready to use?	Is there enough data to include in the SoGive app? A judgement	Yes
			String _ready = get(row, col("ready"));
			boolean ready = yes(_ready);
			String rep = get(row, col("representative")).toLowerCase();
			boolean isRep = yes(rep);
			
//			40	Confidence indicator	An indicator of the confidence we have in the data, especially the cost per impact	Low
//			41	Comments on confidence indicator	Why?	The cost shown is based on CR UK funding 4000 researchers for a cost of £600m, minus some deductions to get to £400m. It is not clear whether this is right, for example, those 4000 researchers might include some who are partfunded by other organisations, or it may be that there are 4000 "inhouse" cruk researchers, but CRUK also funds some researchers who work externally, and some of the cruk funds are also partfunding some other researchers outside of the 4000 mentioned in the accounts. When I contacted CRUK for clarity on this, they were unable to clarify the situation
//			42	Stories	Stories about beneficiaries (either as a link, or copied and pasted - if copied and pasted also include a source). Sometimes this is available in the annual report and accounts, but may need to look on the charity's website	
//			43	Images	A link to an image of a beneficiary. Sometimes this is available in the annual report and accounts, but may need to look on the charity's website	
//			44	Description of charity	About one sentence long	A UK charity which primarily funds cancer research
//			45	Communications with charity	notes about if and when any emails were sent to the charity	Request sent via website on 25 Jan 2016 asking for a conversation to talk about how they look at impact. Site says they will reply in 5 days. Reply sent on 15th Feb (while I was travelling, so I didn't see it for a while). The response included several paragraphs, but not one referred to how they assess impact, and I infer that they do not do this. Response email sent on 6th Mar asking about how to compare costs with number of researchers. The people I spoke with demonstrated themselves to be poorly equipped to deal with these questions.
//			46	Where hear about?	where we heard about the charity. OK to leave this blank	
//			47	Location of intervention	what part of the world the charity interventions are	
//			48	External assessments	Links to any external assessments	
//			49	Assessment		C
			
			String externalAssessments = get(row, col("external assessment"));
			if ( ! Utils.isBlank(externalAssessments)) ngo.put("externalAssessments", externalAssessments);

			String comms = get(row, col("communications with charity"));
			if ( ! Utils.isBlank(comms)) ngo.put("communicationsWithCharity", comms);
			
			// Should projects be separate documents??
//			3	Analyst	Add your name if you've contributed to this data collection!	Sanjay
//			4	Project	This is for when a charity has multiple projects and we've split the analysis up. The Overall category is for the aggregate.	Overall
			String analyst = get(row, col("analyst"));
			String projectName = get(row, col("project"));
			if (Utils.isBlank(projectName)) projectName = "overall";
			projectName = StrUtils.toCanonical(projectName);
			Project project = new Project(projectName);
			project.put("analyst", analyst);
			String story = get(row, col("stories"));
			if (story!=null && WebUtils.URL_REGEX.matcher(story).matches()) {
				Log.d("import", "skipping url story for "+projectName+" by "+analyst+" "+story);
				story = null;
			}
			story = StrUtils.normalisePunctuation(story);
			if (Utils.truthy(story)) project.put(stories, story);
			project.put("stories_src", get(row, col("stories - source")));
			Time start = Time.of(get(row, col("start date")));
			Time end = Time.of(get(row, col("end date")));
			project.setPeriod(start, end);
			Integer year = end!=null? end.getYear() : null;
			String dataSrc = get(row, col("source 1"));
			if ( ! Utils.isBlank(dataSrc)) {
				Citation citation = new Citation(dataSrc);
				if (year!=null) citation.put("year", year);
				project.addOrMerge("data-src", citation);
			}
			String dataSrc2 = get(row, col("source 2"));
			if ( ! Utils.isBlank(dataSrc2)) {
				Citation citation = new Citation(dataSrc2);
				if (year!=null) citation.put("year", year);
				project.addOrMerge("data-src", citation);
			}
			Object img = get(row, col("photo image"));
			if (img!=null) {
				project.put(images, img);
				if (isRep || ! ngo.containsKey(images)) {
					ngo.put(images, img);
				}
			}
			project.put("location", get(row, col("location")));
			
			// inputs
			List inputs = new ArrayList();
			for(String cost : new String[]{"annual costs", "fundraising costs", "trading costs", "income from beneficiaries"}) {
				MonetaryAmount ac = cost(get(row, col(cost)));
				ac.setPeriod(start, end);
				String costName = StrUtils.toCamelCase(cost);
				ac.put("name", costName);
				inputs.add(ac);
			}
			project.put("inputs", inputs);
			
			// Confidence is attributed to project outputs, so confidence-comment should be too
			String confidence = get(row, col("confidence indicator"));
			// Normalise eg "Very Low" to "very-low"
			confidence = confidence.toLowerCase().replaceAll("\\s", "-");
			String confidenceComment = get(row, col("comments on confidence indicator"));
						
			// outputs
			List<Output> outputs = new ArrayList();
			for(int i=1; i<7; i++) {
				double impact1 = MathUtils.getNumber(get(row, col("impact "+i)));
				if (impact1==0) continue;
				String impactUnit = get(row, col("impact "+i+" unit"));
				String type1 = get(row, col("impact "+i+" unit"));
				Output output1 = new Output(impact1, type1);
				
				// Confidence rating + reason				
				if (! Utils.isBlank(confidence)) output1.put("confidence", confidence);
				if (! Utils.isBlank(confidenceComment)) {
					setNote(output1, "all", "Confidence comments: " + confidenceComment);
				}
				
				// Output description
				// Currently we don't have Extra Info 2-6, but allow that we might?
				int extraCol = safeCol("extra info "+i);
				if (extraCol >= 0) {
					String extraInfo = get(row, col("extra info "+i));
					if (! Utils.isBlank(extraInfo)) {
						output1.put("description", extraInfo);
					}
				}

				
				output1.put("order", i-1);
				output1.setName(impactUnit);
				output1.setPeriod(start, end);
				outputs.add(output1);
			}
			project.put("outputs", outputs);
			
			// special formula?
			String adjustmentComment = get(row, col("adhoc adjustments"));
			String analysisComment = get(row, col("comments analysis about the cost per beneficiary figure"));
			project.put("analysisComment", analysisComment);
			project.put("adjustmentComment", adjustmentComment);
			if ( ! Utils.isBlank(analysisComment)) {
				for(int i=1; i<7; i++) {
					double costPerBen = MathUtils.getNumber(get(row, col("cost per ben "+i)));
					if (costPerBen==0) continue;
					if (i >= outputs.size()) {
						Log.d("import", "adhoc cost-per-ben but no outpus (impact)?! "+Printer.toString(row));
						break;
					}
					Output outputi = outputs.get(i);
					MonetaryAmount costPerOut = MonetaryAmount.pound(costPerBen);
					outputi.setCostPerOutput(costPerOut);
				}				
			}
			
			project.put("ready", ready);
			project.put("isRep", isRep);
//			37	Wording for SoGive app		You funded XXXX hours/days/weeks of cancer research, well done!
			project.put("donationWording", get(row, col("wording")));
			
			ngo.addProject(project);
			
//			// stash the impact
//			Project repProject = ngo.getRepProject();
//			if (repProject!=null) {
//				List<Output> repoutputs = repProject.getOutputs();
//				if (repoutputs!=null) {
//					List<Output> impacts = repProject.getImpact(repoutputs, MonetaryAmount.pound(1));
//					if ( ! Utils.isEmpty(impacts)) ngo.put("unitRepImpact", impacts.get(0));
//				}
//			}
			ESPath path = sgconfig.getPath(NGO.class, ourId, KStatus.PUBLISHED);
			UpdateRequestBuilder pi = client.prepareUpdate(path);
//			String json = gson.toJson(ngo);		
			pi.setDoc(ngo);
			pi.setDocAsUpsert(true);
			Future<ESHttpResponse> f = pi.execute();
			f.get().check();
			cnt++;
		}
		return cnt;
	}

	private boolean yes(String ukbased) {
		boolean yes = ukbased.toLowerCase().contains("yes");
		return yes;
	}

	static final Map<String,Integer> cols = new HashMap();
	
	private int safeCol(String colName) {
		try {
			return col(colName);
		} catch (AssertionError ae) {
			return -1;
		}
	}
	
	private int col(String colName) {
		String colname = StrUtils.toCanonical(colName);
		Integer ci = cols.get(colname);
		if (ci==null) {
			List<String> hs = Containers.filter(HEADER_ROW, h -> h.equals(colname));
			if (hs.isEmpty()) hs = Containers.filter(HEADER_ROW, h -> h.contains(colname));
			if (hs.size() != 1) {
				assert hs.size() == 1 : colname+" "+hs+" from "+HEADER_ROW;	
			}
			
			ci = HEADER_ROW.indexOf(hs.get(0));
			cols.put(colname, ci);			
		}
		String h = HEADER_ROW.get(ci);
		return ci;
	}

	private void init() {
		Dep.set(FlexiGson.class, new FlexiGson());
		// hack for import w/o server start
		if ( ! Dep.has(ESConfig.class)) {
			ESConfig esc = new ESConfig();
			esc = AppUtils.getConfig("sogive", esc, new String[0]);
			Dep.set(ESConfig.class, esc);
		}
		ESConfig config = Dep.get(ESConfig.class);
		client = new ESHttpClient(config);
		sgconfig = Dep.get(SoGiveConfig.class);
	}

	private void dumpFileHeader(CSVReader csvr) {
		String[] row1 = csvr.next();
		Printer.out(row1);
		HEADER_ROW = Containers.apply(Arrays.asList(csvr.next()), StrUtils::toCanonical);
		Printer.out(HEADER_ROW);
		String[] row3 = csvr.next();
		Printer.out(row3);
//		String[] row4 = csvr.next();		
		for(int i=0; i<100; i++) {
			String name = Containers.get(HEADER_ROW, i);
			String desc = Containers.get(row3, i);
//			String eg = Containers.get(row4, i);
			if (Utils.isBlank(name)) continue;
			Printer.out(i+"\t"+name+"\t"+desc
//					+"\t"+eg
					);			
		}
	}
	
	private void setNote(Thing thing, String field, String note) {
		setMeta(thing, field, "notes", note);
	}
	
	private void setUrl(Thing thing, String field, String url) {
		setMeta(thing, field, "url", url);
	}
	
	private void setMeta(Thing thing, String field, String metaField, String metaText) {
		Map meta = (Map) thing.get("meta");
		if (meta == null) {
			meta = new HashMap<String, Object>();
			thing.put("meta", meta);
		}
		Map fieldMeta = (Map)meta.get(field);
		if (fieldMeta == null) {
			fieldMeta = new HashMap<String, Object>();
			meta.put(field, fieldMeta);
		}
		fieldMeta.put(metaField, metaText);
	}
}
