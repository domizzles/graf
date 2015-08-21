var React = require('react');
var LineChart = require("react-chartjs").Line;
var _ = require('underscore');

module.exports = React.createClass({
    getInitialState() {
        return {
            trend: {
                labels: ['Three Weeks Ago', 'Two Weeks Ago', 'Last Week', 'This Week'],
                datasets: [{
                    "label": "Workout",
                    "fillColor": "rgba(115, 203, 253, 0.2)",
                    "strokeColor": "#00B3FE",
                    "pointColor": "#00B3FE",
                    "pointStrokeColor": "#fff",
                    "pointHighlightFill": "#fff",
                    "pointHighlightStroke": "#00B3FE",
                    "data": [0, 0, 0, 0]
                }]
            }
        };
    },

    componentWillReceiveProps(newProps) {
        if (newProps.trend
            && newProps.trend.labels
            && newProps.trend.datasets
            && _.isArray(newProps.trend.labels)
            && _.isArray(newProps.trend.datasets)) this.setState(newProps);
    },

    render() {
        var chartOptions = {
            tooltipTemplate: "<%= value %> workout<%if(Number(value) !== 1)%><%='s'%>",
            responsive: false,
            maintainAspectRatio: true
        };

        return (
            <div id="workoutTrend">
                <LineChart data={this.state.trend} options={chartOptions} width="600" height="250"/>
            </div>
        );
    }
});
