const express = require('express');
const router = express.Router();
const { db } = require('../../config/db');
const https = require('https');
const axios = require('axios');


var dr_john_timezone_name = 'Los Angeles, CA'
var dr_john_start_time = '10:00:00';
var dr_john_end_time = '17:00:00';
var dr_john_duration = '00:30:00';
var time_slots = [];
var entire_data;
var start_time_for_slot = dr_john_start_time;
const api_key = 'a24490109c254d9681954f761c08749b';
var filtered_patient_time_slots = [];

var patient_time;

const eventRef = db.collection('events');

// here  dr john time slots are being collected in an array called time_slots
while(start_time_for_slot != dr_john_end_time){
    time_slots.push(convert_to_12_format(start_time_for_slot));
    add_times(start_time_for_slot, dr_john_duration);
    start_time_for_slot = add_times(start_time_for_slot, dr_john_duration);
}




// this function converts 24 hours format into 12 format
function convert_to_12_format (time) {
    var timeString = time;
    var hourEnd = timeString.indexOf(":");
    var Hour = +timeString.substr(0, hourEnd);
    var get_hour = Hour % 12 || 12;
    var ampm = Hour < 12 ? "AM" : "PM";
    timeString = get_hour + timeString.substr(hourEnd, 3) + ' '+ ampm;
    
    console.log(timeString)
    return timeString;
}


// this function gives the collection of time slots after knowing the duration of each slot
function add_times(start_time, end_time){
    
    var a = start_time.split(":");
    var seconds = (+a[0]) * 60 * 60 + (+a[1]) * 60 + (+a[2]); 
    var b = end_time.split(":");
    var seconds2 = (+b[0]) * 60 * 60 + (+b[1]) * 60 + (+b[2]); 

    var date = new Date(1970,0,1);
    date.setSeconds(seconds + seconds2);

    var c = date.toTimeString().replace(/.*(\d{2}:\d{2}:\d{2}).*/, "$1");
    
    return c;
}




// free slots for patient
router.get('/free-slots/:date/:timezone', function(req,res){
    let saved_events_time = [];
    let saved_events_date = [];
    
    

    db.collection('events').get().then((snapshot) => {
        snapshot.forEach((doc) => {
            console.log(doc.id, '=>', doc.data());
            saved_events_time.push(doc.data().time)
            saved_events_date.push(doc.data().date)
        });
        console.log(saved_events_date, saved_events_time, time_slots)
        for(let i = 0; i<saved_events_date.length;i++){
            if(saved_events_date[i] == req.params.date ){
                let idx = time_slots.indexOf(saved_events_time[i])
                console.log(saved_events_time[i],idx);
                const index = idx;
                
                patient_time_slots.splice(index, 1);
                
            }
        }
        filtered_patient_time_slots = patient_time_slots;
        console.log(patient_time_slots);
    }).catch(err => {
        console.log(err)
    })

    var date_required = req.params.date;
    var timezone_required = req.params.timezone;
    

    setTimeout(() => {
        https.get(`https://timezone.abstractapi.com/v1/convert_time?api_key=${api_key}&base_location=${dr_john_timezone_name}&base_datetime=${date_required} ${dr_john_start_time}&target_location=${timezone_required}`, (resp) => {
        let data = '';
        resp.on('data', (chunk) => {
            data += chunk;
        });

        resp.on('end', () => {
            entire_data = JSON.parse(data)
            console.log(JSON.parse(data));
        });

        }).on("error", (err) => {
            console.log("Error: " + err.message);
        })
    }, 5000);
    

    patient_time = entire_data.target_location.datetime.substring(entire_data.target_location.datetime.indexOf(':')-2, entire_data.target_location.datetime.indexOf(':')+6);

    var patient_start_time = patient_time;
    var patient_time_slots = [];
    for(let i =0; i<time_slots.length ;i++){
        patient_time_slots.push(convert_to_12_format(patient_start_time));
        add_times(patient_start_time, dr_john_duration);
        patient_start_time = add_times(patient_start_time, dr_john_duration);
    }

    
    const str1 = `Dr. John living in ${entire_data.base_location.requested_location} has its timing from ${convert_to_12_format(dr_john_start_time)} to ${convert_to_12_format(dr_john_end_time)}. His slot duration is 30 minutes.<br><br> Patient is from ${req.params.timezone}. Patient time slots to be selected are ${filtered_patient_time_slots}`;

    res.send(str1);
    
})


let get_all_events = [];
db.collection('events').get().then((snapshot) => {
    snapshot.forEach((doc) => {
        let each_event = {event_time: '', event_name: '', event_date: ''}
        each_event.event_time = doc.data().time;
        each_event.event_name = doc.data().name;
        each_event.event_date = doc.data().date;
        get_all_events.push(each_event);
    });
}).catch((err) => {
    console.log(err)
})


// create event - incomplete
router.get('/create-event/:duration/:date_time', (req, res) => {

    let result =  ``;
    let status;

    let duration = req.params.duration;
    let date_time = req.params.date_time;
    let name = 'tenth event';
    
    let date = date_time.substring(0,10);
    let time = date_time.substring(11, 19);  
    
    for(let i = 0; i<get_all_events.length; i++){
        
        if((get_all_events[i].event_date === date) && (get_all_events[i].event_time === time)){
            console.log("yes")
            result = `This slot is already booked.`;
            status = 'yes'
            break;
        } else {
            
            console.log("no");
            status = 'no';
            result = `The event created is of ${duration} minutes on ${date} at ${time}.`;
        }
    }
    if(status == 'no'){
        eventRef.add({
            'name': name,
            'time': time,
            'date': date
        })
        get_all_events.push({event_time: time, event_date: date, event_name: name});
        console.log(get_all_events);
    }
    res.send(result);
})

// get all events
router.get('/all_events', (req, res) => {
    
    res.send(get_all_events);

})



module.exports = {
    eventController: router
}


