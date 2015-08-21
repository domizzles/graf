var _ = require('underscore');
var moment = require('moment');
var React = require('react');
var request = require('request-promise');

var WorkoutChart = require('./workout-chart');
var RecentWorkouts = require('./recent-workouts');
var Groups = require('./groups');
var WorkoutStore = require('../stores/workout');

module.exports = React.createClass({
    getInitialState() {
        return {
            trend: {},
            recent_workouts: 0,
            groups: []
        };
    },

    render() {
        return (
            <div id="app">
                <div className="heading row">
                    <div className="columns small-4"><h1>Graf</h1></div>
                    <div id="buttonContainer" className="columns small-8 text-right">
                        <button className="button tiny info" onClick={this.addGroup}>Add/Join Group</button>
                        &nbsp;
                        <a id="logoutButton" className="button tiny alert" href="/logout">Logout</a>
                    </div>
                </div>
                <hr/>
                <RecentWorkouts recentWorkouts={this.state.recent_workouts} />
                <WorkoutChart trend={this.state.trend} />
                <Groups groupInfo={this.state.groups} />
            </div>
        );
    },

    componentDidMount() {
        WorkoutStore.addChangeListener(this.onChange);
        this.getWorkouts();
        this.getTrend();
        this.getGroupWorkouts();
    },

    componentWillUnmount() {
        WorkoutStore.removeChangeListener(this.onChange);
    },

    onChange() {
        this.getWorkouts();
    },

    getWorkouts() {
        return WorkoutStore.getWeekly().then(res => {
            if (this.isMounted()) this.setState({recent_workouts: res});
        });
    },

    getTrend() {
        return request({
            method: 'GET',
            url: `${HOST}/trend/${USER}`,
            qs: {
                start_date: moment().startOf('week').subtract(3, 'weeks').toDate()
            }
        }).then(res => {
            res = JSON.parse(res);
            return _.reduce(res, (memo, week) => {
                memo.datasets[0].data.push(week.workouts);
                return memo;
            }, {
                labels: ['Three Weeks Ago', 'Two Weeks Ago', 'Last Week', 'This Week'],
                datasets: [{
                    label: 'Workout',
                    fillColor: "rgba(220,220,220,0.2)",
                    strokeColor: "rgba(220,220,220,1)",
                    pointColor: "rgba(220,220,220,1)",
                    pointStrokeColor: "#fff",
                    pointHighlightFill: "#fff",
                    pointHighlightStroke: "rgba(220,220,220,1)",
                    data: []
                }]
            });
        }).then(data => {
            if (this.isMounted()) this.setState({trend: data});
        });
    },

    getGroupWorkouts(thing) {
        return request({
            method: 'GET',
            url: `${HOST}/group/${USER}`
        }).then(res => JSON.parse(res).data)
        .then(groups => {
            return _.map(groups, group => {
                group.members = _.map(group.members, member => {
                    if (member === USER) return undefined;
                    return {name: member};
                });
                return group;
            });
        })
        .then(groups => {
            this.setState({groups}, () => {
                _.each(groups, (group, index) => {
                    _.each(group.members, (member, memberIndex) => {
                        if (!member) return;
                        request({
                            method: 'GET',
                            url: `${HOST}/workout/${member.name}`,
                            qs: {
                                start_date: moment().startOf('week').toDate(),
                                end_date: moment().toDate()
                            }
                        }).then(res => {
                            res = JSON.parse(res).data;
                            groups[index].members[memberIndex].workouts = res;
                            this.setState({groups});
                        });
                    });
                });
            });
        });
    },

    addGroup() {
        var groupName = prompt('Enter the name of the group you would like to add/join.');
        request({
            method: 'POST',
            url: `${HOST}/group`,
            body: {
                name: groupName
            },
            json: true
        }).then(res => {
            location.reload();
        });
    }
});