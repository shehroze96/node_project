// this data needs to be run/created at the start of the process on app()/wherever these things happen

import { createRequire } from 'module';
const require = createRequire(import.meta.url);

const csv2json = require('csvtojson/v2');
const { DateTime } = require("luxon");
const luxon = require("luxon");
const Interval = luxon.Interval;
import Zendesk from './Zendesk.js';
const fs = require('fs');
import fetch from "node-fetch";




class Agents {

    
    async returnShifts(csvFilePath)  {
        try {
            const jsonArray= await csv2json().fromFile(csvFilePath); 
            // pass a function that acts on a response into the function we define - remove return statement - code executes 
            return jsonArray
        } catch (err) {
            console.error(err);
        }
    }
    
    returnShiftDataForToday(shiftRota) {
        function stripDate(date) {
            let splitDay = date.split("-");
            let year = 2000 + parseInt(splitDay[0]);
            let month = parseInt(splitDay[1]);
            let day = parseInt(splitDay[2]);
            let dateArr = [year, month, day];
            return dateArr
        }


        // check the csv file date from each JSON object in the array
        // if you convert this date to DATETIME obj does it equal today?
        let now = DateTime.now();
        let dateFromDT = DateTime.utc({day: now.day, month: now.month, year: now.year}).toISODate();
        let objDate;
        let date;
        let todaysShiftData;
        
        // loop through dates and compare date to current date, if the date in the CSV is the same as the current date return that data
        for (let i = 0; i < shiftRota.length; i++) {
            // var keys = Object.keys(shiftRota[i]);
            let obj = shiftRota[i];
            date = stripDate(obj.date);
            objDate = DateTime.utc(date[0], date[1], date[2]).toISODate();;
            // if obj date is the same as today return the data from that day
            if (objDate === dateFromDT) {
                  todaysShiftData = [obj]
            }

        }
        if (typeof todaysShiftData === 'undefined') {
            return false
        } else {
            return todaysShiftData;
        }
        
        
    }
    
    
    
    // this function will return an array of objects {name: shift times}
    getNameAndHours(agentDetails) {
        let myArr = [];
        let agent = {};
        for (var key in agentDetails[0]) {
            if (key != 'date'){
                //console.log(key);
                //console.log(agentDetails[0][key]);
                agent = {[key]: agentDetails[0][key]};
                myArr.push(agent);
            }
        }
        return myArr
    } 
    
    
    createAgentObj(agents) {                 
       function getTimesAsISO(shifts) {
            let now = DateTime.now();
            let hours = shifts.split("-");
            let startTime = parseInt(hours[0]);
            let finishTime = parseInt(hours[1]);
            let hoursArray = [];
            let shiftStart;
            let shiftEnd;
    
            if (startTime < 10){
                shiftStart = DateTime.fromObject({day: now.day, month: now.month, year:now.year, hours: '0' + hours[0]}).toISO();
                hoursArray.push(shiftStart);
            }
            else if (startTime > 9) {
                shiftStart = DateTime.fromObject({day: now.day, month: now.month, year: now.year, hours: hours[0]}).toISO();
                hoursArray.push(shiftStart);
            }
            shiftEnd= DateTime.fromObject({day: now.day, month: now.month, year: now.year, hours: hours[1]}).toISO();
            hoursArray.push(shiftEnd);
            
            return hoursArray;
            
        }

        function agentAvailable(agent) {

            let now = DateTime.now();
            /* Create DT strings (which will be taken from agents.json) */
            let start= agent.hours[0]
            let end = agent.hours[1]
    
            
            /* Convert them to DT */
            let  dtStart= DateTime.fromISO(start);
            let  dtEnd = DateTime.fromISO(end);
            
            let shiftInterval = Interval.fromDateTimes(dtStart, dtEnd);
            let availability = shiftInterval.contains(now);
    
            return availability;
           
        }
        
        let agentsObj = [];
        for (let i = 0; i < agents.length; i++) {
            var keys = Object.keys(agents[i]);
            let hours = getTimesAsISO(agents[i][keys]);
            //console.log(agents[i]); 
            //console.log(keys[0]);

            
            let obj = {'name': keys.toString(),
                        'hours': hours,
                        'assignee_id': 0,
                        'place_in_queue': 0,
                        'is_updated': false } 
            agentsObj.push(obj);
            // remove object if the user is not working right now
            
        }
        let agentsOnShift = [];
        let queue = 0;

        for (let i = 0; i < agentsObj.length; i++) {
            if (agentAvailable(agentsObj[i])) {
                agentsObj[i].place_in_queue = queue;
                queue+=1;
                agentsOnShift.push(agentsObj[i])
            } 

              
        }
    
        return agentsOnShift;
    }

    
    
