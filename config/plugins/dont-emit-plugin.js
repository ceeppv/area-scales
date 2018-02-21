import { every, isArray, isRegExp } from 'lodash';

function DontEmitPlugin(options) {
    if(options && options.patterns) {
        this.patterns = validated(options.patterns);
    } else {
        this.patterns = [];
    }
    function validated(patterns) {
        if (isRegExp(patterns)) {
            return [patterns];
        }
        if((isArray(patterns) &&
                every(patterns, (x) => isRegExp(x))
            )) {
            return patterns;
        }
        throw '[DontEmitPlugin] error: options.patterns should be of type (RegExp | RegExp[]).';
    }
}

DontEmitPlugin.prototype.apply = function(compiler) {
    compiler.plugin('emit', (compilation, callback) => {
        Object.keys(compilation.assets).forEach((assetName) => {
            this.patterns.forEach((pattern) => {
                if(pattern.test(assetName)) {
                    delete compilation.assets[assetName];
                    return false;
                }
            });
        });
        callback();
    });
};

export default DontEmitPlugin;
