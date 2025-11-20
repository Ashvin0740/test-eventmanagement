import logModule from './lib/log.js';
import helper from './lib/helper.js';
import message, { MessageBuilderType } from './lib/message.js';

declare global {
    var log: typeof logModule;
    var _: typeof helper;
    var message: MessageBuilderType;
}

global.log = logModule;
global._ = helper;
global.message = message;
