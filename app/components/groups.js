var React = require('react');
var _ = require('underscore');

var SingleGroup = require('./single-group');

module.exports = React.createClass({
    getInitialState() {
        return {
            groupInfo: []
        };
    },

    componentWillReceiveProps(newProps) {
        this.setState(newProps);
    },

    render() {
        var groups = _.map(this.state.groupInfo, group => {
            return (<SingleGroup group={group} />)
        });

        return (
            <div id="groupWorkouts" className="panel radius">
                <div className="row">
                    <div className="small-12 columns">
                        <h1>Group Workouts</h1>
                    </div>
                </div>
                <div className="row">
                    <div className="small-12 columns">{groups}</div>
                </div>
            </div>
        );
    }
});