    // remove it from agentObject if it does not exist in zendesk object
    matchToZendeskUser (agentObject, zendeskAgentObj) {

        var validAgents =[];
        for (let i = 0; i < agentObject.length; i++) {
            // take our first agent object and compare to all objects in zendeskAgentObj['users']
            for (let j = 0; j < zendeskAgentObj['users'].length; j++){
                if (agentObject[i].name === zendeskAgentObj['users'][j].name ){
                    agentObject[i].assignee_id = zendeskAgentObj['users'][j].id;
                    validAgents.push(agentObject[i]);
                } 
            }            
        }         
        return validAgents;
    }

    updateAgentQueue(filePath) {
        // this looks for the data at the file path location and parse it so we can use it 
        fs.readFile(filePath, 'utf-8', (err,data) => {
            if (err) {
                throw err;
            }
            const dataObj = JSON.parse(data)

            // loop through all objects and set the user in place 
            for (let i = 0; i < dataObj.length; i++) {
                if (dataObj[i].place_in_queue === 0) {
                     // assign the ticket
                     // then set this user to the back of the queue, the array's length -1 (because arrays start at 0)
                     dataObj[i].place_in_queue = dataObj.length;
                }    
             }
            
            // everyone moves closer to 0 in the queue by 1 place
            for (let i = 0; i < dataObj.length ; i++) {
                if (dataObj[i].place_in_queue != 0) {
                    dataObj[i].place_in_queue -= 1;
                }
                
            }
            // dataObj[0].place_in_queue += 5;
            console.log(dataObj)
            fs.writeFile(filePath, JSON.stringify(dataObj), function(err, result) {
                if(err) console.log('error', err);
            }); 
        })
        
    }



    agentAvailable(agent) {

        let now = DateTime.now();
        /* Create DT strings (which will be taken from agents.json) */
        let start= agent.hours[0]
        let end = agent.hours[1]

        
        /* Convert them to DT */
        let  dtStart= DateTime.fromISO(start);
        let  dtEnd = DateTime.fromISO(end);
        
        let shiftInterval = Interval.fromDateTimes(dtStart, dtEnd);
        let availability = shiftInterval.contains(now);

        return availability;
        /*
        let j = 0;
        let k = 1
        for (let i = 0; i < agents.length ; i++) {
            start = agents[i].hours[j];
            end = agents[i].hours[k];

            // Convert them to DT 
            dtStart = DateTime.fromISO(start);
            dtEnd = DateTime.fromISO(end);

        }
        */
        
        

       // console.log(shiftInterval.contains(now));        //=> true (if true you can assign ticket then update the list)
    }    
   
    selectFirstAgentInQueue(agentObj) {
        let agent;
        for (let i = 0; i < agentObj.length ; i++) {
            if (agentObj[i].place_in_queue === 0) {
                agent = agentObj[i];
                break;
            } 
        }
        return agent;
    }

    sendFirstAgentBack(agentObj) {
        // then set this user to the back of the queue, the array's length -1 (because arrays start at 0)
        for (let i = 0; i < agentObj.length ; i++) {
            if (agentObj[i].place_in_queue === 0) {
                agentObj[i].place_in_queue = agentObj.length;
                agentObj[i].is_updated = true;
            }
        }
        return agentObj
    }

