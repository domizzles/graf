var assign = require('object-assign');
var EventEmitter = require('events').EventEmitter;
var moment = require('moment');
var React = require('react');
var request = require('request-promise');

var AppDispatcher = require('../dispatcher');

function addWorkout() {
    return request({
        method: 'POST',
        url: `${HOST}/workout`
    });
}

function deleteWorkout() {
    return request({
        method: 'DELETE',
        url: `${HOST}/workout`
    });
}

var WorkoutStore = assign({}, EventEmitter.prototype, {
    getWeekly() {
        return request({
            method: 'GET',
            url: `${HOST}/workout/${USER}`,
            qs: {
                start_date: moment().startOf('week').toDate(),
                end_date: moment().toDate()
            }
        }).then(workouts => JSON.parse(workouts).data);
    },

    emitChange() {
        this.emit('change');
    },

    addChangeListener(callback) {
        this.on('change', callback);
    },

    removeChangeListener(callback) {
        this.removeListener('change', callback);
    }
});

AppDispatcher.register(action => {
    switch (action.actionType) {
        case 'add':
            addWorkout().then(() => WorkoutStore.emitChange());
            break;

        case 'delete':
            deleteWorkout().then(() => WorkoutStore.emitChange())
            break;
    }
});

module.exports = WorkoutStore;
