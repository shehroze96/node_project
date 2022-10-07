import { createRequire } from 'module';
import Agents from './classes/Agents.js';
const require = createRequire(import.meta.url);
import Zendesk from './classes/Zendesk.js';
const agent_data = require('./models/agents.json') 
const fs = require('fs');
const luxon = require("luxon");
const Interval = luxon.Interval;

const csvFilePath = './shift_rota.csv';


let z = new Zendesk();
let a = new Agents();
  /* Pull the agent data from CSV and API and transform it */
        // the data for the users
        let getAgents = await z.getAvailableAgents('https://zoovasupport.zendesk.com');

        // console.log(getAgents);


        /* Fetch the CSV shift data  */
        let csvAgentData = await a.returnShifts(csvFilePath);
        console.log("CSV agent data",csvAgentData);



        let csvShiftDataToday = a.returnShiftDataForToday(csvAgentData);
        console.log("csv shift data for today", csvShiftDataToday);


// let tickets = await z.getZendeskTickets('https://zoovasupport.zendesk.com/api/v2/tickets');
// let newTicketList = z.returnNewTickets(tickets)

// console.log(a.itIsRegularShiftHours());;



 
/* let test = [
    'https://zoovasupport.zendesk.com/api/v2/tickets/57.json',
    'https://zoovasupport.zendesk.com/api/v2/tickets/58.json',
    'https://zoovasupport.zendesk.com/api/v2/tickets/59.json',
    'https://zoovasupport.zendesk.com/api/v2/tickets/60.json',
    'https://zoovasupport.zendesk.com/api/v2/tickets/61.json',
    'https://zoovasupport.zendesk.com/api/v2/tickets/62.json',
    'https://zoovasupport.zendesk.com/api/v2/tickets/63.json',
    'https://zoovasupport.zendesk.com/api/v2/tickets/64.json',
    'https://zoovasupport.zendesk.com/api/v2/tickets/65.json'
  ]
let newList = [];
  for (let i = 0; i < test.length; i++) {
        console.log("popping", test[i]);
        //console.log("here are the survivors",test)
  } */