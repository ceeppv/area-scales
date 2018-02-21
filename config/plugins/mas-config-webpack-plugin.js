import { isArray, isPlainObject, transform } from 'lodash';

const marker = {
    getPayload: function() { return this.payload; },
    isValid: function() { return this.valid; }
};

const markerCallback = {
    call: function(args) { return this.callback(...args); }
};

function mark(valid, value) {
    valid = !!valid;
    return Object.create(marker, {
        valid: { value: valid },
        payload: { value: valid ? value : undefined }
    });
}

function markCallback(callback, ...args) {
    return Object.create(markerCallback, {
        args: { value: args },
        callback: { value: callback }
    });
}

function sweep(node) {
    if(isMarkedCallable(node)) {
        return node.call(sweep(node.args));
    }
    if(isArray(node)) {
        return transform(node, (result, value) => {
            check(value, (x) => { result.push(sweep(x)); });
        });
    }
    if(isPlainObject(node)) {
        return transform(node, (result, value, key) => {
            check(value, (x) => { result[key] = sweep(x); });
        });
    }
    return node;
}

function check(value, callback) {
    if(isMarked(value)) {
        value.isValid() && callback(value.getPayload());
    } else {
        callback(value);
    }
}

function isMarked(value) {
    return value && value.__proto__ === marker;
}

function isMarkedCallable(value) {
    return value && value.__proto__ === markerCallback;
}

export { mark, markCallback, sweep };
