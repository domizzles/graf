var FontAwesome = require('react-fontawesome');
var React = require('react');
var _ = require('underscore');

var Actions = require('../actions');

module.exports = React.createClass({
    getInitialState() {
        return {
            recentWorkouts: 0
        };
    },

    componentWillReceiveProps(newProps) {
        this.setState(newProps);
    },

    render() {
        var checks = _.map(_.range(this.state.recentWorkouts), num => {
            return (
                <FontAwesome
                    name='check'
                    size='2x'
                    style={{ color: '#35CA36' }} />
            );
        });

        return (
            <div className="panel callout radius">
                <div className="row">
                    <div className="small-12 columns">
                        <h1>Your Workouts This Week</h1>
                    </div>
                </div>
                <div className="row">
                    <div className="small-8 columns text-left">{checks}</div>
                    <div className="small-4 columns">
                        <button style={{margin: '5px'}} onClick={this.add} className="tiny radius success"><FontAwesome name='plus' style={{ color: '#fff' }}/></button>
                        <button style={{margin: '5px'}} onClick={this.delete} className="tiny radius alert"><FontAwesome name='remove' style={{ color: '#fff' }}/></button>
                    </div>
                </div>
            </div>
        );
    },

    add() {
        Actions.add();
    },

    delete() {
        Actions.delete();
    }
});
