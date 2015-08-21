var AppDispatcher = require('../dispatcher');

module.exports = {
    add() {
        AppDispatcher.dispatch({
            actionType: 'add'
        });
    },

    delete() {
        AppDispatcher.dispatch({
            actionType: 'delete'
        });
    }
};
