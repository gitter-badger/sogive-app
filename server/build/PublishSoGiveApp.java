


import java.io.BufferedWriter;
import java.io.File;
import java.io.IOException;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.Collection;
import java.util.List;
import java.util.Map;
import java.util.Properties;
import java.util.Set;
import java.util.jar.Attributes;
import java.util.jar.JarFile;
import java.util.jar.Manifest;
import java.util.logging.Level;

import javax.swing.text.StyledEditorKit.ForegroundAction;

import org.junit.Test;

import com.winterwell.bob.BobSettings;
import com.winterwell.bob.BuildTask;
import com.winterwell.bob.tasks.EclipseClasspath;
import com.winterwell.bob.tasks.GitTask;
import com.winterwell.bob.tasks.JarTask;
import com.winterwell.bob.tasks.ProcessTask;
import com.winterwell.bob.tasks.RSyncTask;
import com.winterwell.bob.tasks.RemoteTask;
import com.winterwell.bob.tasks.SCPTask;
import com.winterwell.es.BuildESJavaClient;
import com.winterwell.utils.Environment;
import com.winterwell.utils.FailureException;
import com.winterwell.utils.Printer;
import com.winterwell.utils.StrUtils;
import com.winterwell.utils.Utils;
import com.winterwell.utils.Warning;
import com.winterwell.utils.gui.GuiUtils;
import com.winterwell.utils.io.CSVReader;
import com.winterwell.utils.io.FileUtils;
import com.winterwell.web.DnsUtils;

import com.winterwell.utils.io.LineReader;
import com.winterwell.utils.log.Log;
import com.winterwell.utils.web.XStreamUtils;
import com.winterwell.web.LoginDetails;
import com.winterwell.web.app.BuildWWAppBase;
import com.winterwell.web.app.HackyEmailer;
import com.winterwell.web.app.KPubType;
import com.winterwell.web.app.PublishProjectTask;
import com.winterwell.web.email.SMTPClient;
import com.winterwell.web.email.SimpleMessage;
import com.winterwell.youagain.client.BuildYouAgainJavaClient;

import jobs.BuildBob;
import jobs.BuildFlexiGson;
import jobs.BuildMaths;
import jobs.BuildDataLog;
import jobs.BuildDepot;
import jobs.BuildUtils;
import jobs.BuildWeb;
import jobs.BuildWinterwellProject;


/**
 */
public class PublishSoGiveApp extends PublishProjectTask {
			
	public PublishSoGiveApp() throws Exception {
		super("sogive", "/home/winterwell/sogive-app");
		bashScript = "./publish-sogiveapp.sh";
		typeOfPublish = KPubType.test;
//		codePart = "backend";
		compile = false;
	}

	@Override
	protected void doTask() throws Exception {
		super.doTask();
		
		doSendEmail("daniel.winterstein@gmail.com,sanjay@sogive.org,daniel.appel.winterwell@gmail.com,roscoe@winterwell.com");
	}
	

}
