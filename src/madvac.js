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
        open: function() {
            this.game.openField(this.x, this.y);
        },
        flag: function() {
            var flagged = this.field().flagged;
            this.game.flagField(this.x, this.y);
            if (flagged !== this.field().flagged) {
                window.navigator.vibrate(100);
            }
        },

        field: function() {
            return this.game.field(this.x, this.y);
        },
        covered: function() {
            return this.field().covered;
        },
        crossed: function() {
            return this.field().crossed;
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
