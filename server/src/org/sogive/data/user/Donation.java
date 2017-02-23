package org.sogive.data.user;

import org.sogive.data.charity.MonetaryAmount;

import com.winterwell.utils.time.Time;
import com.winterwell.web.data.XId;

public class Donation {

	String id;

	XId from;
	
	XId to;
	

	/**
	 * Whether we think this has been collected. 
	 * Note that Stripe can reclaim money, we we have to allow a period before
	 * counting this as firm.
	 */
	boolean collected;
	
	boolean paidOut;
	
	String trackerId;
	
	MonetaryAmount transfer;
	
	MonetaryAmount ourFee;
	
	MonetaryAmount otherFees;

	boolean giftAid;
	
	MonetaryAmount total;

	/**
	 * When this donation was made
	 */
	Time time = new Time();

	public Donation(XId from, XId to, MonetaryAmount ourFee, MonetaryAmount otherFees, boolean giftAid,
			MonetaryAmount total) {
		super();
		this.from = from;
		this.to = to;
		this.ourFee = ourFee;
		this.otherFees = otherFees;
		this.giftAid = giftAid;
		this.total = total;
		transfer = total.minus(ourFee).minus(otherFees);
	}

	public String getId() {
		return id;
	}

	public void setCollected(boolean b) {
		this.collected = b;
	}

}