    shiftQueue(agentObj) {
        // everyone moves closer to 0 in the queue by 1 place
        for(let i = 0; i < agentObj.length ; i++) { 
            agentObj[i].place_in_queue  -= 1;
            agentObj[i].is_updated = true;
        }
        return agentObj
    }

    wasAgentListUpdated(agentObj) {
        let listWasUpdated;
        if (agentObj.length === 0) {
            listWasUpdated = false;
            return listWasUpdated
        } else {
            for(let i = 0; i < agentObj.length ; i++) {
                if (agentObj[i].is_updated) {
                    listWasUpdated = true;
                    return listWasUpdated;
                }
            }
            listWasUpdated = false;
            return listWasUpdated
        }
    }

    doesFileExist(filePath) { 
        if (fs.existsSync(filePath)) {
            return true
        } else {
            return false;
        }
    }

    deleteTickets(tickets) {
        for (let i = 0; i < tickets.length; i++) {
            tickets.pop(tickets[i]);
        }

        return tickets;
    }

    itIsRegularShiftHours() {
        var dt = DateTime.now();
        let freeTime = 'This is our free time, no working!'
        // take the day from dt and put it into workingHours
        // set the time for start and end shift hours
        // create an interval
        // check if true/false
        // create another var for end of day
        var startingHour = DateTime.fromObject({ year: dt.year, month: dt.month, day: dt.day, hour: 7, minute: 0 });
        var endingHour = DateTime.fromObject({ year: dt.year, month: dt.month, day: dt.day, hour: 22, minute: 0 });
        // var stringStartingHour = startingHour.toString();
        var workingInterval = Interval.fromDateTimes(startingHour, endingHour);
        var availability = workingInterval.contains(dt);
        return availability

        
    }

    sleep(ms) {
        return new Promise((resolve) => {
          setTimeout(resolve, ms);
        });
      }
      
    
}


/*
let a = new Agents();

let z = new Zendesk();

// path to shift rota file
const csvFilePath='../shift_rota.csv';




let agents = await z.getAvailableAgents('https://zoovu6424.zendesk.com');
//console.log(agents); 


// controller logic here?
// https://developer.mozilla.org/en-US/docs/Learn/Server-side/Express_Nodejs/routes#create_the_catalog_route_module

let agentDetails = await a.returnShifts(csvFilePath);
// console.log(agentDetails);

let shiftDataToday = a.returnShiftDataForToday(agentDetails);
// console.log(shiftDataToday);
let nameAndHours = a.getNameAndHours(shiftDataToday);
//console.log(nameAndHours);

let agentObject = a.createAgentObj(nameAndHours);
//console.log(agentObject);
let agentsWithIDs = a.matchToZendeskUser(agentObject, agents);
console.log(agentsWithIDs);



var dictstring = JSON.stringify(agentsWithIDs);



//   console.log(dictstring);
fs.writeFile("../models/agents.json", dictstring, function(err, result) {
    if(err) console.log('error', err);
}); 

console.log("lalalala BREAK \n\n\n\n\n\n")

a.updateJSONTest('../models/agents.json')
//console.log()
/* fs.readFile('../models/agents.json', 'utf-8', (err,data) => {
    if (err) {
        throw err;
    }
    console.log("data", data)
    const dataObj = JSON.parse(data)
    dataObj[0].place_in_queue += 5;
    console.log(dataObj)
    fs.writeFile("../models/agents.json", JSON.stringify(dataObj), function(err, result) {
        if(err) console.log('error', err);
    }); 
}) */

// let test = a.updateJSONTest('../models/agents.json');
// console.log(test);



/* let test = a.jsonReader('../models/agents.json');
console.log(test); */


/*

how to use and in which order - remember getNameAndHours(shiftDataToday) should be placed into JSON and becomes the data we work with moving forward.

step 1:
let agentDetails = await returnShifts(csvFilePath);
//console.log(agentDetails);

step :2 
let shiftDataToday = returnShiftDataForToday(agentDetails);
console.log(shiftDataToday);

step 3: 
to make this work - did you check if today's date is in the file?
console.log(getNameAndHours(shiftDataToday));

*/

export default Agents;