// Copyright (c) 2012-2014, Walmart and other contributors.
// All rights reserved.

// Redistribution and use in source and binary forms, with or without
// modification, are permitted provided that the following conditions are met:
//     * Redistributions of source code must retain the above copyright
//       notice, this list of conditions and the following disclaimer.
//     * Redistributions in binary form must reproduce the above copyright
//       notice, this list of conditions and the following disclaimer in the
//       documentation and/or other materials provided with the distribution.
//     * The names of any contributors may not be used to endorse or promote
//       products derived from this software without specific prior written
//       permission.
//      
// THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS" AND
// ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED
// WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE
// DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT HOLDERS AND CONTRIBUTORS BE LIABLE FOR ANY
// DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES
// (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES;
// LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND
// ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT
// (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF THIS
// SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
// ---
// The complete list of contributors can be found at: https://github.com/hapijs/topo/graphs/contributors

module.exports = Topo;

function Topo() {
    this._items = [];
    this.nodes = [];
}

Topo.prototype.add = function (nodes, options) {
    var self = this;

    options = options || {};

    // Validate rules
    var before = [].concat(options.before || []);
    var after = [].concat(options.after || []);
    var group = options.group || "?";

    assert(before.indexOf(group) === -1, "Item cannot come before itself:" + group);
    assert(before.indexOf("?") === -1, "Item cannot come before unassociated items");
    assert(after.indexOf(group) === -1, "Item cannot come after itself: " + group);
    assert(after.indexOf("?") === -1, "Item cannot come after unassociated items");

    [].concat(nodes).forEach(function (node, i) {

        var item = {
            seq: self._items.length,
            before: before,
            after: after,
            group: group,
            node: node
        };

        self._items.push(item);
    });

    // Insert event
    var error = this._sort();

    assert(!error, "item" + (group !== "?" ? " added into group `" + group : "`") + " created a dependencies error");

    return this.nodes;
};

Topo.prototype._sort = function () {

    // Construct graph
    var groups = {};
    var graph = {};
    var graphAfters = {};

    for (var i = 0, il = this._items.length; i < il; ++i) {
        var item = this._items[i];
        var seq = item.seq; // Unique across all items
        var group = item.group;

        // Determine Groups

        groups[group] = groups[group] || [];
        groups[group].push(seq);

        // Build intermediary graph using 'before'

        graph[seq] = [item.before];

        // Build second intermediary graph with 'after'

        var after = item.after;
        for (var j = 0, jl = after.length; j < jl; ++j) {
            graphAfters[after[j]] = (graphAfters[after[j]] || []).concat(seq);
        }
    }

    // Expand intermediary graph

    var graphNodes = Object.keys(graph);
    for (i = 0, il = graphNodes.length; i < il; ++i) {
        var node = graphNodes[i];
        var expandedGroups = [];

        var graphNodeItems = Object.keys(graph[node]);
        for (j = 0, jl = graphNodeItems.length; j < jl; ++j) {
            var group = graph[node][graphNodeItems[j]];
            groups[group] = groups[group] || [];

            groups[group].forEach(function (d) {
                return expandedGroups.push(d);
            });
        }

        graph[node] = expandedGroups;
    }

    // Merge intermediary graph using graphAfters into final graph

    var afterNodes = Object.keys(graphAfters);
    for (i = 0, il = afterNodes.length; i < il; ++i) {
        var group = afterNodes[i];

        if (groups[group]) {
            for (j = 0, jl = groups[group].length; j < jl; ++j) {
                var node = groups[group][j];
                graph[node] = graph[node].concat(graphAfters[group]);
            }
        }
    }

    // Compile ancestors

    var ancestors = {};
    graphNodes = Object.keys(graph);
    for (i = 0, il = graphNodes.length; i < il; ++i) {
        var node = graphNodes[i];
        var children = graph[node];

        for (j = 0, jl = children.length; j < jl; ++j) {
            ancestors[children[j]] = (ancestors[children[j]] || []).concat(node);
        }
    }

    // Topo sort

    var visited = {};
    var sorted = [];

    for (i = 0, il = this._items.length; i < il; ++i) {
        var next = i;

        if (ancestors[i]) {
            next = null;
            for (j = 0, jl = this._items.length; j < jl; ++j) {
                if (visited[j] === true) {
                    continue;
                }

                if (!ancestors[j]) {
                    ancestors[j] = [];
                }

                var shouldSeeCount = ancestors[j].length;
                var seenCount = 0;
                for (var l = 0, ll = shouldSeeCount; l < ll; ++l) {
                    if (sorted.indexOf(ancestors[j][l]) >= 0) {
                        ++seenCount;
                    }
                }

                if (seenCount === shouldSeeCount) {
                    next = j;
                    break;
                }
            }
        }

        if (next !== null) {
            next = next.toString(); // Normalize to string TODO: replace with seq
            visited[next] = true;
            sorted.push(next);
        }
    }

    if (sorted.length !== this._items.length) {
        return new Error("Invalid dependencies");
    }

    var seqIndex = {};
    this._items.forEach(function (item) {
        return seqIndex[item.seq] = item;
    });

    var sortedNodes = [];
    this._items = sorted.map(function (value) {
        var item = seqIndex[value];
        sortedNodes.push(item.node);
        return item;
    });

    this.nodes = sortedNodes;
};

function assert(condition, msg) {
    if (!condition) throw new Error(msg);
}