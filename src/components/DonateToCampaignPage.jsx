import React from 'react';
import ReactDOM from 'react-dom';

import {SJTest,assert} from 'sjtest'
// const assert = SJTest.assert;
import printer from '../utils/printer.js';
import C from '../C.js';
import ServerIO from '../plumbing/ServerIO.js'
import {uid} from 'wwutils';

export default class DonateToCampaignPage extends React.Component {

    constructor(...params) {
        super(...params);     
        assert(this.props.charityId);           
        this.state = {
            loading: false,
            // HACK!!!
            charity: {
                "@type": "NGO",
                "id": "solar-aid",
                "name": "Solar Aid",
                "description": "Providing solar-powered lights for the developing world.",
                "logo": "https://solar-aid.org/wp-content/uploads/2016/10/solar-aid-default-logo.png",
                "photos": [
                    {"url": "http://", "caption": "a well lit family is a happy family"}
                ],
                "tags": "energy, climate change, health, education",
                "projects": {
                    "main": {
                        "ref": "http://www.solar-aid.org/assets/Uploads/Impact-week-2015/SolarAid-IMPACT-REPORT-2015.pdf",
                        "desc": "Providing solar-powered lights for a hut or room that doesn't have electricity. Lighting at home helps with study and improves family time. We take electricity and lighting for granted, but many homes in the developing world don't have them.",
                        "img": "",
                        "inputs": [
                            {"input": "£", "number": 6326794}
                        ],
                        "outputs": [
                            {
                                "output": "solar-light", "number": 624443,
                                "beneficiaries": "$number * 6"
                            }     
                        ],
                        "impact": [
                            // £10 funds 1 solar light
                            {"price":5, "output": "solar-light", "number": 0.5},
                            {"price":10, "output": "solar-light", "number": 1}, // always put £10 middle 
                            {"price":50, "output": "solar-light", "number": 5},
                        ]
                    },
                    "effects": [
                        {"input": "solar-light", "beneficiaries": 3, "output": "Improved education from studying at home"}
                    ]
                },
                "outputs": {
                    "solar-light": {
                        "id": "solar-light",
                        "name": "Solar Light",
                        "img": "http://light"
                    }
                }
            }
        };
    }


    componentWillMount() {
        ServerIO.getCharity(this.props.charityId)
        .then(function(json) {
            console.log(json);
            this.setState({loading: false});
        }.bind(this));
    }

    componentWillUnmount() {

    }

    render() {        
        if (this.state.loading) {
            return (<div>Loading...</div>);
        }
        const charity = this.state.charity;
        const project = charity.projects && charity.projects.main;
        console.log('PAGE RENDER');
        return (
            <div className='campaign'>
                <h2>Alice's Sponsored Marathon for {charity.name}</h2>

                <div className='panel'>
                    <img src={charity.logo} className='logo'/>
                    <h3>About {charity.name}</h3>
                    <p>{charity.desc}</p>
                </div>

                <div className='panel'>
                    <h3>Donate!</h3>
                    <div>{project.desc}</div>
                    <DonationAmounts impacts={project.impact} charity={charity} project={project} />
                    <div>Amongst other benefits, that means better education opportunities for a family.</div>
                    more info...
                </div>

                <div className='panel'>
                    Campaign Info: 823 lights funded
                    Target: 1000 lights

                    Donations by: 
                    <DonationList donations={["Alice", "Bob", "Carol"]} />

                </div>

                <div className='panel'>
                    <h3>Spread the word on social media</h3>

                    Facebook
                    Twitter
                    Instagram

                    Sharing boosts the value of your donation by an average of 2 to 3 times.
                </div>
            </div>
        );
    }

}; // ./DonateToCampaign

class DonationAmounts extends React.Component {
    render() {
        let charity = this.props.charity;
        let project = this.props.project;
        let damounts = _.map(this.props.impacts, a => (<DonationAmount key={uid()} charity={charity} project={project} impact={a}/>) );
        return(<ul>{damounts}</ul>)
    }
}

const DonationAmount = function({charity, project, impact}) {
    return <li>£{impact.price} will fund {impact.number} {impact.output}</li>;
};


const DonationList = ({donations}) => {
    let ddivs = _.map(donations, d => <li>{d}</li>);
    return <ul>{ddivs}</ul>
};