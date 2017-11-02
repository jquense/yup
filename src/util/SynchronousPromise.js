'use strict';
function argumentsToArray(args) {
    return Array.prototype.slice.apply(args);
}

function looksLikePromise(thing) {
    return thing &&
        thing.then &&
        typeof (thing.pause) === 'function' &&
        typeof (thing.resume) === 'function' &&
        typeof (thing.then) === 'function' &&
        typeof (thing.catch) === 'function';
}

function SynchronousPromise(ctorFunction) {
    this.status = 'pending';
    this._paused = false;
    this._next = [];
    this._data = [];
    this._runConstructorFunction(ctorFunction);
}

SynchronousPromise.prototype = {
    then: function (next, fail) {
        this._next.push([next, fail]);

        if (this._isPendingResolutionOrRejection()) {
            return this;
        }

        return this._applyNext();
    },
    catch: function (fn) {
        this._next.push([undefined, fn]);

        if (this._isPendingResolutionOrRejection()) {
            return this;
        }

        return this._applyNext();
    },
    pause: function () {
        this._paused = true;
        return this;
    },
    resume: function () {
        this._paused = false;
        return this._applyNext();
    },
    _runConstructorFunction: function (ctorFunction) {
        var self = this;

        this._next.push([
            function (r) { return r; },
            function (err) { throw err; }
        ]);

        var isRun = false;
        ctorFunction(function (result) {
            if (isRun) {
                return;
            }

            isRun = true;
            self._setResolved();
            self._data = [result];
            self._applyNext();
        }, function (err) {
            if (isRun) {
                return;
            }

            isRun = true;
            self._setRejected();
            self._data = [err];
            self._applyNext();
        });
    },
    _setRejected: function () {
        this.status = 'rejected';
    },
    _setResolved: function () {
        this.status = 'resolved';
    },
    _setPending: function () {
        this.status = 'pending';
    },
    _applyNext: function () {
        if (this._next.length === 0 || this._paused) {
            return this;
        }

        var next = this._findNext();
        if (!next) {
            return this;
        }
        return this._applyNextHandler(next);
    },
    _applyNextHandler: function (handler) {
        try {
            var data = handler.apply(null, this._data);

            if (looksLikePromise(data)) {
                this._handleNestedPromise(data);
                return this;
            }

            this._setResolved();
            this._data = [data];
            return this._applyNext();
        } catch (e) {
            this._setRejected();
            this._data = [e];
            return this._applyNext();
        }
    },
    _findNext: function () {
        if (this._isPendingResolutionOrRejection()) {
            return undefined;
        }
        var handler = this.status === 'resolved'
            ? this._findFirstResolutionHandler
            : this._findFirstRejectionHandler;
        return handler ? handler.apply(this) : undefined;
    },
    _handleNestedPromise: function (promise) {
        this._setPending();
        var self = this;
        promise.then(function (d) {
            self._setResolved();
            self._data = [d];
            self._applyNext();
        }).catch(function (e) {
            self._setRejected();
            self._data = [e];
            self._applyNext();
        });
    },
    _isPendingResolutionOrRejection: function () {
        return this.status === 'pending';
    },
    _findFirstResolutionHandler: function () {
        var next;
        while (!next && this._next.length > 0) {
            next = this._next.shift()[0];
        }

        return next;
    },
    _findFirstRejectionHandler: function () {
        var next;
        while (!next && this._next.length > 0) {
            next = this._next.shift()[1];
        }

        return next;
    }
};
SynchronousPromise.resolve = function (data) {
    if (looksLikePromise(data)) {
        return data;
    }

    return new SynchronousPromise(function (resolve) {
        resolve(data);
    });
};
SynchronousPromise.reject = function (error) {
    if (looksLikePromise(error)) {
        return error;
    }

    return new SynchronousPromise(function (resolve, reject) {
        reject(error);
    });
};
SynchronousPromise.all = function () {
    var args = argumentsToArray(arguments);
    if (Array.isArray(args[0])) {
        args = args[0];
    }
    if (!args.length) {
        return SynchronousPromise.resolve([]);
    }
    return new SynchronousPromise(function (resolve, reject) {
        var
            allData = [],
            numResolved = 0,
            doResolve = function () {
                if (numResolved === args.length) {
                    resolve(allData);
                }
            },
            rejected = false,
            doReject = function (err) {
                if (rejected) {
                    return;
                }
                rejected = true;
                reject(err);
            };
        args.forEach(function (arg, idx) {
            SynchronousPromise.resolve(arg).then(function (thisResult) {
                allData[idx] = thisResult;
                numResolved += 1;
                doResolve();
            }).catch(function (err) {
                doReject(err);
            });
        });
    });
};
SynchronousPromise.unresolved = function () {
    var stash = {};
    var result = new SynchronousPromise(function (resolve, reject) {
        stash.resolve = resolve;
        stash.reject = reject;
    });
    result.resolve = stash.resolve;
    result.reject = stash.reject;
    return result;
};

module.exports = {
    SynchronousPromise: SynchronousPromise
};
