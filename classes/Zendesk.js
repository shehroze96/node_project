//const router = express.Router();

//const agent = require('../models/agent');

import fetch from "node-fetch";
import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const fs = require('fs');

class Zendesk {
    async getZendeskTickets(api_url) {
        const response = await fetch(api_url, {
            'Accept': 'application/json',
            method: 'GET',
            mode: 'no-cors',
            credentials: 'include',
            headers: {
                'Content-Type': 'application/json',
                'Authorization' : 'Basic  c19haG1hZF9rXzg5NkBvdXRsb29rLmNvbS90b2tlbjowVmFseU5uYmdrODNDRklMQ1RTTTRJTHhHelgzakdwb01mWTV1bVFk'
            }})
    
        const data = await response.json();
        //console.log(data);
        //return returnNewTickets(data);
        // checkIfAssigneeNull(data);
        return data;
    }

    returnNewTickets(ticketObject) {
        const ticketList = ticketObject['tickets'];
        let newTickets = [];
        let ticketsAreAvailable = false;
        for (const ticket of ticketList) {
            if (ticket['status'] == 'new') {
                // add these to an array
                let ticketString = ticket['url'];
                newTickets.push(ticketString);
            }
        }
        if (newTickets.length > 0) {
            //  block of code to be executed if the condition is true
            return newTickets;
        } else {
            return ticketsAreAvailable;
        }
        
    }


    // send specific URL for specific ticket
    async assignTickets(api_url, agentData) {
    const response = await fetch(api_url,  {
        'Accept': 'application/json',
        method: 'PUT',
        credentials: 'include',
        headers: {
            'Content-Type': 'application/json',
            'Authorization' : 'Basic c19haG1hZF9rXzg5NkBvdXRsb29rLmNvbS90b2tlbjowVmFseU5uYmdrODNDRklMQ1RTTTRJTHhHelgzakdwb01mWTV1bVFk'
        },
        body: JSON.stringify(agentData)});
            
    const data = await response.json();
    return data;
}

// check if agent is operating during hours

async getAvailableAgents(zendeskURL) {
    const usersEndpointURL = zendeskURL + '/api/v2/users.json';
    const response = await fetch(usersEndpointURL, {
        'Accept': 'application/json',
        method: 'GET',
        mode: 'no-cors',
        credentials: 'include',
        headers: {
            'Content-Type': 'application/json',
            'Authorization' : 'Basic c19haG1hZF9rXzg5NkBvdXRsb29rLmNvbS90b2tlbjowVmFseU5uYmdrODNDRklMQ1RTTTRJTHhHelgzakdwb01mWTV1bVFk'
        }})
    const userData = await response.json();
    return userData;
}

returnAssigneeID(usersObj) {
    const usersList = usersObj['users'];
    let usersAndID = [];
    for (const user of usersList) {
        // add these to an array
        let userWithAssigneeID = {
            name: user['name'],
            id: user['id']
        }
        usersAndID.push(userWithAssigneeID);
    }
    return usersAndID;
}

writeDataToJSON(filePath, data) {
    let formattedData = JSON.stringify(data);
    fs.writeFile(filePath, formattedData, function(err, result) {
        if(err) console.log('error', err);
    }); 
}



}

export default Zendesk;
