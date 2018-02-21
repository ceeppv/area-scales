import {mark} from "./plugins/mas-config-webpack-plugin";

let env;
let build;

function setEnv(obj) {
    env = obj;
    const BUILD_TYPES = ['dev', 'dist'];
    if (env && env.build) {
        if (BUILD_TYPES.indexOf(env.build) === -1) {
            throw `Error: Unrecognized --env.build. Should be one of: ${BUILD_TYPES.join(', ')}.`;
        }
        build = env.build;
    } else {
        build = BUILD_TYPES[0];
    }
}

const nix = () => mark(false);
const ifDev = (x) => mark(build === 'dev', x);
const ifDist = (x) => mark(build === 'dist', x);
const ifInline = (x) => mark(env.inlineSource, x);

export { setEnv, ifDev, ifDist, ifInline, nix };
