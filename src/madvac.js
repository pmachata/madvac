import Vue from 'vue';
import { Game } from './game.js';

var game = new Game();

Vue.component('app-field', {
    props: ["x", "y"],
    template: "#appField",
    data: function() {
        return {
            game: game,
        };
    },
    methods: {
        toggle: function() {
            this.game.toggleField(this.x, this.y);
        },
        flag: function() {
            this.game.flagField(this.x, this.y);
            window.navigator.vibrate(100);
        },

        field: function() {
            return this.game.field(this.x, this.y);
        },
        covered: function() {
            return this.field().covered;
        },
        hasMine: function() {
            return this.field().hasMine;
        },
        flagged: function() {
            return this.field().flagged;
        },
        countNeighMines: function() {
            return this.field().countNeighMines();
        },
    },
});

Vue.component('app-board', {
    template: "#appBoard",
    data: function() {
        return {
            game: game,
        };
    },
    methods: {
    },
});

var app = new Vue({
    el: '#app',
    data: {
    },
    methods: {
    },
});
