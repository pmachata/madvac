import Vue from 'vue';
import { Field } from './field.js';

function randint(max) {
  return Math.floor(Math.random() * Math.floor(max));
}

class Game {
    constructor() {
        function createFields(game) {
            var ret = [];
            var i = 0;
            for (var y = 0; y < 10; ++y) {
                var row = [];
                for (var x = 0; x < 10; ++x) {
                    row.push(new Field(game, x, y, i++));
                }
                ret.push(row);
            }
            return ret;
        }

        this.started = false;
        this.over = false;
        this.fields = createFields(this);
    }

    field(x, y) {
        if (y >= 0 && y < this.fields.length) {
            var row = this.fields[y];
            if (x >= 0 && x < row.length) {
                return row[x];
            }
        }
        return null;
    }

    toggleField(x, y) {
        if (!this.over) {
            this.field(x, y).toggle();
        }
    }

    flagField(x, y) {
        if (!this.over) {
            this.field(x, y).flag();
        }
    }

    start() {
        // xxx
        this.started = true;
        for (var i = 0; i < 10; ++i) {
            var x = randint(10);
            var y = randint(10);
            this.field(x, y).hasMine = true;
        }
    }

    kaboom() {
        for (var row of this.fields) {
            for (var field of row) {
                field.covered = false;
            }
        }
        this.over = true;
    }
};

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
