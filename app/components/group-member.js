var React = require('react');

module.exports = React.createClass({
    getInitialState() {
        return {
            member: {
                name: '',
                workouts: 0
            }
        }
    },

    componentWillReceiveProps(newProps) {
        this.setState(newProps);
    },

    render() {
        return (
            <tr>
                <td>{this.state.member.name}</td>
                <td>{this.state.member.workouts}</td>
            </tr>
        )
    }
});