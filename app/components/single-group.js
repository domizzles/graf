var React = require('react');
var _ = require('underscore');

var GroupMember = require('./group-member');

module.exports = React.createClass({
    getInitialState() {
        return {
            group: {
                name: '',
                members: []
            }
        };
    },

    componentWillReceiveProps(newProps) {
        this.setState(newProps);
    },

    render() {
        var groupMembers = _.chain(this.state.group.members)
            .filter(member => !!member)
            .map(member => {
                return <GroupMember member={member} />;
        }).value();

        return (
            <div>
                <h2>{this.state.group.name}</h2>
                <table>
                    <tbody>
                        {groupMembers}
                    </tbody>
                </table>
            </div>
        );
    }
});
