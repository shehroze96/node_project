// imports

import { createRequire } from 'module';
const require = createRequire(import.meta.url);
import Zendesk from './classes/Zendesk.js';
import Agents from './classes/Agents.js';
import { DateTime } from 'luxon';
// const agent_data = require('./models/agents.json') 
const fs = require('fs');
const luxon = require("luxon");
const Interval = luxon.Interval;



async function  mainMethod() {
    let zendeskRequests = new Zendesk();
    let agentModification = new Agents();
    let now = DateTime.now();
    const csvFilePath = './shift_rota.csv';
    let agentJsonUpdated;
    let executionCycle =0;


    // make ticket request
    let getTickets = await zendeskRequests.getZendeskTickets('https://zoovasupport.zendesk.com/api/v2/tickets');
    // only return new ones
    let unassignedTicketList = zendeskRequests.returnNewTickets(getTickets);

    if (!unassignedTicketList) {
        console.log("no new tickets")
    }

    
    // store the data of the tickets in models > unassignedTickets.json 
    zendeskRequests.writeDataToJSON('./models/unassignedTickets.json', unassignedTicketList );



    

    executionCycle++;

    if (executionCycle === 1) {
        /* Pull the agent data from CSV and API and transform it */
        // the data for the users
        let getAgents = await zendeskRequests.getAvailableAgents('https://zoovasupport.zendesk.com');

        // console.log(getAgents);
        /* Fetch the CSV shift data  */
        let csvAgentData = await agentModification.returnShifts(csvFilePath);
        // console.log(csvAgentData);



        let csvShiftDataToday = agentModification.returnShiftDataForToday(csvAgentData);
        if (!csvShiftDataToday) {
            console.log("No agents available today, according to Rota")
            return;
        }
        // console.log(shiftDataToday);

        let nameAndHours = agentModification.getNameAndHours(csvShiftDataToday );
        //console.log(nameAndHours);

        let agentObject = agentModification.createAgentObj(nameAndHours);
        //console.log(agentObject);

        let agentsAvailable = [];

        // check if the agent is working - shift interval
        for (let i = 0; i < agentObject.length; i++) {
            if (agentModification.agentAvailable(agentObject[i])) {
                agentsAvailable.push(agentObject[i]);
            }
        }

        // console.log("This is the final agent list for now", agentsAvailable);
        let agentsWithIDs = agentModification.matchToZendeskUser(agentsAvailable, getAgents);

        // store the data of the agents 
        zendeskRequests.writeDataToJSON('./models/agents.json', agentsWithIDs);

        // set the execution cycle to 1 so we don't run this code all the time - we just need it to form our 
        // executionCycle = 1
    }

    
    // works! 
    /*
    let agentData = {"ticket": {"status": "open", "assignee_id": user[0].id}}; 
    assignTickets('https://zoovu8416.zendesk.com/api/v2/tickets/6',agentData); */

    // get data from unassignedTickets - parse it 
    // do a for loop with the tickets in the unassignedTickets.json
    // during each loop check if their interval is a match to the current time 
    // during each loop assign the person closest to the front of the queue
    // person in position 0 in the queue should be moved to the back of the queue
    // move each person up 1 in the queue
    // delete the ticket that was assigned from unassignedTickets.json
    // account for it being empty and if it is empty then no new tickets 

    let ticketData = './models/unassignedTickets.json';
    let agentData = './models/agents.json';



    // at some point do a while loop and only run it up until a certain time otherwise the files keep getting recreated and the queue poisition will get messed up
    var agents;


    
    let firstAvailableAgent;
    let index = 0;
    let assignTicketsBool = true;

    // first read the tickets JSON
    fs.readFile(ticketData, function (error, content) {
        var tickets = JSON.parse(content);
        let numOfTickets = tickets.length

        // read the agents JSON - both files are open now and can be manipulated
        fs.readFile(agentData, function (error, data) {
            agents = JSON.parse(data);
            // let numOfAgents = agents.length;

            for (let i = 0; i < agents.length; i++) { 
                if (!agentModification.agentAvailable(agents[i])) {
                    // make it 0 because it will increment to 1 at the start of execution and that is what we need to restart
                    assignTicketsBool = false;
                    executionCycle = 0;
                    break;
                }
            }


            while (numOfTickets > 0 && assignTicketsBool) {
                firstAvailableAgent = agentModification.selectFirstAgentInQueue(agents);

                // if agent is outside of hours, end execution and set the execution cycle to 0
                if (!agentModification.agentAvailable(firstAvailableAgent)) {
                    // make it 0 because it will increment to 1 at the start of execution and that is what we need to restart
                    executionCycle = 0;
                    break;
                }
                

                // assign them here
                let agentData = {"ticket": {"status": "open", "assignee_id": firstAvailableAgent.assignee_id}};
                zendeskRequests.assignTickets(tickets[index],agentData); 
                
                console.log("This ticket was assigned to", firstAvailableAgent.name);
                // send whoever is 0 in the queue to the back
                agentModification.sendFirstAgentBack(agents);

                // move everyone toward the front
                agentModification.shiftQueue(agents)

                // log that it has been modified, this way we can maintain our place in the queue
                // agentJsonUpdated = true;



                // delete the ticket

                // this is broken I suppose it messes with tickets.length/numOfTickets
                // 
                numOfTickets -= 1;
                index +=1

                // if index is tickets.length - 1


                // create a new list to store tickets?
                // search only certain amount of the tickets array
                // if (numOfTickets === 1) {
                //     console.log("numOfTickets is 1 and length of tickets list is ", tickets.length)
                //     console.log("index is ", index)
                //     console.log("current ticket is ", tickets[index]);
                //     // for (let i = 0; i < tickets.length; i++) {
                //     //     tickets.pop(tickets[i]);
                //     // }
                //     // console.log("here are da tickets ", tickets) 
                    
                // }
            }
            
            

            tickets = []
            // console.log("these are agenst ", agents); 
            //console.log(agentTicketMatcher);
           // console.log(agents);

        //    // edit the JSON files and write to them
           fs.writeFile(ticketData, JSON.stringify(tickets), function(err, result) {
                if(err) console.log('error', err);
            })  
        })




            
        // for (let i = 0; i < tickets.length; i++) {
        //     // let agentData = {"ticket": {"status": "open", "assignee_id": agents[i].assignee_id}};
        //     // console.log(tickets[i],agentData);
        //     // now we need to check his/her place in the queue
        //     /*  if (agents[i].place_in_queue === 0) {
        //         let agentData = {"ticket": {"status": "open", "assignee_id": agents[i].assignee_id}}; 
        //         assignTickets(tickets[i],agentData); 
        //     } */
        // }       

        /*
        
        // this only takes the user and stores in teh object when they are place 0 in the queue
                let obj = {
                    "name": firstAvailableAgent.name,
                    "place_in_queue": firstAvailableAgent.place_in_queue
                }
                agentTicketMatcher.push(obj);
        */

        // edit the JSON files and write to them
        // fs.writeFile(filePath, JSON.stringify(dataObj), function(err, result) {
        //     if(err) console.log('error', err);
        // })  
    }); 
}

let agentObject = new Agents();

if (agentObject.itIsRegularShiftHours()) {
    while (agentObject.itIsRegularShiftHours()) {
        await mainMethod();
        console.log("waiting for tickets");

        for (let i=0; i<10; i++) {
            await agentObject.sleep(1000);
            console.log(i, "...")
        }
        // change to a for loop
        
        // await agentObject.sleep(1000);
        // console.log("5")
        // await agentObject.sleep(1000);
        // console.log("4")
        // await agentObject.sleep(1000);
        // console.log("3")
        // await agentObject.sleep(1000);
        // console.log("2")
        // await agentObject.sleep(1000);
        // console.log("1...")
        // await agentObject.sleep(1000);
    }
} else {
    console.log("It is either too early or too late to switch the app on.")
}

//console.log(agentObject.itIsRegularShiftHours())
// if (agentObject.itIsRegularShiftHours()) {
//     console.log("It is in working hour right now")
    
// } else {
//     console.log("Not working time")
// }