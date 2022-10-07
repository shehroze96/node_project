import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const { DateTime } = require("luxon");
const luxon = require("luxon");
const Interval = luxon.Interval;
const agent_data = require('../models/agents.json') 


//console.log(agent_data);


//console.log(now);


// get the shift interval for each agent from csv
// convert the interval that can be read by nodejs/luxon
// store it 
// check if the agent is on shift currently using .contains (interval class)
// if yes add them to a queue 
// assign them to ticket.
/* let day = "22-07-11";
let date = stripDate(day);
let objDate = DateTime.utc(date[0], date[1], date[2]).toISODate();
let d1 = DateTime.utc({day: now.day, month: now.month, year: now.year}).toISODate();


console.log(objDate === d1);
console.log(objDate < d1);
console.log(objDate > d1);
 */

// will have to get the hours from object
// convert them to readable time
// check to see if we are in the range
// if we are in the time range they can be assigned to a ticket

class TimeFunctions {

    constructor(now) {
        this.now = DateTime.now();
      }

    checkIfWorking(agent_data) {
        for (let i = 0; i < agent_data.length; i++) {
            var keys = Object.keys(agent_data[i]);
            console.log(agent_data[i].hours);
        }
    }

   
}

let tf = new TimeFunctions();

//tf.checkIfWorking(agent_data);
console.log(tf.getTimesAsISO('9-16', tf.now));

/* let objDate = DateTime.now().toISOTime();
console.log(objDate); */

