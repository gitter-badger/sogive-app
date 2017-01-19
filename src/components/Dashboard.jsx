import React from 'react';
import ReactDOM from 'react-dom';

import SJTest from 'sjtest'
const assert = SJTest.assert;
import printer from '../utils/printer.js';
import C from '../C.js';


const Dashboard = React.createClass({

    render: function() {
        console.log('PAGE RENDER');
        return (
            <div className='dashboard'>
                <h2>My Dashboard</h2>

                <div class='panel'>
                    Time-Series CHart
                </div>

                <div class='panel'>
                    Pie-Chart by category
                </div>

                <div class='panel'>
                    Badges (encouraging use of all features, and repeated use -- but not extra £s)
                </div>

                <div class='panel'>
                    List of donations and impacts
                </div>
            </div>
        );
    }

}); // ./Dashboard

export default Dashboard;