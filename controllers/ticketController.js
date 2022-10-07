     async function getZendeskTickets(api_url) {
        const response = await fetch(api_url, {
            'Accept': 'application/json',
            method: 'GET',
            mode: 'no-cors',
            credentials: 'include',
            headers: {
                'Content-Type': 'application/json',
                'Authorization' : 'Basic enZfbXl0ZXN0QG91dGxvb2suY29tL3Rva2VuOk1VVEw2dmQyR1IxU2NLdnZhazFzN1NUSUUyUXBZMExDYmNia2t4a2k='
            }})
    
        const data = await response.json();
        //console.log(data);
        //return returnNewTickets(data);
        // checkIfAssigneeNull(data);
        return data;
    }

    function returnNewTickets(ticketObject) {
        const ticketList = ticketObject['tickets'];
        let newTickets = [];
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
            return "no new tickets to assign to agents"
        }
        
    }


    // send specific URL for specific ticket
    async function assignTickets(api_url, agentData) {
    const response = await fetch(api_url,  {
        'Accept': 'application/json',
        method: 'PUT',
        credentials: 'include',
        headers: {
            'Content-Type': 'application/json',
            'Authorization' : 'Basic enZfbXl0ZXN0QG91dGxvb2suY29tL3Rva2VuOk1VVEw2dmQyR1IxU2NLdnZhazFzN1NUSUUyUXBZMExDYmNia2t4a2k='
        },
        body: JSON.stringify(agentData)});
            
    const data = await response.json();
    return data;
}

// check if agent is operating during hours

async function getAvailableAgents(zendeskURL) {
    const usersEndpointURL = zendeskURL + '/api/v2/users.json';
    const response = await fetch(usersEndpointURL, {
        'Accept': 'application/json',
        method: 'GET',
        mode: 'no-cors',
        credentials: 'include',
        headers: {
            'Content-Type': 'application/json',
            'Authorization' : 'Basic enZfbXl0ZXN0QG91dGxvb2suY29tL3Rva2VuOk1VVEw2dmQyR1IxU2NLdnZhazFzN1NUSUUyUXBZMExDYmNia2t4a2k='
        }})
    const userData = await response.json();
    return userData;
}

function returnAssigneeID(usersObj) {
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

module.exports = {
    getZendeskTickets,
    returnNewTickets,
    assignTickets,
    getAvailableAgents,
    returnAssigneeID
}